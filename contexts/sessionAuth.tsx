import {
    useContext,
    createContext,
    type PropsWithChildren,
    useState,
    useEffect,
} from "react";
import { client } from "@/lib/http";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';

type AuthState = {
    token: string|null;
    authenticated: boolean;
}

interface AuthContextType {
    authState: AuthState;
    register: (name: string, surname: string, email: string, password: string) => Promise<any>;
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<any>;
}

const TOKEN_KEY = 'session';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({children}: PropsWithChildren) => {
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        authenticated: false,
    });

    useEffect(() => {
        const loadToken = async () => {
            const token = await SecureStore.getItemAsync(TOKEN_KEY);

            console.log("stored: ", token);

            if (token) {
                client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                setAuthState({ token, authenticated: true });
            }
        };
        loadToken();
    }, []);

    const register = async (name: string, surname: string, email: string, password: string) => {
        await client.post(`/register`, { email, password, name, surname });
        // auto login after register
        return login(email, password);
    };

    const login = async (email: string, password: string) => {
        try {
            const {data} = await client.post(`/login`, { email, password });
            console.log("Login data: ", data);
            const token = data.token;

            await SecureStore.setItemAsync(TOKEN_KEY, token);
            client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            setAuthState({ token, authenticated: true });
            router.replace("/(tabs)");

        } catch (error) {
            return {error: true, msg: (error as any).response.data.msg};
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        client.defaults.headers.common['Authorization'] = '';

        setAuthState({ token: null, authenticated: false });
        router.replace("/(login)");
    };

    const value = {
        authState,
        register,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
