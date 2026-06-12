"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const CF_PROXY_BASE = "https://p.jkt48connect.app";

interface TransactionStats {
  total: number;
  paid: number;
  pending: number;
  cancelled: number;
  expired: number;
  volume_success: number;
  volume_30d: number;
  avg_transaction: number;
}

const DEFAULT_STATS: TransactionStats = {
  total: 0,
  paid: 0,
  pending: 0,
  cancelled: 0,
  expired: 0,
  volume_success: 0,
  volume_30d: 0,
  avg_transaction: 0,
};

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

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function BreakdownSkeleton() {
  return (
    <div className="flex min-h-24 flex-1 flex-col justify-between">
      <div className="flex flex-col gap-1 px-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-5 w-full rounded-sm" />
    </div>
  );
}

export function IncomeBreakdown() {
  const [stats, setStats] = useState<TransactionStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = getGatewayToken();
        if (!token) { setIsLoading(false); return; }

        const res = await fetch(`${CF_PROXY_BASE}/api/profile`, {
          headers: {
            "X-Gateway-Token": token,
          },
          credentials: "include",
        });
        if (!res.ok) { setIsLoading(false); return; }

        const result = await res.json();
        if (result.status && result.data?.stats) {
          const s = result.data.stats;
          setStats({
            total: s.transactions.total,
            paid: s.transactions.paid,
            pending: s.transactions.pending,
            cancelled: s.transactions.cancelled,
            expired: s.transactions.expired,
            volume_success: s.volume_success,
            volume_30d: s.volume_30d,
            avg_transaction: s.avg_transaction,
          });
        }
      } catch {
        // gagal fetch — tetap pakai default
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const failed = stats.cancelled + stats.expired;
  const paidPct = pct(stats.paid, stats.total);
  const pendingPct = pct(stats.pending, stats.total);
  const failedPct = pct(failed, stats.total);

  const sections = [
    {
      label: `Transaksi berhasil · ${paidPct}`,
      value: fmtRp(stats.volume_success),
      barClass: "bg-chart-3",
      count: stats.paid,
    },
    {
      label: `Sedang diproses · ${pendingPct}`,
      value: `${stats.pending} transaksi`,
      barClass: "bg-chart-3/75",
      count: stats.pending,
    },
    {
      label: `Gagal & expired · ${failedPct}`,
      value: `${failed} transaksi`,
      barClass: "bg-chart-3/40",
      count: failed,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Ringkasan transaksi</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <section key={i} className="isolate flex gap-[0.5px]">
                <Separator
                  orientation="vertical"
                  className="mb-1 h-auto self-auto border-muted-foreground/50 border-l border-dashed bg-transparent"
                />
                <BreakdownSkeleton />
              </section>
            ))
          : sections.map((s) => (
              <section key={s.label} className="isolate flex gap-[0.5px]">
                <Separator
                  orientation="vertical"
                  className="mb-1 h-auto self-auto border-muted-foreground/50 border-l border-dashed bg-transparent"
                />
                <div className="flex min-h-24 flex-1 flex-col justify-between">
                  <div className="flex min-w-0 flex-col gap-1 px-1">
                    <p className="wrap-break-word text-muted-foreground text-xs leading-none">
                      {s.label}
                    </p>
                    <div className="text-lg leading-none tracking-tight">{s.value}</div>
                  </div>
                  <div className={`-ml-0.5 h-5 rounded-sm ${s.barClass}`} />
                </div>
              </section>
            ))}
      </CardContent>
    </Card>
  );
}
