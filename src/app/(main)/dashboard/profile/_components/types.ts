export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
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

export type ProfileResponse = {
  user: User;
  stats: ProfileStats;
};
