import { apiClient } from './client';
import { TransactionListOut } from '../types';

export async function getMyTransactions(
  limit = 20,
  offset = 0,
): Promise<TransactionListOut> {
  const response = await apiClient.get<TransactionListOut>('/transactions/my', {
    params: { limit, offset },
  });
  return response.data;
}
