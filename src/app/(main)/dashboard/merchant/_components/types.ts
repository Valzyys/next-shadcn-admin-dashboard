export type Merchant = {
  id: string;
  merchant_name: string;
  city: string;
  business_type: string | null;
  description: string | null;
  is_verified: boolean;
  created_at: string;
};

export type Transaction = {
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
  expired_at: string | null;
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
