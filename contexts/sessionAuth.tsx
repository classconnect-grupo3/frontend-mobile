import React, {
    useContext,
    createContext,
    type PropsWithChildren,
    useState,
    useEffect,
} from "react";
import { client } from "@/lib/http";
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { registerPushToken } from "@/lib/notifications";

type AuthState = {
    token: string | null;
    authenticated: boolean;
    location: string | null; 
    user: {
        id: string;
        name: string;
        surname: string;
    } | null;
  };

interface AuthContextType {
    authState: AuthState;
    register: (name: string, surname: string, email: string, password: string) => Promise<any>;
    login: (email: string, password: string) => Promise<any>;
    loginWithGoogle(id_token: string): Promise<any>;
    logout: () => Promise<any>;
}

const TOKEN_KEY = 'session';
const USER_ID_KEY = 'user_id';
const USER_LOCATION_KEY = 'user_location';
const USER_NAME_KEY = 'user_name';
const USER_SURNAME_KEY = 'user_surname';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({children}: PropsWithChildren) => {
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        authenticated: false,
        location: null,
        user: null,
    });

    const fetchUser = async (token: string) => {
      try {
        const { data } = await client.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('User data fetched:', data);

        const user = {
          id: data.data.uid,
          name: data.data.name,
          surname: data.data.surname,
        }

        console.log('User data for saved in fetchUser:', user);

        return user;
      } catch (e) {
        console.error('Failed to fetch user info:', e);
        return undefined;
      }
    };

    useEffect(() => {
      const loadToken = async () => {
        try {
          const token = await SecureStore.getItemAsync(TOKEN_KEY);
          if (!token) return;
      
          const user = await fetchUser(token);
          if (!user) {
            console.warn('❌ Invalid or expired token, logging out');
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            return;
          }
      
          client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
          const location = await SecureStore.getItemAsync(USER_LOCATION_KEY);
      
          setAuthState({
            token,
            authenticated: true,
            user,
            location: location ?? null,
          });
        } catch (e) {
          console.error('Error loading auth state from SecureStore', e);
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
        const user_info = data.user_info;
        const user = {
          id: user_info.uid,
          name: user_info.name,
          surname: user_info.surname,
        }
        const location = 'pending'

        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(USER_ID_KEY, user.id);
        await SecureStore.setItemAsync(USER_NAME_KEY, user.name);
        await SecureStore.setItemAsync(USER_SURNAME_KEY, user.surname);

        client.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // const user = await fetchUser(token);

        console.log('User data for saved in login:', user);

        setAuthState({ token, authenticated: true, location, user });

        await registerPushToken(user.id)

        router.replace("/(tabs)");
      } catch (error) {
        console.error('Login error:', error);
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
    
        setAuthState({ token, authenticated: true, location, user: { id: '', name: '', surname: '' } });
    
        router.replace("/(tabs)");
      } catch (error) {
        throw error;
      }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        client.defaults.headers.common['Authorization'] = '';

        setAuthState({ token: null, authenticated: false, location: null, user: { id: '', name: '', surname: '' } });
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
