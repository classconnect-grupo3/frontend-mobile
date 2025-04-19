import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity } from 'react-native';
import React from 'react';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileRow}>
        <Image
          source={require('@/assets/images/tuntungsahur.jpeg')}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>Tuntung Sahur</Text>
      </View>

      {/* Name Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value="Tuntung"
          editable={false} // Set to true if you want it to be editable later
        />
      </View>
      {/* Surname Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Surname</Text>
        <TextInput
          style={styles.input}
          value="Sahur"
          editable={false} // Set to true if you want it to be editable later
        />
      </View>
      {/* Surname Field */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value="tuntungsahur@gmail.com"
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
