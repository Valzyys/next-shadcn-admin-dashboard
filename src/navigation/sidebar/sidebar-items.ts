import {
  Banknote,
  Calendar,
  ChartBar,
  Fingerprint,
  Forklift,
  Gauge,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  ListTodo,
  Lock,
  type LucideIcon,
  Mail,
  MessageSquare,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  SquareArrowUpRight,
  Users,
} from "lucide-react";

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

const ADMIN_EMAILS = ["storevalzy@gmail.com"];

export function getSidebarItems(email?: string | null): NavGroup[] {
  const isAdmin = email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false;

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
          url: "/dashboard/kanban",
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
          url: "/dashboard/partnership",
          icon: Users,
          comingSoon: true,
        },
      ],
    },
    {
      id: 3,
      label: "Misc",
      items: [
        {
          title: "Others",
          url: "/dashboard/coming-soon",
          icon: SquareArrowUpRight,
          comingSoon: true,
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
