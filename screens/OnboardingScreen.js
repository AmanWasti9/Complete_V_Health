import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../services/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function OnboardingScreen({ navigation }) {
  const { user, userProfile } = useAuth();

  // useEffect(() => {
  //   if (user) {
  //     navigation.replace("Dashboard");
  //   }
  // }, [user, navigation]);
useEffect(() => {
  if (user && userProfile) {
    const userType = userProfile.user_type;

    if (userType === "admin") {
      navigation.replace("AdminDashboard");
    } else if (userType === "doctor") {
      navigation.replace("DoctorDashboard");
    } else if (userType === "patient") {
      navigation.replace("Dashboard");
    } else {
      navigation.replace("Onboarding");
    }
  }
}, [user, userProfile, navigation]);



  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        // two‑colour gradient
        colors={["#691d9b", "#2856b8"]} // you can replace with hex codes like '#8b5cf6', '#3b82f6'
        // direction:  (0,0) = top‑left  →  (1,1) = bottom‑right
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerPlaceholder} />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("AdminLogin")}
          >
            <Ionicons name="person-circle-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <MaterialIcons
                  name="health-and-safety"
                  size={32}
                  color="white"
                  style={styles.logo}
                />
          
          <Text style={styles.title}>Welcome to Virtual Health</Text>
          <Text style={styles.subtitle}>Choose how you want to continue</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate("SignUp", { userType: "patient" })
            }
          >
            <Text style={styles.buttonText}>Continue as Patient</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.doctorButton]}
            onPress={() =>
              navigation.navigate("SignUp", { userType: "doctor" })
            }
          >
            <Text style={styles.buttonText}>Continue as Doctor</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    width: "100%",
  },
  headerPlaceholder: {
    width: 32, // Same as icon size for balance
  },
  profileButton: {
    padding: 5,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    fontSize: 100,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#4a148c",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 10,
    marginBottom: 15,
  },
  doctorButton: {
    backgroundColor: "#4a148c",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});
