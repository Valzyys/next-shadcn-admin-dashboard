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
  Loader2,
  Webhook,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Code Block ────────────────────────────────────────────────────────────────
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

// ─── Method Badge ──────────────────────────────────────────────────────────────
function MethodBadge({ method }: { method: "GET" | "POST" | "PATCH" | "DELETE" }) {
  const colors = {
    GET:    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    POST:   "bg-green-500/10 text-green-600 dark:text-green-400",
    PATCH:  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span className={cn("rounded px-2 py-0.5 text-xs font-bold font-mono", colors[method])}>
      {method}
    </span>
  );
}

// ─── Endpoint Row ──────────────────────────────────────────────────────────────
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
  const authColors = {
    "API Key": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    "Bearer":  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "None":    "bg-zinc-500/10 text-zinc-500",
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
      <MethodBadge method={method} />
      <code className="flex-1 text-sm font-mono text-foreground">{path}</code>
      <span className="text-muted-foreground text-sm">{description}</span>
      <span className={cn("rounded px-2 py-0.5 text-xs font-medium", authColors[auth])}>
        {auth}
      </span>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────────
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
    <section id={id} className="scroll-mt-6 space-y-4">
      <div className="flex items-center gap-2 border-b pb-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Sidebar Nav ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "quickstart", label: "Quick Start",   icon: Zap },
  { id: "payment",    label: "Payment",       icon: QrCode },
  { id: "webhook",    label: "Webhook",       icon: Webhook },
  { id: "reference",  label: "API Reference", icon: BookOpen },
  { id: "errors",     label: "Error Codes",   icon: Code2 },
];

function DocsSidebar({ active }: { active: string }) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
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

