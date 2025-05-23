import { View, TextInput, StyleSheet, TouchableOpacity, Text, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { styles as homeStyles } from '@/styles/homeScreenStyles';
import { styles as searchBarStyles } from '@/styles/searchBarStyles';
import { styles as createCourseStyles } from '@/styles/createCourseStyles';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { courseClient as client } from '@/lib/courseClient';
import Header from '@/components/Header';
import { UserCard } from '@/components/users/UserCard';
import React from 'react';
import { useAuth } from '@/contexts/sessionAuth';

export default function SearchScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'courses' | 'users'>('users');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (selectedTab === 'users' && search.trim()) {
        fetchUsers();
      }
    }, 500); // debounce

    return () => clearTimeout(timeout);
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // client.defaults.headers.common['Authorization'] = `Bearer ${auth?.authState.token}`;
      const { data } = await client.get(`/users/search?query=${search}`, {
        headers: {
          Authorization: `Bearer ${auth?.authState.token}`,
        },
      });
      setUsers(data.data);
    } catch (e) {
      console.error('Error searching users:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={homeStyles.container}>
      <Header />

      <View style={searchBarStyles.searchBar}>
        <TextInput
          placeholder="Search"
          style={searchBarStyles.input}
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={searchBarStyles.filterButton}>
          <FontAwesome name="filter" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Selection buttons */}
      <View style={searchBarStyles.toggleContainer}>
        <TouchableOpacity
          style={[
            searchBarStyles.toggleButton,
            selectedTab === 'courses' && searchBarStyles.selectedButton,
          ]}
          onPress={() => setSelectedTab('courses')}
        >
          <Text style={selectedTab === 'courses' ? searchBarStyles.selectedText : searchBarStyles.unselectedText}>
            Courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            searchBarStyles.toggleButton,
            selectedTab === 'users' && searchBarStyles.selectedButton,
          ]}
          onPress={() => setSelectedTab('users')}
        >
          <Text style={selectedTab === 'users' ? searchBarStyles.selectedText : searchBarStyles.unselectedText}>
            Users
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'users' && (
        <View style={{ paddingHorizontal: 0 }}>
          {loading ? (
            <Text style={{ padding: 16, color: '#333' }}>Searching...</Text>
          ) : users.length === 0 ? (
            <Text style={{ padding: 16, color: '#333' }}>No users found</Text>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <UserCard name={item.name} surname={item.surname} />
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
