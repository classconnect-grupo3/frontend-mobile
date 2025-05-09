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
    token: string | null;
    authenticated: boolean;
    location?: string | null; 
  };

interface AuthContextType {
    loginWithGoogle(id_token: string): unknown;
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
        router.replace("/(login)");
    };

    const login = async (email: string, password: string) => {
        try {
          const { data } = await client.post("/login/email", { email, password });
          console.log("Login data: ", data);
          const token = data.id_token;
          const location = data.user_location ?? null;
      
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          client.defaults.headers.common['Authorization'] = "Bearer ${token}";
      
          setAuthState({ token, authenticated: true, location }); 
      
          router.replace("/(tabs)");
        } catch (error) {
          throw error;
        }
      };

      const loginWithGoogle = async (idToken: string) => {
        try {
          const { data } = await client.post("/login/google", { id_token: idToken });
          console.log("Google Login data: ", data);
      
          const token = data.id_token;
          const location = data.user_location ?? null;
      
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
          setAuthState({ token, authenticated: true, location });
      
          router.replace("/(tabs)");
        } catch (error) {
          throw error;
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
        loginWithGoogle,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
