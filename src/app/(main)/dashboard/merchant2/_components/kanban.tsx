"use client";

import * as React from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
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
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] items-center justify-center bg-muted/25 px-4">
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-normal text-sm text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-muted-foreground text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Transaction List (V2: gabungan dynamic + static via /payment/history) ──
function TransactionList({ activeApiKey }: { activeApiKey: string | null }) {
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
      // Pakai API key kalau ada, kalau tidak fallback ke JWT (Bearer) biasa
      const headers = activeApiKey
        ? { "x-api-key": activeApiKey }
        : await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/payment/history?${params}`, { headers });
      const result = await res.json();
      if (result.status) {
        setTransactions(result.data);
        setOffset(off);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, activeApiKey]);
  
  React.useEffect(() => { fetchTrx(0); }, [fetchTrx]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.ref_id.toLowerCase().includes(q) ||
        t.gi_trx_id.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.customer_ref?.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  if (!activeApiKey) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <Key className="mb-3 size-8 text-muted-foreground" />
        <h3 className="font-semibold text-base">Belum ada API Key aktif</h3>
        <p className="mt-1.5 max-w-sm text-muted-foreground text-sm">
          Riwayat transaksi V2 diambil menggunakan API Key. Buat API Key terlebih dahulu di tab "API Keys".
        </p>
      </div>
    );
  }

  const statuses = ["all", "pending", "paid", "needs_review", "expired", "cancelled", "rejected"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5">
            {["all", "dynamic", "static"].map((t) => (
              <Button
                key={t}
                size="sm"
                variant={typeFilter === t ? "secondary" : "ghost"}
                onClick={() => setTypeFilter(t)}
              >
                {t === "all" ? "Semua Tipe" : PAYMENT_TYPE_CONFIG[t as keyof typeof PAYMENT_TYPE_CONFIG].label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => fetchTrx(offset)} disabled={loading}>
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
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
                      {trx.customer_ref ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {timeAgo(trx.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
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

// ─── QRIS Statis Panel (baru, khusus V2) ────────────────────────────────────
function StaticQrisPanel({ isVerified }: { isVerified: boolean }) {
  const [data, setData] = React.useState<{ qris_content: string; qr_image_url: string | null } | null>(null);
  const [loading, setLoading] = React.useState(true);
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

  function copyContent() {
    if (!data?.qris_content) return;
    navigator.clipboard.writeText(data.qris_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <QrCode className="size-4" /> QRIS Statis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <Skeleton className="aspect-square w-full rounded-lg" />
          ) : data?.qr_image_url ? (
            <img
              src={data.qr_image_url}
              alt="QRIS statis"
              className="aspect-square w-full rounded-lg border object-contain bg-white"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed text-muted-foreground text-xs">
              QR belum tersedia
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={copyContent} disabled={!data?.qris_content}>
              <Copy className={cn("size-3.5", copied && "text-green-500")} />
              {copied ? "Tersalin" : "Salin"}
            </Button>
            {data?.qr_image_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={data.qr_image_url} download target="_blank" rel="noreferrer">
                  <Download className="size-3.5" />
                </a>
              </Button>
            )}
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
function ApiKeysPanel({ isVerified, onKeysChange }: { isVerified: boolean; onKeysChange: (keys: ApiKey[]) => void }) {
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
      if (result.status) {
        setKeys(result.data);
        onKeysChange(result.data);
      }
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
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Gunakan API Key V2 untuk membuat pembayaran dinamis & mengambil riwayat transaksi.
        </p>
        <Button size="sm" onClick={() => setShowForm((p) => !p)}>
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

      <div className="rounded-xl border overflow-hidden">
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
                  Belum ada API Key V2. Buat satu untuk mulai integrasi.
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.label}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-muted-foreground">
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
    </div>
  );
}

// ─── Pengaturan Panel (baru, khusus V2 — change request) ────────────────────
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
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{message}</p>
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
                <div>
                  <p className="font-medium">{cr.new_merchant_name ?? merchant.merchant_name}</p>
                  <p className="text-muted-foreground text-xs">{timeAgo(cr.created_at)}</p>
                </div>
                <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", CR_STATUS[cr.status])}>
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
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);

  const activeApiKey = React.useMemo(
    () => apiKeys.find((k) => !k.revoked)?.api_key ?? null,
    [apiKeys],
  );

  // Stats V2 dihitung di client: gabungan /balance + sampel /payment/history
  React.useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      try {
        const auth = await getAuthHeader();
        const balanceRes = await fetch(`${GATEWAY_BASE}/balance`, { headers: auth });
        const balanceResult = await balanceRes.json();

        let txRows: Transaction[] = [];
        if (activeApiKey) {
          const txRes = await fetch(`${GATEWAY_BASE}/payment/history?limit=100`, {
            headers: { "x-api-key": activeApiKey },
          });
          const txResult = await txRes.json();
          if (txResult.status) txRows = txResult.data;
        }

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
    }
    fetchStats();
  }, [activeApiKey]);

  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] flex-col">
      <div className="border-b bg-background px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="size-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base leading-none">{merchant.merchant_name}</h1>
              {merchant.is_verified && <BadgeCheck className="size-4 text-blue-500" />}
              <Badge variant="secondary" className="rounded-md border-transparent bg-cyan-500/10 text-cyan-700 text-[10px] dark:text-cyan-300">
                Gateway V2
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />{merchant.city}
              </span>
              {merchant.business_type && (
                <><span>·</span><span>{merchant.business_type}</span></>
              )}
              {merchant.phone && (
                <><span>·</span><span className="flex items-center gap-1"><Phone className="size-3" />{merchant.phone}</span></>
              )}
              <span>·</span>
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
                icon={<Wallet className="size-4 text-muted-foreground" />}
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
          <TabsList className="mb-4">
            <TabsTrigger value="transactions" className="gap-2">
              <Hash className="size-3.5" />
              Transaksi
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
          <TabsContent value="transactions">
            <TransactionList activeApiKey={activeApiKey} />
          </TabsContent>
          <TabsContent value="qris">
            <StaticQrisPanel isVerified={merchant.is_verified} />
          </TabsContent>
          <TabsContent value="apikeys">
            <ApiKeysPanel isVerified={merchant.is_verified} onKeysChange={setApiKeys} />
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
