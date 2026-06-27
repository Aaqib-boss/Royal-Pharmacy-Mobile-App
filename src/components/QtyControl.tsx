import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface QtyControlProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
}

export const QtyControl: React.FC<QtyControlProps> = ({ value, onChange, min = 1 }) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    onChange(value + 1);
  };

  return (
    <View className="flex-row items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <Pressable
        onPress={handleDecrement}
        disabled={value <= min}
        className="px-2.5 py-1 active:bg-slate-200 dark:active:bg-slate-905 disabled:opacity-30"
      >
        <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">-</Text>
      </Pressable>
      <View className="px-3">
        <Text className="text-slate-800 dark:text-slate-200 font-bold text-xs min-w-[14px] text-center">
          {value.toString().padStart(2, '0')}
        </Text>
      </View>
      <Pressable
        onPress={handleIncrement}
        className="px-2.5 py-1 active:bg-slate-200 dark:active:bg-slate-900"
      >
        <Text className="text-emerald-500 font-bold text-sm">+</Text>
      </Pressable>
    </View>
  );
};
export default QtyControl;
