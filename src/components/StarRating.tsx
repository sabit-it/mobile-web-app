import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

interface Props {
  value: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: number;
}

export default function StarRating({
  value,
  interactive = false,
  onRate,
  size = 18,
}: Props): React.ReactElement {
  const filled = Math.round(value);

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= filled;
        if (interactive) {
          return (
            <TouchableOpacity key={star} onPress={() => onRate?.(star)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Ionicons
                name={isFilled ? 'star' : 'star-outline'}
                size={size}
                color={Colors.warning}
              />
            </TouchableOpacity>
          );
        }
        return (
          <Ionicons
            key={star}
            name={isFilled ? 'star' : 'star-outline'}
            size={size}
            color={Colors.warning}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});
