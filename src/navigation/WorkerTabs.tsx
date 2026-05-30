import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

import WorkerHomeScreen from '../screens/worker/WorkerHomeScreen';
import WorkerOrderDetailScreen from '../screens/worker/WorkerOrderDetailScreen';
import WorkerChatScreen from '../screens/worker/WorkerChatScreen';
import WorkerHistoryScreen from '../screens/worker/WorkerHistoryScreen';
import WorkerReviewsScreen from '../screens/worker/WorkerReviewsScreen';
import WorkerProfileScreen from '../screens/worker/WorkerProfileScreen';
import WorkerFinanceScreen from '../screens/worker/WorkerFinanceScreen';

export type WorkerHomeStackParamList = {
  WorkerHome: undefined;
  WorkerOrderDetail: { orderId: string };
  WorkerChat: { orderId: string };
};

export type WorkerHistoryStackParamList = {
  WorkerHistory: undefined;
  WorkerOrderDetail: { orderId: string };
};

export type WorkerReviewsStackParamList = {
  WorkerReviews: undefined;
};

export type WorkerFinanceStackParamList = {
  WorkerFinance: undefined;
};

export type WorkerProfileStackParamList = {
  WorkerProfile: undefined;
};

const HomeStack = createNativeStackNavigator<WorkerHomeStackParamList>();
const HistoryStack = createNativeStackNavigator<WorkerHistoryStackParamList>();
const ReviewsStack = createNativeStackNavigator<WorkerReviewsStackParamList>();
const FinanceStack = createNativeStackNavigator<WorkerFinanceStackParamList>();
const ProfileStack = createNativeStackNavigator<WorkerProfileStackParamList>();
const Tab = createBottomTabNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerTintColor: Colors.primary }}>
      <HomeStack.Screen name="WorkerHome" component={WorkerHomeScreen} options={{ title: 'Главная' }} />
      <HomeStack.Screen name="WorkerOrderDetail" component={WorkerOrderDetailScreen} options={{ title: 'Заказ' }} />
      <HomeStack.Screen name="WorkerChat" component={WorkerChatScreen} options={{ title: 'Чат' }} />
    </HomeStack.Navigator>
  );
}

function HistoryNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerTintColor: Colors.primary }}>
      <HistoryStack.Screen name="WorkerHistory" component={WorkerHistoryScreen} options={{ title: 'История' }} />
      <HistoryStack.Screen name="WorkerOrderDetail" component={WorkerOrderDetailScreen} options={{ title: 'Заказ' }} />
    </HistoryStack.Navigator>
  );
}

function ReviewsNavigator() {
  return (
    <ReviewsStack.Navigator screenOptions={{ headerTintColor: Colors.primary }}>
      <ReviewsStack.Screen name="WorkerReviews" component={WorkerReviewsScreen} options={{ title: 'Отзывы' }} />
    </ReviewsStack.Navigator>
  );
}

function FinanceNavigator() {
  return (
    <FinanceStack.Navigator screenOptions={{ headerTintColor: Colors.primary }}>
      <FinanceStack.Screen name="WorkerFinance" component={WorkerFinanceScreen} options={{ title: 'Финансы' }} />
    </FinanceStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerTintColor: Colors.primary }}>
      <ProfileStack.Screen name="WorkerProfile" component={WorkerProfileScreen} options={{ title: 'Профиль' }} />
    </ProfileStack.Navigator>
  );
}

export default function WorkerTabs(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { borderTopColor: Colors.border },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryNavigator}
        options={{
          title: 'История',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReviewsTab"
        component={ReviewsNavigator}
        options={{
          title: 'Отзывы',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="star-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkerFinanceTab"
        component={FinanceNavigator}
        options={{
          title: 'Финансы',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkerProfileTab"
        component={ProfileNavigator}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
