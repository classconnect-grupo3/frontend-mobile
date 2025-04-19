import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { fetchUserData } from '@/services/userProfile';
import React from 'react';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<{
    name: string;
    surname: string;
    email: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await fetchUserData();
        setUserData(data);
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>Failed to load user data.</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileRow}>
        <Image
          source={require('@/assets/images/tuntungsahur.jpeg')}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{userData.name}</Text>
      </View>

      {/* Name Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={userData.name}
          editable={false} // Set to true if you want it to be editable later
        />
      </View>
      {/* Surname Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Surname</Text>
        <TextInput
          style={styles.input}
          value={userData.surname}
          editable={false} // Set to true if you want it to be editable later
        />
      </View>
      {/* Email Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={userData.email}
          editable={false} // Set to true if you want it to be editable later
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ccc',
    marginTop: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginStart: 20,
    marginTop: 20,
  },
  inputGroup: {
    marginTop: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderColor: '#A8A8A8',
    color: '#A8A8A8',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});
