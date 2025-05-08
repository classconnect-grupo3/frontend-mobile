import { useSession } from "@/contexts/session";
import { Redirect, Stack } from "expo-router";
import 'expo-dev-client';
import { useAuth } from "@/contexts/sessionAuth";
import Toast from 'react-native-toast-message';
import React from "react";

export default function App() {
    const authContext = useAuth();
    if (!authContext) {
        return null;
    }
    const { authState } = authContext;
    
    if (authState.authenticated) {
        return (
            <>
                <Redirect href="/(tabs)" />
                <Toast />
            </>
        );
    } else {
        return (<>
            <Redirect href="/(tabs)" />
            <Toast />
        </>
        );
    }
}
