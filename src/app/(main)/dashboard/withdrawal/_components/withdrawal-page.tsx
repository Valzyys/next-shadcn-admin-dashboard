"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  Loader2,
  RefreshCw,
  Wallet,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";
const FEE_RATE = 0.05; // 5%

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const res = await fetch("/api/gateway/token");
    const result = await res.json();
    if (result.status && result.token) {
      return { Authorization: `Bearer ${result.token}` };
    }
  } catch {}
  return {};
}

function fmtRp(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(1)}K`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function fmtRpFull(n: number): string {
  return `Rp ${Math.floor(n).toLocaleString("id-ID")}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

const EWALLET_OPTIONS = ["OVO", "DANA", "GOPAY", "SHOPEEPAY"];

const STATUS_CONFIG = {
  pending:  { label: "Menunggu",   cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300",  icon: Clock },
  approved: { label: "Disetujui",  cls: "bg-green-500/10 text-green-700 dark:text-green-300",  icon: CheckCircle2 },
  rejected: { label: "Ditolak",    cls: "bg-red-500/10 text-red-700 dark:text-red-300",        icon: XCircle },
} as const;

type WithdrawalHistory = {
  id: string;
  amount: number;
  formatted_amount: string;
  ewallet_type: string;
  ewallet_number: string;
  account_name: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
};

type ProfileStats = {
  active_balance: number;
  clearing_balance: number;
};

// ─── Fee Breakdown Component ───────────────────────────────────────────────────
function FeeBreakdown({ amount }: { amount: number }) {
  if (!amount || amount < 10000) return null;

  const fee = Math.floor(amount * FEE_RATE);
  const received = amount - fee;

  return (
    <div className="rounded-lg border border-dashed bg-muted/40 px-3 py-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Info className="size-3.5" />
        Rincian Penarikan
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Jumlah ditarik dari saldo</span>
          <span className="font-medium tabular-nums">{fmtRpFull(amount)}</span>
        </div>
        <div className="flex justify-between text-destructive/80">
          <span>Biaya layanan (5%)</span>
          <span className="font-medium tabular-nums">− {fmtRpFull(fee)}</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between">
          <span className="font-semibold">Diterima di e-wallet</span>
          <span className="font-bold text-green-600 dark:text-green-400 tabular-nums">
            {fmtRpFull(received)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Balance Card ──────────────────────────────────────────────────────────────
function BalanceCard({ onRefresh }: { onRefresh: () => void }) {
  const [stats, setStats] = React.useState<ProfileStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/profile`, { headers: auth });
      const result = await res.json();
      if (result.status) {
        setStats({
          active_balance: result.data.stats.active_balance,
          clearing_balance: result.data.stats.clearing_balance,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchStats(); }, [fetchStats]);

  React.useEffect(() => {
    const handler = () => fetchStats();
    window.addEventListener("refresh-balance", handler);
    return () => window.removeEventListener("refresh-balance", handler);
  }, [fetchStats]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-normal text-sm text-muted-foreground">Saldo Aktif</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10">
              <Wallet className="size-4 text-green-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {fmtRp(stats?.active_balance ?? 0)}
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs">Dapat ditarik sekarang</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="font-normal text-sm text-muted-foreground">Saldo Kliring</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="size-4 text-amber-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {fmtRp(stats?.clearing_balance ?? 0)}
              </p>
              <p className="mt-0.5 text-muted-foreground text-xs">Sedang diproses</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Withdraw Form ─────────────────────────────────────────────────────────────
function WithdrawForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = React.useState({
    amount: "",
    ewallet_type: "",
    ewallet_number: "",
    account_name: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Numeric value of the raw amount (what gets deducted from balance)
  const rawAmount = Number(form.amount.replace(/\D/g, "")) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const amount = rawAmount;

    if (!amount || amount < 10000) {
      setError("Minimal penarikan Rp 10.000");
      return;
    }
    if (amount % 1000 !== 0) {
      setError("Nominal harus kelipatan Rp 1.000");
      return;
    }
    if (amount > 5000000) {
      setError("Maksimal penarikan Rp 5.000.000 per permintaan");
      return;
    }
    if (!form.ewallet_type) {
      setError("Pilih jenis e-wallet");
      return;
    }
    if (!form.ewallet_number) {
      setError("Nomor e-wallet wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const auth = await getAuthHeader();
      // amount yang dikirim ke backend = jumlah yang dipotong dari saldo (sebelum fee)
      const res = await fetch(`${GATEWAY_BASE}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({
          amount,                              // total dipotong dari saldo
          fee_rate: FEE_RATE,                  // informasi rate fee (opsional, bisa dihitung di backend)
          ewallet_type: form.ewallet_type,
          ewallet_number: form.ewallet_number,
          account_name: form.account_name || undefined,
        }),
      });

      const result = await res.json();

      if (!result.status) {
        setError(result.message || "Gagal mengajukan penarikan");
        return;
      }

      const fee = Math.floor(amount * FEE_RATE);
      const received = amount - fee;
      setSuccess(
        `Permintaan penarikan ${fmtRpFull(amount)} berhasil diajukan! Estimasi diterima: ${fmtRpFull(received)}`
      );
      setForm({ amount: "", ewallet_type: "", ewallet_number: "", account_name: "" });
      window.dispatchEvent(new Event("refresh-balance"));
      onSuccess();
    } catch {
      setError("Network error. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ajukan Penarikan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah Penarikan</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
              <Input
                id="amount"
                placeholder="10.000"
                value={form.amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setForm((p) => ({ ...p, amount: raw ? Number(raw).toLocaleString("id-ID") : "" }));
                }}
                className="pl-9"
              />
            </div>
            <p className="text-muted-foreground text-xs">
              Min. Rp 10.000 · Max. Rp 5.000.000 · Kelipatan Rp 1.000
            </p>
          </div>

          {/* Fee Breakdown — muncul saat amount valid */}
          <FeeBreakdown amount={rawAmount} />

          <div className="space-y-2">
            <Label>Jenis E-Wallet</Label>
            <Select
              value={form.ewallet_type}
              onValueChange={(v) => setForm((p) => ({ ...p, ewallet_type: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih e-wallet..." />
              </SelectTrigger>
              <SelectContent>
                {EWALLET_OPTIONS.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ewallet_number">Nomor E-Wallet</Label>
            <Input
              id="ewallet_number"
              placeholder="08xxxxxxxxxx"
              value={form.ewallet_number}
              onChange={(e) => setForm((p) => ({ ...p, ewallet_number: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name">
              Nama Akun{" "}
              <span className="text-muted-foreground font-normal text-xs">(opsional)</span>
            </Label>
            <Input
              id="account_name"
              placeholder="Nama pemilik e-wallet"
              value={form.account_name}
              onChange={(e) => setForm((p) => ({ ...p, account_name: e.target.value }))}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-md bg-green-500/10 px-3 py-2 text-green-700 dark:text-green-300 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              {success}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Mengajukan..." : "Ajukan Penarikan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Withdrawal History ────────────────────────────────────────────────────────
function WithdrawalHistory({ refreshKey }: { refreshKey: number }) {
  const [history, setHistory] = React.useState<WithdrawalHistory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");

  const fetchHistory = React.useCallback(async () => {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const params = new URLSearchParams({ limit: "20" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${GATEWAY_BASE}/withdraw/history?${params}`, { headers: auth });
      const result = await res.json();
      if (result.status) setHistory(result.data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => { fetchHistory(); }, [fetchHistory, refreshKey]);

  const statuses = ["all", "pending", "approved", "rejected"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Semua" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label ?? s}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={fetchHistory} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Ditarik</TableHead>
              <TableHead>Fee (5%)</TableHead>
              <TableHead>Diterima</TableHead>
              <TableHead>E-Wallet</TableHead>
              <TableHead>Nomor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan Admin</TableHead>
              <TableHead>Diajukan</TableHead>
              <TableHead>Diproses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                  Belum ada riwayat penarikan
                </TableCell>
              </TableRow>
            ) : (
              history.map((w) => {
                const sc = STATUS_CONFIG[w.status];
                const Icon = sc.icon;
                const fee = Math.floor(w.amount * FEE_RATE);
                const received = w.amount - fee;
                return (
                  <TableRow key={w.id}>
                    <TableCell className="font-semibold tabular-nums">{w.formatted_amount}</TableCell>
                    <TableCell className="text-destructive/80 text-sm tabular-nums">
                      − {fmtRpFull(fee)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                      {fmtRpFull(received)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md text-xs">{w.ewallet_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{w.ewallet_number}</TableCell>
                    <TableCell>
                      <div className={cn("flex items-center gap-1.5 text-xs font-medium", sc.cls)}>
                        <Icon className="size-3.5" />
                        {sc.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-40 truncate">
                      {w.admin_notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {timeAgo(w.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {w.processed_at ? timeAgo(w.processed_at) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export function WithdrawalPage() {
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] flex-col">
      <div className="border-b bg-background px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-none">Penarikan Dana</h1>
            <p className="mt-1 text-muted-foreground text-xs">
              Tarik saldo ke e-wallet kamu · Biaya layanan 5%
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <BalanceCard onRefresh={() => setRefreshKey((k) => k + 1)} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr]">
            <WithdrawForm onSuccess={() => setRefreshKey((k) => k + 1)} />

            <div className="space-y-3">
              <h2 className="font-semibold text-sm">Riwayat Penarikan</h2>
              <WithdrawalHistory refreshKey={refreshKey} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
