"use client";

import * as React from "react";
import {
  BadgeCheck,
  Building2,
  Copy,
  Eye,
  EyeOff,
  Hash,
  Key,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
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

import type { ApiKey, Merchant, ProfileStats, Transaction } from "./types";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

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
  pending:   { label: "Pending",    cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  paid:      { label: "Berhasil",   cls: "bg-green-500/10 text-green-700 dark:text-green-300" },
  expired:   { label: "Expired",    cls: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
  cancelled: { label: "Dibatalkan", cls: "bg-red-500/10 text-red-700 dark:text-red-300" },
} as const;

// ─── Register Form ─────────────────────────────────────────────────────────────
function RegisterMerchantForm({ onSuccess }: { onSuccess: (m: Merchant) => void }) {
  const [form, setForm] = React.useState({
    merchant_name: "",
    city: "",
    business_type: "",
    description: "",
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
      <div className="w-full max-w-md">
        <div className="mb-8 space-y-1.5 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Daftarkan Merchant</h1>
          <p className="text-muted-foreground text-sm">
            Lengkapi data merchant untuk mulai menerima pembayaran
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-normal text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-muted-foreground text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Transaction List ──────────────────────────────────────────────────────────
function TransactionList() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [total, setTotal] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const limit = 20;

  const fetchTrx = React.useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const params = new URLSearchParams({ limit: String(limit), offset: String(off) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${GATEWAY_BASE}/merchant/transactions?${params}`, {
        headers: auth,
      });
      const result = await res.json();
      if (result.status) {
        setTransactions(result.data);
        setTotal(result.total);
        setOffset(off);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

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

  const statuses = ["all", "pending", "paid", "expired", "cancelled"];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Ref ID</TableHead>
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
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada transaksi ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((trx) => {
                const sc = STATUS_CONFIG[trx.status];
                return (
                  <TableRow key={trx.id}>
                    <TableCell className="font-mono text-xs">
                      <div>{trx.ref_id}</div>
                      <div className="text-muted-foreground text-[10px]">{trx.gi_trx_id}</div>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">
                      {fmtRp(trx.amount)}
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

      {total > limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total {total} transaksi</span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={offset === 0 || loading}
              onClick={() => fetchTrx(Math.max(0, offset - limit))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={offset + limit >= total || loading}
              onClick={() => fetchTrx(offset + limit)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── API Keys Panel ────────────────────────────────────────────────────────────
function ApiKeysPanel() {
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState("");
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
        body: JSON.stringify({ label: newLabel || "Default Key" }),
      });
      const result = await res.json();
      if (result.status) {
        setNewLabel("");
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Gunakan API Key untuk mengintegrasikan pembayaran ke aplikasi Anda.
        </p>
        <Button size="sm" onClick={() => setShowForm((p) => !p)}>
          <Plus />
          Buat API Key
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Label (opsional)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createKey} disabled={creating}>
                {creating ? <Loader2 className="animate-spin" /> : "Buat"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
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
                  Belum ada API Key. Buat satu untuk mulai integrasi.
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

// ─── Merchant Dashboard ────────────────────────────────────────────────────────
function MerchantDashboard({ merchant }: { merchant: Merchant }) {
  const [stats, setStats] = React.useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const auth = await getAuthHeader();
        const res = await fetch(`${GATEWAY_BASE}/profile`, { headers: auth });
        const result = await res.json();
        if (result.status) setStats(result.data.stats);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

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
            </div>
            <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />{merchant.city}
              </span>
              {merchant.business_type && (
                <><span>·</span><span>{merchant.business_type}</span></>
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
                label="Volume 30 hari"
                value={fmtRp(stats.volume_30d)}
                sub={`Total: ${fmtRp(stats.volume_success)}`}
              />
              <StatCard
                label="Saldo aktif"
                value={fmtRp(stats.active_balance)}
                sub={`${fmtRp(stats.clearing_balance)} kliring`}
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
            <TabsTrigger value="apikeys" className="gap-2">
              <Key className="size-3.5" />
              API Keys
            </TabsTrigger>
          </TabsList>
          <TabsContent value="transactions">
            <TransactionList />
          </TabsContent>
          <TabsContent value="apikeys">
            <ApiKeysPanel />
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
        const res = await fetch(`${GATEWAY_BASE}/profile`, { headers: auth });
        const result = await res.json();
        if (result.status && result.data?.merchant) {
          setMerchant(result.data.merchant);
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
