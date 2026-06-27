import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { theme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !phone || !address || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Contact number must be exactly 10 digits');
      return;
    }
    if (password.length !== 6) {
      setError('Password must be exactly 6 characters');
      return;
    }
    setError('');
    setLoading(true);

    const payload = {
      name: `${firstName} ${lastName}`,
      email,
      password,
      phone: phone.replace(/\D/g, ''),
      address,
    };

    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Account created successfully! Please login.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6 py-8">
            {/* Branding Header */}
            <View className="items-center mb-6">
              <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Create Account
              </Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                Join Royal Pharmacy Management System
              </Text>
            </View>

            {/* Registration Card */}
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200 dark:shadow-black">
              {error ? (
                <View className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl">
                  <Text className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</Text>
                </View>
              ) : null}

              {/* Names Input Grid */}
              <View className="flex-row mb-4 gap-3">
                <View className="flex-1">
                  <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                    First Name
                  </Text>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First"
                    placeholderTextColor="#94a3b8"
                    style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                    Last Name
                  </Text>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last"
                    placeholderTextColor="#94a3b8"
                    style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                    className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                  />
                </View>
              </View>

              {/* Email Address */}
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

              {/* Contact Number */}
              <View className="mb-4">
                <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  Contact Number
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 0774563201"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={10}
                  style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                />
              </View>

              {/* Address */}
              <View className="mb-4">
                <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  Address
                </Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="e.g. 123 Wellness Ave, NY"
                  placeholderTextColor="#94a3b8"
                  style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                />
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  Password
                </Text>
                <View className="relative justify-center">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Exactly 6 characters"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    maxLength={6}
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

              {/* Submit Register */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.9}
                className="w-full bg-emerald-500 rounded-xl py-3.5 flex-row justify-center items-center shadow-lg shadow-emerald-500"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                ) : null}
                <Text className="text-white font-bold text-sm">Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Back to Login */}
            <View className="items-center mt-6">
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text className="text-xs text-emerald-500 dark:text-emerald-400 font-bold">
                  Already have an account? Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
