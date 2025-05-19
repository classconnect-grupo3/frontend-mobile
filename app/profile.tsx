import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Button,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/sessionAuth';
import { fetchUserData } from '@/services/userProfile';
import { client } from '@/lib/http';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import React from 'react';

const schema = z.object({
  name: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Last name is required'),
  email: z.string().email('Must be a valid email'),
});

type FormData = z.infer<typeof schema>;

export default function ProfileScreen() {
  const [userData, setUserData] = useState<{
    name: string;
    surname: string;
    email: string;
    location: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const auth = useAuth();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      surname: '',
      email: '',
    },
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!auth?.authState.token) return;
        const data = await fetchUserData(auth.authState.token);
        setUserData(data);
        reset({
          name: data.name,
          surname: data.surname,
          email: data.email,
        });
      } catch (err) {
        console.error('Failed to load user:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSave = async (data: FormData) => {
    if (!auth) return;

    try {
      await client.patch(
        '/users/me',
        {
          ...data,
          location: 'Pending', // placeholder
        },
        {
          headers: {
            Authorization: `Bearer ${auth.authState.token}`,
          },
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Profile updated',
      });

      setEditMode(false);
    } catch (e) {
      console.error('Error updating profile', e);
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2: 'Something went wrong while updating your profile.',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text>Failed to load user data.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Your Profile</Text>

        <View style={styles.profileRow}>
          <Image
            source={require('@/assets/images/profile-placeholder.jpeg')}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{userData.name}</Text>
        </View>

        <View style={styles.form}>
          {(['name', 'surname', 'email'] as const).map((field) => (
            <View style={styles.inputGroup} key={field}>
              <Text style={styles.label}>
                {field === 'name'
                  ? 'First Name'
                  : field === 'surname'
                  ? 'Last Name'
                  : 'Email'}
              </Text>
              <Controller
                control={control}
                name={field}
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <TextInput
                      style={[styles.input, errors[field] && styles.inputError]}
                      placeholder={`Enter your ${field}`}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      editable={editMode}
                      autoCapitalize={field === 'email' ? 'none' : 'words'}
                      keyboardType={field === 'email' ? 'email-address' : 'default'}
                    />
                    {errors[field] && (
                      <Text style={styles.errorText}>{errors[field]?.message}</Text>
                    )}
                  </>
                )}
              />
            </View>
          ))}
        </View>

        <View style={styles.buttonRow}>
          {editMode ? (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit(handleSave)}
              disabled={!isValid || isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={() => setEditMode(true)}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ccc',
    marginTop: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginStart: 20,
    marginTop: 20,
  },
  inputGroup: {
    marginTop: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderColor: '#A8A8A8',
    color: '#000',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginBottom: 8,
  },
  button: {
    width: "100%",
    padding: 12,
    backgroundColor: "#007BFF",
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  link: {
    fontStyle: "italic",
    marginTop: 16,
    color: "#007BFF",
    textDecorationLine: "underline",
  },
  buttonRow: {
    marginTop: 24,
    alignItems: 'center',
  },
});
