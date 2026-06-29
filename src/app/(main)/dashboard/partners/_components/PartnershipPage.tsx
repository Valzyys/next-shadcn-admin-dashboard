"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Handshake,
  History,
  KeyRound,
  Loader2,
  Plus,
  QrCode,
  RefreshCw,
  Tv,
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
  Partnership,
  SubscriptionInvoice,
  ShowOrder,
  PartnershipLog,
  PendingPayment,
  ShowPendingPayment,
  PaymentCheckResult,
} from "./types";

const PARTNERSHIP_BASE = "/api/partnership";

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

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

const PARTNERSHIP_STATUS_CONFIG = {
  pending_payment: { label: "Menunggu Pembayaran/ACC", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  active:          { label: "Aktif",                   cls: "bg-green-500/10 text-green-700 dark:text-green-300" },
  suspended:       { label: "Disuspend",               cls: "bg-red-500/10 text-red-700 dark:text-red-300" },
} as const;

const INVOICE_STATUS_CONFIG = {
  pending:   { label: "Menunggu",   cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  paid:      { label: "Lunas",      cls: "bg-green-500/10 text-green-700 dark:text-green-300" },
  expired:   { label: "Expired",    cls: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
  cancelled: { label: "Dibatalkan", cls: "bg-red-500/10 text-red-700 dark:text-red-300" },
} as const;

const ACTOR_LABEL: Record<string, string> = { partner: "Anda", admin: "Admin", system: "Sistem" };

type PlanOption = {
  key: string;
  label: string;
  monthly_price: number;
  formatted_monthly_price: string;
  show_price: number;
  formatted_show_price: string;
};

type AvailableShow = {
  slug: string;
  showId: string | null;
  title: string;
  image_url: string | null;
  creator_name: string | null;
  status: string;
  live_at: string | null;
  scheduled_at: string | null;
};

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

// ─── Plan Selector (dipakai di registrasi & ganti plan) ────────────────────────
function PlanSelector({
  plans,
  selected,
  disabled,
  onSelect,
}: {
  plans: PlanOption[];
  selected: string;
  disabled?: boolean;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {plans.map((p) => (
        <button
          key={p.key}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(p.key)}
          className={cn(
            "rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/50 disabled:opacity-60",
            selected === p.key && "border-primary bg-primary/5"
          )}
        >
          <div className="font-semibold">{p.label}</div>
          <div className="text-muted-foreground text-xs">{p.formatted_monthly_price}/bulan</div>
          <div className="text-muted-foreground text-xs">{p.formatted_show_price}/show</div>
        </button>
      ))}
    </div>
  );
}

// ─── Secret Reveal (copy + show/hide) ──────────────────────────────────────────
function SecretReveal({ value }: { value: string }) {
  const [visible, setVisible] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
      <code className="flex-1 truncate font-mono text-xs">
        {visible ? value : "•".repeat(40)}
      </code>
      <Button variant="ghost" size="icon-xs" onClick={() => setVisible((v) => !v)}>
        {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={copy}>
        <Copy className={cn("size-3.5", copied && "text-green-500")} />
      </Button>
    </div>
  );
}

// ─── Register Partnership Form ─────────────────────────────────────────────────
function RegisterPartnershipForm({ onSuccess }: { onSuccess: (p: Partnership) => void }) {
  const [form, setForm] = React.useState({ kid: "", label: "", plan: "basic" });
  const [plans, setPlans] = React.useState<PlanOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchPlans() {
      try {
        const auth = await getAuthHeader();
        const res = await fetch(`${PARTNERSHIP_BASE}/plans`, { headers: auth });
        const result = await res.json();
        if (result.status) setPlans(result.data);
      } catch {}
    }
    fetchPlans();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const kid = form.kid.trim();
    if (!kid) {
      setError("kid wajib diisi");
      return;
    }
    if (!/^[a-z0-9_-]{3,32}$/i.test(kid)) {
      setError("kid hanya boleh huruf, angka, _ dan - (3-32 karakter)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ kid, label: form.label.trim() || undefined, plan: form.plan }),
      });
      const result = await res.json();
      if (!result.status) throw new Error(result.message);
      onSuccess(result.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mendaftarkan partnership");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] items-center justify-center bg-muted/25 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 space-y-1.5 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
            <Handshake className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Daftarkan Partnership</h1>
          <p className="text-muted-foreground text-sm">
            Daftar sebagai partner untuk mendapatkan akses token-stream dan integrasi show.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kid">
                  Partner ID (kid) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="kid"
                  placeholder="contoh: streamhub-id"
                  value={form.kid}
                  onChange={(e) => setForm((p) => ({ ...p, kid: e.target.value }))}
                />
                <p className="text-muted-foreground text-xs">
                  Huruf, angka, underscore, dan dash saja. 3–32 karakter. Tidak bisa diubah setelah didaftarkan.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="contoh: StreamHub Indonesia"
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                />
              </div>

              {plans.length > 0 && (
                <div className="space-y-2">
                  <Label>Pilih Plan</Label>
                  <PlanSelector
                    plans={plans}
                    selected={form.plan}
                    onSelect={(key) => setForm((f) => ({ ...f, plan: key }))}
                  />
                </div>
              )}

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Plus />}
                {loading ? "Mendaftarkan..." : "Daftarkan Partnership"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Payment Checkout (QRIS + auto-poll status + resume/cancel) ───────────────
function PaymentCheckout({
  payment,
  checkUrl,
  cancelUrl,
  onPaid,
  onExpired,
  onCancelled,
  onClose,
}: {
  payment: PendingPayment;
  checkUrl: string;
  cancelUrl: string;
  onPaid: (result: PaymentCheckResult) => void;
  onExpired: () => void;
  onCancelled: () => void;
  onClose: () => void;
}) {
  const [checking, setChecking] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const settledRef = React.useRef(false);

  React.useEffect(() => {
    settledRef.current = false;
    const interval = setInterval(async () => {
      if (settledRef.current) return;
      setChecking(true);
      try {
        const auth = await getAuthHeader();
        const res = await fetch(checkUrl, { headers: auth });
        const result: PaymentCheckResult = await res.json();
        if (settledRef.current) return;
        if (result.payment_status === "paid") {
          settledRef.current = true;
          onPaid(result);
        } else if (result.payment_status === "expired" || result.payment_status === "cancelled") {
          settledRef.current = true;
          onExpired();
        }
      } catch {
        // diamkan, dicoba lagi di interval berikutnya
      } finally {
        setChecking(false);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [checkUrl, onPaid, onExpired]);

  async function cancelPayment() {
    setCancelling(true);
    try {
      const auth = await getAuthHeader();
      await fetch(cancelUrl, { method: "POST", headers: auth });
      settledRef.current = true;
      onCancelled();
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
        {payment.qr_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={payment.qr_image} alt="QRIS" className="size-56 rounded-lg border" />
        ) : (
          <div className="flex size-56 items-center justify-center rounded-lg border bg-muted/40">
            <QrCode className="size-10 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-semibold text-lg">{payment.formatted_amount}</p>
          <p className="font-mono text-muted-foreground text-xs">{payment.ref_id}</p>
        </div>
        <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
          {checking ? <Loader2 className="size-3.5 animate-spin" /> : <Clock className="size-3.5" />}
          Menunggu pembayaran... (auto-check tiap 4 detik)
        </p>
        <p className="text-muted-foreground text-xs">
          Kedaluwarsa dalam {payment.timeout_minutes} menit
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup (lanjutkan nanti)
          </Button>
          <Button variant="destructive" size="sm" disabled={cancelling} onClick={cancelPayment}>
            {cancelling ? <Loader2 className="size-3 animate-spin" /> : null}
            Batalkan Pembayaran
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Subscription Panel ─────────────────────────────────────────────────────────
function SubscriptionPanel({
  partnership,
  onActivated,
}: {
  partnership: Partnership;
  onActivated: (p: Partnership) => void;
}) {
  const [payment, setPayment] = React.useState<PendingPayment | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [justActivated, setJustActivated] = React.useState<{ kid: string; secret: string } | null>(null);
  const [plans, setPlans] = React.useState<PlanOption[]>([]);
  const [changingPlan, setChangingPlan] = React.useState(false);

  async function checkPending() {
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/payment/pending`, { headers: auth });
      const result = await res.json();
      if (result.status && result.data) setPayment(result.data);
    } catch {}
  }

  async function fetchPlans() {
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/plans`, { headers: auth });
      const result = await res.json();
      if (result.status) setPlans(result.data);
    } catch {}
  }

  React.useEffect(() => {
    checkPending();
    fetchPlans();
  }, []);

  async function createInvoice() {
    setCreating(true);
    setError(null);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
      });
      const result = await res.json();
      if (!result.status) throw new Error(result.message);
      setPayment(result.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal membuat invoice subscription");
    } finally {
      setCreating(false);
    }
  }

  async function changePlan(planKey: string) {
    if (planKey === partnership.plan) return;
    setChangingPlan(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ plan: planKey }),
      });
      const result = await res.json();
      if (result.status) onActivated(result.data);
    } finally {
      setChangingPlan(false);
    }
  }

  function handlePaid(result: PaymentCheckResult) {
    if (result.kid && result.secret) {
      setJustActivated({ kid: result.kid, secret: result.secret });
    }
    setPayment(null);
    onActivated({ ...partnership, status: "active" });
  }

  const sc = PARTNERSHIP_STATUS_CONFIG[partnership.status];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Status" value={sc.label} />
        <StatCard label="Plan" value={partnership.plan_label ?? "Basic"} sub={partnership.formatted_monthly_price} />
        <StatCard
          label="Jatuh tempo"
          value={fmtDate(partnership.current_period_end)}
          sub={partnership.is_overdue ? "Sudah lewat jatuh tempo" : undefined}
        />
        <StatCard
          label="Harga per show"
          value={partnership.formatted_show_price ?? "—"}
        />
      </div>

      {partnership.is_testing && (
        <p className="rounded-md bg-blue-500/10 px-3 py-2 text-blue-700 text-sm dark:text-blue-300">
          Partner ini dalam mode testing — tidak perlu membayar subscription bulanan.
        </p>
      )}

      {plans.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="font-semibold text-sm">Plan Subscription</h3>
            <PlanSelector
              plans={plans}
              selected={partnership.plan ?? "basic"}
              disabled={changingPlan}
              onSelect={changePlan}
            />
            <p className="text-muted-foreground text-xs">
              Ganti plan berlaku untuk invoice bulanan & pembelian show berikutnya, tidak mengubah periode aktif saat ini.
            </p>
          </CardContent>
        </Card>
      )}

      {justActivated && (
        <Card className="border-green-500/30">
          <CardContent className="space-y-2 pt-6">
            <p className="flex items-center gap-2 font-semibold text-green-600 text-sm dark:text-green-400">
              <CheckCircle2 className="size-4" /> Partnership aktif! Secret berikut hanya tampil sekali:
            </p>
            <SecretReveal value={justActivated.secret} />
          </CardContent>
        </Card>
      )}

      {payment ? (
        <PaymentCheckout
          payment={payment}
          checkUrl={`${PARTNERSHIP_BASE}/payment/check/${payment.ref_id}`}
          cancelUrl={`${PARTNERSHIP_BASE}/payment/cancel/${payment.ref_id}`}
          onPaid={handlePaid}
          onExpired={() => setPayment(null)}
          onCancelled={() => setPayment(null)}
          onClose={() => setPayment(null)}
        />
      ) : (
        !partnership.is_testing && (
          <div className="flex items-center gap-3">
            <Button onClick={createInvoice} disabled={creating}>
              {creating ? <Loader2 className="animate-spin" /> : <Plus />}
              Buat Invoice Bulanan
            </Button>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        )
      )}
    </div>
  );
}

// ─── Invoices Panel ──────────────────────────────────────────────────────────────
function InvoicesPanel() {
  const [invoices, setInvoices] = React.useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/invoices`, { headers: auth });
      const result = await res.json();
      if (result.status) setInvoices(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchInvoices(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="icon" onClick={fetchInvoices} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Ref ID</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Belum ada invoice subscription
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => {
                const sc = INVOICE_STATUS_CONFIG[inv.status];
                return (
                  <TableRow key={inv.ref_id}>
                    <TableCell className="font-mono text-xs">{inv.ref_id}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{inv.formatted_amount}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", sc.cls)}>
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {timeAgo(inv.created_at)}
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

// ─── Buy Show Access Form — pilih dari daftar realtime idnplus ────────────────
function BuyShowForm({
  showPrice,
  formattedShowPrice,
  onSuccess,
  onFreeGranted,
}: {
  showPrice: number;
  formattedShowPrice: string;
  onSuccess: (payment: ShowPendingPayment) => void;
  onFreeGranted: () => void;
}) {
  const [shows, setShows] = React.useState<AvailableShow[]>([]);
  const [loadingShows, setLoadingShows] = React.useState(true);
  const [selected, setSelected] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function fetchShows() {
    setLoadingShows(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/shows/available?limit=50`, { headers: auth });
      const result = await res.json();
      if (result.status) setShows(result.data);
    } finally {
      setLoadingShows(false);
    }
  }

  React.useEffect(() => { fetchShows(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const show = shows.find((s) => s.slug === selected);
    if (!show) {
      setError("Pilih show dari daftar terlebih dahulu");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/show/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ slug: show.slug, showId: show.showId }),
      });
      const result = await res.json();
      if (!result.status) throw new Error(result.message);
      setSelected("");
      if (result.free) {
        onFreeGranted();
      } else {
        onSuccess(result.data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal membuat invoice show");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-select">Pilih Show (realtime dari IDN Plus)</Label>
              <Button type="button" variant="ghost" size="icon-xs" onClick={fetchShows} disabled={loadingShows}>
                <RefreshCw className={cn("size-3.5", loadingShows && "animate-spin")} />
              </Button>
            </div>
            <select
              id="show-select"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={loadingShows}
            >
              <option value="">{loadingShows ? "Memuat daftar show..." : "-- Pilih show --"}</option>
              {shows.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}{s.status === "live" ? " 🔴 LIVE" : ""}
                </option>
              ))}
            </select>
            {!loadingShows && shows.length === 0 && (
              <p className="text-muted-foreground text-xs">Tidak ada show tersedia saat ini.</p>
            )}
          </div>
          <div className="text-sm text-muted-foreground sm:w-32">
            Harga: <span className="font-semibold text-foreground">{showPrice > 0 ? formattedShowPrice : "Gratis"}</span>
          </div>
          <Button type="submit" disabled={loading || !selected}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus />}
            Beli Akses
          </Button>
        </form>
        {error && <p className="mt-2 text-destructive text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Show Orders Panel ────────────────────────────────────────────────────────────
function ShowOrdersPanel({ partnership }: { partnership: Partnership }) {
  const [orders, setOrders] = React.useState<ShowOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pendingPayment, setPendingPayment] = React.useState<ShowPendingPayment | null>(null);
  const [freeMessage, setFreeMessage] = React.useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/shows`, { headers: auth });
      const result = await res.json();
      if (result.status) setOrders(result.data);
    } finally {
      setLoading(false);
    }
  }

  async function checkPending() {
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/show/pending`, { headers: auth });
      const result = await res.json();
      if (result.status && result.data) setPendingPayment(result.data);
    } catch {}
  }

  React.useEffect(() => {
    fetchOrders();
    checkPending();
  }, []);

  return (
    <div className="space-y-4">
      <BuyShowForm
        showPrice={partnership.show_price ?? 0}
        formattedShowPrice={partnership.formatted_show_price ?? "Gratis"}
        onSuccess={(payment) => setPendingPayment(payment)}
        onFreeGranted={() => {
          setFreeMessage("Akses show berhasil diberikan otomatis (termasuk dalam plan kamu, gratis).");
          fetchOrders();
        }}
      />

      {freeMessage && (
        <p className="rounded-md bg-green-500/10 px-3 py-2 text-green-700 text-sm dark:text-green-300">
          {freeMessage}
        </p>
      )}

      {pendingPayment && (
        <PaymentCheckout
          payment={pendingPayment}
          checkUrl={`${PARTNERSHIP_BASE}/show/check/${pendingPayment.ref_id}`}
          cancelUrl={`${PARTNERSHIP_BASE}/show/cancel/${pendingPayment.ref_id}`}
          onPaid={() => { setPendingPayment(null); fetchOrders(); }}
          onExpired={() => setPendingPayment(null)}
          onCancelled={() => setPendingPayment(null)}
          onClose={() => setPendingPayment(null)}
        />
      )}

      <div className="flex justify-end">
        <Button variant="outline" size="icon" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Show</TableHead>
              <TableHead>Ref ID</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Belum ada pembelian akses show
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => {
                const sc = INVOICE_STATUS_CONFIG[o.status];
                return (
                  <TableRow key={o.ref_id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{o.title ?? o.slug ?? o.show_id}</div>
                      <div className="text-muted-foreground text-xs">{o.slug ?? o.show_id}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{o.ref_id}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{o.formatted_amount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", sc.cls)}>
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {timeAgo(o.created_at)}
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

// ─── Logs Panel ──────────────────────────────────────────────────────────────────
function LogsPanel() {
  const [logs, setLogs] = React.useState<PartnershipLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function fetchLogs() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/logs`, { headers: auth });
      const result = await res.json();
      if (result.status) setLogs(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>
      <div className="rounded-xl border divide-y">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3"><Skeleton className="h-4 w-2/3" /></div>
          ))
        ) : logs.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground text-sm">Belum ada aktivitas tercatat</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <History className="mt-0.5 size-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{ACTOR_LABEL[log.actor] ?? log.actor}</span>
                  {" "}— {log.action.replace(/_/g, " ")}
                </p>
                <p className="text-muted-foreground text-xs">{timeAgo(log.created_at)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Secret Panel (rotate token-stream secret) ──────────────────────────────────
function SecretPanel() {
  const [secret, setSecret] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function rotate() {
    setLoading(true);
    setError(null);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/rotate-secret`, {
        method: "POST",
        headers: auth,
      });
      const result = await res.json();
      if (!result.status) throw new Error(result.message);
      setSecret(result.secret);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal merotasi secret");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h3 className="font-semibold text-sm">Secret untuk Token Stream</h3>
          <p className="mt-1 text-muted-foreground text-sm">
            Secret dipakai untuk signing request ke <code className="text-xs">/token-stream/generate</code>.
            Merotasi secret akan membuat secret lama langsung tidak berlaku.
          </p>
        </div>

        {secret ? (
          <div className="space-y-2">
            <p className="text-amber-600 text-xs dark:text-amber-400">
              Secret ini hanya ditampilkan sekali. Simpan sekarang.
            </p>
            <SecretReveal value={secret} />
          </div>
        ) : (
          <Button onClick={rotate} disabled={loading} variant="outline">
            {loading ? <Loader2 className="animate-spin" /> : <KeyRound />}
            Rotasi Secret
          </Button>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Partnership Dashboard (layout + tabs) ──────────────────────────────────────
function PartnershipDashboard({ partnership: initial }: { partnership: Partnership }) {
  const [partnership, setPartnership] = React.useState(initial);
  const sc = PARTNERSHIP_STATUS_CONFIG[partnership.status];

  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] flex-col">
      <div className="border-b bg-background px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Handshake className="size-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base leading-none">{partnership.label}</h1>
              {partnership.is_overdue && (
                <Badge
                  variant="secondary"
                  className="rounded-md border-transparent bg-red-500/10 text-red-700 text-xs dark:text-red-300"
                >
                  <AlertTriangle className="mr-1 size-3" /> Overdue
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3 text-muted-foreground text-xs">
              <span className="font-mono">kid: {partnership.kid}</span>
              <span>·</span>
              <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", sc.cls)}>
                {sc.label}
              </Badge>
              {partnership.plan_label && (
                <>
                  <span>·</span>
                  <span>{partnership.plan_label}</span>
                </>
              )}
              {partnership.is_testing && (
                <>
                  <span>·</span>
                  <span>Testing Mode</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <Tabs defaultValue="subscription">
          <TabsList className="mb-4">
            <TabsTrigger value="subscription" className="gap-2">
              <Wallet className="size-3.5" /> Subscription
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="size-3.5" /> Invoices
            </TabsTrigger>
            <TabsTrigger value="shows" className="gap-2">
              <Tv className="size-3.5" /> Show Orders
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <History className="size-3.5" /> Logs
            </TabsTrigger>
            <TabsTrigger value="secret" className="gap-2">
              <KeyRound className="size-3.5" /> Secret
            </TabsTrigger>
          </TabsList>
          <TabsContent value="subscription">
            <SubscriptionPanel partnership={partnership} onActivated={setPartnership} />
          </TabsContent>
          <TabsContent value="invoices"><InvoicesPanel /></TabsContent>
          <TabsContent value="shows"><ShowOrdersPanel partnership={partnership} /></TabsContent>
          <TabsContent value="logs"><LogsPanel /></TabsContent>
          <TabsContent value="secret"><SecretPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export function PartnershipPage() {
  const [partnership, setPartnership] = React.useState<Partnership | null>(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    async function checkPartnership() {
      try {
        const auth = await getAuthHeader();
        const res = await fetch(`${PARTNERSHIP_BASE}/me`, { headers: auth });
        const result = await res.json();
        if (result.status && result.data) {
          setPartnership(result.data);
        }
      } finally {
        setChecking(false);
      }
    }
    checkPartnership();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!partnership) {
    return <RegisterPartnershipForm onSuccess={setPartnership} />;
  }

  return <PartnershipDashboard partnership={partnership} />;
}
