import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../services/AuthContext";
import supabase from "../services/supabaseService";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

export default function LoginScreen({ navigation, route }) {
  const { signIn, userProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { userType } = route.params;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await signIn(email, password);

      if (error) throw error;

      if (user) {
        try {
          // Get the profile data before navigation
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", user.id)
            .single();

          console.log("User: ", user.id);

          if (error) throw error;

          // Navigate based on actual user type from database
          if (profile?.user_type?.toLowerCase() === "doctor") {
            navigation.replace("DoctorDashboard");
          } else {
            navigation.replace("Dashboard");
          }
        } catch (error) {
          // console.error("Error fetching profile:", error);
          Alert.alert("Error", "Failed to load user profile");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      // two‑colour gradient
      colors={["#691d9b", "#2856b8"]} // you can replace with hex codes like '#8b5cf6', '#3b82f6'
      // direction:  (0,0) = top‑left  →  (1,1) = bottom‑right
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <MaterialIcons
        name="health-and-safety"
        size={32}
        color="white"
        style={styles.logo}
      />

      <Text style={styles.title}>Login as {userType}</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="email"
          size={24}
          color="#4a148c"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password Input with Icon */}
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="lock"
          size={24}
          color="#4a148c"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.forgotPasswordLink}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate("SignUp", { userType })}
      >
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
    padding: 20,
    justifyContent: "center",
  },
  logo: {
    fontSize: 100,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#fff",
  },
  // input: {
  //   backgroundColor: "#f5f5f5",
  //   padding: 15,
  //   borderRadius: 10,
  //   marginBottom: 15,
  //   fontSize: 16,
  // },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  icon: {
    marginRight: 8,
  },
  input: {
    color: "#000",
    flex: 1,
    height: 40,
  },
  button: {
    backgroundColor: "#4a148c",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  forgotPasswordLink: {
    marginVertical: 10,
    textAlign: "center",
  },
  forgotPasswordText: {
    color: "white",
    fontSize: 14,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  linkButton: {
    padding: 10,
  },
  linkText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
});
