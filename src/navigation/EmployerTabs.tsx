import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

import OrderListScreen from '../screens/employer/OrderListScreen';
import CreateOrderScreen from '../screens/employer/CreateOrderScreen';
import OrderDetailScreen from '../screens/employer/OrderDetailScreen';
import WorkerCatalogScreen from '../screens/employer/WorkerCatalogScreen';
import WorkerDetailScreen from '../screens/employer/WorkerDetailScreen';
import ChatScreen from '../screens/employer/ChatScreen';
import TransactionsScreen from '../screens/employer/TransactionsScreen';
import ProfileScreen from '../screens/employer/ProfileScreen';

export type EmployerOrdersStackParamList = {
  OrderList: undefined;
  CreateOrder: undefined;
  OrderDetail: { orderId: string };
  Chat: { orderId: string };
  WorkerDetail: { workerId: string };
};

export type EmployerCatalogStackParamList = {
  WorkerCatalog: undefined;
  WorkerDetail: { workerId: string };
};

export type EmployerFinancesStackParamList = {
  Transactions: undefined;
};

export type EmployerProfileStackParamList = {
  Profile: undefined;
};

const OrdersStack = createNativeStackNavigator<EmployerOrdersStackParamList>();
const CatalogStack = createNativeStackNavigator<EmployerCatalogStackParamList>();
const FinancesStack = createNativeStackNavigator<EmployerFinancesStackParamList>();
const ProfileStack = createNativeStackNavigator<EmployerProfileStackParamList>();
const Tab = createBottomTabNavigator();

function OrdersNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerTintColor: Colors.primary }}>
      <OrdersStack.Screen name="OrderList" component={OrderListScreen} options={{ title: 'Мои заказы' }} />
      <OrdersStack.Screen name="CreateOrder" component={CreateOrderScreen} options={{ title: 'Новый заказ' }} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Заказ' }} />
      <OrdersStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Чат' }} />
      <OrdersStack.Screen name="WorkerDetail" component={WorkerDetailScreen} options={{ title: 'Профиль мастера' }} />
    </OrdersStack.Navigator>
  );
}

function CatalogNavigator() {
  return (
    <CatalogStack.Navigator screenOptions={{ headerTintColor: Colors.primary }}>
      <CatalogStack.Screen name="WorkerCatalog" component={WorkerCatalogScreen} options={{ title: 'Каталог мастеров' }} />
      <CatalogStack.Screen name="WorkerDetail" component={WorkerDetailScreen} options={{ title: 'Профиль мастера' }} />
    </CatalogStack.Navigator>
  );
}

function FinancesNavigator() {
  return (
    <FinancesStack.Navigator screenOptions={{ headerTintColor: Colors.primary }}>
      <FinancesStack.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Финансы' }} />
    </FinancesStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerTintColor: Colors.primary }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
    </ProfileStack.Navigator>
  );
}

export default function EmployerTabs(): React.ReactElement {
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
        name="OrdersTab"
        component={OrdersNavigator}
        options={{
          title: 'Заказы',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CatalogTab"
        component={CatalogNavigator}
        options={{
          title: 'Каталог',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FinancesTab"
        component={FinancesNavigator}
        options={{
          title: 'Финансы',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
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
