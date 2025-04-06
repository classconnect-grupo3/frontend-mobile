import {
    useContext,
    createContext,
    type PropsWithChildren,
    useState,
    useEffect,
  } from "react";
  import { client } from "@/lib/http";
  import { router } from "expo-router";
  import { deleteItemAsync, getItemAsync, setItemAsync } from "@/lib/storage";
  
  type Session = string;
  
  interface SessionService {
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    session?: Session;
  }
  
  const SessionContext = createContext<SessionService | undefined>(undefined);
  
  export function useSession() {
    return useContext(SessionContext)!;
  }
  
  async function startSession(token: string) {
    await setItemAsync("session", token);
    // https://axios-http.com/docs/interceptors
    // if (session) {
    //   client.defaults.headers.common["Authorization"] = session;
    // }
    return token as Session;
  }
  
  async function endSession() {
    await deleteItemAsync("session");
    // delete client.defaults.headers.common["Authorization"];
  }
  
  export async function recoverSession() {
    const token = await getItemAsync("session");
    // Session validation & recovery, is alive? refresh token?
    if (token) return await startSession(token);
    return undefined;
  }
  
  export function useInitializeSessionService() {
    const [session, setSession] = useState<Session>();
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
      recoverSession()
        .then((session) => session && setSession(session))
        .finally(() => setIsLoading(false));
    }, []);
  
    const signInWithPassword = async (email: string, password: string) => {
      const { data } = await client.post("/login", {
        email,
        password,
      });
      const session = await startSession(data.token);
      setSession(session);
      router.push("/(tabs)");
    };
  
    const signOut = async () => {
      await endSession();
      router.navigate("/(login)");
    };
  
    return isLoading ? undefined : { session, signInWithPassword, signOut };
  }
  
  export function SessionProvider({
    value,
    children,
  }: PropsWithChildren<{ value: SessionService }>) {
    return (
      <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
    );
  }
