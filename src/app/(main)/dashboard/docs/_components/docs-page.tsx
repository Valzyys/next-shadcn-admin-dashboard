"use client";

import * as React from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  QrCode,
  Webhook,
  Zap,
  Wallet,
  Menu,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES (dipakai bareng V1 & V2)
// ═══════════════════════════════════════════════════════════════════════════

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = React.useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-xl overflow-hidden border bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-zinc-400 text-xs font-mono">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle2 className="size-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-zinc-100 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MethodBadge({ method }: { method: "GET" | "POST" | "PATCH" | "DELETE" }) {
  const colors = {
    GET: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    POST: "bg-green-500/10 text-green-600 dark:text-green-400",
    PATCH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span className={cn("shrink-0 rounded px-2 py-0.5 text-xs font-bold font-mono", colors[method])}>
      {method}
    </span>
  );
}

function AuthBadge({ auth }: { auth: "API Key" | "Bearer" | "None" }) {
  const authColors = {
    "API Key": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    Bearer: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    None: "bg-zinc-500/10 text-zinc-500",
  };
  return (
    <span className={cn("shrink-0 rounded px-2 py-0.5 text-xs font-medium", authColors[auth])}>
      {auth}
    </span>
  );
}

// Stacked di mobile, row di desktop
function EndpointRow({
  method,
  path,
  description,
  auth,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: "API Key" | "Bearer" | "None";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
      <div className="flex items-center gap-2">
        <MethodBadge method={method} />
        <code className="text-xs font-mono text-foreground break-all sm:hidden">{path}</code>
      </div>
      <code className="hidden flex-1 text-sm font-mono text-foreground sm:block">{path}</code>
      <span className="text-muted-foreground text-xs sm:text-sm">{description}</span>
      <div className="sm:ml-auto">
        <AuthBadge auth={auth} />
      </div>
    </div>
  );
}

