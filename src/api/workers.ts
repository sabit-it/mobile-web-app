import { apiClient } from './client';
import { WorkerCatalogOut, WorkerProfileOut } from '../types';

interface ListWorkersParams {
  profession_id?: number;
  min_rating?: number;
  is_online?: boolean;
  limit?: number;
  offset?: number;
  lat?: number;
  lng?: number;
  max_distance_km?: number;
}

export async function listWorkers(params?: ListWorkersParams): Promise<WorkerCatalogOut> {
  const response = await apiClient.get<WorkerCatalogOut>('/workers/', { params });
  return response.data;
}

export async function getMyWorkerProfile(): Promise<WorkerProfileOut> {
  const response = await apiClient.get<WorkerProfileOut>('/workers/me/profile');
  return response.data;
}

export async function upsertWorkerProfile(data: {
  profession_id: number;
  about?: string;
  max_distance_km?: number;
}): Promise<WorkerProfileOut> {
  const response = await apiClient.put<WorkerProfileOut>('/workers/me/profile', data);
  return response.data;
}

export async function setLineStatus(isOnline: boolean): Promise<WorkerProfileOut> {
  const response = await apiClient.patch<WorkerProfileOut>('/workers/me/line', {
    is_online: isOnline,
  });
  return response.data;
}
