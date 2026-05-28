import { apiClient } from './client';
import { OrderCreateResult, OrderParticipantView, OrderStatus, OrderSummary } from '../types';

interface OrderCreateData {
  profession_id: number;
  title: string;
  description?: string;
  hours: number;
  hourly_rate: number;
  address: string;
  lat: number;
  lng: number;
  scheduled_at?: string;
}

export async function createOrder(data: OrderCreateData): Promise<OrderCreateResult> {
  const response = await apiClient.post<OrderCreateResult>('/orders/', data);
  return response.data;
}

export async function getMyOrders(status?: OrderStatus): Promise<OrderSummary[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const response = await apiClient.get<OrderSummary[]>('/orders/my', { params });
  return response.data;
}

export async function getOrder(orderId: string): Promise<OrderParticipantView> {
  const response = await apiClient.get<OrderParticipantView>(`/orders/${orderId}`);
  return response.data;
}

export async function completeOrder(orderId: string): Promise<OrderSummary> {
  const response = await apiClient.patch<OrderSummary>(`/orders/${orderId}/complete`);
  return response.data;
}

export async function cancelOrder(orderId: string): Promise<OrderSummary> {
  const response = await apiClient.patch<OrderSummary>(`/orders/${orderId}/cancel`);
  return response.data;
}

export async function repeatOrder(orderId: string): Promise<OrderCreateResult> {
  const response = await apiClient.post<OrderCreateResult>(`/orders/${orderId}/repeat`);
  return response.data;
}
