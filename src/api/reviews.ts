import { apiClient } from './client';
import { ReviewOut } from '../types';

export async function createReview(data: {
  order_id: string;
  rating: number;
  text?: string;
}): Promise<ReviewOut> {
  const response = await apiClient.post<ReviewOut>('/reviews/', data);
  return response.data;
}

export async function getReceivedReviews(): Promise<ReviewOut[]> {
  const response = await apiClient.get<ReviewOut[]>('/reviews/received');
  return response.data;
}

export async function getGivenReviews(): Promise<ReviewOut[]> {
  const response = await apiClient.get<ReviewOut[]>('/reviews/given');
  return response.data;
}

export async function getOrderReviews(orderId: string): Promise<ReviewOut[]> {
  const response = await apiClient.get<ReviewOut[]>(`/reviews/by-order/${orderId}`);
  return response.data;
}

export async function getReviewsForUser(userId: string): Promise<ReviewOut[]> {
  const response = await apiClient.get<ReviewOut[]>(`/reviews/for-user/${userId}`);
  return response.data;
}
