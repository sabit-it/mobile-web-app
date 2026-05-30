import { apiClient } from './client';
import { TransactionListOut, TransactionSummary, DepositResult, WithdrawResult } from '../types';

export async function getMyTransactions(
  limit = 20,
  offset = 0,
  type?: string,
): Promise<TransactionListOut> {
  const response = await apiClient.get<TransactionListOut>('/transactions/my', {
    params: { limit, offset, ...(type ? { type } : {}) },
  });
  return response.data;
}

export async function getTransactionSummary(): Promise<TransactionSummary> {
  const response = await apiClient.get<TransactionSummary>('/transactions/summary');
  return response.data;
}

export interface DepositRequest {
  amount: number;
  card_number: string;
  card_holder: string;
  expiry_month: number;
  expiry_year: number;
  cvv: string;
}

export async function deposit(data: DepositRequest): Promise<DepositResult> {
  const response = await apiClient.post<DepositResult>('/transactions/deposit', data);
  return response.data;
}

export interface WithdrawRequest {
  amount: number;
  card_number: string;
  card_holder: string;
  expiry_month: number;
  expiry_year: number;
  cvv: string;
}

export async function withdraw(data: WithdrawRequest): Promise<WithdrawResult> {
  const response = await apiClient.post<WithdrawResult>('/transactions/withdraw', data);
  return response.data;
}
