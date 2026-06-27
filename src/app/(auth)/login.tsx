import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message || 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6 py-12">
            {/* Header Theme Switcher */}
            <View className="absolute top-4 right-6 z-10">
              <TouchableOpacity
                onPress={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-200 bg-opacity-50 dark:bg-slate-800 bg-opacity-50 border border-slate-300 border-opacity-30 dark:border-slate-700 border-opacity-30"
              >
                <Text className="text-slate-800 dark:text-white font-bold text-xs">
                  {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* App Branding */}
            <View className="items-center mb-8">
              <Image
                source={
                  theme === 'dark'
                    ? require('../../../assets/images/royal_logo_white.png')
                    : require('../../../assets/images/royal_logo_dark.png')
                }
                style={{ width: 220, height: 60, resizeMode: 'contain' }}
                className="mb-2"
              />
              <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold tracking-wider uppercase">
                Logistics & Management Directory
              </Text>
            </View>

            {/* Login Card */}
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200 dark:shadow-black">
              <Text className="text-lg font-bold text-slate-800 dark:text-white mb-6">
                Access System
              </Text>

              {error ? (
                <View className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl">
                  <Text className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  Email Address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@gmail.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                />
              </View>

              {/* Password Input */}
              <View className="mb-5">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                    Password
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/forgot')}>
                    <Text className="text-xs text-emerald-500 font-bold">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="relative justify-center">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="6 characters"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                    className="px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, padding: 4 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
                className="w-full bg-emerald-500 rounded-xl py-3.5 flex-row justify-center items-center shadow-lg shadow-emerald-500"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                ) : null}
                <Text className="text-white font-bold text-sm">Access System</Text>
              </TouchableOpacity>
            </View>

            {/* Registration Link */}
            <View className="items-center mt-6">
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text className="text-xs text-emerald-500 dark:text-emerald-400 font-bold">
                  Don't have an account? Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
