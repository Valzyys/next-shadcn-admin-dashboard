"use client";

import * as React from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  CreditCard,
  ReceiptText,
  Clock,
  Handshake,
  FlaskConical,
  AlertTriangle,
  BadgeDollarSign,
  Tv,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";
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

const TRX_STATUS_CONFIG = {
  pending:   { label: "Pending",    cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  paid:      { label: "Berhasil",   cls: "bg-green-500/10 text-green-700 dark:text-green-300" },
  expired:   { label: "Expired",    cls: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
  cancelled: { label: "Dibatalkan", cls: "bg-red-500/10 text-red-700 dark:text-red-300" },
} as const;

const PARTNERSHIP_STATUS_CONFIG = {
  pending_payment: { label: "Menunggu ACC",  cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  active:          { label: "Aktif",          cls: "bg-green-500/10 text-green-700 dark:text-green-300" },
  suspended:       { label: "Disuspend",      cls: "bg-red-500/10 text-red-700 dark:text-red-300" },
} as const;

const PLANS = ["basic", "pro", "premium"] as const;
type PlanKey = typeof PLANS[number];

// ─── Types ─────────────────────────────────────────────────────────────────────
type AdminStats = {
  transactions: {
    total_transactions: string;
    paid_count: string;
    pending_count: string;
    total_volume: string;
    volume_30d: string;
    volume_this_month: string;
  };
  users: {
    total_users: string;
    active_users: string;
    new_users_30d: string;
  };
  merchants: {
    total_merchants: string;
    verified_merchants: string;
    pending_verification: string;
  };
};

type MerchantPending = {
  id: string;
  merchant_name: string;
  city: string;
  business_type: string | null;
  description: string | null;
  is_verified: boolean;
  created_at: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string | null;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
};

type AdminTransaction = {
  id: string;
  ref_id: string;
  gi_trx_id: string;
  amount: number;
  formatted_amount: string;
  status: "pending" | "paid" | "expired" | "cancelled";
  description: string | null;
  customer_ref: string | null;
  paid_at: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
  merchant_name: string | null;
};

type WithdrawalPending = {
  id: string;
  amount: number;
  formatted_amount: string;
  ewallet_type: string;
  ewallet_number: string;
  account_name: string | null;
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
};

type AdminPartnership = {
  id: string;
  kid: string;
  label: string;
  status: "pending_payment" | "active" | "suspended";
  plan: string;
  plan_label: string | null;
  monthly_price: number;
  formatted_monthly_price: string;
  show_price: number;
  formatted_show_price: string | null;
  is_testing: boolean;
  is_overdue: boolean;
  current_period_end: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
};

type PendingInvoice = {
  id: string;
  ref_id: string;
  amount: number;
  formatted_amount: string;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  kid: string;
  user_email: string;
};

type PendingShowOrder = {
  id: string;
  ref_id: string;
  slug: string | null;
  show_id: string | null;
  title: string | null;
  amount: number;
  formatted_amount: string;
  status: string;
  created_at: string;
  kid: string;
  user_email: string;
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "primary",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ElementType;
  color?: "primary" | "green" | "amber" | "blue";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    green:   "bg-green-500/10 text-green-600",
    amber:   "bg-amber-500/10 text-amber-600",
    blue:    "bg-blue-500/10 text-blue-600",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-normal text-sm text-muted-foreground">{label}</CardTitle>
          {Icon && (
            <div className={cn("flex size-8 items-center justify-center rounded-lg", colorMap[color])}>
              <Icon className="size-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {sub && <p className="mt-0.5 text-muted-foreground text-xs">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Overview Stats ────────────────────────────────────────────────────────────
function OverviewStats() {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const auth = await getAuthHeader();
        const res = await fetch(`${GATEWAY_BASE}/admin/stats`, { headers: auth });
        const result = await res.json();
        if (result.status) setStats(result.data);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-3 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-7 w-20" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Transaksi</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Total Volume"
          value={fmtRp(parseFloat(stats.transactions.total_volume))}
          sub={`30 hari: ${fmtRp(parseFloat(stats.transactions.volume_30d))}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Bulan Ini"
          value={fmtRp(parseFloat(stats.transactions.volume_this_month))}
          sub={`${stats.transactions.paid_count} transaksi berhasil`}
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          label="Pending"
          value={stats.transactions.pending_count}
          sub={`Total: ${stats.transactions.total_transactions} transaksi`}
          icon={Clock}
          color="amber"
        />
      </div>

      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Pengguna & Merchant</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Total User"
          value={stats.users.total_users}
          sub={`Aktif: ${stats.users.active_users}`}
          icon={Users}
          color="primary"
        />
        <StatCard
          label="User Baru (30 hari)"
          value={stats.users.new_users_30d}
          icon={Users}
          color="green"
        />
        <StatCard
          label="Merchant"
          value={stats.merchants.total_merchants}
          sub={`Terverifikasi: ${stats.merchants.verified_merchants} | Pending: ${stats.merchants.pending_verification}`}
          icon={Building2}
          color="amber"
        />
      </div>
    </div>
  );
}

// ─── Merchant Verification ─────────────────────────────────────────────────────
function MerchantVerification() {
  const [merchants, setMerchants] = React.useState<MerchantPending[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState<string | null>(null);

  async function fetchMerchants() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/admin/merchants/pending`, { headers: auth });
      const result = await res.json();
      if (result.status) setMerchants(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchMerchants(); }, []);

  async function verify(id: string, isVerified: boolean) {
    setProcessing(id);
    try {
      const auth = await getAuthHeader();
      await fetch(`${GATEWAY_BASE}/admin/merchants/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ is_verified: isVerified }),
      });
      fetchMerchants();
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Merchant yang menunggu verifikasi</p>
        <Button variant="outline" size="sm" onClick={fetchMerchants} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Merchant</TableHead>
              <TableHead>Pemilik</TableHead>
              <TableHead>Kota</TableHead>
              <TableHead>Jenis Usaha</TableHead>
              <TableHead>Didaftarkan</TableHead>
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
            ) : merchants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada merchant yang menunggu verifikasi
                </TableCell>
              </TableRow>
            ) : (
              merchants.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-medium">{m.merchant_name}</div>
                    {m.description && (
                      <div className="text-muted-foreground text-xs truncate max-w-40">{m.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{m.owner_name}</div>
                    <div className="text-muted-foreground text-xs">{m.owner_email}</div>
                  </TableCell>
                  <TableCell className="text-sm">{m.city}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.business_type ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {timeAgo(m.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={processing === m.id}
                        onClick={() => verify(m.id, true)}
                      >
                        {processing === m.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                        Verifikasi
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={processing === m.id}
                        onClick={() => verify(m.id, false)}
                      >
                        <X className="size-3" />
                        Tolak
                      </Button>
                    </div>
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

// ─── User Management ───────────────────────────────────────────────────────────
function UserManagement() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [toggling, setToggling] = React.useState<string | null>(null);

  async function fetchUsers(q = "") {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const params = new URLSearchParams({ limit: "50" });
      if (q) params.set("search", q);
      const res = await fetch(`${GATEWAY_BASE}/admin/users?${params}`, { headers: auth });
      const result = await res.json();
      if (result.status) setUsers(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchUsers(); }, []);

  async function toggleActive(id: string) {
    setToggling(id);
    try {
      const auth = await getAuthHeader();
      await fetch(`${GATEWAY_BASE}/admin/users/${id}/toggle-active`, {
        method: "PATCH",
        headers: auth,
      });
      fetchUsers(search);
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers(search)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={() => fetchUsers(search)} disabled={loading}>
          <Search className="size-4" />
          Cari
        </Button>
        <Button variant="outline" size="icon" onClick={() => { setSearch(""); fetchUsers(""); }} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Login Terakhir</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead />
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Tidak ada user ditemukan
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell>
                    {u.is_admin ? (
                      <Badge variant="secondary" className="rounded-md border-transparent bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-md border-transparent text-xs">
                        User
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-md border-transparent text-xs",
                        u.is_active
                          ? "bg-green-500/10 text-green-700 dark:text-green-300"
                          : "bg-red-500/10 text-red-700 dark:text-red-300"
                      )}
                    >
                      {u.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {u.last_login_at ? timeAgo(u.last_login_at) : "Belum pernah"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {timeAgo(u.created_at)}
                  </TableCell>
                  <TableCell>
                    {!u.is_admin && (
                      <Button
                        size="sm"
                        variant={u.is_active ? "destructive" : "outline"}
                        disabled={toggling === u.id}
                        onClick={() => toggleActive(u.id)}
                      >
                        {toggling === u.id ? <Loader2 className="size-3 animate-spin" /> : null}
                        {u.is_active ? "Nonaktifkan" : "Aktifkan"}
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

// ─── All Transactions ──────────────────────────────────────────────────────────
function AllTransactions() {
  const [transactions, setTransactions] = React.useState<AdminTransaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [offset, setOffset] = React.useState(0);
  const limit = 20;

  const fetchTrx = React.useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const params = new URLSearchParams({ limit: String(limit), offset: String(off) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${GATEWAY_BASE}/admin/transactions?${params}`, { headers: auth });
      const result = await res.json();
      if (result.status) {
        setTransactions(result.data);
        setOffset(off);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => { fetchTrx(0); }, [fetchTrx]);

  const statuses = ["all", "pending", "paid", "expired", "cancelled"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Semua" : TRX_STATUS_CONFIG[s as keyof typeof TRX_STATUS_CONFIG]?.label ?? s}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchTrx(offset)} disabled={loading} className="ml-auto">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Ref ID</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>User</TableHead>
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
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada transaksi
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((trx) => {
                const sc = TRX_STATUS_CONFIG[trx.status];
                return (
                  <TableRow key={trx.id}>
                    <TableCell className="font-mono text-xs">
                      <div>{trx.ref_id}</div>
                      <div className="text-muted-foreground text-[10px]">{trx.gi_trx_id}</div>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">{trx.formatted_amount}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", sc.cls)}>
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{trx.merchant_name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{trx.user_name}</div>
                      <div className="text-muted-foreground text-xs">{trx.user_email}</div>
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

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={offset === 0 || loading} onClick={() => fetchTrx(Math.max(0, offset - limit))}>
          Sebelumnya
        </Button>
        <Button variant="outline" size="sm" disabled={transactions.length < limit || loading} onClick={() => fetchTrx(offset + limit)}>
          Berikutnya
        </Button>
      </div>
    </div>
  );
}

// ─── Withdrawal Management ─────────────────────────────────────────────────────
function WithdrawalManagement() {
  const [withdrawals, setWithdrawals] = React.useState<WithdrawalPending[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState<string | null>(null);

  async function fetchWithdrawals() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/admin/withdrawals/pending`, { headers: auth });
      const result = await res.json();
      if (result.status) setWithdrawals(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchWithdrawals(); }, []);

  async function process(id: string, action: "approve" | "reject") {
    setProcessing(id);
    try {
      const auth = await getAuthHeader();
      await fetch(`${GATEWAY_BASE}/admin/withdrawals/${id}/process`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ action }),
      });
      fetchWithdrawals();
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Permintaan penarikan yang menunggu persetujuan</p>
        <Button variant="outline" size="sm" onClick={fetchWithdrawals} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>E-Wallet</TableHead>
              <TableHead>Nomor</TableHead>
              <TableHead>Diajukan</TableHead>
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
            ) : withdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada permintaan penarikan
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{w.user_name}</div>
                    <div className="text-muted-foreground text-xs">{w.user_email}</div>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">{w.formatted_amount}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-md text-xs">{w.ewallet_type}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{w.ewallet_number}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {timeAgo(w.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={processing === w.id}
                        onClick={() => process(w.id, "approve")}
                      >
                        {processing === w.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={processing === w.id}
                        onClick={() => process(w.id, "reject")}
                      >
                        <X className="size-3" />
                        Tolak
                      </Button>
                    </div>
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

// ─── Partnership Management ────────────────────────────────────────────────────

// Modal-like inline action row yang expand ketika partner dipilih
function PartnershipActionRow({
  p,
  onRefresh,
}: {
  p: AdminPartnership;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = React.useState<string | null>(null);
  const [months, setMonths] = React.useState(1);
  const [plan, setPlan] = React.useState<PlanKey>((p.plan as PlanKey) ?? "basic");
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  async function call(
    path: string,
    method: "POST" | "PATCH",
    body?: Record<string, unknown>,
    label = "action"
  ) {
    setLoading(label);
    setMsg(null);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/admin/${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...auth },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await res.json();
      setMsg({ ok: result.status, text: result.message ?? (result.status ? "Berhasil" : "Gagal") });
      if (result.status) onRefresh();
    } catch (e) {
      setMsg({ ok: false, text: String(e) });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">
      {/* Activate */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium w-24 shrink-0">ACC / Aktifkan</span>
        <select
          className="h-8 rounded-md border bg-background px-2 text-xs"
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanKey)}
        >
          {PLANS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Bulan:</span>
          <input
            type="number"
            min={1}
            max={24}
            value={months}
            onChange={(e) => setMonths(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-8 w-14 rounded-md border bg-background px-2 text-xs"
          />
        </div>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={!!loading}
          onClick={() => call(`${p.id}/activate`, "POST", { months, plan }, "activate")}
        >
          {loading === "activate" ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          ACC Langsung
        </Button>
      </div>

      {/* Ganti Plan */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium w-24 shrink-0">Ganti Plan</span>
        <select
          className="h-8 rounded-md border bg-background px-2 text-xs"
          value={plan}
          onChange={(e) => setPlan(e.target.value as PlanKey)}
        >
          {PLANS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          disabled={!!loading}
          onClick={() => call(`${p.id}/plan`, "PATCH", { plan }, "plan")}
        >
          {loading === "plan" ? <Loader2 className="size-3 animate-spin" /> : null}
          Simpan Plan
        </Button>
      </div>

      {/* Testing Mode */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium w-24 shrink-0">Testing Mode</span>
        <Button
          size="sm"
          variant={p.is_testing ? "destructive" : "outline"}
          disabled={!!loading}
          onClick={() => call(`${p.id}/testing`, "PATCH", { enabled: !p.is_testing }, "testing")}
        >
          {loading === "testing" ? <Loader2 className="size-3 animate-spin" /> : <FlaskConical className="size-3" />}
          {p.is_testing ? "Matikan Testing" : "Aktifkan Testing"}
        </Button>
        {p.is_testing && (
          <Badge variant="secondary" className="rounded-md border-transparent bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
            Testing ON
          </Badge>
        )}
      </div>

      {/* Suspend */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium w-24 shrink-0">Suspend</span>
        <Button
          size="sm"
          variant="destructive"
          disabled={!!loading || p.status === "suspended"}
          onClick={() => call(`${p.id}/suspend`, "POST", { reason: "manual_admin" }, "suspend")}
        >
          {loading === "suspend" ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
          Suspend Partner
        </Button>
      </div>

      {msg && (
        <p className={cn("text-xs rounded px-2 py-1", msg.ok ? "bg-green-500/10 text-green-700 dark:text-green-300" : "bg-red-500/10 text-red-700 dark:text-red-300")}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

function PartnershipList() {
  const [partnerships, setPartnerships] = React.useState<AdminPartnership[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  async function fetchPartnerships() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`${PARTNERSHIP_BASE}/admin/list?${params}`, { headers: auth });
      const result = await res.json();
      if (result.status) setPartnerships(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchPartnerships(); }, [statusFilter]); // eslint-disable-line

  const statuses = ["all", "pending_payment", "active", "suspended"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all"
                ? "Semua"
                : PARTNERSHIP_STATUS_CONFIG[s as keyof typeof PARTNERSHIP_STATUS_CONFIG]?.label ?? s}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={fetchPartnerships} disabled={loading} className="ml-auto">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Partner</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : partnerships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada partnership ditemukan
                </TableCell>
              </TableRow>
            ) : (
              partnerships.map((p) => {
                const sc = PARTNERSHIP_STATUS_CONFIG[p.status];
                const isOpen = expanded === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <TableRow className={cn(isOpen && "bg-muted/30")}>
                      <TableCell>
                        <div className="font-medium">{p.label}</div>
                        <div className="font-mono text-muted-foreground text-xs">kid: {p.kid}</div>
                        {p.is_testing && (
                          <Badge variant="secondary" className="mt-0.5 rounded-md border-transparent bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
                            Testing
                          </Badge>
                        )}
                        {p.is_overdue && (
                          <Badge variant="secondary" className="mt-0.5 rounded-md border-transparent bg-red-500/10 text-red-700 dark:text-red-300 text-xs">
                            <AlertTriangle className="mr-1 size-2.5" />Overdue
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{p.user_name}</div>
                        <div className="text-muted-foreground text-xs">{p.user_email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm capitalize">{p.plan_label ?? p.plan}</div>
                        <div className="text-muted-foreground text-xs">{p.formatted_monthly_price}/bln</div>
                        <div className="text-muted-foreground text-xs">{p.formatted_show_price}/show</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("rounded-md border-transparent text-xs", sc.cls)}>
                          {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {fmtDate(p.current_period_end)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpanded(isOpen ? null : p.id)}
                        >
                          {isOpen ? "Tutup" : "Kelola"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/10 p-3">
                          <PartnershipActionRow p={p} onRefresh={fetchPartnerships} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Pending Invoices (subscription) ──────────────────────────────────────────
function PendingInvoices() {
  const [invoices, setInvoices] = React.useState<PendingInvoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState<string | null>(null);
  const [msgs, setMsgs] = React.useState<Record<string, { ok: boolean; text: string }>>({});

  async function fetchInvoices() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/admin/invoices/pending`, { headers: auth });
      const result = await res.json();
      if (result.status) setInvoices(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchInvoices(); }, []);

  async function markPaid(refId: string) {
    setProcessing(refId);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/admin/invoices/${refId}/mark-paid`, {
        method: "POST",
        headers: auth,
      });
      const result = await res.json();
      setMsgs((m) => ({ ...m, [refId]: { ok: result.status, text: result.message ?? (result.status ? "Berhasil" : "Gagal") } }));
      if (result.status) fetchInvoices();
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Invoice subscription yang belum dibayar</p>
        <Button variant="outline" size="sm" onClick={fetchInvoices} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Ref ID</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Periode</TableHead>
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
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada invoice pending
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <React.Fragment key={inv.ref_id}>
                  <TableRow>
                    <TableCell className="font-mono text-xs">{inv.ref_id}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{inv.kid}</div>
                      <div className="text-muted-foreground text-xs">{inv.user_email}</div>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">{inv.formatted_amount ?? fmtRp(inv.amount)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {timeAgo(inv.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={processing === inv.ref_id}
                        onClick={() => markPaid(inv.ref_id)}
                      >
                        {processing === inv.ref_id ? <Loader2 className="size-3 animate-spin" /> : <BadgeDollarSign className="size-3" />}
                        Mark Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                  {msgs[inv.ref_id] && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-1">
                        <p className={cn("text-xs rounded px-2 py-1", msgs[inv.ref_id].ok ? "bg-green-500/10 text-green-700 dark:text-green-300" : "bg-red-500/10 text-red-700 dark:text-red-300")}>
                          {msgs[inv.ref_id].text}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Pending Show Orders ────────────────────────────────────────────────────────
function PendingShowOrders() {
  const [orders, setOrders] = React.useState<PendingShowOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState<string | null>(null);
  const [msgs, setMsgs] = React.useState<Record<string, { ok: boolean; text: string }>>({});

  async function fetchOrders() {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/admin/show-orders/pending`, { headers: auth });
      const result = await res.json();
      if (result.status) setOrders(result.data);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchOrders(); }, []);

  async function markPaid(refId: string) {
    setProcessing(refId);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${PARTNERSHIP_BASE}/admin/show-orders/${refId}/mark-paid`, {
        method: "POST",
        headers: auth,
      });
      const result = await res.json();
      setMsgs((m) => ({ ...m, [refId]: { ok: result.status, text: result.message ?? (result.status ? "Berhasil" : "Gagal") } }));
      if (result.status) fetchOrders();
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Order show yang belum dibayar</p>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Ref ID</TableHead>
              <TableHead>Partner</TableHead>
              <TableHead>Show</TableHead>
              <TableHead>Jumlah</TableHead>
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
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Tidak ada show order pending
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <React.Fragment key={o.ref_id}>
                  <TableRow>
                    <TableCell className="font-mono text-xs">{o.ref_id}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{o.kid}</div>
                      <div className="text-muted-foreground text-xs">{o.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{o.title ?? o.slug ?? o.show_id ?? "—"}</div>
                      <div className="text-muted-foreground text-xs">{o.slug}</div>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums">{o.formatted_amount ?? fmtRp(o.amount)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {timeAgo(o.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={processing === o.ref_id}
                        onClick={() => markPaid(o.ref_id)}
                      >
                        {processing === o.ref_id ? <Loader2 className="size-3 animate-spin" /> : <BadgeDollarSign className="size-3" />}
                        Mark Paid
                      </Button>
                    </TableCell>
                  </TableRow>
                  {msgs[o.ref_id] && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-1">
                        <p className={cn("text-xs rounded px-2 py-1", msgs[o.ref_id].ok ? "bg-green-500/10 text-green-700 dark:text-green-300" : "bg-red-500/10 text-red-700 dark:text-red-300")}>
                          {msgs[o.ref_id].text}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Partnership Panel (wrapper tabs) ─────────────────────────────────────────
function PartnershipPanel() {
  return (
    <Tabs defaultValue="list">
      <TabsList className="mb-4">
        <TabsTrigger value="list" className="gap-2">
          <Handshake className="size-3.5" /> Semua Partner
        </TabsTrigger>
        <TabsTrigger value="invoices" className="gap-2">
          <BadgeDollarSign className="size-3.5" /> Invoice Pending
        </TabsTrigger>
        <TabsTrigger value="shows" className="gap-2">
          <Tv className="size-3.5" /> Show Order Pending
        </TabsTrigger>
      </TabsList>
      <TabsContent value="list"><PartnershipList /></TabsContent>
      <TabsContent value="invoices"><PendingInvoices /></TabsContent>
      <TabsContent value="shows"><PendingShowOrders /></TabsContent>
    </Tabs>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export function AdminPanel() {
  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] flex-col">
      <div className="border-b bg-background px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-none">Admin Panel</h1>
            <p className="mt-1 text-muted-foreground text-xs">Kelola user, merchant, transaksi, dan partnership</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="size-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="merchants" className="gap-2">
              <Building2 className="size-3.5" />
              Verifikasi Merchant
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="size-3.5" />
              Users
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <ReceiptText className="size-3.5" />
              Transaksi
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <CreditCard className="size-3.5" />
              Penarikan
            </TabsTrigger>
            <TabsTrigger value="partnership" className="gap-2">
              <Handshake className="size-3.5" />
              Partnership
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><OverviewStats /></TabsContent>
          <TabsContent value="merchants"><MerchantVerification /></TabsContent>
          <TabsContent value="users"><UserManagement /></TabsContent>
          <TabsContent value="transactions"><AllTransactions /></TabsContent>
          <TabsContent value="withdrawals"><WithdrawalManagement /></TabsContent>
          <TabsContent value="partnership"><PartnershipPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
