import { Banknote, BookOpen, LayoutDashboard, type LucideIcon, ReceiptText, ShieldCheck, Users } from "lucide-react";
export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}
export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}
export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}
export function getSidebarItems(isAdmin = false): NavGroup[] {
  const groups: NavGroup[] = [
    {
      id: 1,
      label: "Dashboards",
      items: [
        {
          title: "Home",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      id: 2,
      label: "Pages",
      items: [
        {
          title: "Merchant",
          url: "/dashboard/merchant",
          icon: Banknote,
        },
        {
          title: "Merchant V2",
          url: "/dashboard/merchant2",
          icon: Banknote,
          isNew: true,
        },
        {
          title: "Penarikan",
          url: "/dashboard/withdrawal",
          icon: Banknote,
        },
        {
          title: "Reseller",
          url: "/dashboard/reseller",
          icon: ReceiptText,
          comingSoon: true,
        },
        {
          title: "Partnership",
          url: "/dashboard/partners",
          icon: Users,
          comingSoon: false,
        },
      ],
    },
    {
      id: 3,
      label: "Misc",
      items: [
        {
          title: "API Docs",
          url: "/dashboard/docs",
          icon: BookOpen,
        },
      ],
    },
  ];
  if (isAdmin) {
    groups.push({
      id: 4,
      label: "Admin",
      items: [
        {
          title: "Admin Panel",
          url: "/dashboard/admin",
          icon: ShieldCheck,
          isNew: true,
        },
      ],
    });
  }
  return groups;
}
// Backward compat — default tanpa email
export const sidebarItems = getSidebarItems();
