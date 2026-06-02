import React from 'react';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import AuthStack from './AuthStack';
import EmployerTabs from './EmployerTabs';
import WorkerTabs from './WorkerTabs';
import AdminTabs from './AdminTabs';

export default function AppNavigator(): React.ReactElement {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (user?.is_admin) {
    return <AdminTabs />;
  }

  if (user?.role === 'employer') {
    return <EmployerTabs />;
  }

  return <WorkerTabs />;
}
