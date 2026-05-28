import { apiClient } from './client';
import { TokenResponse, User } from '../types';

interface RegisterData {
  email: string;
  password: string;
  last_name: string;
  first_name: string;
  patronymic?: string;
  role: 'employer' | 'worker';
  phone?: string;
}

interface RegisterResponse extends TokenResponse {
  user: User;
}

export async function register(data: RegisterData): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data);
  return response.data;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/auth/login', { email, password });
  return response.data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const response = await apiClient.post<TokenResponse>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}

export async function updateProfile(data: Partial<{
  first_name: string;
  last_name: string;
  patronymic: string | null;
  phone: string | null;
  photo_url: string | null;
}>): Promise<User> {
  const response = await apiClient.patch<User>('/auth/me', data);
  return response.data;
}

export async function updateEmail(newEmail: string, currentPassword: string): Promise<User> {
  const response = await apiClient.patch<User>('/auth/me/email', {
    new_email: newEmail,
    current_password: currentPassword,
  });
  return response.data;
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiClient.patch('/auth/me/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

export async function updateLocation(lat: number, lng: number): Promise<User> {
  const response = await apiClient.patch<User>('/auth/me/location', { lat, lng });
  return response.data;
}
