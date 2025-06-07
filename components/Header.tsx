import React from 'react'
import { View, Image, TouchableOpacity } from 'react-native'
import { styles as homeStyles } from '@/styles/homeScreenStyles';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/sessionAuth';

export default function Header() {
    const router = useRouter();
    const { authState } = useAuth();
    const profileImageUrl = authState.user?.profilePicUrl;

    return (
        <View style={homeStyles.topBar}>
            <Image
                source={require('@/assets/images/logo.png')}
                style={homeStyles.logo}
            />
            <TouchableOpacity onPress={() => router.push('/profile')}>
                <Image
                source={
                    profileImageUrl
                    ? { uri: profileImageUrl }
                    : require('@/assets/images/profile_placeholder.png')
                }
                style={homeStyles.profileIcon}
                />
            </TouchableOpacity>
        </View>
    );
}
