export type Merchant = {
  id: string;
  merchant_name: string;
  city: string;
  business_type: string | null;
  description: string | null;
  is_verified: boolean;
  created_at: string;
  // ── tambahan khusus V2 (optional, non-breaking) ──
  phone?: string | null;
  static_qris_content?: string | null;
  static_qr_image_url?: string | null;
};

export type Transaction = {
  id: string;
  ref_id: string;
  gi_trx_id: string;
  amount: number;
  formatted_amount: string;
  // V2 menambah 'needs_review' & 'rejected' (khusus alur static/manual verify)
  status: "pending" | "paid" | "expired" | "cancelled" | "needs_review" | "rejected";
  description: string | null;
customer_name: string | null;
customer_email?: string | null;
customer_phone?: string | null;
  paid_at: string | null;
  created_at: string;
  expired_at: string | null;
  // ── tambahan khusus V2 ──
  payment_type?: "dynamic" | "static";
  final_amount?: number;
};

export type ApiKey = {
  id: string;
  api_key: string;
  label: string;
  revoked: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export type ProfileStats = {
  active_balance: number;
  clearing_balance: number;
  volume_success: number;
  volume_30d: number;
  avg_transaction: number;
  success_rate: string;
  transactions: {
    total: number;
    paid: number;
    pending: number;
    cancelled: number;
    expired: number;
  };
};

// ── tipe tambahan khusus V2 ──
export type ChangeRequest = {
  id: string;
  merchant_id: string;
  new_merchant_name: string | null;
  new_city: string | null;
  new_business_type: string | null;
  new_description: string | null;
  new_phone: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
};