// ─── Main Export ───────────────────────────────────────────────────────────────
export function DocsPage() {
  const [activeSection, setActiveSection] = React.useState("quickstart");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    for (const item of NAV_ITEMS) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-[calc(100dvh-var(--dashboard-header-height))] flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <QrCode className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-base leading-none">Payment API Docs</h1>
            <p className="mt-1 text-muted-foreground text-xs">JKT48Connect Payment Gateway — v1.0</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="rounded-md bg-green-500/10 text-green-700 dark:text-green-300 text-xs border-transparent">
              Live
            </Badge>
            <a
              href="https://v5.jkt48connect.com/gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Base URL
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 border-r px-3 py-6 lg:block">
          <DocsSidebar active={activeSection} />
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-12">

            {/* Quick Start */}
            <Section id="quickstart" icon={Zap} title="Quick Start">
              <p className="text-muted-foreground text-sm leading-relaxed">
                JKT48Connect Payment Gateway memungkinkan kamu menerima pembayaran QRIS secara otomatis. Cukup siapkan API Key dan langsung buat transaksi.
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
                <CodeBlock language="bash" code={`# Sertakan di setiap request payment
x-api-key: GI-xxxxxxxxxxxxxxxx`} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Contoh request pertama:</p>
                <CodeBlock language="bash" code={`curl -X POST https://v5.jkt48connect.com/gateway/payment/create \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "description": "Pembayaran Tiket Theater JKT48",
    "customer_ref": "user_123"
  }'`} />
              </div>
            </Section>

            {/* Payment */}
            <Section id="payment" icon={QrCode} title="Payment">
              <p className="text-muted-foreground text-sm">
                Semua endpoint pembayaran menggunakan autentikasi <strong>API Key</strong> via header <code>x-api-key</code>.
              </p>

              <Tabs defaultValue="create">
                <TabsList className="flex-wrap h-auto gap-1">
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
                  <CodeBlock language="bash" code={`curl -X POST https://v5.jkt48connect.com/gateway/payment/create \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "description": "Pembayaran Tiket Theater JKT48",
    "customer_ref": "user_123"
  }'`} />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Request Body</p>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-xs">Field</th>
                            <th className="px-3 py-2 text-left font-medium text-xs">Type</th>
                            <th className="px-3 py-2 text-left font-medium text-xs">Required</th>
                            <th className="px-3 py-2 text-left font-medium text-xs">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {[
                            ["amount", "number", "✅", "Nominal dalam Rupiah (> 0)"],
                            ["description", "string", "❌", "Deskripsi pembayaran"],
                            ["customer_ref", "string", "❌", "Referensi pelanggan kamu"],
                          ].map(([field, type, req, desc]) => (
                            <tr key={field}>
                              <td className="px-3 py-2 font-mono text-xs text-primary">{field}</td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">{type}</td>
                              <td className="px-3 py-2 text-xs">{req}</td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">{desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Response</p>
                    <CodeBlock language="json" code={`{
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
}`} />
                  </div>
                </TabsContent>

                <TabsContent value="check" className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <MethodBadge method="GET" />
                    <code className="text-sm font-mono">/gateway/payment/check/:ref_id</code>
                  </div>
                  <p className="text-muted-foreground text-sm">Cek status pembayaran berdasarkan ref_id.</p>
                  <CodeBlock language="bash" code={`curl https://v5.jkt48connect.com/gateway/payment/check/GI-xxxxxxxxxxxxx \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx"`} />
                  <CodeBlock language="json" code={`# Jika pending
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
}`} />
                  <div className="rounded-lg border p-3 bg-amber-500/5 text-amber-700 dark:text-amber-300 text-xs space-y-1">
                    <p className="font-medium">💡 Polling Recommendation</p>
                    <p>Poll endpoint ini setiap <strong>3-5 detik</strong> hingga status berubah dari <code>pending</code>. Hentikan polling jika status <code>paid</code>, <code>expired</code>, atau <code>cancelled</code>.</p>
                  </div>
                </TabsContent>

                <TabsContent value="cancel" className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <MethodBadge method="DELETE" />
                    <code className="text-sm font-mono">/gateway/payment/cancel/:ref_id</code>
                  </div>
                  <p className="text-muted-foreground text-sm">Batalkan pembayaran yang masih pending.</p>
                  <CodeBlock language="bash" code={`curl -X DELETE https://v5.jkt48connect.com/gateway/payment/cancel/GI-xxxxxxxxxxxxx \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx"`} />
                  <CodeBlock language="json" code={`{
  "status": true,
  "message": "Pembayaran berhasil dibatalkan",
  "ref_id": "GI-xxxxxxxxxxxxx"
}`} />
                </TabsContent>

                <TabsContent value="history" className="space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <MethodBadge method="GET" />
                    <code className="text-sm font-mono">/gateway/payment/history</code>
                  </div>
                  <p className="text-muted-foreground text-sm">Ambil riwayat transaksi via API Key.</p>
                  <CodeBlock language="bash" code={`curl "https://v5.jkt48connect.com/gateway/payment/history?limit=20&offset=0&status=paid" \\
  -H "x-api-key: GI-xxxxxxxxxxxxxxxx"`} />
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-xs">Query Param</th>
                          <th className="px-3 py-2 text-left font-medium text-xs">Default</th>
                          <th className="px-3 py-2 text-left font-medium text-xs">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[
                          ["limit", "20", "Jumlah data per halaman (max 100)"],
                          ["offset", "0", "Offset untuk pagination"],
                          ["status", "-", "Filter: pending | paid | expired | cancelled"],
                        ].map(([p, d, k]) => (
                          <tr key={p}>
                            <td className="px-3 py-2 font-mono text-xs text-primary">{p}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{d}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{k}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </Section>

            {/* Webhook */}
            <Section id="webhook" icon={Webhook} title="Webhook">
              <div className="rounded-lg border p-4 bg-muted/30 text-sm space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <span className="rounded px-2 py-0.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400">Coming Soon</span>
                  Webhook Notifikasi
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Webhook akan segera tersedia. Dengan webhook, kamu akan menerima notifikasi otomatis ke URL kamu ketika status pembayaran berubah — tanpa perlu polling.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Sementara ini, gunakan polling:</p>
                <CodeBlock language="javascript" code={`async function pollPayment(refId, apiKey) {
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
}`} />
              </div>
            </Section>

            {/* Reference */}
            <Section id="reference" icon={BookOpen} title="API Reference">
              <p className="text-muted-foreground text-sm">Daftar lengkap endpoint payment yang tersedia.</p>
              <div className="space-y-2">
                <div className="space-y-2">
                  <EndpointRow method="POST"   path="/gateway/payment/create"         description="Buat transaksi QRIS"     auth="API Key" />
                  <EndpointRow method="GET"    path="/gateway/payment/check/:ref_id"  description="Cek status pembayaran"   auth="API Key" />
                  <EndpointRow method="DELETE" path="/gateway/payment/cancel/:ref_id" description="Batalkan pembayaran"     auth="API Key" />
                  <EndpointRow method="GET"    path="/gateway/payment/history"        description="Riwayat pembayaran"      auth="API Key" />
                </div>
              </div>
            </Section>

            {/* Errors */}
            <Section id="errors" icon={Code2} title="Error Codes">
              <p className="text-muted-foreground text-sm">Semua response error menggunakan format standar:</p>
              <CodeBlock language="json" code={`{
  "status": false,
  "message": "Deskripsi error",
  "error": "Detail teknis (development only)"
}`} />
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-xs">HTTP Code</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Arti</th>
                      <th className="px-3 py-2 text-left font-medium text-xs">Contoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ["400", "Bad Request", "Field wajib tidak diisi, format salah"],
                      ["401", "Unauthorized", "API Key tidak valid atau expired"],
                      ["403", "Forbidden", "API Key tidak punya akses ke resource ini"],
                      ["404", "Not Found", "Transaksi tidak ditemukan"],
                      ["409", "Conflict", "Transaksi duplikat"],
                      ["500", "Server Error", "Kesalahan internal server"],
                      ["502", "Bad Gateway", "Gagal koneksi ke payment provider"],
                    ].map(([code, arti, contoh]) => (
                      <tr key={code}>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "rounded px-2 py-0.5 text-xs font-bold font-mono",
                            code.startsWith("2") ? "bg-green-500/10 text-green-600" :
                            code.startsWith("4") ? "bg-amber-500/10 text-amber-600" :
                            "bg-red-500/10 text-red-600"
                          )}>
                            {code}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs font-medium">{arti}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{contoh}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-lg border p-4 bg-blue-500/5 text-blue-700 dark:text-blue-300 text-xs space-y-1">
                <p className="font-medium">💡 Tips</p>
                <p>Selalu cek field <code>status</code> (boolean) pada setiap response sebelum menggunakan datanya. Jika <code>false</code>, tangani error dari field <code>message</code>.</p>
              </div>
            </Section>

          </div>
        </main>
      </div>
    </div>
  );
}
