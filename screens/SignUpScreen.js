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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

export default function SignUpScreen({ navigation, route }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { userType } = route.params;

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await signUp(email, password, {
        full_name: fullName,
        user_type: userType,
      });

      if (error) throw error;

      if (user) {
        Alert.alert("Success", "Account created successfully!");
        navigation.replace("Dashboard");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
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

      <Text style={styles.title}>Sign Up as {userType}</Text>

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="person"
          size={24}
          color="#4a148c"
          style={styles.icon}
        />

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#9ca3af"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <MaterialIcons
          name="mail"
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
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate("Login", { userType })}
      >
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
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
