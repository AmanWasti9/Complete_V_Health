import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
// import MapView, { Marker, Circle } from "react-native-maps";
import Slider from "@react-native-community/slider";
import { useAuth } from "../services/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import supabase from "../services/supabaseService";
import { useRoute } from '@react-navigation/native';


const { width, height } = Dimensions.get("window");

export default function DashboardScreen({ navigation }) {
  const {
    user,
    userProfile,
    signOut,
    loading,
    setUserProfile,
    fetchUserProfile,
  } = useAuth();
  // Map and location state
  const [userLocation, setUserLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(10); // Default 10km
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  // const mapRef = useRef(null);
const route = useRoute();

  useEffect(() => {
    if (!user && !loading) {
      navigation.replace("Onboarding");
    }
  }, [user, loading, navigation]);
useEffect(() => {
  if (route.params?.updatedName) {
    setUserProfile((prev) => ({
      ...prev,
      full_name: route.params.updatedName,
    }));
  }
}, [route.params?.updatedName]);



  // Get user's current location and find nearby hospitals
  // useEffect(() => {
  //   const getUserLocation = async () => {
  //     try {
  //       // For demo purposes, we'll use a default location (can be replaced with Geolocation)
  //       // This simulates Islamabad, Pakistan coordinates
  //       const defaultLocation = {
  //         latitude: 33.6844,
  //         longitude: 73.0479,
  //         latitudeDelta: 0.0922,
  //         longitudeDelta: 0.0421,
  //       };
  //       setUserLocation(defaultLocation);
  //       findNearbyHospitals(defaultLocation, searchRadius);
  //     } catch (error) {
  //       console.error("Error getting location:", error);
  //     }
  //   };

  //   getUserLocation();
  // }, []);

  // // Update hospitals when search radius changes
  // useEffect(() => {
  //   if (userLocation) {
  //     findNearbyHospitals(userLocation, searchRadius);
  //   }
  // }, [searchRadius]);

  // // Function to find nearby hospitals (simulated data for demo)
  // const findNearbyHospitals = (location, radius) => {
  //   setIsLoadingHospitals(true);

  //   // Simulated hospital data
  //   // In a real app, this would come from an API like Google Places API
  //   setTimeout(() => {
  //     const simulatedHospitals = [
  //       {
  //         id: 1,
  //         name: "City Hospital",
  //         latitude: location.latitude + 0.01,
  //         longitude: location.longitude + 0.01,
  //         distance: 2.3,
  //         rating: 4.5,
  //       },
  //       {
  //         id: 2,
  //         name: "General Hospital",
  //         latitude: location.latitude - 0.015,
  //         longitude: location.longitude + 0.008,
  //         distance: 3.7,
  //         rating: 4.2,
  //       },
  //       {
  //         id: 3,
  //         name: "Medical Center",
  //         latitude: location.latitude + 0.02,
  //         longitude: location.longitude - 0.01,
  //         distance: 4.8,
  //         rating: 4.8,
  //       },
  //       {
  //         id: 4,
  //         name: "Community Hospital",
  //         latitude: location.latitude - 0.01,
  //         longitude: location.longitude - 0.02,
  //         distance: 6.5,
  //         rating: 3.9,
  //       },
  //       {
  //         id: 5,
  //         name: "Regional Medical",
  //         latitude: location.latitude + 0.03,
  //         longitude: location.longitude + 0.025,
  //         distance: 8.2,
  //         rating: 4.1,
  //       },
  //       {
  //         id: 6,
  //         name: "Children's Hospital",
  //         latitude: location.latitude - 0.025,
  //         longitude: location.longitude - 0.015,
  //         distance: 12.4,
  //         rating: 4.7,
  //       },
  //       {
  //         id: 7,
  //         name: "University Hospital",
  //         latitude: location.latitude + 0.04,
  //         longitude: location.longitude - 0.03,
  //         distance: 15.8,
  //         rating: 4.4,
  //       },
  //       {
  //         id: 8,
  //         name: "Memorial Hospital",
  //         latitude: location.latitude - 0.035,
  //         longitude: location.longitude + 0.04,
  //         distance: 18.3,
  //         rating: 4.0,
  //       },
  //       {
  //         id: 9,
  //         name: "Specialty Clinic",
  //         latitude: location.latitude + 0.05,
  //         longitude: location.longitude + 0.045,
  //         distance: 22.6,
  //         rating: 4.6,
  //       },
  //     ];

  //     // Filter hospitals within the selected radius
  //     const filtered = simulatedHospitals.filter(
  //       (hospital) => hospital.distance <= radius
  //     );
  //     setNearbyHospitals(filtered);
  //     setIsLoadingHospitals(false);
  //   }, 1000);
  // };



  //   // Add a useEffect to handle auth state changes
  // useEffect(() => {
  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange(async (event, session) => {
  //     console.log("Auth state changed:", event);

  //     if (event === "PASSWORD_RECOVERY") {
  //       // Handle password recovery
  //     } else if (event === "USER_UPDATED") {
  //       // Specifically handle password updates
  //       await fetchUserProfile();
  //       refreshScreen();
  //     } else if (event === "SIGNED_OUT") {
  //       setUserProfile(null);
  //       navigation.reset({
  //         index: 0,
  //         routes: [{ name: "Onboarding" }],
  //       });
  //     }
  //   });

  //   return () => subscription.unsubscribe();
  // }, [navigation]);

  // Add a useEffect to handle screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Refresh user profile when screen comes into focus
      if (user) {
        fetchUserProfile();
      }
    });

    return unsubscribe;
  }, [navigation, user, fetchUserProfile]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (!user || !userProfile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
        <ActivityIndicator
          size="small"
          color="#4A90E2"
          style={{ marginTop: 10 }}
        />
      </View>
    );
  }

  const userTypeDisplay = userProfile.user_type
    ? userProfile.user_type.charAt(0).toUpperCase() +
      userProfile.user_type.slice(1)
    : "User";

  return (
    <View style={styles.container}>
      {/* Modern flat header design */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {(userProfile.full_name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.greetingContainer}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.greetingText}>Welcome back</Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => navigation.navigate('ProfileEdit')}
                >
                  <Feather name="edit-2" size={16} color="#4A90E2" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>
                {userProfile.full_name || "User"}
              </Text>
              <Text style={styles.userType}>{userTypeDisplay}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.signOutButton}
            // onPress={async () => {
            //   await signOut();
            //   navigation.replace("Onboarding");
            // }}
            onPress={async () => {
              try {
                await signOut(); // Wait for sign-out to complete
                navigation.replace("Onboarding"); // Then navigate
              } catch (error) {
                console.error("Sign out failed:", error);
                Alert.alert("Error", "Failed to sign out. Please try again.");
              }
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

 

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Health Services</Text>
          <Text style={styles.sectionSubtitle}>
            Access healthcare at your fingertips
          </Text>

          <View style={styles.servicesGrid}>
            {/* First row */}
            <View style={styles.serviceRow}>
              <TouchableOpacity
                style={[styles.serviceCard, styles.doctorCard]}
                onPress={() => navigation.navigate("DoctorAppointment")}
              >
                <View style={styles.serviceIconContainer}>
                  <Ionicons name="medical" size={28} color="#fff" />
                </View>
                <Text style={styles.serviceTitle}>Doctor</Text>
                <Text style={styles.serviceSubtitle}>Appointment</Text>
                <Text style={styles.serviceDescription}>
                  Book with specialists
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceCard, styles.labCard]}
                onPress={() => navigation.navigate("LabTest")}
              >
                <View style={styles.serviceIconContainer}>
                  <Ionicons name="flask" size={28} color="#fff" />
                </View>
                <Text style={styles.serviceTitle}>Lab</Text>
                <Text style={styles.serviceSubtitle}>Tests</Text>
                <Text style={styles.serviceDescription}>
                  Diagnostic services
                </Text>
              </TouchableOpacity>
            </View>

            {/* Second row */}
            <View style={styles.serviceRow}>
              <TouchableOpacity
                style={[styles.serviceCard, styles.pharmacyCard]}
                onPress={() => navigation.navigate("Pharmacy")}
              >
                <View style={styles.serviceIconContainer}>
                  <Ionicons name="medkit" size={28} color="#fff" />
                </View>
                <Text style={styles.serviceTitle}>Pharmacy</Text>
                <Text style={styles.serviceSubtitle}>Online</Text>
                <Text style={styles.serviceDescription}>Order medicines</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.serviceCard, styles.staffCard]}
                onPress={() => navigation.navigate("HireMedicalStaff")}
              >
                <View style={styles.serviceIconContainer}>
                  <Ionicons name="people" size={28} color="#fff" />
                </View>
                <Text style={styles.serviceTitle}>Medical</Text>
                <Text style={styles.serviceSubtitle}>Staff</Text>
                <Text style={styles.serviceDescription}>
                  Hire professionals
                </Text>
              </TouchableOpacity>
            </View>

            {/* Third row */}
            {/* <View style={styles.serviceRow}>
              <TouchableOpacity
                style={styles.chatbtnCard}
                onPress={() => navigation.navigate("Pharmacy")}
              >
                <View>
                  <Ionicons name="chatbubbles" size={28} color="#fff" />
                </View>
                <View>
                  <Text style={styles.serviceTitle}>Chat With AI</Text>
                </View>
              </TouchableOpacity>
            </View> */}
          </View>
        </View>
      </ScrollView>

      {/* Floating Chat Icon Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={() => navigation.navigate("AIChat")}
      >
        <Ionicons name="chatbubbles" size={28} color="#fff" />
      </TouchableOpacity>

      
    </View>
  );
}

// Custom map style for a cleaner look
const mapStyle = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: 50,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  headerContainer: {
    backgroundColor: "#3A7BD5",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    marginHorizontal: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  userType: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginTop: 30,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  servicesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
  },
  servicesGrid: {
    gap: 15,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  serviceCard: {
    width: (width - 55) / 2,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
    overflow: "hidden",
  },
  chatbtnCard: {
    width: "100%",
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
    overflow: "hidden",
    flexDirection: "row", // ✅ this puts children in a row
    alignItems: "center", // ✅ vertical center alignment
    justifyContent: "center", // ✅ Horizontal center alignment
    gap: 10, // optional: spacing between icon and text (or use margin)
    backgroundColor: "#4F46E5",
  },
  doctorCard: {
    backgroundColor: "#4A90E2",
  },
  labCard: {
    backgroundColor: "#50C878",
  },
  pharmacyCard: {
    backgroundColor: "#E74C3C",
  },
  staffCard: {
    backgroundColor: "#F39C12",
  },
  aiChatCard: {
    backgroundColor: "#9B59B6", // Purple color for AI Chat
  },
  emptyCard: {
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  serviceSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 16,
  },
  mapSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  mapHeader: {
    marginBottom: 15,
  },
  mapContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  map: {
    width: "100%",
    height: 300,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4A90E2",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userLocationPulse: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(74, 144, 226, 0.3)",
  },
  hospitalMarker: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapOverlay: {
    position: "absolute",
    bottom: 15,
    left: 15,
    right: 15,
  },
  radiusControl: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
  },
  radiusValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A90E2",
    textAlign: "center",
    marginVertical: 5,
  },
  radiusSlider: {
    width: "100%",
    height: 30,
  },
  radiusLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  radiusLabelText: {
    fontSize: 12,
    color: "#64748B",
  },
  hospitalsContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  hospitalsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  hospitalsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  hospitalsList: {
    paddingRight: 20,
    marginBottom: 20,
  },
  hospitalCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hospitalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  hospitalIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  hospitalRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(243, 156, 18, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F39C12",
    marginLeft: 2,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 5,
    lineHeight: 18,
  },
  hospitalDistance: {
    fontSize: 12,
    color: "#64748B",
  },
  // Floating chat button styles
  floatingChatButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4F46E5", // Same purple color as the original AI Chat button
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  profileSettingsButton: {
    position: "absolute",
    marginTop: 30,
    top: Platform.OS === "ios" ? 50 : 30,
    right: 30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  editButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  editForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1e293b",
  },
  formDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  formDividerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginRight: 10,
  },
  errorMessage: {
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
