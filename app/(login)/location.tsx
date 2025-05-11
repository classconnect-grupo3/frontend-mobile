import { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '@/contexts/sessionAuth';
import { client } from '@/lib/http';
import { router } from 'expo-router';
import React from 'react';

export default function LocationScreen() {
  const auth = useAuth();
  const [selectedCountry, setSelectedCountry] = useState('Argentina');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!auth) return;
    setIsSubmitting(true);
    try {
      await client.post('/users/me/location',{ 
        country: selectedCountry 
        }, {
          headers: {
            Authorization: `Bearer ${auth.authState.token}`,
          },
        });
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error('Failed to save country:', e);
      Alert.alert('Error', 'Failed to save your country. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your country</Text>

      <Picker
        selectedValue={selectedCountry}
        onValueChange={(value) => setSelectedCountry(value)}
        style={styles.picker}
      >
        <Picker.Item label="Argentina 🇦🇷" value="Argentina" />
        <Picker.Item label="Chile 🇨🇱" value="Chile" />
        <Picker.Item label="Uruguay 🇺🇾" value="Uruguay" />
      </Picker>

      <Button
        title={isSubmitting ? 'Saving...' : 'Confirm'}
        onPress={handleConfirm}
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  picker: {
    marginBottom: 24,
  },
});
