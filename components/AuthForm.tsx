import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    ImageSourcePropType,
  } from "react-native";
  import Toast from "react-native-toast-message";
  import { styles } from "@/styles/loginStyle";
  import { Link } from "expo-router";
  
  interface AuthFormProps {
    title: string;
    email: string;
    password: string;
    showPassword: boolean;
    error?: string;
    isLoading: boolean;
    onEmailChange: (text: string) => void;
    onPasswordChange: (text: string) => void;
    togglePassword: () => void;
    onSubmit: () => void;
    buttonLabel: string;
    navigateLabel: string;
    navigateLink: "/(login)" | "/(login)/register";
    logoSource: ImageSourcePropType;
  }
  
  export function AuthForm({
    title,
    email,
    password,
    showPassword,
    error,
    isLoading,
    onEmailChange,
    onPasswordChange,
    togglePassword,
    onSubmit,
    buttonLabel,
    navigateLabel,
    navigateLink,
    logoSource,
  }: AuthFormProps) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.text}>{title}</Text>
  
          {error && <Text style={styles.errorText}>{error}</Text>}
  
          <Image source={logoSource} style={styles.image} />
  
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={onEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={onPasswordChange}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={togglePassword}>
              <Text style={styles.togglePassword}>
                {showPassword ? "Hide password" : "Show password"}
              </Text>
            </TouchableOpacity>
  
            <TouchableOpacity
              style={[styles.button, isLoading && { opacity: 0.7 }]}
              onPress={onSubmit}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? `${buttonLabel}ing...` : buttonLabel}
              </Text>
            </TouchableOpacity>

            <Link style={[styles.link, {marginTop: 12}]} href={navigateLink} >
                {navigateLabel}
            </Link>
            
          </View>
          <Toast />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  