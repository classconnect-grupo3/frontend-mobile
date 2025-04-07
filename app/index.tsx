import { useSession } from "@/contexts/session";
import { Redirect, Stack } from "expo-router";
import 'expo-dev-client';
import { useAuth } from "@/contexts/sessionAuth";
import Toast from 'react-native-toast-message';

// export default function App() {
//   const { session } = useSession();
//   if (!session) return <Redirect href="/(login)" />;
//   return <Redirect href="/(tabs)" />;
// }

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
            <Redirect href="/(login)" />
            <Toast />
        </>
        );
    }
}
