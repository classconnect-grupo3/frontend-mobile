import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/contexts/sessionAuth';
import { useRouter } from 'expo-router';
import { styles } from '@/styles/loginStyle';
import { Link } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons'; 
import React from 'react';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const schema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Google Sign-In
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, 
    redirectUri: makeRedirectUri({
      useProxy: true,
    }),
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      if (auth && id_token) {
        auth.loginWithGoogle(id_token).catch((e: any) => {
          Toast.show({
            type: 'error',
            text1: 'Google Login failed',
            text2: e?.message ?? 'Something went wrong',
          });
        });
      }
    }
  }, [response]);

  const onSubmit = async (data: FormData) => {
    try {
      if (auth) {
        await auth.login(data.email, data.password);
        console.log('Login successful');
      } else {
        throw new Error('Authentication context is not available');
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: e?.response?.data?.detail ?? e?.message ?? 'Something went wrong',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require("@/assets/images/logo.png")} style={styles.image} />

        <View style={styles.form}>
          {(['email', 'password'] as const).map((field) => (
            <Controller
              key={field}
              control={control}
              name={field}
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  {field === 'password' ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                          style={[
                            styles.input,
                            errors[field] ? styles.inputError : {},
                            { flex: 1 }
                          ]}
                          placeholder="Password"
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                          <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color="#888"
                            style={{ marginHorizontal: 8 }}
                          />
                        </TouchableOpacity>
                      </View>
                      {errors[field] && (
                        <Text style={styles.errorText}>{errors[field]?.message}</Text>
                      )}
                    </>
                  ) : (
                    <>
                      <TextInput
                        style={[
                          styles.input,
                          errors[field] ? styles.inputError : {},
                        ]}
                        placeholder={'Email'}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        autoCapitalize={'none'}
                        keyboardType={'email-address'}
                      />
                      {errors[field] && (
                        <Text style={styles.errorText}>{errors[field]?.message}</Text>
                      )}
                    </>
                  )}
                </>
              )}
            />
          ))}

          <TouchableOpacity
            style={[styles.button, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          {/* Botón Login con Google */}
          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: '#DB4437' }]}
            onPress={() => promptAsync()}
            disabled={!request}
          >
            <Text style={styles.buttonText}>Login con Google</Text>
          </TouchableOpacity>

          <Link style={[styles.link, { marginTop: 12 }]} href="/(login)/register">
            Don't have an account yet? Register
          </Link>
        </View>

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
