import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../utils/api';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRequestOtp = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      Alert.alert('OTP Sent', data.message || 'OTP verification code sent to your registered email address!');
      setIsOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send recovery details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (otp.length !== 6) {
      setError('OTP verification code must be exactly 6 digits');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length !== 6) {
      setError('Password must be exactly 6 characters');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email,
        otp,
        password: newPassword,
      });
      Alert.alert('Success', data.message || 'Password reset successfully! Please login.', [
        {
          text: 'OK',
          onPress: () => {
            setIsOtpSent(false);
            setEmail('');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
            router.replace('/(auth)/login');
          },
        },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. OTP may be invalid or expired.');
    } finally {
      setLoading(false);
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
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isOtpSent ? 'Reset Password' : 'Forgot Password?'}
              </Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium text-center">
                {isOtpSent
                  ? 'Enter the 6-digit OTP code sent to your email'
                  : 'Get a password recovery link and OTP code in your inbox'}
              </Text>
            </View>

            {/* Form Box */}
            <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200 dark:shadow-black">
              {error ? (
                <View className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl">
                  <Text className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</Text>
                </View>
              ) : null}

              {!isOtpSent ? (
                /* Step 1: Request OTP */
                <>
                  <View className="mb-6">
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

                  <TouchableOpacity
                    onPress={handleRequestOtp}
                    disabled={loading}
                    activeOpacity={0.9}
                    className="w-full bg-emerald-500 rounded-xl py-3.5 flex-row justify-center items-center shadow-lg shadow-emerald-500"
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                    ) : null}
                    <Text className="text-white font-bold text-sm">Send Recovery Details</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* Step 2: Verification and Password reset */
                <>
                  {/* OTP Code */}
                  <View className="mb-4">
                    <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                      OTP Code
                    </Text>
                    <TextInput
                      value={otp}
                      onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      maxLength={6}
                      style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                      className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                    />
                  </View>

                   {/* New Password */}
                  <View className="mb-4">
                    <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                      New Password
                    </Text>
                    <View className="relative justify-center">
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Exactly 6 characters"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showNewPassword}
                        maxLength={6}
                        autoCapitalize="none"
                        style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                        className="px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: 12, padding: 4 }}
                      >
                        <Ionicons
                          name={showNewPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="#94a3b8"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm Password */}
                  <View className="mb-6">
                    <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                      Confirm Password
                    </Text>
                    <View className="relative justify-center">
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm 6 characters"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showConfirmPassword}
                        maxLength={6}
                        autoCapitalize="none"
                        style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                        className="px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: 12, padding: 4 }}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="#94a3b8"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleResetPassword}
                    disabled={loading}
                    activeOpacity={0.9}
                    className="w-full bg-emerald-500 rounded-xl py-3.5 flex-row justify-center items-center shadow-lg shadow-emerald-500"
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                    ) : null}
                    <Text className="text-white font-bold text-sm">Reset Password</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Back to Login */}
            <View className="items-center mt-6">
              <TouchableOpacity
                onPress={() => {
                  setIsOtpSent(false);
                  setEmail('');
                  setOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                  router.replace('/(auth)/login');
                }}
              >
                <Text className="text-xs text-emerald-500 dark:text-emerald-400 font-bold">
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
