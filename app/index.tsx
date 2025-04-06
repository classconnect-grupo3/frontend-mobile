import { useSession } from "@/contexts/session";
import { Redirect, Stack } from "expo-router";
import 'expo-dev-client';

export default function App() {
  const { session } = useSession();
  if (!session) return <Redirect href="/(login)" />;
  return <Redirect href="/(tabs)" />;
}
