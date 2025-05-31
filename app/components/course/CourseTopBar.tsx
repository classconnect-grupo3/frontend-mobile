import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

export function CourseTopBar({ title, role, onBack }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={{ fontSize: 20 }}>←</Text>
      </TouchableOpacity>
      <Text style={{ marginLeft: 10, fontSize: 18 }}>{title}</Text>
      <Text style={{ marginLeft: 10 }}>{role}</Text>
      <Image source={require('@/assets/images/profile-placeholder.jpeg')} style={{ width: 30, height: 30, marginLeft: 'auto' }} />
    </View>
  );
} 
