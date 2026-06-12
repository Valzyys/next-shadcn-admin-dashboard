"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const GATEWAY_BASE = "https://p.jkt48connect.app";

interface ProfileStats {
  active_balance: number;
  clearing_balance: number;
  volume_success: number;
  volume_30d: number;
  avg_transaction: number;
  success_rate: string;
  transactions: {
    total: number;
    paid: number;
    pending: number;
    cancelled: number;
    expired: number;
  };
}

const DEFAULT_STATS: ProfileStats = {
  active_balance: 0,
  clearing_balance: 0,
  volume_success: 0,
  volume_30d: 0,
  avg_transaction: 0,
  success_rate: "0.00%",
  transactions: { total: 0, paid: 0, pending: 0, cancelled: 0, expired: 0 },
};

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

function KpiSkeleton() {
  return (
    <div className="space-y-1">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function OverviewKpis() {
  const [stats, setStats] = useState<ProfileStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [prevVolume30d, setPrevVolume30d] = useState(0);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = getCookie("access_token");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${GATEWAY_BASE}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const result = await res.json();
        if (result.status && result.data?.stats) {
          setStats(result.data.stats);
          // Estimasi bulan lalu dari selisih volume_success - volume_30d
          const lastMonth = result.data.stats.volume_success - result.data.stats.volume_30d;
          setPrevVolume30d(Math.max(0, lastMonth));
        }
      } catch {
        // Gagal fetch — tetap pakai default 0
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // Hitung persentase perubahan
  function pctChange(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const pct = ((current - previous) / previous) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  }

  const successRateNum = parseFloat(stats.success_rate);
  const prevSuccessRate = 0; // tidak ada data bulan lalu dari API
  const successRateDiff = (successRateNum - prevSuccessRate).toFixed(1);

  const volumeChange = pctChange(stats.volume_30d, prevVolume30d);
  const isVolumeUp = !volumeChange.startsWith("-");
  const isSuccessUp = successRateNum >= 50;

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid grid-cols-1 xl:grid-cols-8">

        {/* Volume 30 hari */}
        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">Volume 30 hari</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {isLoading ? (
              <KpiSkeleton />
            ) : (
              <div className="space-y-1">
                <div className="text-3xl leading-none tracking-tight">
                  {fmtRp(stats.volume_30d)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Total volume transaksi bulan ini
                </p>
              </div>
            )}
            {!isLoading && (
              <Badge
                className={
                  isVolumeUp
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {volumeChange}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Saldo aktif */}
        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">Saldo aktif</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {isLoading ? (
              <KpiSkeleton />
            ) : (
              <div className="flex flex-col gap-1">
                <div className="text-3xl leading-none tracking-tight">
                  {fmtRp(stats.active_balance)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {fmtRp(stats.clearing_balance)} dalam proses kliring
                </p>
              </div>
            )}
            {!isLoading && (
              <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                {stats.transactions.paid} paid
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Rata-rata transaksi */}
        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">Rata-rata transaksi</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {isLoading ? (
              <KpiSkeleton />
            ) : (
              <div className="flex flex-col gap-1">
                <div className="text-3xl leading-none tracking-tight">
                  {fmtRp(stats.avg_transaction)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Dari {stats.transactions.total} total transaksi
                </p>
              </div>
            )}
            {!isLoading && (
              <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                {stats.transactions.pending} pending
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Success rate */}
        <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">Success rate</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {isLoading ? (
              <KpiSkeleton />
            ) : (
              <div className="flex flex-col gap-1">
                <div className="text-3xl leading-none tracking-tight">
                  {stats.success_rate}
                </div>
                <p className="text-muted-foreground text-xs">
                  {stats.transactions.paid} berhasil dari {stats.transactions.total} transaksi
                </p>
              </div>
            )}
            {!isLoading && (
              <Badge
                className={
                  isSuccessUp
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {successRateNum >= 50 ? "+" : ""}{successRateDiff}%
              </Badge>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
