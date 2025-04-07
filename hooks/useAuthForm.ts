import { useState } from "react";

export function useAuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setError(undefined);
  };

  return {
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
    resetForm,
  };
}
