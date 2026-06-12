"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

// ✅ Ganti dengan URL CF Worker yang sudah di-deploy
const CF_PROXY_BASE = "https://p.jkt48connect.app";

function getGatewayToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )gateway_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

type StatusKey = "paid" | "pending" | "failed";

const chartConfig = {
  count: { label: "Transaksi" },
  paid: { color: "var(--chart-2)", label: "Berhasil" },
  pending: { color: "var(--chart-4)", label: "Pending" },
  failed: { color: "var(--chart-1)", label: "Gagal & Expired" },
} satisfies ChartConfig;

const STATUS_META: { key: StatusKey; label: string }[] = [
  { key: "paid", label: "Berhasil" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Gagal & Expired" },
];

export function BalanceDistributionCard() {
  const [data, setData] = React.useState<{
    paid: number;
    pending: number;
    failed: number;
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const token = getGatewayToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // ✅ Panggil CF Worker proxy, BUKAN gateway langsung
        // Browser mengirim semua header asli + token via custom header
        const res = await fetch(`${CF_PROXY_BASE}/api/profile`, {
          headers: {
            "X-Gateway-Token": token,
          },
          credentials: "include",
        });

        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const result = await res.json();

        if (result.status && result.data?.stats?.transactions) {
          const t = result.data.stats.transactions;
          setData({
            paid: t.paid,
            pending: t.pending,
            failed: t.cancelled + t.expired,
            total: t.total,
          });
        }
      } catch {
        // biarkan data tetap null
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const chartData = React.useMemo(() => {
    if (!data) return [];

    return STATUS_META.map(({ key, label }) => ({
      key,
      label,
      count: data[key],
      fill: chartConfig[key].color,
      percentage:
        data.total > 0 ? ((data[key] / data.total) * 100).toFixed(1) : "0.0",
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Status Transaksi</CardTitle>
      </CardHeader>

      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        {isLoading ? (
          <>
            <Skeleton className="mx-auto aspect-square h-50 rounded-full" />
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-50"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      className="w-48"
                      nameKey="label"
                    />
                  }
                />
                <Pie
                  cornerRadius={6}
                  data={chartData}
                  dataKey="count"
                  innerRadius={65}
                  nameKey="label"
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (!(viewBox && "cx" in viewBox && "cy" in viewBox))
                        return null;
                      return (
                        <text
                          dominantBaseline="middle"
                          textAnchor="middle"
                          x={viewBox.cx}
                          y={viewBox.cy}
                        >
                          <tspan
                            className="fill-muted-foreground text-xs"
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) - 8}
                          >
                            Total
                          </tspan>
                          <tspan
                            className="fill-foreground font-medium text-lg tabular-nums"
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 14}
                          >
                            {data?.total ?? 0} trx
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="flex min-w-0 flex-col gap-3">
              {chartData.map((item) => (
                <div
                  className="grid grid-cols-[1fr_auto] items-end gap-3"
                  key={item.key}
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1">
                      <span
                        aria-hidden="true"
                        className="h-2 w-1 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <p className="truncate text-muted-foreground text-xs">
                        {item.label}
                      </p>
                    </div>
                    <p className="font-medium tabular-nums">
                      {item.count} transaksi
                    </p>
                  </div>
                  <div className="font-medium tabular-nums">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
