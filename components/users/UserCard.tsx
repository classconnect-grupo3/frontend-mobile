import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { styles } from '@/styles/usersStyles';

interface Props {
  name: string;
  surname: string;
}

export function UserCard({ name, surname }: Props) {
  return (
    <View style={styles.userCard}>
      <Image
        source={require('@/assets/images/profile_placeholder.png')}
        style={styles.avatar}
      />
      <Text style={styles.name}>{name} {surname}</Text>
    </View>
  );
}