// Table di sm+, stacked card di mobile
function ResponsiveTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="hidden w-full text-sm sm:table">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium text-xs">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-xs align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="divide-y sm:hidden">
        {rows.map((row, i) => (
          <div key={i} className="p-3 space-y-1.5">
            {row.map((cell, j) => (
              <div key={j} className="flex items-start justify-between gap-3 text-xs">
                <span className="text-muted-foreground shrink-0">{columns[j]}</span>
                <span className="text-right">{cell}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <h2 className="font-semibold text-base sm:text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAV CONFIG — beda per versi, tapi dirender pakai komponen yang sama
// ═══════════════════════════════════════════════════════════════════════════

const NAV_ITEMS_V1 = [
  { id: "v1-quickstart", label: "Quick Start", icon: Zap },
  { id: "v1-payment", label: "Payment", icon: QrCode },
  { id: "v1-webhook", label: "Webhook", icon: Webhook },
  { id: "v1-reference", label: "API Reference", icon: BookOpen },
  { id: "v1-errors", label: "Error Codes", icon: Code2 },
];

const NAV_ITEMS_V2 = [
  { id: "v2-quickstart", label: "Quick Start", icon: Zap },
  { id: "v2-dynamic", label: "Payment", icon: QrCode },
  { id: "v2-history", label: "History", icon: Wallet },
  { id: "v2-webhook", label: "Webhook", icon: Webhook },
  { id: "v2-reference", label: "API Reference", icon: BookOpen },
  { id: "v2-errors", label: "Error Codes", icon: Code2 },
];

type NavItem = { id: string; label: string; icon: React.ElementType };

function DocsNavList({
  items,
  active,
  onNavigate,
}: {
  items: NavItem[];
  active: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
            active === item.id
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
          <ChevronRight className="ml-auto size-3.5 opacity-50" />
        </a>
      ))}
    </nav>
  );
}

function DocsPillNav({ items, active }: { items: NavItem[]; active: string }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
            active === item.id
              ? "border-primary/40 bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <item.icon className="size-3.5" />
          {item.label}
        </a>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// V1 CONTENT
// ═══════════════════════════════════════════════════════════════════════════

function V1Content() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 sm:space-y-12">
      <Section id="v1-quickstart" icon={Zap} title="Quick Start">
        <p className="text-muted-foreground text-sm leading-relaxed">
          JKT48Connect Payment Gateway memungkinkan kamu menerima pembayaran QRIS secara otomatis.
          Cukup siapkan API Key dan langsung buat transaksi.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { step: "1", title: "Dapatkan API Key", desc: "Hubungi admin JKT48Connect untuk mendapatkan API Key" },
            { step: "2", title: "Buat Transaksi", desc: "POST ke /gateway/payment/create dengan amount & deskripsi" },
            { step: "3", title: "Cek Status", desc: "Poll /gateway/payment/check/:ref_id hingga paid" },
          ].map((s) => (
            <Card key={s.step}>
              <CardContent className="pt-4">
                <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {s.step}
                </div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Autentikasi — API Key:</p>
          <CodeBlock
            language="bash"
            code={`# Sertakan di setiap request payment
x-api-key: GI-xxxxxxxxxxxxxxxx`}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Contoh request pertama:</p>
          <CodeBlock
            language="bash"
            code={`curl -X POST https://v5.jkt48connect.com/gateway/payment/create \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "description": "Pembayaran Tiket Theater JKT48",
    "customer_ref": "user_123"
  }'`}
          />
        </div>
      </Section>

      <Section id="v1-payment" icon={QrCode} title="Payment">
        <p className="text-muted-foreground text-sm">
          Semua endpoint pembayaran menggunakan autentikasi <strong>API Key</strong> via header{" "}
          <code>x-api-key</code>.
        </p>

        <Tabs defaultValue="create">
          <TabsList className="flex h-auto w-full flex-wrap gap-1">
            <TabsTrigger value="create">Buat Pembayaran</TabsTrigger>
            <TabsTrigger value="check">Cek Status</TabsTrigger>
            <TabsTrigger value="cancel">Batalkan</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <MethodBadge method="POST" />
              <code className="text-sm font-mono">/gateway/payment/create</code>
            </div>
            <p className="text-muted-foreground text-sm">Membuat transaksi QRIS baru.</p>
            <CodeBlock
              language="bash"
              code={`curl -X POST https://v5.jkt48connect.com/gateway/payment/create \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "description": "Pembayaran Tiket Theater JKT48",
    "customer_ref": "user_123"
  }'`}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Request Body</p>
              <ResponsiveTable
                columns={["Field", "Type", "Required", "Keterangan"]}
                rows={[
                  ["amount", "number", "✅", "Nominal dalam Rupiah (> 0)"],
                  ["description", "string", "❌", "Deskripsi pembayaran"],
                  ["customer_ref", "string", "❌", "Referensi pelanggan kamu"],
                ]}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Response</p>
              <CodeBlock
                language="json"
                code={`{
  "status": true,
  "message": "Pembayaran berhasil dibuat",
  "data": {
    "transaction_id": "uuid",
    "ref_id": "GI-xxxxxxxxxxxxx",
    "trx_id": "GI-XXXXXX-XXXX",
    "amount": 50000,
    "formatted_amount": "Rp 50.000",
    "qris_content": "00020101021226...",
    "qr_image": "https://r2.jkt48connect.com/qr/...",
    "payment_url": "https://payment.jkt48connect.com/xxxxx",
    "expired_at": "2026-06-14T10:00:00.000Z",
    "timeout_minutes": 60
  }
}`}
              />
            </div>
          </TabsContent>

          <TabsContent value="check" className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono">/gateway/payment/check/:ref_id</code>
            </div>
            <p className="text-muted-foreground text-sm">Cek status pembayaran berdasarkan ref_id.</p>
            <CodeBlock
              language="bash"
              code={`curl https://v5.jkt48connect.com/gateway/payment/check/GI-xxxxxxxxxxxxx \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx"`}
            />
            <CodeBlock
              language="json"
              code={`# Jika pending
{
  "status": true,
  "payment_status": "pending",
  "message": "⏳ Menunggu pembayaran...",
  "data": {
    "trx_id": "GI-XXXXXX-XXXX",
    "amount": 50000,
    "qr_image": "https://...",
    "payment_url": "https://...",
    "time_remaining": {
      "seconds": 3542,
      "minutes": 59,
      "formatted": "59m 2s"
    }
  }
}

# Jika berhasil
{
  "status": true,
  "payment_status": "paid",
  "message": "🎉 Pembayaran berhasil!",
  "just_confirmed": true,
  "data": {
    "trx_id": "GI-XXXXXX-XXXX",
    "amount": 50000,
    "paid_at": "2026-06-14T09:30:00.000Z"
  }
}`}
            />
            <div className="rounded-lg border p-3 bg-amber-500/5 text-amber-700 dark:text-amber-300 text-xs space-y-1">
              <p className="font-medium">💡 Polling Recommendation</p>
              <p>
                Poll endpoint ini setiap <strong>3-5 detik</strong> hingga status berubah dari{" "}
                <code>pending</code>. Hentikan polling jika status <code>paid</code>,{" "}
                <code>expired</code>, atau <code>cancelled</code>.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="cancel" className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <MethodBadge method="DELETE" />
              <code className="text-sm font-mono">/gateway/payment/cancel/:ref_id</code>
            </div>
            <p className="text-muted-foreground text-sm">Batalkan pembayaran yang masih pending.</p>
            <CodeBlock
              language="bash"
              code={`curl -X DELETE https://v5.jkt48connect.com/gateway/payment/cancel/GI-xxxxxxxxxxxxx \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx"`}
            />
            <CodeBlock
              language="json"
              code={`{
  "status": true,
  "message": "Pembayaran berhasil dibatalkan",
  "ref_id": "GI-xxxxxxxxxxxxx"
}`}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono">/gateway/payment/history</code>
            </div>
            <p className="text-muted-foreground text-sm">Ambil riwayat transaksi via API Key.</p>
            <CodeBlock
              language="bash"
              code={`curl "https://v5.jkt48connect.com/gateway/payment/history?limit=20&offset=0&status=paid" \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx"`}
            />
            <ResponsiveTable
              columns={["Query Param", "Default", "Keterangan"]}
              rows={[
                ["limit", "20", "Jumlah data per halaman (max 100)"],
                ["offset", "0", "Offset untuk pagination"],
                ["status", "-", "Filter: pending | paid | expired | cancelled"],
              ]}
            />
          </TabsContent>
        </Tabs>
      </Section>

      <Section id="v1-webhook" icon={Webhook} title="Webhook">
        <div className="rounded-lg border p-4 bg-muted/30 text-sm space-y-2">
          <p className="font-medium flex flex-wrap items-center gap-2">
            <span className="rounded px-2 py-0.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Coming Soon
            </span>
            Webhook Notifikasi
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Webhook akan segera tersedia. Dengan webhook, kamu akan menerima notifikasi otomatis ke
            URL kamu ketika status pembayaran berubah — tanpa perlu polling.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Sementara ini, gunakan polling:</p>
          <CodeBlock
            language="javascript"
            code={`async function pollPayment(refId, apiKey) {
  const interval = setInterval(async () => {
    const res = await fetch(
      \`https://v5.jkt48connect.com/gateway/payment/check/\${refId}\`,
      { headers: { "x-api-key": apiKey } }
    );
    const data = await res.json();

    if (data.payment_status === "paid") {
      clearInterval(interval);
      console.log("✅ Pembayaran berhasil!", data);
      // Handle success
    }

    if (["expired", "cancelled"].includes(data.payment_status)) {
      clearInterval(interval);
      console.log("❌ Pembayaran gagal:", data.payment_status);
      // Handle failure
    }
  }, 3000); // Poll setiap 3 detik

  // Stop polling setelah 65 menit
  setTimeout(() => clearInterval(interval), 65 * 60 * 1000);
}`}
          />
        </div>
      </Section>

      <Section id="v1-reference" icon={BookOpen} title="API Reference">
        <p className="text-muted-foreground text-sm">Daftar lengkap endpoint payment yang tersedia.</p>
        <div className="space-y-2">
          <EndpointRow method="POST" path="/gateway/payment/create" description="Buat transaksi QRIS" auth="API Key" />
          <EndpointRow method="GET" path="/gateway/payment/check/:ref_id" description="Cek status pembayaran" auth="API Key" />
          <EndpointRow method="DELETE" path="/gateway/payment/cancel/:ref_id" description="Batalkan pembayaran" auth="API Key" />
          <EndpointRow method="GET" path="/gateway/payment/history" description="Riwayat pembayaran" auth="API Key" />
        </div>
      </Section>

      <Section id="v1-errors" icon={Code2} title="Error Codes">
        <p className="text-muted-foreground text-sm">Semua response error menggunakan format standar:</p>
        <CodeBlock
          language="json"
          code={`{
  "status": false,
  "message": "Deskripsi error",
  "error": "Detail teknis (development only)"
}`}
        />
        <ResponsiveTable
          columns={["HTTP Code", "Arti", "Contoh"]}
          rows={[
            [
              <span key="400" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-amber-500/10 text-amber-600">400</span>,
              "Bad Request",
              "Field wajib tidak diisi, format salah",
            ],
            [
              <span key="401" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-amber-500/10 text-amber-600">401</span>,
              "Unauthorized",
              "API Key tidak valid atau expired",
            ],
            [
              <span key="403" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-amber-500/10 text-amber-600">403</span>,
              "Forbidden",
              "API Key tidak punya akses ke resource ini",
            ],
            [
              <span key="404" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-red-500/10 text-red-600">404</span>,
              "Not Found",
              "Transaksi tidak ditemukan",
            ],
            [
              <span key="409" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-red-500/10 text-red-600">409</span>,
              "Conflict",
              "Transaksi duplikat",
            ],
            [
              <span key="500" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-red-500/10 text-red-600">500</span>,
              "Server Error",
              "Kesalahan internal server",
            ],
            [
              <span key="502" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-red-500/10 text-red-600">502</span>,
              "Bad Gateway",
              "Gagal koneksi ke payment provider",
            ],
          ]}
        />
        <div className="rounded-lg border p-4 bg-blue-500/5 text-blue-700 dark:text-blue-300 text-xs space-y-1">
          <p className="font-medium">💡 Tips</p>
          <p>
            Selalu cek field <code>status</code> (boolean) pada setiap response sebelum menggunakan
            datanya. Jika <code>false</code>, tangani error dari field <code>message</code>.
          </p>
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// V2 CONTENT
// ═══════════════════════════════════════════════════════════════════════════

function V2Content() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 sm:space-y-12">
      <Section id="v2-quickstart" icon={Zap} title="Quick Start">
        <p className="text-muted-foreground text-sm leading-relaxed">
          Gateway V2 (jalur <strong>dynamic</strong>) menerima pembayaran QRIS dengan nominal yang
          berubah-ubah (kode unik anti-collision), dan diverifikasi otomatis lewat polling Durable
          Object tiap 2 detik. Cukup pakai API Key kamu untuk mulai.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { step: "1", title: "Dapatkan API Key", desc: "Hubungi admin JKT48Connect untuk mendapatkan API Key V2" },
            { step: "2", title: "Buat Transaksi", desc: "POST /v2/payment/create dengan amount & deskripsi" },
            { step: "3", title: "Cek Status", desc: "Poll /v2/payment/check/:ref_id hingga paid" },
          ].map((s) => (
            <Card key={s.step}>
              <CardContent className="pt-4">
                <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {s.step}
                </div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Autentikasi — API Key:</p>
          <CodeBlock
            language="bash"
            code={`# Sertakan di setiap request payment
x-api-key: GIV2-xxxxxxxxxxxxxxxx`}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Contoh request pertama:</p>
          <CodeBlock
            language="bash"
            code={`curl -X POST https://v5.jkt48connect.com/gateway/v2/payment/create \\
  -H "x-api-key: GIV2-xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "description": "Pembayaran Merchandise JKT48",
    "customer_name": "user_123"
  }'`}
          />
        </div>
      </Section>

      <Section id="v2-dynamic" icon={QrCode} title="Payment">
        <p className="text-muted-foreground text-sm">
          QRIS nominal dinamis dengan kode unik anti-collision. Status diverifikasi otomatis oleh
          poller (Durable Object) tiap 2 detik lewat webhook.
        </p>

        <Tabs defaultValue="create">
          <TabsList className="flex h-auto w-full flex-wrap gap-1">
            <TabsTrigger value="create">Buat Pembayaran</TabsTrigger>
            <TabsTrigger value="check">Cek Status</TabsTrigger>
            <TabsTrigger value="cancel">Batalkan</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <MethodBadge method="POST" />
              <code className="text-sm font-mono">/gateway/v2/payment/create</code>
            </div>
            <p className="text-muted-foreground text-sm">
              Membuat transaksi QRIS dinamis baru. Nominal final sudah termasuk kode unik.
            </p>
            <CodeBlock
              language="bash"
              code={`curl -X POST https://v5.jkt48connect.com/gateway/v2/payment/create \\
  -H "x-api-key: GIV2-xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "customer_name": "user_123",
    "description": "Pembayaran Merchandise",
    "timeout_minutes": 30
  }'`}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium">Request Body</p>
              <ResponsiveTable
                columns={["Field", "Type", "Required", "Keterangan"]}
                rows={[
                  ["amount", "number", "✅", "Nominal dasar dalam Rupiah (> 0)"],
                  ["customer_name", "string", "❌", "Nama pelanggan"],
                  ["customer_email", "string", "❌", "Email pelanggan"],
                  ["customer_phone", "string", "❌", "Nomor HP pelanggan"],
                  ["description", "string", "❌", "Deskripsi pembayaran"],
                  ["custom_trx_id", "string", "❌", "ID transaksi custom dari sistem kamu"],
                  ["timeout_minutes", "number", "❌", "Default 30 menit"],
                ]}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Response</p>
              <CodeBlock
                language="json"
                code={`{
  "status": true,
  "message": "Pembayaran dinamis berhasil dibuat",
  "data": {
    "transaction_id": "uuid",
    "ref_id": "GIV2-xxxxxxxxxxxxx",
    "trx_id": "GIV2-XXXXXX-XXXX",
    "amount": 50000,
    "unique_code": 123,
    "final_amount": 50123,
    "formatted_final_amount": "Rp 50.123",
    "qris_content": "00020101021226...",
    "qr_image": "https://r2.jkt48connect.com/...",
    "expired_at": "2026-06-14T10:00:00.000Z",
    "timeout_minutes": 30,
    "note": "Nominal yang WAJIB ditransfer adalah final_amount, bukan amount asli."
  }
}`}
              />
            </div>
            <div className="rounded-lg border p-3 bg-amber-500/5 text-amber-700 dark:text-amber-300 text-xs space-y-1">
              <p className="font-medium">💡 Penting</p>
              <p>
                Selalu tampilkan <code>final_amount</code> ke customer, bukan <code>amount</code> —
                kode unik dipakai sistem untuk mencocokkan mutasi dana masuk secara presisi.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="check" className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <MethodBadge method="GET" />
              <code className="text-sm font-mono">/gateway/v2/payment/check/:ref_id</code>
            </div>
            <p className="text-muted-foreground text-sm">Cek status pembayaran dinamis berdasarkan ref_id.</p>
            <CodeBlock
              language="bash"
              code={`curl https://v5.jkt48connect.com/gateway/v2/payment/check/GIV2-xxxxxxxxxxxxx \\
  -H "x-api-key: GIV2-xxxxxxxxxxxxxxxx"`}
            />
            <CodeBlock
              language="json"
              code={`# Jika pending
{
  "status": true,
  "payment_status": "pending",
  "ref_id": "GIV2-xxxxxxxxxxxxx",
  "data": {
    "trx_id": "GIV2-XXXXXX-XXXX",
    "final_amount": 50123,
    "qr_image": "https://...",
    "time_remaining": { "seconds": 1742 }
  }
}

# Jika berhasil
{
  "status": true,
  "payment_status": "paid",
  "ref_id": "GIV2-xxxxxxxxxxxxx",
  "data": {
    "trx_id": "GIV2-XXXXXX-XXXX",
    "amount": 50123,
    "matched_source": "webhook",
    "paid_at": "2026-06-14T09:30:00.000Z"
  }
}`}
            />
            <div className="rounded-lg border p-3 bg-amber-500/5 text-amber-700 dark:text-amber-300 text-xs space-y-1">
              <p className="font-medium">💡 Polling Recommendation</p>
              <p>
                Poll endpoint ini setiap <strong>3-5 detik</strong> hingga status berubah dari{" "}
                <code>pending</code>. Hentikan polling jika status <code>paid</code>,{" "}
                <code>expired</code>, atau <code>cancelled</code>.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="cancel" className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <MethodBadge method="DELETE" />
              <code className="text-sm font-mono">/gateway/v2/payment/cancel/:ref_id</code>
            </div>
            <p className="text-muted-foreground text-sm">Batalkan pembayaran dinamis yang masih pending.</p>
            <CodeBlock
              language="bash"
              code={`curl -X DELETE https://v5.jkt48connect.com/gateway/v2/payment/cancel/GIV2-xxxxxxxxxxxxx \\
  -H "x-api-key: GIV2-xxxxxxxxxxxxxxxx"`}
            />
            <CodeBlock
              language="json"
              code={`{
  "status": true,
  "message": "Pembayaran berhasil dibatalkan",
  "ref_id": "GIV2-xxxxxxxxxxxxx"
}`}
            />
          </TabsContent>
        </Tabs>
      </Section>

      <Section id="v2-history" icon={Wallet} title="History">
        <p className="text-muted-foreground text-sm">
          Riwayat transaksi payment V2, diakses via API Key yang sama dengan jalur payment.
        </p>
        <div className="space-y-2">
          <EndpointRow
            method="GET"
            path="/gateway/v2/payment/history"
            description="Riwayat semua transaksi V2"
            auth="API Key"
          />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Query Params</p>
          <ResponsiveTable
            columns={["Param", "Default", "Keterangan"]}
            rows={[
              ["limit", "20", "Jumlah data per halaman (max 100)"],
              ["offset", "0", "Offset untuk pagination"],
              ["status", "-", "Filter: pending | paid | expired | cancelled"],
            ]}
          />
        </div>
        <CodeBlock
          language="bash"
          code={`curl "https://v5.jkt48connect.com/gateway/v2/payment/history?limit=20&offset=0&status=paid" \\
  -H "x-api-key: GIV2-xxxxxxxxxxxxxxxx"`}
        />
      </Section>

      <Section id="v2-webhook" icon={Webhook} title="Webhook">
        <div className="rounded-lg border p-4 bg-muted/30 text-sm space-y-2">
          <p className="font-medium flex flex-wrap items-center gap-2">
            <span className="rounded px-2 py-0.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Internal Only
            </span>
            Webhook Notifikasi
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Di V2, webhook dana masuk dipakai secara internal oleh poller (dynamic) dan proses
            submit-proof (static) untuk mencocokkan mutasi. Webhook publik untuk pihak ketiga belum
            tersedia — gunakan polling di bawah ini.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Contoh polling client untuk dynamic payment:</p>
          <CodeBlock
            language="javascript"
            code={`async function pollPaymentV2(refId, apiKey) {
  const interval = setInterval(async () => {
    const res = await fetch(
      \`https://v5.jkt48connect.com/gateway/v2/payment/check/\${refId}\`,
      { headers: { "x-api-key": apiKey } }
    );
    const data = await res.json();

    if (data.payment_status === "paid") {
      clearInterval(interval);
      console.log("✅ Pembayaran berhasil!", data);
      // Handle success
    }

    if (["expired", "cancelled"].includes(data.payment_status)) {
      clearInterval(interval);
      console.log("❌ Pembayaran gagal:", data.payment_status);
      // Handle failure
    }
  }, 3000); // Poll setiap 3 detik

  setTimeout(() => clearInterval(interval), 35 * 60 * 1000);
}`}
          />
        </div>
      </Section>

      <Section id="v2-reference" icon={BookOpen} title="API Reference">
        <p className="text-muted-foreground text-sm">
          Daftar endpoint Gateway V2 yang diakses via <strong>API Key</strong> (<code>x-api-key</code>).
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
            <EndpointRow method="POST" path="/gateway/v2/payment/create" description="Buat transaksi QRIS" auth="API Key" />
            <EndpointRow method="GET" path="/gateway/v2/payment/check/:ref_id" description="Cek status pembayaran" auth="API Key" />
            <EndpointRow method="DELETE" path="/gateway/v2/payment/cancel/:ref_id" description="Batalkan pembayaran" auth="API Key" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</p>
            <EndpointRow method="GET" path="/gateway/v2/payment/history" description="Riwayat transaksi" auth="API Key" />
          </div>
        </div>
      </Section>

      <Section id="v2-errors" icon={Code2} title="Error Codes">
        <p className="text-muted-foreground text-sm">Semua response error menggunakan format standar:</p>
        <CodeBlock
          language="json"
          code={`{
  "status": false,
  "message": "Deskripsi error",
  "error": "Detail teknis (development only)"
}`}
        />
        <ResponsiveTable
          columns={["HTTP Code", "Arti", "Contoh"]}
          rows={[
            [
              <span key="400" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-amber-500/10 text-amber-600">400</span>,
              "Bad Request",
              "amount tidak diisi, merchant_name/city kosong",
            ],
            [
              <span key="401" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-amber-500/10 text-amber-600">401</span>,
              "Unauthorized",
              "Token/API Key tidak valid atau expired",
            ],
            [
              <span key="403" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-amber-500/10 text-amber-600">403</span>,
              "Forbidden",
              "Bukan admin, atau akun tidak aktif",
            ],
            [
              <span key="404" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-red-500/10 text-red-600">404</span>,
              "Not Found",
              "Merchant/transaksi/API Key tidak ditemukan",
            ],
            [
              <span key="409" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-red-500/10 text-red-600">409</span>,
              "Conflict",
              "Merchant sudah terdaftar, transaksi sudah paid/diproses",
            ],
            [
              <span key="500" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-red-500/10 text-red-600">500</span>,
              "Server Error",
              "Kesalahan internal, OCR gagal total",
            ],
            [
              <span key="202" className="rounded px-2 py-0.5 text-xs font-bold font-mono bg-green-500/10 text-green-600">202</span>,
              "Accepted (needs_review)",
              "Bukti diterima tapi butuh review admin",
            ],
          ]}
        />
        <div className="rounded-lg border p-4 bg-blue-500/5 text-blue-700 dark:text-blue-300 text-xs space-y-1">
          <p className="font-medium">💡 Tips</p>
          <p>
            Untuk jalur static, HTTP 202 dengan <code>payment_status: "needs_review"</code> bukan
            error — artinya bukti sudah diterima tapi menunggu keputusan admin.
          </p>
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — 1 page, toggle antara V1 & V2
// ═══════════════════════════════════════════════════════════════════════════

export function DocsPage() {
  const [version, setVersion] = React.useState<"v1" | "v2">("v1");
  const [activeSection, setActiveSection] = React.useState("v1-quickstart");
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const navItems = version === "v1" ? NAV_ITEMS_V1 : NAV_ITEMS_V2;

  // Reset ke section pertama tiap ganti versi
  function switchVersion(v: "v1" | "v2") {
    setVersion(v);
    setActiveSection(v === "v1" ? NAV_ITEMS_V1[0].id : NAV_ITEMS_V2[0].id);
    window.location.hash = "";
  }

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    // beri waktu section ter-render dulu sebelum observe
    const raf = requestAnimationFrame(() => {
      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [version, navItems]);

  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex flex-wrap items-center gap-3 px-4 py-4 lg:px-6">
          {/* Mobile nav trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 px-3 py-6">
              <p className="px-3 pb-3 font-semibold text-sm">Navigasi Docs</p>
              <DocsNavList items={navItems} active={activeSection} onNavigate={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:size-10">
            <QrCode className="size-4 text-primary sm:size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm leading-none sm:text-base">Payment API Docs</h1>
            <p className="mt-1 truncate text-muted-foreground text-xs">
              JKT48Connect Payment Gateway
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-md border-transparent bg-green-500/10 text-[10px] text-green-700 dark:text-green-300 sm:text-xs"
            >
              Live
            </Badge>
            <a
              href={version === "v1" ? "https://v5.jkt48connect.com/gateway" : "https://v5.jkt48connect.com/gateway/v2"}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 text-muted-foreground hover:text-foreground text-xs transition-colors sm:flex"
            >
              Base URL
              <ExternalLink className="size-3" />
            </a>
          </div>

          {/* Version switcher */}
          <div className="order-last flex w-full sm:order-none sm:w-auto">
            <div className="flex w-full rounded-lg border p-0.5 sm:w-auto">
              {(["v1", "v2"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => switchVersion(v)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:px-4",
                    version === v
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Gateway {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pill nav — tablet & mobile only */}
        <DocsPillNav items={navItems} active={activeSection} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop only */}
        <aside className="hidden w-56 shrink-0 border-r px-3 py-6 lg:block">
          <DocsNavList items={navItems} active={activeSection} />
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {version === "v1" ? <V1Content /> : <V2Content />}
        </main>
      </div>
    </div>
  );
}
