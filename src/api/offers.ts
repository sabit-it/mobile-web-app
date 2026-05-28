import { apiClient } from './client';
import { OrderSummary, PendingOfferForWorker } from '../types';

interface RespondResult {
  order: OrderSummary;
}

export async function respondToOffer(
  offerId: string,
  accept: boolean,
): Promise<RespondResult> {
  const response = await apiClient.post<RespondResult>(
    `/orders/offers/${offerId}/respond`,
    { accept },
  );
  return response.data;
}

export async function getPendingOffers(): Promise<PendingOfferForWorker[]> {
  const response = await apiClient.get<PendingOfferForWorker[]>('/orders/pending-offers');
  return response.data;
}
