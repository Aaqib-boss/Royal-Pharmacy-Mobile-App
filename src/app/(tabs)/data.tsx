import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type DirectoryType = 'pharmacies' | 'products' | 'reasons';

export default function DataMasterScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DirectoryType>('pharmacies');
  
  // Data States
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reasons, setReasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Pharmacy Form States
  const [companyName, setCompanyName] = useState('');
  const [refName, setRefName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumbers, setContactNumbers] = useState<string[]>(['']);
  const [city, setCity] = useState('');

  // Product Form States
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');

  // Reason Form States
  const [reasonName, setReasonName] = useState('');

  const fetchData = async () => {
    try {
      const [pharmaciesRes, productsRes, reasonsRes] = await Promise.all([
        api.get('/pharmacies'),
        api.get('/products'),
        api.get('/reasons'),
      ]);
      setPharmacies(pharmaciesRes.data);
      setProducts(productsRes.data);
      setReasons(reasonsRes.data);
    } catch (error) {
      const err = error as any;
      if (err?.response?.status !== 401) {
        console.error('Error fetching directories data:', error);
        Alert.alert('Error', 'Failed to fetch directories data');
      } else {
        console.log('Directories fetch unauthorized (session expired)');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchData();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const resetForm = () => {
    // Pharmacy
    setCompanyName('');
    setRefName('');
    setAddress('');
    setContactNumbers(['']);
    setCity('');
    // Product
    setProductName('');
    setPrice('');
    // Reason
    setReasonName('');
    // Edit state
    setIsEditing(false);
    setEditId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: any) => {
    resetForm();
    setIsEditing(true);
    setEditId(item._id);

    if (activeTab === 'pharmacies') {
      setCompanyName(item.companyName || '');
      setRefName(item.refName || '');
      setAddress(item.address || '');
      const nums = item.contactNumber ? item.contactNumber.split(',').map((n: string) => n.trim()) : [''];
      if (item.contactNumber2) nums.push(item.contactNumber2);
      setContactNumbers(nums);
      setCity(item.city || '');
    } else if (activeTab === 'products') {
      setProductName(item.productName || '');
      setPrice(item.price ? item.price.toString() : '');
    } else if (activeTab === 'reasons') {
      setReasonName(item.reasonName || '');
    }

    setShowModal(true);
  };

  const handleFormSubmit = async () => {
    if (activeTab === 'pharmacies') {
      if (!companyName.trim() || !refName.trim() || !address.trim() || !city.trim()) {
        Alert.alert('Warning', 'All fields are required for a pharmacy');
        return;
      }
      const trimmedNums = contactNumbers.map(n => n.trim()).filter(Boolean);
      if (trimmedNums.length === 0) {
        Alert.alert('Warning', 'Please add at least one contact number');
        return;
      }
      for (const num of trimmedNums) {
        if (num.length !== 10) {
          Alert.alert('Warning', 'Each contact number must be exactly 10 digits');
          return;
        }
      }
      const payload = { companyName, refName, address, contactNumber: trimmedNums.join(', '), contactNumber2: undefined, city };
      try {
        setLoading(true);
        if (isEditing && editId) {
          await api.put(`/pharmacies/${editId}`, payload);
          Alert.alert('Success', 'Pharmacy updated successfully');
        } else {
          await api.post('/pharmacies', payload);
          Alert.alert('Success', 'Pharmacy added successfully');
        }
        setShowModal(false);
        resetForm();
        fetchData();
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Error saving pharmacy');
        setLoading(false);
      }
    } else if (activeTab === 'products') {
      if (!productName.trim() || !price.trim()) {
        Alert.alert('Warning', 'All fields are required for a product');
        return;
      }
      if (isNaN(Number(price)) || Number(price) <= 0) {
        Alert.alert('Warning', 'Please enter a valid positive price');
        return;
      }
      const payload = { productName, price: Number(price) };
      try {
        setLoading(true);
        if (isEditing && editId) {
          await api.put(`/products/${editId}`, payload);
          Alert.alert('Success', 'Product updated successfully');
        } else {
          await api.post('/products', payload);
          Alert.alert('Success', 'Product added successfully');
        }
        setShowModal(false);
        resetForm();
        fetchData();
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Error saving product');
        setLoading(false);
      }
    } else if (activeTab === 'reasons') {
      if (!reasonName.trim()) {
        Alert.alert('Warning', 'Reason name is required');
        return;
      }
      const payload = { reasonName };
      try {
        setLoading(true);
        if (isEditing && editId) {
          await api.put(`/reasons/${editId}`, payload);
          Alert.alert('Success', 'Reason updated successfully');
        } else {
          await api.post('/reasons', payload);
          Alert.alert('Success', 'Reason added successfully');
        }
        setShowModal(false);
        resetForm();
        fetchData();
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.message || 'Error saving reason');
        setLoading(false);
      }
    }
  };

  const handleDeleteItem = (item: any) => {
    const itemName =
      activeTab === 'pharmacies'
        ? item.companyName
        : activeTab === 'products'
        ? item.productName
        : item.reasonName;

    Alert.alert('Are you sure?', `Delete "${itemName}" from directories?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await api.delete(`/${activeTab}/${item._id}`);
            Alert.alert('Success', 'Item deleted successfully');
            fetchData();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete item');
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Client-side search logic
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase().trim();
    if (activeTab === 'pharmacies') {
      if (!query) return pharmacies;
      return pharmacies.filter(
        (p) =>
          (p.companyName || '').toLowerCase().includes(query) ||
          (p.refName || '').toLowerCase().includes(query) ||
          (p.city || '').toLowerCase().includes(query) ||
          (p.address || '').toLowerCase().includes(query)
      );
    } else if (activeTab === 'products') {
      if (!query) return products;
      return products.filter(
        (p) =>
          (p.productName || '').toLowerCase().includes(query) ||
          (p.price || '').toString().includes(query)
      );
    } else {
      if (!query) return reasons;
      return reasons.filter((r) => (r.reasonName || '').toLowerCase().includes(query));
    }
  };

  const filteredData = getFilteredData();

  const renderItem = ({ item }: { item: any }) => {
    const isDark = theme === 'dark';
    
    if (activeTab === 'pharmacies') {
      return (
        <View className="mb-4 mx-5 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-2">
              <Text className="text-base font-bold text-slate-800 dark:text-slate-100">
                {item.companyName}
              </Text>
              <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex-row items-center">
                <Ionicons name="location-sharp" size={12} color="#10b981" /> {item.city}
              </Text>
              
              <View className="mt-3 space-y-1">
                <View className="flex-row items-center">
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-24">Ref Name:</Text>
                  <Text className="text-xs text-slate-700 dark:text-slate-300">{item.refName}</Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-24 mt-0.5">Contact:</Text>
                  <View className="flex-1">
                    <Text className="text-xs text-slate-700 dark:text-slate-300">{item.contactNumber}</Text>
                    {item.contactNumber2 ? (
                      <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.contactNumber2}</Text>
                    ) : null}
                  </View>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-24 mt-0.5">Address:</Text>
                  <Text className="text-xs text-slate-700 dark:text-slate-300 flex-1">{item.address}</Text>
                </View>
              </View>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleOpenEditModal(item)}
                className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 bg-opacity-30 items-center justify-center border border-emerald-100 dark:border-emerald-900 border-opacity-50"
              >
                <Ionicons name="pencil" size={14} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteItem(item)}
                className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950 bg-opacity-30 items-center justify-center border border-red-100 dark:border-red-900 border-opacity-50"
              >
                <Ionicons name="trash" size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    if (activeTab === 'products') {
      return (
        <View className="mb-3 mx-5 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex-row justify-between items-center">
          <View className="flex-1 pr-2">
            <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {item.productName}
            </Text>
            <Text className="text-xs text-emerald-500 font-bold mt-1">
              RS {item.price ? item.price.toFixed(2) : '0.00'}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleOpenEditModal(item)}
              className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 bg-opacity-30 items-center justify-center border border-emerald-100 dark:border-emerald-900 border-opacity-50"
            >
              <Ionicons name="pencil" size={14} color="#10b981" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteItem(item)}
              className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950 bg-opacity-30 items-center justify-center border border-red-100 dark:border-red-900 border-opacity-50"
            >
              <Ionicons name="trash" size={14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Reasons
    return (
      <View className="mb-3 mx-5 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex-row justify-between items-center">
        <View className="flex-1 pr-2">
          <Text className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {item.reasonName}
          </Text>
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleOpenEditModal(item)}
            className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 bg-opacity-30 items-center justify-center border border-emerald-100 dark:border-emerald-900 border-opacity-50"
          >
            <Ionicons name="pencil" size={14} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteItem(item)}
            className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950 bg-opacity-30 items-center justify-center border border-red-100 dark:border-red-900 border-opacity-50"
          >
            <Ionicons name="trash" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Segmented Tab Buttons */}
      <View className="px-5 pt-3 pb-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <View className="flex-row bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => {
              setActiveTab('pharmacies');
              setSearchQuery('');
            }}
            className="flex-1 py-2.5 rounded-lg items-center"
            style={activeTab === 'pharmacies' ? {
              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            } : {
              backgroundColor: 'transparent',
            }}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'pharmacies'
                  ? 'text-emerald-500 dark:text-emerald-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              Pharmacies
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('products');
              setSearchQuery('');
            }}
            className="flex-1 py-2.5 rounded-lg items-center"
            style={activeTab === 'products' ? {
              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            } : {
              backgroundColor: 'transparent',
            }}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'products'
                  ? 'text-emerald-500 dark:text-emerald-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              Products
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('reasons');
              setSearchQuery('');
            }}
            className="flex-1 py-2.5 rounded-lg items-center"
            style={activeTab === 'reasons' ? {
              backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            } : {
              backgroundColor: 'transparent',
            }}
          >
            <Text
              className={`text-xs font-semibold ${
                activeTab === 'reasons'
                  ? 'text-emerald-500 dark:text-emerald-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              Reasons
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Header */}
      <View className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row gap-3 items-center">
        <View className="flex-1 flex-row items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <Ionicons name="search" size={16} color="#94a3b8" className="mr-2" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-800 dark:text-slate-100 text-xs py-0.5"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <Pressable
          onPress={handleOpenAddModal}
          className="bg-emerald-500 active:bg-emerald-600 px-4 py-2.5 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="add" size={16} color="#ffffff" className="mr-1" />
          <Text className="text-white text-xs font-bold">Add New</Text>
        </Pressable>
      </View>

      {/* Loading indicator */}
      {loading && filteredData.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10b981']} />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-12 px-6">
              <View className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full items-center justify-center mb-4">
                <Ionicons name="folder-open-outline" size={28} color="#94a3b8" />
              </View>
              <Text className="text-slate-500 dark:text-slate-400 text-sm font-semibold text-center">
                No entries found
              </Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs text-center mt-1">
                {searchQuery ? 'Try adjusting your search terms' : `Tap "Add New" to add a ${activeTab.slice(0, -1)}`}
              </Text>
            </View>
          }
        />
      )}

      {/* CRUD Modal Form */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1"
        >
          <View className="flex-1 justify-end bg-slate-950 bg-opacity-60">
            <View className="bg-white dark:bg-slate-900 rounded-t-[32px] border-t border-slate-100 dark:border-slate-800 p-6 max-h-[90%]">
              
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {isEditing ? 'Edit' : 'Add New'} {activeTab === 'pharmacies' ? 'Pharmacy' : activeTab === 'products' ? 'Product' : 'Reason'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color={theme === 'dark' ? '#94a3b8' : '#475569'} />
                </TouchableOpacity>
              </View>

              {/* Modal Inputs Scroll */}
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} className="mb-6">
                <View className="space-y-4">
                  {activeTab === 'pharmacies' && (
                    <>
                      <View>
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Company/Pharmacy Name</Text>
                        <TextInput
                          value={companyName}
                          onChangeText={setCompanyName}
                          placeholder="Enter company name"
                          placeholderTextColor="#94a3b8"
                          className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                        />
                      </View>

                      <View>
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Reference Name</Text>
                        <TextInput
                          value={refName}
                          onChangeText={setRefName}
                          placeholder="Enter ref name (e.g. Sales Rep / Owner)"
                          placeholderTextColor="#94a3b8"
                          className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                        />
                      </View>

                      <View className="space-y-3">
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">Contact Numbers</Text>
                        {contactNumbers.map((num, index) => (
                          <View key={index} className="flex-row items-center gap-2">
                            <TextInput
                              value={num}
                              onChangeText={(text) => {
                                const updated = [...contactNumbers];
                                updated[index] = text.replace(/\D/g, '').slice(0, 10);
                                setContactNumbers(updated);
                              }}
                              placeholder={`Contact Number ${index + 1}`}
                              placeholderTextColor="#94a3b8"
                              keyboardType="phone-pad"
                              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                            />
                            {index > 0 && (
                              <TouchableOpacity
                                onPress={() => setContactNumbers(contactNumbers.filter((_, i) => i !== index))}
                                className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950 bg-opacity-30 items-center justify-center border border-red-100 dark:border-red-900 border-opacity-50"
                              >
                                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                        <TouchableOpacity
                          onPress={() => setContactNumbers([...contactNumbers, ''])}
                          className="flex-row items-center gap-1 mt-1 animate-active"
                        >
                          <Ionicons name="add-circle-outline" size={16} color="#10b981" />
                          <Text className="text-xs font-bold text-emerald-500">Add Contact Number</Text>
                        </TouchableOpacity>
                      </View>

                      <View>
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">City</Text>
                        <TextInput
                          value={city}
                          onChangeText={setCity}
                          placeholder="Enter city"
                          placeholderTextColor="#94a3b8"
                          className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                        />
                      </View>

                      <View className="mb-4">
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Address</Text>
                        <TextInput
                          value={address}
                          onChangeText={setAddress}
                          placeholder="Enter street address"
                          placeholderTextColor="#94a3b8"
                          multiline={true}
                          numberOfLines={3}
                          className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500 text-left min-h-[80px]"
                        />
                      </View>
                    </>
                  )}

                  {activeTab === 'products' && (
                    <>
                      <View>
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Product Name</Text>
                        <TextInput
                          value={productName}
                          onChangeText={setProductName}
                          placeholder="Enter product brand/generic name"
                          placeholderTextColor="#94a3b8"
                          className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                        />
                      </View>

                      <View className="mb-4">
                        <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Product Price (RS)</Text>
                        <TextInput
                          value={price}
                          onChangeText={setPrice}
                          placeholder="Enter price (e.g. 150.00)"
                          placeholderTextColor="#94a3b8"
                          keyboardType="numeric"
                          className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                        />
                      </View>
                    </>
                  )}

                  {activeTab === 'reasons' && (
                    <View className="mb-4">
                      <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Reason Name</Text>
                      <TextInput
                        value={reasonName}
                        onChangeText={setReasonName}
                        placeholder="Enter return reason (e.g. Near Expiry)"
                        placeholderTextColor="#94a3b8"
                        className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                      />
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowModal(false)}
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 items-center justify-center active:bg-slate-50 dark:active:bg-slate-850"
                >
                  <Text className="text-slate-600 dark:text-slate-400 text-sm font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleFormSubmit}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-500 active:bg-emerald-600 items-center justify-center"
                >
                  <Text className="text-white text-sm font-bold">Save</Text>
                </Pressable>
              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
