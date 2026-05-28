import { apiClient } from './client';
import { MessageListOut, MessageOut } from '../types';

export async function sendMessage(orderId: string, text: string): Promise<MessageOut> {
  const response = await apiClient.post<MessageOut>(`/messages/${orderId}`, { text });
  return response.data;
}

export async function getMessages(
  orderId: string,
  limit = 50,
  before?: string,
): Promise<MessageListOut> {
  const params: Record<string, string | number> = { limit };
  if (before) params.before = before;
  const response = await apiClient.get<MessageListOut>(`/messages/${orderId}`, { params });
  return response.data;
}
