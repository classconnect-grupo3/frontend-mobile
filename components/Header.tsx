import React from 'react'
import { View, Image, TouchableOpacity } from 'react-native'
import { styles as homeStyles } from '@/styles/homeScreenStyles';
import { useRouter } from 'expo-router';

export default function Header() {
    const router = useRouter();

    return (
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
    );
}
