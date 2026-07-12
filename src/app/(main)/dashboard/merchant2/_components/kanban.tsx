"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileEdit,
  Hash,
  ImagePlus,
  Key,
  Loader2,
  MapPin,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type {
  ApiKey,
  ChangeRequest,
  Merchant,
  ProfileStats,
  Transaction,
  Withdrawal,
} from "./types";

// ─── V2 base ─────────────────────────────────────────────────────────────────
const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway/v2";

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
  return `Rp ${n.toLocaleString("id-ID")}`;
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

const STATUS_CONFIG = {
  pending:      { label: "Pending",      cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  paid:         { label: "Berhasil",     cls: "bg-green-500/10 text-green-700 dark:text-green-300" },
  expired:      { label: "Expired",      cls: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
  cancelled:    { label: "Dibatalkan",   cls: "bg-red-500/10 text-red-700 dark:text-red-300" },
  needs_review: { label: "Perlu Review", cls: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  rejected:     { label: "Ditolak",      cls: "bg-red-500/10 text-red-700 dark:text-red-300" },
} as const;

const PAYMENT_TYPE_CONFIG = {
  dynamic: { label: "Dinamis", cls: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  static:  { label: "Statis",  cls: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
} as const;

const WITHDRAW_STATUS_CONFIG = {
  pending:  { label: "Menunggu",   cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300", icon: Clock },
  approved: { label: "Diproses",   cls: "bg-blue-500/10 text-blue-700 dark:text-blue-300", icon: RefreshCw },
  paid_out: { label: "Selesai",    cls: "bg-green-500/10 text-green-700 dark:text-green-300", icon: CheckCircle2 },
  rejected: { label: "Ditolak",    cls: "bg-red-500/10 text-red-700 dark:text-red-300", icon: XCircle },
  cancelled:{ label: "Dibatalkan", cls: "bg-slate-500/10 text-slate-700 dark:text-slate-300", icon: XCircle },
} as const;

const WALLET_OPTIONS: { value: Withdrawal["wallet_type"]; label: string }[] = [
  { value: "dana", label: "DANA" },
  { value: "ovo", label: "OVO" },
  { value: "gopay", label: "GoPay" },
  { value: "shopeepay", label: "ShopeePay" },
  { value: "astrapay", label: "AstraPay" },
  { value: "linkaja", label: "LinkAja" },
  { value: "isaku", label: "i.saku" },
];

const WITHDRAW_FEE_PERCENT = 5;
const WITHDRAW_MIN_AMOUNT = 10000;

// ─── Register Form (V2: + phone) ────────────────────────────────────────────
function RegisterMerchantForm({ onSuccess }: { onSuccess: (m: Merchant) => void }) {
  const [form, setForm] = React.useState({
    merchant_name: "",
    city: "",
    business_type: "",
    description: "",
    phone: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.merchant_name || !form.city) {
      setError("Nama merchant dan kota wajib diisi");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/merchant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!result.status) throw new Error(result.message);
      onSuccess(result.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mendaftarkan merchant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] items-center justify-center bg-muted/25 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 space-y-1.5 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Daftarkan Merchant</h1>
          <p className="text-muted-foreground text-sm">
            Lengkapi data merchant untuk mendapatkan QRIS statis & mulai menerima pembayaran
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="merchant_name">
                    Nama Merchant <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="merchant_name"
                    placeholder="contoh: Toko Baju Keren"
                    value={form.merchant_name}
                    onChange={(e) => setForm((p) => ({ ...p, merchant_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">
                    Kota <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="contoh: Jakarta"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Jenis Usaha</Label>
                  <Input
                    id="business_type"
                    placeholder="contoh: Retail, F&B, Jasa..."
                    value={form.business_type}
                    onChange={(e) => setForm((p) => ({ ...p, business_type: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon</Label>
                  <Input
                    id="phone"
                    placeholder="contoh: 0812xxxxxxx"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  placeholder="Ceritakan sedikit tentang bisnis Anda"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Plus />}
                {loading ? "Mendaftarkan..." : "Daftarkan Merchant"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="truncate font-normal text-muted-foreground text-xs sm:text-sm">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
        {sub && <p className="mt-0.5 truncate text-muted-foreground text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Transaction List (V2: gabungan dynamic + static via /payment/history) ──
function TransactionList() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [offset, setOffset] = React.useState(0);
  const limit = 20;

  const fetchTrx = React.useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(off) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("payment_type", typeFilter);
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/payment/history?${params}`, { headers: auth });
      const result = await res.json();
      if (result.status) {
        setTransactions(result.data);
        setOffset(off);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  React.useEffect(() => { fetchTrx(0); }, [fetchTrx]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.ref_id.toLowerCase().includes(q) ||
        t.gi_trx_id.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.customer_name?.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const statuses = ["all", "pending", "paid", "needs_review", "expired", "cancelled", "rejected"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {statuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className="shrink-0"
            >
              {s === "all" ? "Semua" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label ?? s}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
            {["all", "dynamic", "static"].map((t) => (
              <Button
                key={t}
                size="sm"
                variant={typeFilter === t ? "secondary" : "ghost"}
                onClick={() => setTypeFilter(t)}
                className="shrink-0"
              >
                {t === "all" ? "Semua Tipe" : PAYMENT_TYPE_CONFIG[t as keyof typeof PAYMENT_TYPE_CONFIG].label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 sm:w-56"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => fetchTrx(offset)} disabled={loading} className="shrink-0">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Ref ID</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Waktu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Tidak ada transaksi ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((trx) => {
                const sc = STATUS_CONFIG[trx.status];
                const tc = trx.payment_type ? PAYMENT_TYPE_CONFIG[trx.payment_type] : null;
                return (
                  <TableRow key={trx.id}>
                    <TableCell className="font-mono text-xs">
                      <div>{trx.ref_id}</div>
                      <div className="text-muted-foreground text-[10px]">{trx.gi_trx_id}</div>
                    </TableCell>
                    <TableCell>
                      {tc && (
                        <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", tc.cls)}>
                          {tc.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {trx.formatted_amount ?? fmtRp(trx.final_amount ?? trx.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", sc.cls)}>
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-muted-foreground text-sm">
                      {trx.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {trx.customer_name ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {timeAgo(trx.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: card list */}
      <div className="space-y-2 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border py-12 text-center text-muted-foreground text-sm">
            Tidak ada transaksi ditemukan
          </div>
        ) : (
          filtered.map((trx) => {
            const sc = STATUS_CONFIG[trx.status];
            const tc = trx.payment_type ? PAYMENT_TYPE_CONFIG[trx.payment_type] : null;
            return (
              <div key={trx.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs">{trx.ref_id}</p>
                    <p className="truncate text-muted-foreground text-[10px]">{trx.gi_trx_id}</p>
                  </div>
                  <Badge variant="secondary" className={cn("shrink-0 rounded-md border-transparent text-xs", sc.cls)}>
                    {sc.label}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold tabular-nums">
                    {trx.formatted_amount ?? fmtRp(trx.final_amount ?? trx.amount)}
                  </span>
                  {tc && (
                    <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", tc.cls)}>
                      {tc.label}
                    </Badge>
                  )}
                </div>
                {(trx.description || trx.customer_name) && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-xs">
                    {trx.description && <span className="truncate">{trx.description}</span>}
                    {trx.customer_name && <span className="truncate">· {trx.customer_name}</span>}
                  </div>
                )}
                <p className="mt-1.5 text-muted-foreground text-[10px]">{timeAgo(trx.created_at)}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-end gap-2 text-muted-foreground text-sm">
        <Button
          variant="outline" size="sm"
          disabled={offset === 0 || loading}
          onClick={() => fetchTrx(Math.max(0, offset - limit))}
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline" size="sm"
          disabled={filtered.length < limit || loading}
          onClick={() => fetchTrx(offset + limit)}
        >
          Berikutnya
        </Button>
      </div>
    </div>
  );
}

// ─── Withdraw Panel (baru) ───────────────────────────────────────────────────
function WithdrawPanel({ availableBalance, onWithdrawSuccess }: { availableBalance: number; onWithdrawSuccess: () => void }) {
  const [history, setHistory] = React.useState<Withdrawal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({
    amount: "",
    wallet_type: "" as Withdrawal["wallet_type"] | "",
    wallet_number: "",
    wallet_account_name: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function fetchHistory() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/withdraw?limit=30`, { headers: auth });
      const result = await res.json();
      if (result.status) setHistory(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchHistory(); }, []);

  const amountNum = Number(form.amount) || 0;
  const fee = Math.round(amountNum * (WITHDRAW_FEE_PERCENT / 100));
  const net = amountNum - fee;
  const isValidAmount = amountNum >= WITHDRAW_MIN_AMOUNT && amountNum <= availableBalance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.wallet_type) return setError("Pilih e-wallet tujuan terlebih dahulu");
    if (!form.wallet_number) return setError("Nomor e-wallet wajib diisi");
    if (!form.wallet_account_name) return setError("Nama pemilik e-wallet wajib diisi");
    if (amountNum < WITHDRAW_MIN_AMOUNT) return setError(`Minimal penarikan ${fmtRpFull(WITHDRAW_MIN_AMOUNT)}`);
    if (amountNum > availableBalance) return setError("Nominal melebihi saldo tersedia");

    setSubmitting(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({
          amount: amountNum,
          wallet_type: form.wallet_type,
          wallet_number: form.wallet_number,
          wallet_account_name: form.wallet_account_name,
        }),
      });
      const result = await res.json();
      if (!result.status) throw new Error(result.message);
      setSuccess(`Penarikan diajukan. Kamu akan menerima ${result.data.formatted_net_amount} setelah disetujui admin.`);
      setForm({ amount: "", wallet_type: "", wallet_number: "", wallet_account_name: "" });
      fetchHistory();
      onWithdrawSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mengajukan penarikan");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelWithdraw(refId: string) {
    const auth = await getAuthHeader();
    await fetch(`${GATEWAY_BASE}/withdraw/${refId}`, { method: "DELETE", headers: auth });
    fetchHistory();
    onWithdrawSuccess();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <ArrowDownToLine className="size-4" /> Tarik Saldo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-muted-foreground text-xs">Saldo tersedia</p>
            <p className="font-semibold text-lg tabular-nums">{fmtRpFull(availableBalance)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label>Nominal Penarikan *</Label>
              <Input
                type="number"
                placeholder={`min. ${fmtRpFull(WITHDRAW_MIN_AMOUNT)}`}
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[0.25, 0.5, 1].map((frac) => {
                  const val = Math.floor((availableBalance * frac) / 1000) * 1000;
                  if (val < WITHDRAW_MIN_AMOUNT) return null;
                  return (
                    <button
                      key={frac}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, amount: String(val) }))}
                      className="rounded-md border px-2 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {frac === 1 ? "Semua" : `${frac * 100}%`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>E-Wallet Tujuan *</Label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {WALLET_OPTIONS.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, wallet_type: w.value }))}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs transition-colors",
                      form.wallet_type === w.value
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Nomor E-Wallet *</Label>
              <Input
                placeholder="0812xxxxxxxx"
                value={form.wallet_number}
                onChange={(e) => setForm((p) => ({ ...p, wallet_number: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nama Pemilik E-Wallet *</Label>
              <Input
                placeholder="Sesuai nama terdaftar di e-wallet"
                value={form.wallet_account_name}
                onChange={(e) => setForm((p) => ({ ...p, wallet_account_name: e.target.value }))}
              />
            </div>

            {amountNum > 0 && (
              <div className="space-y-1 rounded-lg border border-dashed px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Nominal diajukan</span>
                  <span className="tabular-nums">{fmtRpFull(amountNum)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Fee ({WITHDRAW_FEE_PERCENT}%)</span>
                  <span className="tabular-nums">- {fmtRpFull(fee)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-1 font-medium">
                  <span>Diterima</span>
                  <span className="tabular-nums">{fmtRpFull(net)}</span>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">{error}</p>
            )}
            {success && (
              <p className="flex items-start gap-2 rounded-md bg-green-500/10 px-3 py-2 text-green-700 text-sm dark:text-green-300">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                {success}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting || !isValidAmount}>
              {submitting ? <Loader2 className="animate-spin" /> : <ArrowDownToLine className="size-4" />}
              {submitting ? "Mengajukan..." : "Ajukan Penarikan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Riwayat Penarikan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Belum ada riwayat penarikan
            </div>
          ) : (
            history.map((wd) => {
              const sc = WITHDRAW_STATUS_CONFIG[wd.status];
              const StatusIcon = sc.icon;
              return (
                <div key={wd.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", sc.cls)}>
                      <StatusIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium text-sm">{fmtRpFull(wd.net_amount)}</p>
                        <span className="text-muted-foreground text-xs">
                          ke {WALLET_OPTIONS.find((w) => w.value === wd.wallet_type)?.label ?? wd.wallet_type}
                        </span>
                      </div>
                      <p className="truncate text-muted-foreground text-xs">
                        {wd.ref_id} · {timeAgo(wd.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", sc.cls)}>
                      {sc.label}
                    </Badge>
                    {wd.status === "pending" && (
                      <Button
                        variant="ghost" size="icon-xs"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => cancelWithdraw(wd.ref_id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── QRIS Statis Panel ───────────────────────────────────────────────────────
function extractNmid(qrisContent: string | undefined): string | null {
  if (!qrisContent) return null;
  const match = qrisContent.match(/ID\d{13}/);
  return match ? match[0] : null;
}

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar QR"));
    img.src = src;
  });
}

function toProxiedImageUrl(url: string): string {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
  return cursorY;
}

const QRIS_TEMPLATE_URL =
  "https://i.pinimg.com/1200x/b7/c7/f5/b7c7f57fcbbca4d5df4e9f3b4261007b.jpg";

async function buildQrisPosterDataUrl(opts: {
  merchantName: string;
  nmid: string | null;
  qrImageUrl: string;
}): Promise<string> {
  const templateImg = await loadImageEl(toProxiedImageUrl(QRIS_TEMPLATE_URL));
  const W = templateImg.naturalWidth;
  const H = templateImg.naturalHeight;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung");

  ctx.drawImage(templateImg, 0, 0, W, H);

  const textCoverX = W * 0.17;
  const textCoverY = H * 0.145;
  const textCoverW = W * 0.63;
  const textCoverH = H * 0.16;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(textCoverX, textCoverY, textCoverW, textCoverH);

  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.font = `bold ${Math.round(W * 0.052)}px Arial, sans-serif`;
  const nameEndY = wrapCanvasText(
    ctx,
    opts.merchantName.toUpperCase(),
    W / 2,
    H * 0.205,
    W * 0.82,
    W * 0.062,
  );

  ctx.font = `${Math.round(W * 0.032)}px Arial, sans-serif`;
  ctx.fillStyle = "#333333";
  const nmidY = Math.max(nameEndY + W * 0.06, H * 0.27);
  ctx.fillText(opts.nmid ? `NMID : ${opts.nmid}` : "NMID : -", W / 2, nmidY);

  const qrSize = W * 0.54;
  const qrX = (W - qrSize) / 2;
  const qrY = H * 0.315;
  const padSide = qrSize * 0.012;
  const padTop = qrSize * 0.012;
  const padBottom = qrSize * 0.02;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(
    qrX - padSide,
    qrY - padTop,
    qrSize + padSide * 2,
    qrSize + padTop + padBottom,
  );

  const qrImg = await loadImageEl(toProxiedImageUrl(opts.qrImageUrl));
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  return canvas.toDataURL("image/png");
}

function StaticQrisPanel({ merchant, isVerified }: { merchant: Merchant; isVerified: boolean }) {
  const [data, setData] = React.useState<{ qris_content: string; qr_image_url: string | null } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [posterUrl, setPosterUrl] = React.useState<string | null>(null);
  const [posterError, setPosterError] = React.useState<string | null>(null);
  const [posterLoading, setPosterLoading] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const [proofForm, setProofForm] = React.useState({
    image_url: "", amount: "", customer_name: "", customer_email: "", customer_phone: "", description: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [proofResult, setProofResult] = React.useState<{ status: string; message: string } | null>(null);

  React.useEffect(() => {
    async function fetchQris() {
      setLoading(true);
      try {
        const auth = await getAuthHeader();
        const res = await fetch(`${GATEWAY_BASE}/payment/static/qris`, { headers: auth });
        const result = await res.json();
        if (result.status) setData(result.data);
      } finally {
        setLoading(false);
      }
    }
    fetchQris();
  }, []);

  React.useEffect(() => {
    if (!data?.qr_image_url) return;
    let cancelled = false;
    setPosterLoading(true);
    setPosterError(null);
    buildQrisPosterDataUrl({
      merchantName: merchant.merchant_name,
      nmid: extractNmid(data.qris_content),
      qrImageUrl: data.qr_image_url,
    })
      .then((url) => {
        if (!cancelled) setPosterUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPosterError("Gagal membuat template QRIS, menampilkan QR polos.");
      })
      .finally(() => {
        if (!cancelled) setPosterLoading(false);
      });
    return () => { cancelled = true; };
  }, [data?.qr_image_url, data?.qris_content, merchant.merchant_name]);

  function copyContent() {
    if (!data?.qris_content) return;
    navigator.clipboard.writeText(data.qris_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      let url = posterUrl;
      if (!url && data?.qr_image_url) {
        url = await buildQrisPosterDataUrl({
          merchantName: merchant.merchant_name,
          nmid: extractNmid(data.qris_content),
          qrImageUrl: data.qr_image_url,
        });
      }
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.download = `qris-${merchant.merchant_name.trim().toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setPosterError("Gagal men-download gambar QRIS.");
    } finally {
      setDownloading(false);
    }
  }

  async function submitProof(e: React.FormEvent) {
    e.preventDefault();
    if (!proofForm.image_url || !proofForm.amount) return;
    setSubmitting(true);
    setProofResult(null);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/payment/static/submit-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ ...proofForm, amount: Number(proofForm.amount) }),
      });
      const result = await res.json();
      setProofResult({
        status: result.payment_status ?? (result.status ? "ok" : "error"),
        message: result.message,
      });
    } catch (e: unknown) {
      setProofResult({ status: "error", message: e instanceof Error ? e.message : "Gagal mengirim bukti" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
          <ShieldCheck className="size-7 text-amber-500" />
        </div>
        <h3 className="font-semibold text-base">Menunggu Verifikasi</h3>
        <p className="mt-1.5 max-w-sm text-muted-foreground text-sm">
          QRIS statis akan aktif digunakan setelah merchant terverifikasi oleh admin.
        </p>
      </div>
    );
  }

  const showingPoster = Boolean(posterUrl);
  const displayImageUrl = posterUrl ?? data?.qr_image_url ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <QrCode className="size-4" /> QRIS Statis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading || posterLoading ? (
            <Skeleton className={cn("w-full rounded-lg", showingPoster ? "aspect-[880/1246]" : "aspect-square")} />
          ) : displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={`QRIS ${merchant.merchant_name}`}
              className={cn(
                "w-full rounded-lg border bg-white object-contain",
                showingPoster ? "aspect-[880/1246]" : "aspect-square",
              )}
            />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed text-muted-foreground text-xs">
              QR belum tersedia
            </div>
          )}

          {posterError && (
            <p className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-amber-700 text-xs dark:text-amber-300">
              {posterError}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={copyContent} disabled={!data?.qris_content}>
              <Copy className={cn("size-3.5", copied && "text-green-500")} />
              {copied ? "Tersalin" : "Salin Kode"}
            </Button>
            <Button
              variant="outline" size="sm" className="flex-1"
              onClick={handleDownload}
              disabled={!displayImageUrl || downloading}
            >
              {downloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              {downloading ? "Menyiapkan..." : "Download"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Send className="size-4" /> Ajukan Bukti Transfer (verifikasi manual)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitProof} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>URL Gambar Bukti Transfer *</Label>
                <Input
                  placeholder="https://..."
                  value={proofForm.image_url}
                  onChange={(e) => setProofForm((p) => ({ ...p, image_url: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nominal *</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={proofForm.amount}
                  onChange={(e) => setProofForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nama Customer</Label>
                <Input
                  value={proofForm.customer_name}
                  onChange={(e) => setProofForm((p) => ({ ...p, customer_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email Customer</Label>
                <Input
                  value={proofForm.customer_email}
                  onChange={(e) => setProofForm((p) => ({ ...p, customer_email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi</Label>
                <Input
                  value={proofForm.description}
                  onChange={(e) => setProofForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>

            {proofResult && (
              <p className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                proofResult.status === "paid"
                  ? "bg-green-500/10 text-green-700 dark:text-green-300"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
              )}>
                {proofResult.status === "paid" ? <CheckCircle2 className="size-4" /> : <ImagePlus className="size-4" />}
                {proofResult.message}
              </p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
              {submitting ? "Memproses..." : "Kirim Bukti"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── API Keys Panel (V2) ─────────────────────────────────────────────────────
function ApiKeysPanel({ isVerified }: { isVerified: boolean }) {
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState("");
  const [expiresDays, setExpiresDays] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [visibleKeys, setVisibleKeys] = React.useState<Set<string>>(new Set());
  const [copied, setCopied] = React.useState<string | null>(null);

  async function fetchKeys() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/apikeys`, { headers: auth });
      const result = await res.json();
      if (result.status) setKeys(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchKeys(); }, []);

  async function createKey() {
    setCreating(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/apikeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({
          label: newLabel || "Default Key",
          expires_days: expiresDays ? Number(expiresDays) : undefined,
        }),
      });
      const result = await res.json();
      if (result.status) {
        setNewLabel("");
        setExpiresDays("");
        setShowForm(false);
        fetchKeys();
      }
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    const auth = await getAuthHeader();
    await fetch(`${GATEWAY_BASE}/apikeys/${id}`, { method: "DELETE", headers: auth });
    fetchKeys();
  }

  function toggleVisible(id: string) {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function copyKey(key: string, id: string) {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function maskKey(key: string) {
    return key.slice(0, 8) + "•".repeat(16) + key.slice(-6);
  }

  if (!isVerified) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
          <ShieldCheck className="size-7 text-amber-500" />
        </div>
        <h3 className="font-semibold text-base">Menunggu Verifikasi</h3>
        <p className="mt-1.5 max-w-sm text-muted-foreground text-sm">
          Merchant kamu sedang dalam proses verifikasi oleh admin. API Key V2 baru bisa dibuat setelah merchant terverifikasi.
        </p>
        <Badge
          variant="secondary"
          className="mt-4 rounded-md border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300"
        >
          Menunggu verifikasi admin
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Opsional — dipakai kalau kamu mau integrasi server-to-server (bot, aplikasi eksternal)
          tanpa login JWT. Dashboard ini sendiri (transaksi & saldo) sudah jalan tanpa API Key.
        </p>
        <Button size="sm" onClick={() => setShowForm((p) => !p)} className="shrink-0">
          <Plus />
          Buat API Key
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Label (opsional)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Berlaku (hari, opsional)"
                value={expiresDays}
                onChange={(e) => setExpiresDays(e.target.value)}
                className="sm:w-48"
              />
              <div className="flex gap-2">
                <Button onClick={createKey} disabled={creating}>
                  {creating ? <Loader2 className="animate-spin" /> : "Buat"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Label</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Terakhir dipakai</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Belum ada API Key V2. Buat satu kalau perlu integrasi eksternal.
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.label}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-muted-foreground text-xs">
                        {visibleKeys.has(key.id) ? key.api_key : maskKey(key.api_key)}
                      </code>
                      <Button
                        variant="ghost" size="icon-xs"
                        onClick={() => toggleVisible(key.id)}
                        className="text-muted-foreground"
                      >
                        {visibleKeys.has(key.id)
                          ? <EyeOff className="size-3.5" />
                          : <Eye className="size-3.5" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon-xs"
                        onClick={() => copyKey(key.api_key, key.id)}
                        className="text-muted-foreground"
                      >
                        <Copy className={cn("size-3.5", copied === key.id && "text-green-500")} />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-md border-transparent text-xs",
                        key.revoked
                          ? "bg-red-500/10 text-red-700 dark:text-red-300"
                          : "bg-green-500/10 text-green-700 dark:text-green-300",
                      )}
                    >
                      {key.revoked ? "Nonaktif" : "Aktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {key.last_used_at ? timeAgo(key.last_used_at) : "Belum pernah"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {timeAgo(key.created_at)}
                  </TableCell>
                  <TableCell>
                    {!key.revoked && (
                      <Button
                        variant="ghost" size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => revokeKey(key.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
        ) : keys.length === 0 ? (
          <div className="rounded-xl border py-10 text-center text-muted-foreground text-sm">
            Belum ada API Key V2
          </div>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{key.label}</p>
                <div className="flex items-center gap-1">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-md border-transparent text-xs",
                      key.revoked
                        ? "bg-red-500/10 text-red-700 dark:text-red-300"
                        : "bg-green-500/10 text-green-700 dark:text-green-300",
                    )}
                  >
                    {key.revoked ? "Nonaktif" : "Aktif"}
                  </Badge>
                  {!key.revoked && (
                    <Button
                      variant="ghost" size="icon-xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => revokeKey(key.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs">
                  {visibleKeys.has(key.id) ? key.api_key : maskKey(key.api_key)}
                </code>
                <Button variant="ghost" size="icon-xs" onClick={() => toggleVisible(key.id)} className="shrink-0 text-muted-foreground">
                  {visibleKeys.has(key.id) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => copyKey(key.api_key, key.id)} className="shrink-0 text-muted-foreground">
                  <Copy className={cn("size-3.5", copied === key.id && "text-green-500")} />
                </Button>
              </div>
              <p className="mt-1.5 text-muted-foreground text-[10px]">
                {key.last_used_at ? `Dipakai ${timeAgo(key.last_used_at)}` : "Belum pernah dipakai"} · Dibuat {timeAgo(key.created_at)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Pengaturan Panel ────────────────────────────────────────────────────────
function SettingsPanel({ merchant }: { merchant: Merchant }) {
  const [history, setHistory] = React.useState<ChangeRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({
    merchant_name: merchant.merchant_name,
    city: merchant.city,
    business_type: merchant.business_type ?? "",
    description: merchant.description ?? "",
    phone: merchant.phone ?? "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function fetchHistory() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/merchant/change-request`, { headers: auth });
      const result = await res.json();
      if (result.status) setHistory(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchHistory(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/merchant/change-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      setMessage(result.message);
      if (result.status) fetchHistory();
    } finally {
      setSubmitting(false);
    }
  }

  const CR_STATUS: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    approved: "bg-green-500/10 text-green-700 dark:text-green-300",
    rejected: "bg-red-500/10 text-red-700 dark:text-red-300",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <FileEdit className="size-4" /> Ajukan Perubahan Data Merchant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nama Merchant</Label>
                <Input value={form.merchant_name} onChange={(e) => setForm((p) => ({ ...p, merchant_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Kota</Label>
                <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Usaha</Label>
                <Input value={form.business_type} onChange={(e) => setForm((p) => ({ ...p, business_type: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>No. Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Deskripsi</Label>
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            {message && (
              <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground text-sm">{message}</p>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Send className="size-4" />}
              Ajukan Perubahan
            </Button>
            <p className="text-muted-foreground text-xs">
              Perubahan baru berlaku setelah disetujui admin. QRIS statis akan otomatis diregenerate.
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Riwayat Pengajuan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">Belum ada pengajuan perubahan</p>
          ) : (
            history.map((cr) => (
              <div key={cr.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{cr.new_merchant_name ?? merchant.merchant_name}</p>
                  <p className="text-muted-foreground text-xs">{timeAgo(cr.created_at)}</p>
                </div>
                <Badge variant="secondary" className={cn("shrink-0 rounded-md border-transparent text-xs", CR_STATUS[cr.status])}>
                  {cr.status === "pending" ? "Pending" : cr.status === "approved" ? "Disetujui" : "Ditolak"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Merchant Dashboard (V2) ─────────────────────────────────────────────────
function MerchantDashboard({ merchant }: { merchant: Merchant }) {
  const [stats, setStats] = React.useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

  const fetchStats = React.useCallback(async () => {
    setStatsLoading(true);
    try {
      const auth = await getAuthHeader();

      const [balanceRes, txRes] = await Promise.all([
        fetch(`${GATEWAY_BASE}/balance`, { headers: auth }),
        fetch(`${GATEWAY_BASE}/payment/history?limit=100`, { headers: auth }),
      ]);
      const balanceResult = await balanceRes.json();
      const txResult = await txRes.json();
      const txRows: Transaction[] = txResult.status ? txResult.data : [];

      const now = Date.now();
      const paid = txRows.filter((t) => t.status === "paid");
      const paid30d = paid.filter((t) => now - new Date(t.paid_at ?? t.created_at).getTime() <= 30 * 86400 * 1000);
      const volumeSuccess = paid.reduce((sum, t) => sum + (t.final_amount ?? t.amount), 0);
      const volume30d = paid30d.reduce((sum, t) => sum + (t.final_amount ?? t.amount), 0);

      const counts = {
        total: txRows.length,
        paid: paid.length,
        pending: txRows.filter((t) => t.status === "pending").length,
        cancelled: txRows.filter((t) => t.status === "cancelled").length,
        expired: txRows.filter((t) => t.status === "expired").length,
      };

      setStats({
        active_balance: balanceResult.status ? balanceResult.data.available_balance : 0,
        clearing_balance: balanceResult.status ? balanceResult.data.total_withdrawn_or_pending : 0,
        volume_success: volumeSuccess,
        volume_30d: volume30d,
        avg_transaction: paid.length ? volumeSuccess / paid.length : 0,
        success_rate: counts.total ? `${((counts.paid / counts.total) * 100).toFixed(1)}%` : "0%",
        transactions: counts,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] flex-col">
      <div className="border-b bg-background px-4 py-4 lg:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-semibold text-base leading-none">{merchant.merchant_name}</h1>
              {merchant.is_verified && <BadgeCheck className="size-4 shrink-0 text-blue-500" />}
              <Badge variant="secondary" className="shrink-0 rounded-md border-transparent bg-cyan-500/10 text-[10px] text-cyan-700 dark:text-cyan-300">
                Gateway V2
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />{merchant.city}
              </span>
              {merchant.business_type && <span>{merchant.business_type}</span>}
              {merchant.phone && (
                <span className="flex items-center gap-1"><Phone className="size-3" />{merchant.phone}</span>
              )}
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3" />
                {merchant.is_verified ? "Terverifikasi" : "Belum verifikasi"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-3 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-7 w-20" /></CardContent>
              </Card>
            ))
          ) : stats ? (
            <>
              <StatCard
                label="Saldo tersedia"
                value={fmtRp(stats.active_balance)}
                sub={`${fmtRp(stats.clearing_balance)} penarikan pending`}
                icon={<Wallet className="size-4 shrink-0 text-muted-foreground" />}
              />
              <StatCard
                label="Volume 30 hari"
                value={fmtRp(stats.volume_30d)}
                sub={`Total: ${fmtRp(stats.volume_success)}`}
              />
              <StatCard
                label="Rata-rata transaksi"
                value={fmtRp(stats.avg_transaction)}
                sub={`${stats.transactions.total} total transaksi`}
              />
              <StatCard
                label="Success rate"
                value={stats.success_rate}
                sub={`${stats.transactions.paid} berhasil`}
              />
            </>
          ) : null}
        </div>

        <Tabs defaultValue="transactions">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="mb-4 inline-flex w-max min-w-full sm:w-auto sm:min-w-0">
              <TabsTrigger value="transactions" className="gap-2">
                <Hash className="size-3.5" />
                Transaksi
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="gap-2">
                <ArrowDownToLine className="size-3.5" />
                Tarik Saldo
              </TabsTrigger>
              <TabsTrigger value="qris" className="gap-2">
                <QrCode className="size-3.5" />
                QRIS Statis
              </TabsTrigger>
              <TabsTrigger value="apikeys" className="gap-2">
                <Key className="size-3.5" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <FileEdit className="size-3.5" />
                Pengaturan
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="transactions">
            <TransactionList />
          </TabsContent>
          <TabsContent value="withdraw">
            <WithdrawPanel availableBalance={stats?.active_balance ?? 0} onWithdrawSuccess={fetchStats} />
          </TabsContent>
          <TabsContent value="qris">
            <StaticQrisPanel merchant={merchant} isVerified={merchant.is_verified} />
          </TabsContent>
          <TabsContent value="apikeys">
            <ApiKeysPanel isVerified={merchant.is_verified} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsPanel merchant={merchant} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export function Kanban() {
  const [merchant, setMerchant] = React.useState<Merchant | null>(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    async function checkMerchant() {
      try {
        const auth = await getAuthHeader();
        const res = await fetch(`${GATEWAY_BASE}/merchant`, { headers: auth });
        const result = await res.json();
        if (result.status && result.data) {
          setMerchant(result.data);
        }
      } finally {
        setChecking(false);
      }
    }
    checkMerchant();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!merchant) {
    return <RegisterMerchantForm onSuccess={setMerchant} />;
  }

  return <MerchantDashboard merchant={merchant} />;
}
