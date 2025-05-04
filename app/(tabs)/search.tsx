import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { styles } from '@/styles/homeScreenStyles';
import { Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function SearchScreen() {
    const router = useRouter();
    return (
        <View style={styles.container}>

            <View style={styles.topBar}>
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.logo}
                />
                <TouchableOpacity onPress={() => { router.push('/profile') }}>
                    <Image
                        source={require('@/assets/images/tuntungsahur.jpeg')}
                        style={styles.profileIcon}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
                <TextInput
                    placeholder="Search"
                    style={styles.input}
                    placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.filterButton}>
                    <FontAwesome name="filter" size={20} color="#333" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
