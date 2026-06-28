// types.ts — Partnership API types (mengikuti response routes/pt.js)

export type PartnershipStatus = "pending_payment" | "active" | "suspended";

export type Partnership = {
  id: string;
  kid: string;
  label: string;
  status: PartnershipStatus;
  plan: string;
  plan_label: string | null;
  monthly_price: number;
  formatted_monthly_price: string;
  show_price: number;
  formatted_show_price: string | null;
  is_testing: boolean;
  current_period_start: string | null;
  current_period_end: string | null;
  grace_until: string | null;
  days_until_due: number | null;
  is_overdue: boolean;
  created_at: string;
};

export type InvoiceStatus = "pending" | "paid" | "expired" | "cancelled";

export type SubscriptionInvoice = {
  ref_id: string;
  amount: number;
  formatted_amount: string;
  period_start: string;
  period_end: string;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
};

export type ShowOrder = {
  ref_id: string;
  slug: string | null;
  show_id: string | null;
  title: string | null;
  amount: number;
  formatted_amount: string;
  status: InvoiceStatus;
  paid_at: string | null;
  created_at: string;
};

export type PartnershipLogActor = "partner" | "admin" | "system";

export type PartnershipLog = {
  actor: PartnershipLogActor;
  action: string;
  detail: Record<string, unknown> | null;
  created_at: string;
};

export type PendingPayment = {
  ref_id: string;
  trx_id: string;
  amount: number;
  formatted_amount: string;
  qris_content: string;
  qr_image: string | null;
  expired_at: string;
  timeout_minutes: number;
};

export type ShowPendingPayment = PendingPayment & {
  slug: string | null;
  showId: string | null;
  title: string | null;
};

export type PaymentCheckResult = {
  status: boolean;
  payment_status: "pending" | "paid" | "expired" | "cancelled";
  message: string;
  kid?: string;
  secret?: string;
  note?: string;
};
