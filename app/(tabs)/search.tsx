import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { styles as homeStyles } from '@/styles/homeScreenStyles';
import { styles as searchBarStyles } from '@/styles/searchBarStyles';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import React from 'react';
import Header from '@/components/Header';

export default function SearchScreen() {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<'courses' | 'users'>('courses');

    return (
        <View style={homeStyles.container}>
            <Header/>

            <View style={searchBarStyles.searchBar}>
                <TextInput
                    placeholder="Search"
                    style={searchBarStyles.input}
                    placeholderTextColor="#999"
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
        </View>
    );
}
