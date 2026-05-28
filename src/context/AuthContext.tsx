import React, { createContext, useContext, useEffect, useReducer } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { getMe } from '../api/auth';
import { clearTokens, setLogoutCallback } from '../api/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  dispatch: React.Dispatch<AuthAction>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    setLogoutCallback(() => dispatch({ type: 'LOGOUT' }));

    async function bootstrap() {
      try {
        const accessToken = await SecureStore.getItemAsync('access_token');
        if (!accessToken) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
        const user = await getMe();
        dispatch({ type: 'LOGIN', payload: user });
      } catch {
        try {
          const refreshToken = await SecureStore.getItemAsync('refresh_token');
          if (refreshToken) {
            const user = await getMe();
            dispatch({ type: 'LOGIN', payload: user });
          } else {
            await clearTokens();
            dispatch({ type: 'LOGOUT' });
          }
        } catch {
          await clearTokens();
          dispatch({ type: 'LOGOUT' });
        }
      }
    }

    bootstrap();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
