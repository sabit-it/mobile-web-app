export { apiClient as api } from '../../api/client';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  patronymic: string | null;
  role: string;
  is_active: boolean;
  is_admin: boolean;
  balance: string;
  phone: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  title: string;
  status: string;
  total_price: string;
  address: string;
  employer_id: string;
  assigned_worker_id: string | null;
  profession_id: number;
  created_at: string;
}

export interface Profession {
  id: number;
  name: string;
  hourly_rate: string;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  type: string;
  amount: string;
  commission_amount: string;
  status: string;
  payer_id: string;
  receiver_id: string;
  payer_name: string;
  receiver_name: string;
  order_id: string | null;
  created_at: string;
}

export interface Stats {
  total_users: number;
  total_workers: number;
  total_employers: number;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_platform_revenue: string;
  total_volume: string;
}
