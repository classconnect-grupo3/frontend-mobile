import { useAuth } from "@/contexts/sessionAuth";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AuthForm } from "@/components/AuthForm";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const auth = useAuth();
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    setError,
    isLoading,
    setIsLoading,
  } = useAuthForm();

  const handleLogin = async () => {
    if (!auth) return;

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }


    setIsLoading(true);
    try {
      await auth.login(email, password);
    } catch (e: any) {
      const message = e?.response?.data?.error ?? e?.message ?? "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Login"
      email={email}
      password={password}
      showPassword={showPassword}
      error={error}
      isLoading={isLoading}
      onEmailChange={(text) => {
        setEmail(text);
        setError(undefined);
      }}
      onPasswordChange={(text) => {
        setPassword(text);
        setError(undefined);
      }}
      togglePassword={() => setShowPassword(!showPassword)}
      onSubmit={handleLogin}
      buttonLabel="Log in"
      loadingLabel="Logging in..."
      navigateLabel="Don't have an account? Register here"
      navigateLink="/(login)/register"
      logoSource={require("@/assets/images/logo.png")}
    />
  );
}
