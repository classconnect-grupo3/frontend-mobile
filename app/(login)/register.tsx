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
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons'; 

const schema = z.object({
  name: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
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
      name: '',
      surname: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (auth) {
        await auth.register(data.name, data.surname, data.email, data.password);
        router.replace('/(login)');
      } else {
        throw new Error('Authentication context is not available');
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
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
        <Image source={require("@/assets/images/thiago.jpeg")} style={styles.image} />

        <View style={styles.form}>
          {(['name', 'surname', 'email', 'password'] as const).map((field) => (
            <Controller
              key={field}
              control={control}
              name={field}
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  {field === 'password' ? (
                    <>
                      <View style={[styles.input, errors[field] && styles.inputError, { flexDirection: 'row', alignItems: 'center' }]}>
                        <TextInput
                          style={{ flex: 1 }}
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
                        style={[styles.input, errors[field] ? styles.inputError : {}]}
                        placeholder={
                          field === 'name'
                            ? 'First Name'
                            : field === 'surname'
                            ? 'Last Name'
                            : 'Email'
                        }
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        autoCapitalize={field === 'email' ? 'none' : 'words'}
                        keyboardType={field === 'email' ? 'email-address' : 'default'}
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
              {isSubmitting ? "Registering..." : "Register"}
            </Text>
          </TouchableOpacity>

          <Link style={[styles.link, { marginTop: 12 }]} href="/(login)">
            Already have an account? Login here
          </Link>
        </View>

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
