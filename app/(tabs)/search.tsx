import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { styles as homeStyles } from '@/styles/homeScreenStyles';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function SearchScreen() {
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<'courses' | 'users'>('courses');

    return (
        <View style={homeStyles.container}>
            <View style={homeStyles.topBar}>
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={homeStyles.logo}
                />
                <TouchableOpacity onPress={() => router.push('/profile')}>
                    <Image
                        source={require('@/assets/images/tuntungsahur.jpeg')}
                        style={homeStyles.profileIcon}
                    />
                </TouchableOpacity>
            </View>

            <View style={localStyles.searchBar}>
                <TextInput
                    placeholder="Search"
                    style={localStyles.input}
                    placeholderTextColor="#999"
                />
                <TouchableOpacity style={localStyles.filterButton}>
                    <FontAwesome name="filter" size={20} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Selection buttons */}
            <View style={localStyles.toggleContainer}>
                <TouchableOpacity
                    style={[
                        localStyles.toggleButton,
                        selectedTab === 'courses' && localStyles.selectedButton,
                    ]}
                    onPress={() => setSelectedTab('courses')}
                >
                    <Text style={selectedTab === 'courses' ? localStyles.selectedText : localStyles.unselectedText}>
                        Courses
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        localStyles.toggleButton,
                        selectedTab === 'users' && localStyles.selectedButton,
                    ]}
                    onPress={() => setSelectedTab('users')}
                >
                    <Text style={selectedTab === 'users' ? localStyles.selectedText : localStyles.unselectedText}>
                        Users
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 8,
    },
    filterButton: {
        marginLeft: 10,
        padding: 10,
        backgroundColor: '#ddd',
        borderRadius: 8,
    },
    toggleContainer: {
        flexDirection: 'row',
        marginTop: 12,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    selectedButton: {
        backgroundColor: '#007AFF',
    },
    selectedText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    unselectedText: {
        color: '#333',
    },
});
