import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const { theme } = useTheme();
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', // slate-900 or white
          borderBottomWidth: 1,
          borderBottomColor: theme === 'dark' ? '#1e293b' : '#f1f5f9', // slate-800 or slate-100
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme === 'dark' ? '#ffffff' : '#0f172a',
        },
        tabBarStyle: {
          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: theme === 'dark' ? '#1e293b' : '#f1f5f9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#10b981', // emerald-500
        tabBarInactiveTintColor: '#94a3b8', // slate-400
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerTitle: 'Dashboard Metrics',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="returns"
        options={{
          title: 'Returns',
          tabBarLabel: 'Returns',
          headerTitle: 'Product Returns Ledger',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'arrow-undo' : 'arrow-undo-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cash"
        options={{
          title: 'Cash',
          tabBarLabel: 'Cash',
          headerTitle: 'Cash Payments Ledger',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cash' : 'cash-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cheques"
        options={{
          title: 'Cheques',
          tabBarLabel: 'Cheques',
          headerTitle: 'Cheques Clearance Ledger',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'card' : 'card-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: 'Data Master',
          tabBarLabel: 'Data Master',
          headerTitle: 'Directories Master',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'server' : 'server-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
