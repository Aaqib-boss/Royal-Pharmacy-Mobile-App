import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import api from '../utils/api';

interface AutoCompleteProps {
  apiPath: string;
  placeholder: string;
  displayField: string;
  onSelect: (item: any) => void;
  excludeIds?: string[];
  clearOnSelect?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

export const AutoComplete: React.FC<AutoCompleteProps> = ({
  apiPath,
  placeholder,
  displayField,
  onSelect,
  excludeIds = [],
  clearOnSelect = false,
  value = '',
  onChangeText = () => {},
}) => {
  const [query, setQuery] = useState(value);
  const [items, setItems] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(apiPath);
        setItems(data);
      } catch (error) {
        console.error('Error pre-fetching autocomplete items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [apiPath]);

  const excludeIdsStr = excludeIds.join(',');

  useEffect(() => {
    if (!query || query.trim() === '') {
      if (suggestions.length > 0) {
        setSuggestions([]);
      }
      return;
    }
    const searchLower = query.toLowerCase();
    const filtered = items.filter((item) => {
      if (excludeIds.includes(item._id)) return false;
      const displayVal = (item[displayField] || '').toLowerCase();
      return displayVal.includes(searchLower);
    });
    setSuggestions(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, items, excludeIdsStr, displayField]);

  const handleSelect = (item: any) => {
    onSelect(item);
    if (clearOnSelect) {
      setQuery('');
      onChangeText('');
    } else {
      setQuery(item[displayField]);
      onChangeText(item[displayField]);
    }
    setShowDropdown(false);
  };

  return (
    <View className="w-full relative z-30">
      <TextInput
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          onChangeText(text);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:border-emerald-500"
      />
      {loading && items.length === 0 && (
        <ActivityIndicator size="small" color="#10b981" className="mt-1" />
      )}
      {showDropdown && query && query.trim() !== '' && (
        <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl shadow-lg mt-1 max-h-40 z-50">
          <ScrollView
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {!suggestions.some(s => (s[displayField] || '').toLowerCase() === query.trim().toLowerCase()) && (
              <Pressable
                onPress={() => handleSelect({ _id: query.trim(), [displayField]: query.trim(), price: 0 })}
                className="px-4 py-3 border-b border-slate-55 dark:border-slate-855 active:bg-slate-100 dark:active:bg-slate-800"
              >
                <Text className="text-emerald-500 font-bold text-sm">
                  + Add "{query.trim()}"
                </Text>
              </Pressable>
            )}
            {suggestions.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => handleSelect(item)}
                className="px-4 py-3 border-b border-slate-50 dark:border-slate-855 last:border-b-0 active:bg-slate-100 dark:active:bg-slate-800"
              >
                <Text className="text-slate-800 dark:text-slate-200 text-sm font-semibold">
                   {item[displayField]}
                </Text>
                {item.city && (
                  <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {item.city}
                  </Text>
                )}
                {item.price !== undefined && (
                  <Text className="text-xs text-emerald-500 font-bold mt-0.5">
                    RS {item.price.toFixed(2)}
                  </Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
