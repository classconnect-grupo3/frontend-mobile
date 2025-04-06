import { CenteredView } from "@/components/views/CenteredView";
import { useSession } from "@/contexts/session";
import { AxiosError } from "axios";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Controller, set, useForm } from "react-hook-form";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/sessionAuth";

const styles = StyleSheet.create({
  text: {
    fontSize: 24,
    marginBottom: 16,
  },
  link: {
    fontStyle: "italic",
    marginTop: 16,
    color: "#007BFF",
    textDecorationLine: "underline",
  },
  input: {
    width: "100%",
    padding: 0,
    margin: 0,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  helperText: {
    width: "100%",
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "left",
  },
  error: {
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 4,
  },
  button: {
    width: "100%",
    padding: 12,
    backgroundColor: "#007BFF",
    borderRadius: 4,
    alignItems: "center",
  },
});

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function LoginScreen() {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(UserSchema),
        defaultValues: {
        email: "",
        password: "",
        },
    });

    const [error, setError] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    
    const auth = useAuth();
    if (!auth) {
        throw new Error("Auth context is undefined. Ensure you are using AuthProvider.");
    }
    const { login } = auth;

    const handleLogin = async ({ email, password }: { email: string; password: string }) => {
        setIsLoading(true);
        try {
            console.log(email, password);
            await login(email, password);
        } catch (e) {
            setError(
                e instanceof AxiosError && e.response
                ? e.response.data.error
                : "Something went wrong"
            );
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <CenteredView>
            <Text style={styles.text}>Login</Text>
            {error && <Text style={{ backgroundColor: "red", color: "white", padding:8 }}>{error}</Text>}

            {/* email input */}
            <View style={{ width: "100%" }}>
                <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                    style={[styles.input, errors?.email ? styles.error : {}]}
                    placeholder="Email..."
                    editable={!isLoading}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    />
                )}
                />
                <Text style={styles.helperText}>{errors?.email?.message}</Text>
            </View>

            {/* password input */}
            <View style={{ width: "100%" }}>
                <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                    style={[styles.input, errors?.password ? styles.error : {}]}
                    placeholder="Password..."
                    editable={!isLoading}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                    autoCapitalize="none"
                    />
                )}
                />
                <Text style={styles.helperText}>{errors?.password?.message}</Text>
            </View>

            {/* login button */}
            <View style={{ width: "100%" }}>
                <Button
                color="green"
                disabled={isLoading}
                title={isLoading ? "Loading..." : "Login"}
                onPress={handleSubmit(handleLogin)}
                />
            </View>

            {/* register link */}
            <Link style={styles.link} href="./register">Register</Link>
        </CenteredView>
    );
}
