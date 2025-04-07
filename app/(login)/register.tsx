import { useAuth } from "@/contexts/sessionAuth";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AuthForm } from "@/components/AuthForm";
import Toast from "react-native-toast-message";

export default function RegisterScreen() {
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

  const handleRegister = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await auth.register(email, password);
      Toast.show({
        type: "success",
        text1: "Account created!",
      });
    } catch (e: any) {
      const message = e?.response?.data?.error ?? e?.message ?? "Something went wrong";
      setError(message);
      Toast.show({
        type: "error",
        text1: "Registration failed",
        text2: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Register"
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
      onSubmit={handleRegister}
      buttonLabel="Register"
      navigateLabel="Already have an account? Login here"
      navigateLink="/(login)"
      logoSource={require("@/assets/images/logo-register.jpeg")}
    />
  );
}
