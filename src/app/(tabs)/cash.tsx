import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, FlatList, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { LOGO_BASE64 } from '../../utils/logoBase64';
import { AutoComplete } from '../../components/AutoComplete';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export default function CashScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [cashEntries, setCashEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [pharmaciesList, setPharmaciesList] = useState<any[]>([]);
  const [selectedPharmacyFilter, setSelectedPharmacyFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyId, setPharmacyId] = useState('');
  const [city, setCity] = useState('');
  const [amount, setAmount] = useState('');

  const getSelectedPharmacyName = () => {
    if (selectedPharmacyFilter === 'all') return 'All Companies';
    const found = pharmaciesList.find((p) => p._id === selectedPharmacyFilter);
    return found ? `${found.companyName} (${found.city})` : 'Specific Company';
  };

  const getSelectedDateFilterName = () => {
    switch (selectedDateFilter) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      case 'custom':
        return 'Custom Range';
      case 'all':
      default:
        return 'All Time';
    }
  };

  const generateHTML = () => {
    const reportTitle = 'Cash Payments Collection';
    const userName = user?.name || 'User';
    const generatedAt = new Date().toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const headersHTML = `
      <th>Date</th>
      <th>Invoice No</th>
      <th>Pharmacy & City</th>
      <th>Amount Received</th>
    `;

    const rowsHTML = filteredCash.map((item) => {
      const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const pharmacyDetails = `${item.pharmacyId?.companyName || 'Unknown Pharmacy'}<br/><span style="font-size: 9px; color: #64748b;">(${item.city || ''})</span>`;
      const amountVal = `RS ${parseFloat(item.amount || '0').toFixed(2)}`;

      return `
        <tr>
          <td>${formattedDate}</td>
          <td><span class="invoice-badge">${item.invoiceNumber}</span></td>
          <td>${pharmacyDetails}</td>
          <td style="color: #10b981; font-weight: bold;">${amountVal}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
          .logo-container { display: flex; align-items: center; }
          .company-details { font-size: 9px; color: #64748b; line-height: 1.4; text-align: right; }
          .company-title { font-size: 12px; font-weight: bold; color: #1e3a8a; margin: 0 0 3px 0; }
          .report-title { font-size: 14px; font-weight: bold; color: #10b981; margin: 0 0 6px 0; }
          .meta-line { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 10px; color: #475569; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
          th { border: 1px solid #cbd5e1; background-color: #10b981; color: white; text-align: center; padding: 8px; font-weight: bold; }
          td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; vertical-align: middle; }
          .invoice-badge { font-family: monospace; background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <img src="${LOGO_BASE64}" style="width: 140px; height: 40px; object-fit: contain; display: block;" />
          </div>
          <div class="company-details">
            <div class="company-title">Royal Pharmacy Lanka (Pvt) limited</div>
            NO 47/3 A, PRISON CAMP ROAD, NEGOMBO.<br/>
            TP: +94312232313, +94704848383<br/>
            e-Mail: royalpharmangm@gmail.com
          </div>
        </div>

        <div style="border-top: 3px solid #10b981; border-bottom: 1px solid #cbd5e1; height: 2px; margin-bottom: 15px;"></div>

        <div class="report-title">${reportTitle} Report</div>

        <div class="meta-line">
          <div><strong>Delivery Assistance:</strong> ${userName}</div>
          <div>Generated: ${generatedAt}</div>
        </div>

        <table>
          <colgroup>
            <col style="width: 18%;" />
            <col style="width: 18%;" />
            <col style="width: 42%;" />
            <col style="width: 22%;" />
          </colgroup>
          <thead>
            <tr>
              ${headersHTML}
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const exportToPDF = async () => {
    if (isExporting) return;
    if (filteredCash.length === 0) {
      Alert.alert('Info', 'No records to export');
      return;
    }
    setIsExporting(true);
    const html = generateHTML();
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share PDF Report',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const printReport = async () => {
    if (isExporting) return;
    if (filteredCash.length === 0) {
      Alert.alert('Info', 'No records to print');
      return;
    }
    setIsExporting(true);
    const html = generateHTML();
    try {
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert('Error', 'Failed to print');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (isExporting) return;
    if (filteredCash.length === 0) {
      Alert.alert('Info', 'No records to export');
      return;
    }
    setIsExporting(true);

    let metadataRows = '';
    if (selectedPharmacyFilter !== 'all' || selectedDateFilter !== 'all') {
      let companyNameLabel = '';
      let companyNameVal = '';
      let cityLabel = '';
      let cityVal = '';
      if (selectedPharmacyFilter !== 'all') {
        const found = pharmaciesList.find((p) => p._id === selectedPharmacyFilter);
        companyNameLabel = 'Company Name:';
        companyNameVal = found ? found.companyName : '';
        cityLabel = 'City:';
        cityVal = found ? found.city : '';
      }
      let dateRangeStr = 'All Time';
      if (selectedDateFilter === 'week') dateRangeStr = 'Last 7 Days';
      else if (selectedDateFilter === 'month') dateRangeStr = 'Last 30 Days';
      else if (selectedDateFilter === 'year') dateRangeStr = 'Last 365 Days';
      else if (selectedDateFilter === 'custom') {
        const startStr = startDate ? startDate : 'Beginning';
        const endStr = endDate ? endDate : 'Present';
        dateRangeStr = `${startStr} to ${endStr}`;
      }

      metadataRows = `\"${companyNameLabel}\",\"${companyNameVal}\",\"${cityLabel}\",\"${cityVal}\",\"Filter Period: ${dateRangeStr}\"\n\n`;
    }

    const csvHeaders = ['Date', 'Invoice No', 'Pharmacy Name', 'City', 'Amount Received'];
    const tableHeaders = csvHeaders.map(h => `\"${h}\"`).join(',');

    const tableRows = filteredCash.map((item) => {
      const dateStr = new Date(item.date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const invoice = item.invoiceNumber;
      const pharmacy = item.pharmacyId?.companyName || 'Unknown Pharmacy';
      const cityVal = item.city;
      const amountVal = item.amount;

      return [dateStr, invoice, pharmacy, cityVal, amountVal]
        .map(val => `\"${(val || '').toString().replace(/\"/g, '\"\"')}\"`)
        .join(',');
    }).join('\n');

    const csvContent = metadataRows + tableHeaders + '\n' + tableRows;
    const filename = `cash_report_${Date.now()}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    try {
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export to Excel (CSV)',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export CSV file');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchData = async () => {
    try {
      const [cashRes, pharmaciesRes] = await Promise.all([
        api.get('/cash'),
        api.get('/pharmacies'),
      ]);
      setCashEntries(cashRes.data);
      setPharmaciesList(pharmaciesRes.data);
    } catch (error) {
      const err = error as any;
      if (err?.response?.status !== 401) {
        console.error('Error fetching cash payments data:', error);
      } else {
        console.log('Cash payments fetch unauthorized (session expired)');
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

  const handlePharmacySelect = (pharmacy: any) => {
    setPharmacyId(pharmacy._id);
    setPharmacyName(pharmacy.companyName);
    setCity(pharmacy.city);
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setInvoiceNumber('');
    setPharmacyName('');
    setPharmacyId('');
    setCity('');
    setAmount('');
    setIsEditing(false);
    setEditId(null);
  };

  const handleFormSubmit = async () => {
    if (!invoiceNumber) {
      Alert.alert('Warning', 'Invoice Number is required');
      return;
    }
    const isExistingPharma = /^[0-9a-fA-F]{24}$/.test(pharmacyId);
    if (!isExistingPharma && !pharmacyName.trim()) {
      Alert.alert('Warning', 'Pharmacy Name is required');
      return;
    }
    if (!isExistingPharma && !city.trim()) {
      Alert.alert('Warning', 'City is required for new pharmacy');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Warning', 'Please enter a valid positive amount');
      return;
    }

    const payload = {
      date,
      invoiceNumber,
      pharmacyId: pharmacyId || pharmacyName,
      city,
      amount: Number(amount),
    };

    setLoading(true);
    try {
      if (isEditing && editId) {
        await api.put(`/cash/${editId}`, payload);
        Alert.alert('Success', 'Cash payment updated successfully!');
      } else {
        await api.post('/cash', payload);
        Alert.alert('Success', 'Cash payment logged successfully!');
      }
      setShowFormModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error saving cash payment');
      setLoading(false);
    }
  };

  const handleEditClick = (record: any) => {
    setIsEditing(true);
    setEditId(record._id);
    setDate(new Date(record.date).toISOString().split('T')[0]);
    setInvoiceNumber(record.invoiceNumber);
    setPharmacyId(record.pharmacyId?._id || '');
    setPharmacyName(record.pharmacyId?.companyName || '');
    setCity(record.city);
    setAmount(record.amount.toString());
    setShowFormModal(true);
  };

  const handleDeleteClick = (record: any) => {
    Alert.alert('Are you sure?', `Delete cash payment entry for invoice ${record.invoiceNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await api.delete(`/cash/${record._id}`);
            Alert.alert('Success', 'Cash entry deleted');
            fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to remove cash entry');
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Client side query filtering
  const filteredCash = cashEntries.filter((item) => {
    // 1. Company Filter
    if (selectedPharmacyFilter !== 'all' && item.pharmacyId?._id !== selectedPharmacyFilter) {
      return false;
    }

    // 2. Date Filter
    if (selectedDateFilter !== 'all') {
      const recordTime = new Date(item.date).getTime();
      const now = Date.now();
      let limitMs = 0;
      if (selectedDateFilter === 'week') {
        limitMs = 7 * 24 * 60 * 60 * 1000;
        if (now - recordTime > limitMs) return false;
      } else if (selectedDateFilter === 'month') {
        limitMs = 30 * 24 * 60 * 60 * 1000;
        if (now - recordTime > limitMs) return false;
      } else if (selectedDateFilter === 'year') {
        limitMs = 365 * 24 * 60 * 60 * 1000;
        if (now - recordTime > limitMs) return false;
      } else if (selectedDateFilter === 'custom') {
        const itemDateStr = new Date(item.date).toISOString().split('T')[0];
        if (startDate && itemDateStr < startDate) return false;
        if (endDate && itemDateStr > endDate) return false;
      }
    }

    // 3. Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const invoiceNo = (item.invoiceNumber || '').toLowerCase();
      const pName = (item.pharmacyId?.companyName || '').toLowerCase();
      const pCity = (item.city || '').toLowerCase();
      const pAmount = (item.amount || '').toString();

      return (
        invoiceNo.includes(query) ||
        pName.includes(query) ||
        pCity.includes(query) ||
        pAmount.includes(query)
      );
    }

    return true;
  });

  if (loading && cashEntries.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-950">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Search Header */}
      <View className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row gap-3 items-center">
        <View className="flex-1 flex-row items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <Ionicons name="search" size={16} color="#94a3b8" className="mr-2" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cash entries..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-800 dark:text-slate-100 text-xs py-0.5"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Dropdown Filters Row */}
      <View className="px-5 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row gap-3">
        <TouchableOpacity
          onPress={() => setShowFilterModal(true)}
          style={{ height: 38 }}
          className="flex-1 flex-row justify-between items-center bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 px-3 rounded-xl"
        >
          <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold truncate pr-2" numberOfLines={1}>
            {getSelectedPharmacyName()}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowDateFilterModal(true)}
          style={{ height: 38 }}
          className="flex-1 flex-row justify-between items-center bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 px-3 rounded-xl"
        >
          <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold truncate pr-2" numberOfLines={1}>
            {getSelectedDateFilterName()}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Custom Date Range Picker Inputs */}
      {selectedDateFilter === 'custom' ? (
        <View className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row gap-3 items-center">
          <View className="flex-1 flex-row items-center bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mr-2 uppercase">Start:</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              className="flex-1 text-slate-800 dark:text-slate-100 text-xs py-0.5"
            />
          </View>
          <View className="flex-1 flex-row items-center bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mr-2 uppercase">End:</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
              className="flex-1 text-slate-800 dark:text-slate-100 text-xs py-0.5"
            />
          </View>
        </View>
      ) : null}

      {/* Export Toolbar */}
      <View className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row justify-between items-center">
        <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
          {filteredCash.length} records found
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            disabled={isExporting}
            onPress={exportToPDF}
            style={{ opacity: isExporting ? 0.5 : 1 }}
            className="flex-row items-center gap-1.5 bg-red-500 px-3 py-1.5 rounded-lg active:scale-95"
          >
            <Ionicons name="document-text-outline" size={12} color="#ffffff" />
            <Text className="text-[10px] font-bold text-white">PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isExporting}
            onPress={printReport}
            style={{ opacity: isExporting ? 0.5 : 1 }}
            className="flex-row items-center gap-1.5 bg-blue-500 px-3 py-1.5 rounded-lg active:scale-95"
          >
            <Ionicons name="print-outline" size={12} color="#ffffff" />
            <Text className="text-[10px] font-bold text-white">Print</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isExporting}
            onPress={exportToExcel}
            style={{ opacity: isExporting ? 0.5 : 1 }}
            className="flex-row items-center gap-1.5 bg-emerald-500 px-3 py-1.5 rounded-lg active:scale-95"
          >
            <Ionicons name="grid-outline" size={12} color="#ffffff" />
            <Text className="text-[10px] font-bold text-white">Excel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredCash}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-slate-400 dark:text-slate-500 italic text-sm">
              No cash payments logged.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                {new Date(item.date).toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
              <View className="bg-emerald-500 bg-opacity-10 px-2 py-0.5 rounded-md border border-emerald-500 border-opacity-20">
                <Text className="text-[10px] font-mono font-bold text-emerald-500">
                  {item.invoiceNumber}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1 pr-3">
                <Text className="text-slate-800 dark:text-white font-extrabold text-sm truncate">
                  {item.pharmacyId?.companyName || 'Unknown Pharmacy'}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 bg-opacity-50 mr-1.5" />
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                    {item.city}
                  </Text>
                </View>
              </View>
              <Text className="font-extrabold text-slate-900 dark:text-white text-base">
                RS {item.amount.toFixed(2)}
              </Text>
            </View>

            {/* Actions Panel */}
            <View className="flex-row justify-end gap-3 border-t border-slate-50 dark:border-slate-800 pt-3">
              <TouchableOpacity
                onPress={() => handleEditClick(item)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 flex-row items-center gap-1 active:scale-95"
              >
                <Ionicons name="create" size={14} color="#ffffff" />
                <Text className="text-white font-bold text-xs">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteClick(item)}
                className="px-3.5 py-2 rounded-xl bg-red-500 flex-row items-center gap-1 active:scale-95"
              >
                <Ionicons name="trash" size={14} color="#ffffff" />
                <Text className="text-white font-bold text-xs">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Floating Add Button */}
      <Pressable
        onPress={() => {
          resetForm();
          setShowFormModal(true);
        }}
        className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-500 rounded-full justify-center items-center shadow-lg shadow-emerald-500 active:scale-95"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </Pressable>

      {/* 1. FILTER SELECTION MODAL */}
      <Modal
        visible={showFilterModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50 p-6">
          <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl">
            <Text className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Filter by Pharmacy
            </Text>
            <ScrollView className="max-h-60 mb-6">
              <TouchableOpacity
                onPress={() => {
                  setSelectedPharmacyFilter('all');
                  setShowFilterModal(false);
                }}
                className={`py-3 px-4 rounded-xl border mb-2 ${
                  selectedPharmacyFilter === 'all'
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                <Text
                  style={{ color: selectedPharmacyFilter === 'all' ? '#ffffff' : '#64748b' }}
                  className="font-bold text-xs"
                >
                  All Companies
                </Text>
              </TouchableOpacity>
              {pharmaciesList.map((pharm) => (
                <TouchableOpacity
                  key={pharm._id}
                  onPress={() => {
                    setSelectedPharmacyFilter(pharm._id);
                    setShowFilterModal(false);
                  }}
                  className={`py-3 px-4 rounded-xl border mb-2 ${
                    selectedPharmacyFilter === pharm._id
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <Text
                    style={{ color: selectedPharmacyFilter === pharm._id ? '#ffffff' : (theme === 'dark' ? '#cbd5e1' : '#334155') }}
                    className="font-semibold text-xs"
                  >
                    {pharm.companyName} ({pharm.city})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              className="w-full bg-slate-100 dark:bg-slate-800 py-3 rounded-xl items-center"
            >
              <Text className="text-slate-600 dark:text-slate-300 font-bold text-xs">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. FORM MODAL (ADD / EDIT CASH ENTRY) */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        onRequestClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
      >
        <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
          >
          <View
            style={{ paddingTop: Platform.OS === 'ios' ? 52 : 16 }}
            className="px-5 pb-4 border-b border-slate-150 dark:border-slate-850 flex-row justify-between items-center bg-white dark:bg-slate-900"
          >
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Cash Entry' : 'New Cash Entry'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowFormModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color={theme === 'dark' ? '#ffffff' : '#0f172a'} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-5" keyboardShouldPersistTaps="handled">
            <View className="space-y-4 pb-10">
              {/* Date Input */}
              <View className="mb-4">
                <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  Payment Date (YYYY-MM-DD)
                </Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="e.g. 2026-06-21"
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                />
              </View>

              {/* Invoice Number */}
              <View className="mb-4">
                <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  Invoice Number
                </Text>
                <TextInput
                  value={invoiceNumber}
                  onChangeText={setInvoiceNumber}
                  placeholder="e.g. CS-1004"
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                />
              </View>

              {/* Pharmacy Autocomplete */}
              <View className="mb-4">
                <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  Pharmacy Name
                </Text>
                <AutoComplete
                  apiPath="/pharmacies"
                  placeholder="Search pharmacy..."
                  displayField="companyName"
                  onSelect={handlePharmacySelect}
                  value={pharmacyName}
                  onChangeText={(val) => {
                    setPharmacyName(val);
                    setPharmacyId('');
                  }}
                />
              </View>

              {/* City */}
              <View className="mb-4">
                <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  {/^[0-9a-fA-F]{24}$/.test(pharmacyId) ? "City (Auto-filled)" : "City"}
                </Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  editable={!/^[0-9a-fA-F]{24}$/.test(pharmacyId)}
                  placeholder={/^[0-9a-fA-F]{24}$/.test(pharmacyId) ? "Select pharmacy first" : "Enter city"}
                  placeholderTextColor="#94a3b8"
                  className={`px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold ${
                    /^[0-9a-fA-F]{24}$/.test(pharmacyId)
                      ? 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:border-emerald-500'
                  }`}
                />
              </View>

              {/* Amount Received */}
              <View className="mb-6">
                <Text className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1.5">
                  Amount Received (RS)
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
                />
              </View>

              {/* Submit Form */}
              <TouchableOpacity
                onPress={handleFormSubmit}
                activeOpacity={0.9}
                className="w-full bg-emerald-500 py-3.5 rounded-xl justify-center items-center shadow-lg shadow-emerald-500"
              >
                <Text className="text-white font-bold text-sm">
                  {isEditing ? 'Update Entry' : 'Submit Cash Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* 3. DATE FILTER SELECTION MODAL */}
      <Modal
        visible={showDateFilterModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDateFilterModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50 p-6">
          <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl">
            <Text className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Filter by Date Range
            </Text>
            <ScrollView className="max-h-60 mb-6">
              {[
                { id: 'all', name: 'All Time' },
                { id: 'week', name: 'This Week' },
                { id: 'month', name: 'This Month' },
                { id: 'year', name: 'This Year' },
                { id: 'custom', name: 'Custom Range' },
              ].map((itemOption) => (
                <TouchableOpacity
                  key={itemOption.id}
                  onPress={() => {
                    setSelectedDateFilter(itemOption.id);
                    setShowDateFilterModal(false);
                  }}
                  className={`py-3 px-4 rounded-xl border mb-2 ${
                    selectedDateFilter === itemOption.id
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <Text
                    style={{ color: selectedDateFilter === itemOption.id ? '#ffffff' : (theme === 'dark' ? '#cbd5e1' : '#334155') }}
                    className="font-semibold text-xs"
                  >
                    {itemOption.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowDateFilterModal(false)}
              className="w-full bg-slate-100 dark:bg-slate-800 py-3 rounded-xl items-center"
            >
              <Text className="text-slate-600 dark:text-slate-300 font-bold text-xs">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
