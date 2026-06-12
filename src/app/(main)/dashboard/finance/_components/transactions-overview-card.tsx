"use client";

import { useEffect, useState, useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const GATEWAY_BASE = "https://p.jkt48connect.app";

interface GraphPoint {
  date: string;
  count: number;
  revenue: number;
  timestamp: number;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function fmtRp(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(1)}K`;
  return `Rp ${n.toLocaleString("id-ID")}`;
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
        const token = getCookie("access_token");
        if (!token) { setIsLoading(false); return; }

        const res = await fetch(`${GATEWAY_BASE}/profile/graph`, {
          headers: { Authorization: `Bearer ${token}` },
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

  const chartData = useMemo(() => {
    if (!rawData.length) return [];
    const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return rawData.filter((p) => p.timestamp >= cutoff);
  }, [rawData, range]);

  const domain = useMemo(() => {
    if (!chartData.length) return [0, Date.now()];
    return [chartData[0].timestamp, chartData[chartData.length - 1].timestamp];
  }, [chartData]);

  // Hitung tick labels
  const ticks = useMemo(() => {
    if (!chartData.length) return [];
    const days = range === "7d" ? 7 : range === "14d" ? 7 : 6; // jumlah tick
    const step = Math.max(1, Math.floor(chartData.length / days));
    return chartData
      .filter((_, i) => i % step === 0)
      .map((p) => p.timestamp);
  }, [chartData, range]);

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
        ) : chartData.length === 0 ? (
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
              {/* Count transaksi — garis tipis dashed */}
              <Line
                connectNulls
                dataKey="count"
                dot={false}
                stroke="var(--color-count)"
                strokeDasharray="5 5"
                strokeLinecap="round"
                strokeWidth={1}
                type="linear"
              />
              {/* Revenue — garis utama tebal */}
              <Line
                dataKey="revenue"
                dot={false}
                stroke="var(--color-revenue)"
                strokeLinecap="round"
                strokeWidth={3}
                type="linear"
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
