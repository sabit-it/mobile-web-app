export type UserRole = 'employer' | 'worker';
export type OrderStatus =
  | 'pending_offer'
  | 'assigned'
  | 'completed'
  | 'cancelled'
  | 'no_workers_available';
export type OfferStatus = 'sent' | 'accepted' | 'declined' | 'expired';

export interface User {
  id: string;
  email: string;
  phone: string | null;
  last_name: string;
  first_name: string;
  patronymic: string | null;
  role: UserRole;
  photo_url: string | null;
  lat: string | null;
  lng: string | null;
  balance: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface Profession {
  id: number;
  name: string;
  hourly_rate: string;
  rate_unit: string;
  is_active: boolean;
}

export interface OrderSummary {
  id: string;
  employer_id: string;
  profession_id: number;
  title: string;
  description: string | null;
  hours: number;
  hourly_rate: string;
  total_price: string;
  address: string;
  lat: string;
  lng: string;
  scheduled_at: string | null;
  status: OrderStatus;
  assigned_worker_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCreateResult {
  order: OrderSummary;
  active_offer_id: string | null;
  message: string | null;
}

export interface AssignedWorkerOut {
  id: string;
  email: string;
  phone: string | null;
  last_name: string;
  first_name: string;
  patronymic: string | null;
  photo_url: string | null;
  rating_avg: string;
  reviews_count: number;
  completed_orders: number;
  location: { lat: string | null; lng: string | null; source: string };
}

export interface OrderParticipantView {
  order: OrderSummary;
  assigned_worker: AssignedWorkerOut | null;
  active_offer_id: string | null;
}

export interface WorkerCatalogItem {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  profession: Profession;
  about: string | null;
  max_distance_km: number | null;
  rating_avg: string;
  reviews_count: number;
  completed_orders: number;
  is_online: boolean;
  distance_meters: number | null;
}

export interface WorkerCatalogOut {
  items: WorkerCatalogItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface WorkerProfileOut {
  id: string;
  user_id: string;
  profession: Profession;
  about: string | null;
  max_distance_km: number | null;
  rating_avg: string;
  reviews_count: number;
  completed_orders: number;
  is_online: boolean;
  current_lat: string | null;
  current_lng: string | null;
  last_location_at: string | null;
}

export interface OfferSummary {
  id: string;
  order_id: string;
  worker_id: string;
  distance_meters: number;
  status: OfferStatus;
  sent_at: string;
  responded_at: string | null;
}

export interface PendingOfferForWorker {
  offer: OfferSummary;
  order: OrderSummary;
}

export interface ReviewOut {
  id: string;
  order_id: string;
  author_id: string;
  recipient_id: string;
  rating: number;
  text: string | null;
  created_at: string;
}

export interface MessageOut {
  id: string;
  order_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface MessageListOut {
  items: MessageOut[];
  next_cursor: string | null;
}

export interface TransactionOut {
  id: string;
  order_id: string | null;
  payer_id: string;
  receiver_id: string;
  amount: string;
  commission_amount: string;
  worker_amount: string;
  type: string; // 'order_settlement' | 'deposit' | 'withdrawal'
  status: string;
  created_at: string;
}

export interface TransactionListOut {
  items: TransactionOut[];
  total: number;
  limit: number;
  offset: number;
}

export interface TransactionSummary {
  current_balance: string;
  total_deposited: string;
  total_withdrawn: string;
  total_earned: string;
  total_spent: string;
}

export interface DepositResult {
  transaction_id: string;
  amount: string;
  new_balance: string;
  card_last4: string;
}

export interface WithdrawResult {
  transaction_id: string;
  amount: string;
  new_balance: string;
  card_last4: string;
}
