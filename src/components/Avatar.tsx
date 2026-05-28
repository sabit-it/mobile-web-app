import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<AvatarSize, number> = { sm: 32, md: 48, lg: 80 };
const FONT_MAP: Record<AvatarSize, number> = { sm: 13, md: 18, lg: 28 };

interface Props {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: AvatarSize;
}

export default function Avatar({
  firstName,
  lastName,
  photoUrl,
  size = 'md',
}: Props): React.ReactElement {
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.border,
  },
  circle: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
});
