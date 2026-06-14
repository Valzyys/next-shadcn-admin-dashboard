"use client";

import { useEffect, useState, useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CF_PROXY_BASE = "https://p.jkt48connect.app";

interface GraphPoint {
  date: string;
  count: number;
  revenue: number;
  timestamp: number;
}

function getGatewayToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )gateway_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function fmtRp(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(1)}K`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// Format tanggal YYYY-MM-DD dari UTC timestamp
function toDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// Buat array semua hari dalam range (UTC midnight timestamps)
function buildDateRange(days: number): number[] {
  const result: number[] = [];
  const now = new Date();
  // Start dari hari ini mundur ke belakang
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    result.push(d.getTime());
  }
  return result;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

const chartConfig = {
  revenue: {
    color: "var(--chart-4)",
    label: "Revenue",
  },
  count: {
    color: "var(--chart-2)",
    label: "Transaksi",
  },
} satisfies ChartConfig;

type Range = "7d" | "14d" | "30d";

export function TransactionsOverviewCard() {
  const [rawData, setRawData] = useState<GraphPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<Range>("30d");

  useEffect(() => {
    async function fetchGraph() {
      try {
        const token = getGatewayToken();
        if (!token) { setIsLoading(false); return; }

        const res = await fetch(`${CF_PROXY_BASE}/api/profile/graph`, {
          headers: { "X-Gateway-Token": token },
          credentials: "include",
        });
        if (!res.ok) { setIsLoading(false); return; }

        const result = await res.json();
        if (result.status && Array.isArray(result.data)) {
          const mapped: GraphPoint[] = result.data.map((r: { date: string; count: number; revenue: number }) => ({
            date: r.date,
            count: r.count,
            revenue: r.revenue,
            timestamp: Date.parse(r.date),
          }));
          setRawData(mapped);
        }
      } catch {
        // gagal fetch — biarkan kosong
      } finally {
        setIsLoading(false);
      }
    }
    fetchGraph();
  }, []);

  // Fill semua hari dalam range, hari tanpa data = 0
  const chartData = useMemo(() => {
    const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    const allDays = buildDateRange(days);

    // Buat lookup dari date key ke data
    const lookup = new Map<string, { count: number; revenue: number }>();
    for (const p of rawData) {
      const key = p.date.slice(0, 10); // ambil YYYY-MM-DD saja
      lookup.set(key, { count: p.count, revenue: p.revenue });
    }

    return allDays.map((ts) => {
      const key = toDateKey(ts);
      const found = lookup.get(key);
      return {
        date: key,
        timestamp: ts,
        count: found?.count ?? 0,
        revenue: found?.revenue ?? 0,
      };
    });
  }, [rawData, range]);

  const domain = useMemo(() => {
    if (!chartData.length) return [0, Date.now()];
    return [chartData[0].timestamp, chartData[chartData.length - 1].timestamp];
  }, [chartData]);

  const ticks = useMemo(() => {
    if (!chartData.length) return [];
    const tickCount = range === "7d" ? 7 : range === "14d" ? 7 : 6;
    const step = Math.max(1, Math.floor(chartData.length / tickCount));
    return chartData
      .filter((_, i) => i % step === 0 || i === chartData.length - 1)
      .map((p) => p.timestamp);
  }, [chartData, range]);

  const hasAnyData = useMemo(() => chartData.some((p) => p.revenue > 0 || p.count > 0), [chartData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Revenue Overview</CardTitle>
        <CardAction>
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="7d">7 hari</SelectItem>
                <SelectItem value="14d">14 hari</SelectItem>
                <SelectItem value="30d">30 hari</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <Skeleton className="h-50 w-full rounded-md" />
        ) : !hasAnyData ? (
          <div className="flex h-50 items-center justify-center text-muted-foreground text-sm">
            Belum ada data transaksi
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-50 w-full">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="timestamp"
                domain={domain}
                scale="time"
                tickFormatter={(v) => dateFormatter.format(new Date(v))}
                tickLine={false}
                tickMargin={10}
                ticks={ticks}
                tick={{ fontSize: 12 }}
                type="number"
              />
              <YAxis hide axisLine={false} tickLine={false} />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => (
                  <ChartTooltipContent
                    active={active}
                    hideLabel
                    label={label}
                    payload={payload?.map((item) => ({
                      ...item,
                      value:
                        item.dataKey === "revenue"
                          ? fmtRp(Number(item.value))
                          : `${item.value} trx`,
                    }))}
                  />
                )}
              />
              <Line
                connectNulls
                dataKey="count"
                dot={false}
                stroke="var(--color-count)"
                strokeDasharray="5 5"
                strokeLinecap="round"
                strokeWidth={1}
                type="monotone"
              />
              <Line
                dataKey="revenue"
                dot={false}
                stroke="var(--color-revenue)"
                strokeLinecap="round"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
