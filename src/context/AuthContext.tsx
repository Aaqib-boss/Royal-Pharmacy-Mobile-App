import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../utils/api';

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (payload: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; message?: string }>;
  setUser: (user: any) => void;
  updateProfilePhoto: (photoUri: string) => Promise<any>;
  deleteProfilePhoto: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load session from storage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUserState(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  // Axios global response interceptor for 401 Unauthorized
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          console.log('Session expired. Redirecting to login...');
          await logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const setUser = async (newUser: any) => {
    try {
      setUserState(newUser);
      if (newUser) {
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
      } else {
        await AsyncStorage.removeItem('user');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.token);
      setUserState(data);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const register = async (payload: any) => {
    try {
      await api.post('/auth/register', payload);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.',
      };
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUserState(null);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const deleteAccount = async () => {
    try {
      const { data } = await api.delete('/auth/profile');
      await logout();
      return { success: true, message: data.message };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete account.',
      };
    }
  };

  const updateProfilePhoto = async (photoUri: string) => {
    const formData = new FormData();
    const uriParts = photoUri.split('/');
    const filename = uriParts[uriParts.length - 1];
    const fileType = filename.split('.').pop() || 'jpeg';

    formData.append('profilePhoto', {
      uri: photoUri,
      name: filename,
      type: `image/${fileType}`,
    } as any);

    const { data } = await api.put('/auth/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const updatedUser = { ...user, profilePhoto: data.profilePhoto };
    setUserState(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const deleteProfilePhoto = async () => {
    const { data } = await api.delete('/auth/profile/photo');
    const updatedUser = { ...user, profilePhoto: '' };
    setUserState(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        deleteAccount,
        setUser,
        updateProfilePhoto,
        deleteProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

