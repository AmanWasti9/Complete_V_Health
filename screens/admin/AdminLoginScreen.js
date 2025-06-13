import React, { useState, useEffect } from "react";
import supabase from "../../services/supabaseService";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle keyboard visibility for better UX
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleAdminLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      Keyboard.dismiss();
      setIsLoading(true);

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify the user is an admin and get full profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      console.log("Admin", data.user.id);

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error("Error loading user profile");
      }

      if (!profile.is_admin) {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      navigation.replace("AdminDashboard");
    } catch (error) {
      // console.error('Admin login error:', error);
      Alert.alert(
        "Login Failed",
        error.message ||
          "Failed to log in. Please check your credentials and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.formContainer}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark" size={60} color="#2196F3" />
          </View>
          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>
            Sign in to access the admin dashboard
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter admin email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              (isLoading || !email || !password) && styles.buttonDisabled,
            ]}
            onPress={handleAdminLogin}
            disabled={isLoading || !email || !password}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {!keyboardVisible && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                © {new Date().getFullYear()} Healthify Admin
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  footer: {
    marginTop: 30,
    alignItems: "center",
  },
  footerText: {
    color: "#999",
    fontSize: 12,
  },
  backButton: {
    padding: 10,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e1e4e8",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: "transparent",
  },
  eyeIcon: {
    padding: 10,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 25,
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  forgotPasswordLink: {
    marginVertical: 10,
    textAlign: "center",
  },
  forgotPasswordText: {
    color: "black",
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
