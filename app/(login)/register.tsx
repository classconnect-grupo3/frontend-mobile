import { useAuth } from "@/contexts/sessionAuth";
import { useAuthForm } from "@/hooks/useAuthForm";
import { AuthForm } from "@/components/AuthForm";
import { useState } from "react";
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


  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");

  const handleRegister = async () => {
    if (!auth) return;
  
    if (!name?.trim()) {
      setError("First name is required");
      return;
    }
    if (!surname?.trim()) {
      setError("Last name is required");
      return;
    }
    if (!email?.trim()) {
      setError("Email is required");
      return;
    }
    if (!password?.trim()) {
      setError("Password is required");
      return;
    }
  
    setIsLoading(true);
    try {
      await auth.register(name, surname, email, password);
      Toast.show({
        type: "success",
        text1: "Account created!",
      });
    } catch (e: any) {
      const message = e?.response?.data?.detail ?? e?.message ?? "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Register"
      name={name}
      surname={surname}
      email={email}
      password={password}
      showPassword={showPassword}
      error={error}
      isLoading={isLoading}
      onNameChange={(text) => {
        setName(text);
        setError(undefined);
      }}
      onSurnameChange={(text) => {
        setSurname(text);
        setError(undefined);
      }}
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
      logoSource={require("@/assets/images/thiago.jpeg")}
    />
  );
}
