import Link from "next/link";
import { siWhatsapp } from "simple-icons";
import { SimpleIcon } from "@/components/simple-icon";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SidebarSupportCard() {
  return (
    <Card size="sm" className="shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">Butuh bantuan?</CardTitle>
        <CardDescription>
          Hubungi tim JKT48Connect via&nbsp;
          <Link
            href="https://wa.me/6285189020193"
            target="_blank"
            rel="noreferrer"
            aria-label="Hubungi via WhatsApp"
            className="inline-flex items-center text-foreground"
          >
            <SimpleIcon icon={siWhatsapp} aria-hidden className="size-3 fill-current" />
          </Link>
          .
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
