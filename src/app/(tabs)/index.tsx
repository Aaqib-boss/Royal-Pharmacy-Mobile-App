import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    cashTotal: 0,
    chequeTotal: 0,
    returnsCount: 0,
  });

  const fetchDashboardData = async () => {
    try {
      const [cashRes, chequesRes, returnsRes] = await Promise.all([
        api.get('/cash'),
        api.get('/cheques'),
        api.get('/returns'),
      ]);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const cashSum = cashRes.data
        .filter((item: any) => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
        })
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      const chequeSum = chequesRes.data
        .filter((item: any) => {
          const itemDate = new Date(item.date);
          return itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
        })
        .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

      setMetrics({
        cashTotal: cashSum,
        chequeTotal: chequeSum,
        returnsCount: returnsRes.data.length,
      });
    } catch (error) {
      const err = error as any;
      if (err?.response?.status !== 401) {
        console.error('Error fetching dashboard data:', error);
      } else {
        console.log('Dashboard fetch unauthorized (session expired)');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchDashboardData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      <View className="p-5 pb-24">
        {/* Welcome Block */}
        <View className="mb-6">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
            Welcome back,
          </Text>
          <Text className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">
            {user?.name || 'Staff Member'}
          </Text>
        </View>

        {/* Financial Cards Grid */}
        <View className="flex-row gap-4 mb-6">
          {/* Cash Metrics Card */}
          <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-lg shadow-slate-200 dark:shadow-black">
            <View className="w-10 h-10 rounded-2xl bg-emerald-500 bg-opacity-10 items-center justify-center mb-3">
              <Ionicons name="cash" size={20} color="#10b981" />
            </View>
            <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold">
              Cash (This Month)
            </Text>
            <Text className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
              RS {metrics.cashTotal.toFixed(2)}
            </Text>
          </View>

          {/* Cheque Metrics Card */}
          <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-lg shadow-slate-200 dark:shadow-black">
            <View className="w-10 h-10 rounded-2xl bg-teal-500 bg-opacity-10 items-center justify-center mb-3">
              <Ionicons name="card" size={20} color="#14b8a6" />
            </View>
            <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold">
              Cheques (This Month)
            </Text>
            <Text className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
              RS {metrics.chequeTotal.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Returns Count Banner */}
        <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-lg shadow-slate-200 dark:shadow-black mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl bg-amber-500 bg-opacity-10 items-center justify-center mr-4">
              <Ionicons name="arrow-undo" size={20} color="#f59e0b" />
            </View>
            <View>
              <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold">
                Logged Returns
              </Text>
              <Text className="text-slate-900 dark:text-white font-extrabold text-lg mt-0.5">
                {metrics.returnsCount.toString().padStart(2, '0')} Invoices
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/returns')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
          >
            <Ionicons name="chevron-forward" size={16} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions Title */}
        <Text className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Quick Operations
        </Text>

        {/* Quick Action Buttons Grid */}
        <View className="space-y-3" style={{ gap: 12 }}>
          {/* Quick Returns */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/returns')}
            className="flex-row items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
          >
            <View className="flex-row items-center">
              <Ionicons name="arrow-undo-outline" size={18} color="#10b981" className="mr-3" />
              <Text className="text-slate-800 dark:text-white font-bold text-sm">
                Log Product Return
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>

          {/* Quick Cash */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cash')}
            className="flex-row items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
          >
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={18} color="#10b981" className="mr-3" />
              <Text className="text-slate-800 dark:text-white font-bold text-sm">
                Log Cash Collection
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>

          {/* Quick Cheque */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cheques')}
            className="flex-row items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm"
          >
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={18} color="#10b981" className="mr-3" />
              <Text className="text-slate-800 dark:text-white font-bold text-sm">
                Log Cheque Claim
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
