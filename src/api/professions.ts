import { apiClient } from './client';
import { Profession } from '../types';

export async function listProfessions(): Promise<Profession[]> {
  const response = await apiClient.get<Profession[]>('/professions/');
  return response.data;
}
