"use client";

import * as React from "react";
import {
  Camera,
  Hash,
  Lock,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { ProfileStats, User } from "./types";

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

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Avatar Upload ─────────────────────────────────────────────────────────────
function AvatarField({
  user,
  onUpdated,
}: {
  user: User;
  onUpdated: (url: string) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Format harus JPG, PNG, atau WEBP");
      return;
    }

    setUploading(true);
    try {
      const auth = await getAuthHeader();
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${GATEWAY_BASE}/profile/avatar`, {
        method: "POST",
        headers: auth, // jangan set Content-Type, biar browser handle multipart
        body: formData,
      });
      const result = await res.json();
      if (result.status && result.data?.avatar_url) {
        onUpdated(result.data.avatar_url);
      } else {
        alert(result.message || "Gagal upload avatar");
      }
    } catch {
      alert("Gagal upload avatar");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="relative inline-block">
      <Avatar className="size-24 border-2 border-background shadow-sm">
        <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      <Button
        type="button"
        size="icon"
        className="absolute -bottom-1 -right-1 size-7 rounded-full"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="size-3.5" />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
          <RefreshCw className="size-5 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

// ─── Edit Profile Dialog ───────────────────────────────────────────────────────
function EditProfileDialog({
  user,
  onUpdated,
}: {
  user: User;
  onUpdated: (u: User) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: user.name, phone: user.phone ?? "" });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({ name: user.name, phone: user.phone ?? "" });
      setError(null);
    }
  }, [open, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Nama tidak boleh kosong");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ name: form.name, phone: form.phone || null }),
      });
      const result = await res.json();
      if (!result.status) throw new Error(result.message);
      onUpdated({ ...user, ...(result.data ?? {}) });
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
        Edit Profil
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>Perbarui nama dan nomor telepon Anda.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              id="phone"
              placeholder="08xxxxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Change Password Dialog ────────────────────────────────────────────────────
function ChangePasswordDialog() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  function reset() {
    setForm({ old_password: "", new_password: "", confirm_password: "" });
    setError(null);
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.new_password.length < 8) {
      setError("Password baru minimal 8 karakter");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/profile/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({
          old_password: form.old_password,
          new_password: form.new_password,
        }),
      });
      const result = await res.json();
      if (!result.status) throw new Error(result.message);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Lock className="size-4" />
        Ganti Password
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ganti Password</DialogTitle>
          <DialogDescription>
            Setelah diubah, semua sesi akan keluar dan Anda perlu login ulang.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-500/10">
              <ShieldCheck className="size-6 text-green-600" />
            </div>
            <p className="text-sm font-medium">Password berhasil diubah</p>
            <p className="text-sm text-muted-foreground">
              Silakan login kembali dengan password baru Anda.
            </p>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Mengerti
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old_password">Password Lama</Label>
              <Input
                id="old_password"
                type="password"
                value={form.old_password}
                onChange={(e) => setForm((p) => ({ ...p, old_password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Password Baru</Label>
              <Input
                id="new_password"
                type="password"
                value={form.new_password}
                onChange={(e) => setForm((p) => ({ ...p, new_password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
              <Input
                id="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={(e) => setForm((p) => ({ ...p, confirm_password: e.target.value }))}
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Mengubah..." : "Ubah Password"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

// ─── Main Export: Profile Page ─────────────────────────────────────────────────
export function ProfilePage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [stats, setStats] = React.useState<ProfileStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const auth = await getAuthHeader();
      const res = await fetch(`${GATEWAY_BASE}/profile`, { headers: auth });
      const result = await res.json();
      if (result.status && result.data) {
        setUser(result.data.user);
        if (result.data.stats) setStats(result.data.stats);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm text-muted-foreground">Gagal memuat profil.</p>
        <Button variant="outline" size="sm" onClick={fetchProfile}>
          <RefreshCw className="size-4" />
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 lg:px-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <AvatarField
                user={user}
                onUpdated={(url) => setUser({ ...user, avatar_url: url })}
              />

              <div className="flex-1 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h1 className="text-xl font-semibold tracking-tight">{user.name}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5" />{user.email}
                      </span>
                      {user.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3.5" />{user.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserIcon className="size-3" />Bergabung {fmtDate(user.created_at)}
                      </span>
                      <span>·</span>
                      <span>Login terakhir {fmtDate(user.last_login_at)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <EditProfileDialog user={user} onUpdated={setUser} />
                    <ChangePasswordDialog />
                  </div>
                </div>

                {/* Mini stats */}
                {stats && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <MiniStat label="Saldo Aktif" value={fmtRp(stats.active_balance)} />
                      <MiniStat label="Volume 30 hari" value={fmtRp(stats.volume_30d)} />
                      <MiniStat label="Transaksi" value={String(stats.transactions.total)} />
                      <MiniStat label="Success rate" value={stats.success_rate} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
          </div>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={<UserIcon className="size-4" />} label="Nama" value={user.name} />
            <InfoRow icon={<Mail className="size-4" />} label="Email" value={user.email} />
            <InfoRow icon={<Phone className="size-4" />} label="Telepon" value={user.phone ?? "—"} />
            <InfoRow
              icon={<ShieldCheck className="size-4" />}
              label="Bergabung sejak"
              value={fmtDate(user.created_at)}
            />
            <InfoRow
              icon={<Hash className="size-4" />}
              label="Login terakhir"
              value={fmtDate(user.last_login_at)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("rounded-lg border bg-muted/30 px-3 py-2")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export default ProfilePage;
