import type { ReactNode } from "react";
import { QrCode } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full rounded-3xl bg-primary lg:flex">
          <div className="absolute top-10 space-y-1 px-10 text-primary-foreground">
            <QrCode className="size-10" />
            <h1 className="font-medium text-2xl">{APP_CONFIG.name}</h1>
            <p className="text-sm">Bayar. Verifikasi. Otomatis.</p>
          </div>
          <div className="absolute bottom-10 flex w-full justify-between px-10">
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Pembayaran QRIS Otomatis</h2>
              <p className="text-sm">Kelola transaksi membership dan tiket JKT48 dengan sistem QRIS terintegrasi.</p>
            </div>
            <Separator orientation="vertical" className="mx-3 h-auto!" />
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Butuh bantuan?</h2>
              <p className="text-sm">
                Hubungi tim JKT48Connect atau cek dokumentasi API untuk integrasi lebih lanjut.
              </p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
