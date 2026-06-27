import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Switch,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import api from '../../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const BACKEND_URL = 'https://web-based-royal-pharmacy-system.onrender.com';

export default function ProfileScreen() {
  const { user, updateProfilePhoto, deleteProfilePhoto, logout, deleteAccount, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [photoUploading, setPhotoUploading] = useState(false);
  
  // Admin-only States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserTargetId, setEditUserTargetId] = useState<string | null>(null);

  // User form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'User'>('User');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Refresh self profile on mount
  useEffect(() => {
    const refreshProfile = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setUser({ ...user, ...data });
      } catch (err) {
        console.log('Failed to refresh profile:', err);
      }
    };
    refreshProfile();
  }, []);

  const fetchUsers = async () => {
    if (user?.role !== 'Admin') return;
    setAdminLoading(true);
    try {
      const { data } = await api.get('/auth/users');
      setUsersList(data);
    } catch (error) {
      const err = error as any;
      if (err?.response?.status !== 401) {
        console.error('Failed to load user directory:', error);
      } else {
        console.log('User directory fetch unauthorized (session expired)');
      }
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need library permissions to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      setPhotoUploading(true);
      try {
        // Resize and compress on device for instant upload and sync
        const manipulated = await ImageManipulator.manipulateAsync(
          selectedUri,
          [{ resize: { width: 150, height: 150 } }],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        await updateProfilePhoto(manipulated.uri);
        Alert.alert('Success', 'Profile photo updated successfully!');
      } catch (err: any) {
        console.error('Photo upload error:', err);
        Alert.alert('Error', err.response?.data?.message || 'Failed to upload photo');
      } finally {
        setPhotoUploading(false);
      }
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert('Remove Photo', 'Are you sure you want to delete your profile photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setPhotoUploading(true);
          try {
            await deleteProfilePhoto();
            Alert.alert('Success', 'Profile photo removed.');
          } catch (err) {
            Alert.alert('Error', 'Failed to remove profile photo.');
          } finally {
            setPhotoUploading(false);
          }
        },
      },
    ]);
  };

  const handleSelfDelete = () => {
    Alert.alert(
      'Delete My Account',
      'WARNING: This will permanently delete your account and all associated pharmacy return ledgers, cash payments, cheques, and custom master directories. This action cannot be undone.\n\nType DELETE to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Deletion',
              'Please type DELETE to confirm account deletion:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: async (text?: string) => {
                    if (text === 'DELETE') {
                      try {
                        const res = await deleteAccount();
                        if (res.success) {
                          Alert.alert('Success', 'Your account has been deleted.');
                        } else {
                          Alert.alert('Error', res.message);
                        }
                      } catch (err) {
                        Alert.alert('Error', 'Failed to delete account.');
                      }
                    } else {
                      Alert.alert('Error', 'Verification failed. Account was not deleted.');
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  };

  // User Admin Form Actions
  const handleOpenAddUser = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormAddress('');
    setFormRole('User');
    setIsEditingUser(false);
    setEditUserTargetId(null);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (target: any) => {
    setFormName(target.name || '');
    setFormEmail(target.email || '');
    setFormPassword(''); // Don't prefill password
    setFormPhone(target.phone || '');
    setFormAddress(target.address || '');
    setFormRole(target.role || 'User');
    setIsEditingUser(true);
    setEditUserTargetId(target._id);
    setShowUserModal(true);
  };

  const handleUserFormSubmit = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim() || !formAddress.trim()) {
      Alert.alert('Warning', 'Please fill in all details');
      return;
    }

    if (formPhone.trim().length !== 10) {
      Alert.alert('Warning', 'Contact phone must be exactly 10 digits');
      return;
    }

    if (!isEditingUser && (!formPassword || formPassword.length !== 6)) {
      Alert.alert('Warning', 'Password must be exactly 6 characters');
      return;
    }

    const payload: any = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      address: formAddress,
      role: formRole,
    };

    if (!isEditingUser && formPassword) {
      payload.password = formPassword;
    }

    setAdminLoading(true);
    try {
      if (isEditingUser && editUserTargetId) {
        await api.put(`/auth/users/${editUserTargetId}`, payload);
        Alert.alert('Success', 'User updated successfully');
      } else {
        await api.post('/auth/create-user', payload);
        Alert.alert('Success', 'User account created successfully');
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error processing request');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteUser = (target: any) => {
    if (target._id === user?._id) {
      Alert.alert('Warning', 'You cannot delete your own account from this panel. Use "Delete My Account" below.');
      return;
    }

    Alert.alert('Are you sure?', `Delete user "${target.name}"? This will delete all of their data.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setAdminLoading(true);
          try {
            await api.delete(`/auth/users/${target._id}`);
            Alert.alert('Success', 'User account deleted');
            fetchUsers();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete user');
            setAdminLoading(false);
          }
        },
      },
    ]);
  };

  // Avatar Image Source calculation
  const getAvatarSource = () => {
    if (user?.profilePhoto) {
      return { uri: user.profilePhoto.startsWith('data:') ? user.profilePhoto : `${BACKEND_URL}${user.profilePhoto}` };
    }
    return null;
  };

  const avatarSource = getAvatarSource();
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'RP';

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Card Header */}
        <View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-8 items-center">
          <View className="relative">
            <View className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-950 bg-opacity-30 border-2 border-emerald-500 overflow-hidden items-center justify-center shadow-md">
              {avatarSource ? (
                <Image source={avatarSource} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-emerald-500 dark:text-emerald-400 text-3xl font-extrabold">{initials}</Text>
              )}
              {photoUploading && (
                <View className="absolute inset-0 bg-black bg-opacity-40 items-center justify-center">
                  <ActivityIndicator size="small" color="#10b981" />
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={handlePickImage}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-500 items-center justify-center border border-white dark:border-slate-900"
            >
              <Ionicons name="camera" size={16} color="#ffffff" />
            </TouchableOpacity>

            {user?.profilePhoto ? (
              <TouchableOpacity
                onPress={handleRemovePhoto}
                className="absolute top-0 right-0 w-6 h-6 rounded-full bg-red-500 items-center justify-center border border-white dark:border-slate-900"
              >
                <Ionicons name="trash-outline" size={12} color="#ffffff" />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4">{user?.name}</Text>
          <View className="mt-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 bg-opacity-40 border border-emerald-100 dark:border-emerald-900 border-opacity-50 flex-row items-center gap-1">
            <Ionicons name="shield-checkmark" size={12} color="#10b981" />
            <Text className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">{user?.role || 'User'}</Text>
          </View>
        </View>

        {/* Account Details */}
        <View className="mt-6 mx-5 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <Text className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Account Information</Text>

          <View className="space-y-4">
            <View className="flex-row items-center pb-3">
              <Ionicons name="mail-outline" size={18} color="#94a3b8" className="mr-3" />
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Email Address</Text>
                <Text className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{user?.email}</Text>
              </View>
            </View>

            <View className="flex-row items-center pb-3">
              <Ionicons name="call-outline" size={18} color="#94a3b8" className="mr-3" />
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Phone Number</Text>
                <Text className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{user?.phone || 'Not provided'}</Text>
              </View>
            </View>

            <View className="flex-row items-start pb-1">
              <Ionicons name="location-outline" size={18} color="#94a3b8" className="mr-3 mt-1" />
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Residential Address</Text>
                <Text className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{user?.address || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Styling Preferences */}
        <View className="mt-6 mx-5 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="moon-outline" size={20} color="#10b981" className="mr-3" />
            <View>
              <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">Dark Mode theme</Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500">Toggle dark slate appearance</Text>
            </View>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#cbd5e1', true: '#059669' }}
            thumbColor={theme === 'dark' ? '#10b981' : '#f4f3f4'}
          />
        </View>

        {/* User Management Panel (Admin Only) */}
        {user?.role === 'Admin' && (
          <View className="mt-6 mx-5 p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={20} color="#10b981" className="mr-3" />
                <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">User Accounts Directory</Text>
              </View>
              <TouchableOpacity
                onPress={handleOpenAddUser}
                className="bg-emerald-50 dark:bg-emerald-950 bg-opacity-30 border border-emerald-100 dark:border-emerald-900 border-opacity-50 px-2.5 py-1.5 rounded-lg flex-row items-center gap-1"
              >
                <Ionicons name="person-add" size={12} color="#10b981" />
                <Text className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400">Add Account</Text>
              </TouchableOpacity>
            </View>

            {adminLoading && usersList.length === 0 ? (
              <ActivityIndicator size="small" color="#10b981" className="py-4" />
            ) : (
              <View className="space-y-3 mt-2">
                {usersList.map((item) => (
                  <View
                    key={item._id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 flex-row justify-between items-center"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.name}</Text>
                      <Text className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{item.email}</Text>
                      
                      <View className="flex-row items-center gap-2 mt-1.5">
                        <View className={`px-2 py-0.5 rounded-full border ${
                          item.role === 'Admin' 
                            ? 'bg-purple-50 dark:bg-purple-950 bg-opacity-30 border-purple-100 dark:border-purple-900 border-opacity-30' 
                            : 'bg-emerald-50 dark:bg-emerald-950 bg-opacity-30 border-emerald-100 dark:border-emerald-900 border-opacity-30'
                        }`}>
                          <Text className={`text-[8px] font-bold ${
                            item.role === 'Admin' ? 'text-purple-500' : 'text-emerald-500'
                          }`}>{item.role}</Text>
                        </View>
                        {item.phone && (
                          <Text className="text-[9px] text-slate-400 dark:text-slate-500">{item.phone}</Text>
                        )}
                      </View>
                    </View>

                    <View className="flex-row gap-1">
                      <TouchableOpacity
                        onPress={() => handleOpenEditUser(item)}
                        className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950 bg-opacity-30 border border-emerald-100 dark:border-emerald-900 border-opacity-30 items-center justify-center"
                      >
                        <Ionicons name="pencil" size={12} color="#10b981" />
                      </TouchableOpacity>
                      
                      {item._id !== user?._id && (
                        <TouchableOpacity
                          onPress={() => handleDeleteUser(item)}
                          className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-950 bg-opacity-30 border border-red-100 dark:border-red-900 border-opacity-30 items-center justify-center"
                        >
                          <Ionicons name="trash" size={12} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
                
                {usersList.length === 0 && (
                  <Text className="text-center text-xs text-slate-400 dark:text-slate-500 py-3">No other user accounts found</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Profile Settings Actions */}
        <View className="mt-8 mx-5">
          <Pressable
            onPress={logout}
            className="w-full py-4 rounded-2xl bg-slate-200 dark:bg-slate-800 active:bg-slate-350 flex-row items-center justify-center gap-2 border border-slate-300 dark:border-slate-700"
          >
            <Ionicons name="log-out-outline" size={18} color={theme === 'dark' ? '#ffffff' : '#0f172a'} />
            <Text className="text-sm font-bold text-slate-800 dark:text-white">Log Out Session</Text>
          </Pressable>

          <Pressable
            onPress={handleSelfDelete}
            className="w-full py-4 rounded-2xl bg-red-50 dark:bg-red-950 bg-opacity-20 active:bg-red-100 bg-opacity-50 flex-row items-center justify-center gap-2 border border-red-200 dark:border-red-900 border-opacity-50 mt-3"
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text className="text-sm font-bold text-red-500">Delete My Account</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* Admin User CRUD Modal Form */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="flex-1 justify-end bg-slate-950 bg-opacity-60">
            <View className="bg-white dark:bg-slate-900 rounded-t-[32px] border-t border-slate-100 dark:border-slate-800 p-6 max-h-[90%]">
              
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {isEditingUser ? 'Edit User details' : 'Add User Account'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowUserModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color={theme === 'dark' ? '#94a3b8' : '#475569'} />
                </TouchableOpacity>
              </View>

              {/* Modal Scroll Form */}
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="mb-6">
                <View className="space-y-4">
                  
                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Full Name</Text>
                    <TextInput
                      value={formName}
                      onChangeText={setFormName}
                      placeholder="Enter user name"
                      placeholderTextColor="#94a3b8"
                      className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                    />
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Email Address</Text>
                    <TextInput
                      value={formEmail}
                      onChangeText={setFormEmail}
                      placeholder="Enter email address"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                    />
                  </View>

                  {!isEditingUser && (
                    <View>
                      <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Password (Exactly 6 characters)</Text>
                      <TextInput
                        value={formPassword}
                        onChangeText={setFormPassword}
                        placeholder="Enter 6-char password"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={true}
                        autoCapitalize="none"
                        maxLength={6}
                        className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                      />
                    </View>
                  )}

                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Role Level</Text>
                    <View className="flex-row bg-slate-55 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                      <TouchableOpacity
                        onPress={() => setFormRole('User')}
                        className="flex-1 py-2.5 rounded-lg items-center"
                        style={formRole === 'User' ? {
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#1e293b' : '#f1f5f9',
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        } : {
                          backgroundColor: 'transparent',
                          borderColor: 'transparent',
                          borderWidth: 1,
                        }}
                      >
                        <Text className={`text-xs font-bold ${formRole === 'User' ? 'text-emerald-500' : 'text-slate-400'}`}>User</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => setFormRole('Admin')}
                        disabled={isEditingUser && editUserTargetId === user?._id} // Prevent self-role update
                        className={`flex-1 py-2.5 rounded-lg items-center ${isEditingUser && editUserTargetId === user?._id ? 'opacity-50' : ''}`}
                        style={formRole === 'Admin' ? {
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#1e293b' : '#f1f5f9',
                          borderWidth: 1,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        } : {
                          backgroundColor: 'transparent',
                          borderColor: 'transparent',
                          borderWidth: 1,
                        }}
                      >
                        <Text className={`text-xs font-bold ${formRole === 'Admin' ? 'text-purple-500' : 'text-slate-400'}`}>Admin</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Phone Number (Exactly 10 digits)</Text>
                    <TextInput
                      value={formPhone}
                      onChangeText={setFormPhone}
                      placeholder="Enter 10-digit number"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Home Address</Text>
                    <TextInput
                      value={formAddress}
                      onChangeText={setFormAddress}
                      placeholder="Enter physical address"
                      placeholderTextColor="#94a3b8"
                      multiline={true}
                      numberOfLines={3}
                      className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500 text-left min-h-[80px]"
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowUserModal(false)}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 items-center justify-center active:bg-slate-50 dark:active:bg-slate-850"
                >
                  <Text className="text-slate-600 dark:text-slate-400 text-sm font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleUserFormSubmit}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-500 active:bg-emerald-600 items-center justify-center"
                >
                  <Text className="text-white text-sm font-bold">Save Account</Text>
                </Pressable>
              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
