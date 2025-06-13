"use client";

import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../services/AuthContext";
import { BlurView } from "expo-blur";
import supabase from "../services/supabaseService";
import { Ionicons } from "@expo/vector-icons";


const { width, height } = Dimensions.get("window");

// Sample data for medical staff
const SAMPLE_STAFF = [
  {
    id: "1",
    full_name: "Dr. Sarah Johnson",
    role: "Cardiologist",
    department: "Cardiology",
    experience: 12,
    availability: "Available",
    perdaycost: 450,
    perhourcost: 85,
    contact_info: "+1 (555) 123-4567",
    image_url:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
    rating: 4.9,
    reviews: 124,
    specializations: ["Heart Disease", "Cardiac Surgery", "Vascular Health"],
    education: "Harvard Medical School",
    languages: ["English", "Spanish"],
  },
  {
    id: "2",
    full_name: "Dr. Michael Chen",
    role: "Neurologist",
    department: "Neurology",
    experience: 15,
    availability: "Available",
    perdaycost: 500,
    perhourcost: 95,
    contact_info: "+1 (555) 234-5678",
    image_url:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400",
    rating: 4.8,
    reviews: 98,
    specializations: ["Brain Disorders", "Stroke Treatment", "Neurosurgery"],
    education: "Johns Hopkins University",
    languages: ["English", "Mandarin"],
  },
  {
    id: "3",
    full_name: "Nurse Rebecca Miller",
    role: "Head Nurse",
    department: "Emergency",
    experience: 8,
    availability: "On Leave",
    perdaycost: 300,
    perhourcost: 60,
    contact_info: "+1 (555) 345-6789",
    image_url:
      "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400",
    rating: 4.7,
    reviews: 87,
    specializations: ["Emergency Care", "Trauma", "Critical Care"],
    education: "University of Pennsylvania",
    languages: ["English"],
  },
  {
    id: "4",
    full_name: "Dr. James Wilson",
    role: "Pediatrician",
    department: "Pediatrics",
    experience: 10,
    availability: "Available",
    perdaycost: 400,
    perhourcost: 75,
    contact_info: "+1 (555) 456-7890",
    image_url:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
    rating: 4.9,
    reviews: 156,
    specializations: ["Child Health", "Neonatal Care", "Adolescent Medicine"],
    education: "Stanford University",
    languages: ["English", "French"],
  },
  {
    id: "5",
    full_name: "Dr. Olivia Martinez",
    role: "Orthopedic Surgeon",
    department: "Orthopedics",
    experience: 14,
    availability: "Available",
    perdaycost: 550,
    perhourcost: 100,
    contact_info: "+1 (555) 567-8901",
    image_url:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400",
    rating: 4.8,
    reviews: 112,
    specializations: ["Joint Replacement", "Sports Medicine", "Trauma Surgery"],
    education: "Yale University",
    languages: ["English", "Spanish"],
  },
  {
    id: "6",
    full_name: "Dr. David Kim",
    role: "Anesthesiologist",
    department: "Anesthesiology",
    experience: 11,
    availability: "Unavailable",
    perdaycost: 480,
    perhourcost: 90,
    contact_info: "+1 (555) 678-9012",
    image_url:
      "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400",
    rating: 4.7,
    reviews: 78,
    specializations: [
      "General Anesthesia",
      "Pain Management",
      "Regional Anesthesia",
    ],
    education: "Columbia University",
    languages: ["English", "Korean"],
  },
];

// Sample data for bookings
const SAMPLE_BOOKINGS = [
  {
    id: "1",
    patient_id: "user123",
    medical_staff_id: "1",
    full_name: "Dr. Sarah Johnson",
    role: "Cardiologist",
    department: "Cardiology",
    booking_date: "2025-06-15T10:00:00",
    status: "confirmed",
    created_at: "2025-06-01T14:30:00",
  },
  {
    id: "2",
    patient_id: "user123",
    medical_staff_id: "4",
    full_name: "Dr. James Wilson",
    role: "Pediatrician",
    department: "Pediatrics",
    booking_date: "2025-06-18T14:30:00",
    status: "pending",
    created_at: "2025-06-02T09:15:00",
  },
  {
    id: "3",
    patient_id: "user123",
    medical_staff_id: "5",
    full_name: "Dr. Olivia Martinez",
    role: "Orthopedic Surgeon",
    department: "Orthopedics",
    booking_date: "2025-05-30T11:00:00",
    status: "completed",
    created_at: "2025-05-20T16:45:00",
  },
];

export default function HireMedicalStaffScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("staff");
  const [medicalStaff, setMedicalStaff] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingsError, setBookingsError] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("day");
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingDateString, setBookingDateString] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [bookingTimeString, setBookingTimeString] = useState("12:00");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const scrollY = useRef(new Animated.Value(0)).current;

  // Departments for filtering
  const departments = [
    { name: "All", icon: "th-large" },
    { name: "Cardiology", icon: "heart" },
    { name: "Neurology", icon: "brain" },
    { name: "Emergency", icon: "medkit" },
    { name: "Pediatrics", icon: "child" },
    { name: "Orthopedics", icon: "bone" },
    { name: "Anesthesiology", icon: "user-nurse" },
  ];

  // Animation for header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 100],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [0, 0.7, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    fetchMyBookings(); // Initial fetch
  }, [fetchMyBookings]);


  useEffect(() => {
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    fetchMedicalStaff();
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  useEffect(() => {
    if (medicalStaff.length > 0) {
      filterStaff();
    }
  }, [medicalStaff, searchQuery, selectedDepartment]);

  const filterStaff = () => {
    let filtered = [...medicalStaff];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (staff) =>
          staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staff.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by department
    if (selectedDepartment !== "All") {
      filtered = filtered.filter(
        (staff) => staff.department === selectedDepartment
      );
    }

    setFilteredStaff(filtered);
  };

  const fetchMedicalStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch medical staff from Supabase
      const { data, error } = await supabase
        .from("medical_staff")
        .select("*")
        .eq("availability", "Available")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match our component's expectations
      const transformedStaff = data.map((staff) => ({
        ...staff,
        rating: 4.5, // Default rating since we don't have this field in the database
        reviews: Math.floor(Math.random() * 100) + 50, // Random number of reviews between 50-150
        specializations:
          staff.role === "Doctor"
            ? ["General Practice", "Emergency Care"]
            : ["Nursing Care", "Patient Support"],
        education: "Medical School", // Default education
        languages: ["English"], // Default language
      }));

      setMedicalStaff(transformedStaff);
      setFilteredStaff(transformedStaff);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching medical staff:", error);
      setError("Failed to load medical staff. Please try again.");
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    if (!user) return;

    try {
      // setBookingsLoading(true);
      // setBookingsError(null);

      // // In a real app, this would fetch from Supabase
      // // For demo purposes, we'll use sample data with a delay
      // setTimeout(() => {
      //   setMyBookings(SAMPLE_BOOKINGS);
      //   setBookingsLoading(false);
      // }, 1000);

      setBookingsLoading(true);
      setBookingsError(null);

      const { data, error } = await supabase
        .from("booking_medical_staff")
        .select("*")
        .eq("patient_id", user.id)
        .order("booking_date", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setMyBookings(data);
      }
      setBookingsLoading(false);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookingsError("Failed to load your bookings. Please try again.");
      setBookingsLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              // First update the UI for immediate feedback
              setMyBookings((prevBookings) =>
                prevBookings.filter((booking) => booking.id !== appointmentId)
              );

              // Then attempt to delete from Supabase
              const { error } = await supabase
                .from("booking_medical_staff")
                .delete()
                .eq("id", appointmentId);

              if (error) {
                // If there's an error, revert the UI change
                setMyBookings((prevBookings) => [
                  ...prevBookings,
                  prevBookings.find((booking) => booking.id === appointmentId),
                ]);
                throw error;
              }

              Alert.alert("Success", "Appointment cancelled successfully");
            } catch (error) {
              console.error("Error cancelling appointment:", error.message);
              Alert.alert(
                "Error",
                `Failed to cancel appointment: ${error.message}`
              );
            }
          },
        },
      ]
    );
  };

  const handleHire = () => {
    setShowModal(false);
    setShowBookingModal(true);
  };

  const handleBooking = async () => {
    if (!selectedStaff) return;

    if (!bookingDateString || !bookingTimeString) {
      Alert.alert(
        "Invalid Date",
        "Please enter both date and time for your booking."
      );
      return;
    }

    try {
      const dateTimeString = `${bookingDateString}T${bookingTimeString}`;
      const newBookingDate = new Date(dateTimeString);

      if (isNaN(newBookingDate.getTime())) {
        Alert.alert("Invalid Date", "Please enter a valid date and time.");
        return;
      }

      setBookingDate(newBookingDate);
      setIsSubmittingBooking(true);

      const { data, error } = await supabase
        .from("booking_medical_staff")
        .insert([
          {
            patient_id: user.id,
            medical_staff_id: selectedStaff.id,
            full_name: selectedStaff.full_name,
            department: selectedStaff.department,
            role: selectedStaff.role,
            booking_date: newBookingDate.toISOString(),
            contact_info: selectedStaff.contact_info,
            status: "pending",
          },
        ]);

      if (error) throw error;

      setShowBookingModal(false);
      setBookingNotes("");

      // Refresh bookings if on the bookings tab
      if (activeTab === "bookings") {
        fetchMyBookings();
      }

      Alert.alert(
        "Booking Successful",
        `You have successfully booked ${
          selectedStaff.full_name
        } for ${newBookingDate.toLocaleDateString()} at ${newBookingDate.toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        )}.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error booking staff:", error);
      Alert.alert(
        "Booking Failed",
        "There was an error processing your booking. Please try again."
      );
      setIsSubmittingBooking(false);
    }
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case "Available":
        return "#4CAF50";
      case "On Leave":
        return "#FF9800";
      default:
        return "#F44336";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#4CAF50";
      case "completed":
        return "#2196F3";
      case "cancelled":
        return "#F44336";
      default:
        return "#FF9800";
    }
  };

  const getDepartmentIcon = (department) => {
    const dept = departments.find((d) => d.name === department);
    return dept ? dept.icon : "medical-bag";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderStaffCard = ({ item, index }) => {
    // Calculate animation delay based on index
    const delay = index * 100;

    return (
      <Animated.View
        style={[
          styles.staffCardContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: Animated.multiply(
                  slideAnim,
                  new Animated.Value(1 + index * 0.1)
                ),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.staffCard}
          onPress={() => {
            setSelectedStaff(item);
            setShowModal(true);
          }}
          activeOpacity={0.95}
          accessibilityLabel={`View details for ${item.full_name}, ${item.role}`}
          accessibilityRole="button"
        >
          <View style={styles.staffCardContent}>
            <View style={styles.staffImageSection}>
              <View style={styles.staffImageContainer}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.staffImage}
                  />
                ) : (
                  <View style={styles.defaultImageContainer}>
                    <FontAwesome5 name="user-md" size={30} color="#F39C12" />
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.availabilityBadge,
                  { backgroundColor: getAvailabilityColor(item.availability) },
                ]}
              >
                <Text style={styles.availabilityText}>{item.availability}</Text>
              </View>
            </View>

            <View style={styles.staffInfo}>
              <Text style={styles.staffName} numberOfLines={1}>
                {item.full_name}
              </Text>
              <Text style={styles.staffRole}>{item.role}</Text>

              <View style={styles.staffDetailRow}>
                <View style={styles.staffDetailItem}>
                  <FontAwesome5
                    name={getDepartmentIcon(item.department)}
                    size={14}
                    color="#F39C12"
                    solid
                  />
                  <Text style={styles.staffDetailText} numberOfLines={1}>
                    {item.department}
                  </Text>
                </View>

                <View style={styles.staffDetailItem}>
                  <FontAwesome5 name="medal" size={14} color="#F39C12" solid />
                  <Text style={styles.staffDetailText}>
                    {item.experience} yrs
                  </Text>
                </View>
              </View>

              <View style={styles.ratingContainer}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FontAwesome5
                      key={star}
                      name="star"
                      size={12}
                      color={
                        star <= Math.floor(item.rating) ? "#F39C12" : "#E0E0E0"
                      }
                      solid
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {item.rating} ({item.reviews})
                </Text>
              </View>

              <View style={styles.priceContainer}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Per Day</Text>
                  <Text style={styles.priceValue}>
                    Rs. {Number.parseFloat(item.perdaycost).toFixed(0)}
                  </Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceItem}>
                  <Text style={styles.priceLabel}>Per Hour</Text>
                  <Text style={styles.priceValue}>
                    Rs. {Number.parseFloat(item.perhourcost).toFixed(0)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.hireButton}
                onPress={() => {
                  setSelectedStaff(item);
                  setShowModal(true);
                }}
                accessibilityLabel={`Hire ${item.full_name}`}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={["#F39C12", "#E67E22"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.hireButtonGradient}
                >
                  <Text style={styles.hireButtonText}>Hire Now</Text>
                  <FontAwesome5 name="arrow-right" size={14} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderBookingCard = ({ item, index }) => {
    return (
      <ScrollView>
        <Animated.View
          style={[
            styles.bookingCardContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: Animated.multiply(
                    slideAnim,
                    new Animated.Value(1 + index * 0.1)
                  ),
                },
              ],
            },
          ]}
        >
          <View style={styles.bookingCard}>
            <View style={styles.bookingCardHeader}>
              <View style={styles.bookingHeaderLeft}>
                <View style={styles.bookingAvatarContainer}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.bookingAvatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={["#F5F5F5", "#E0E0E0"]}
                      style={styles.bookingAvatarGradient}
                    >
                      <FontAwesome5
                        name="user-md"
                        size={20}
                        color="#F39C12"
                        solid
                      />
                    </LinearGradient>
                  )}
                </View>
                <View style={styles.bookingHeaderInfo}>
                  <Text style={styles.bookingStaffName} numberOfLines={1}>
                    {item.full_name}
                  </Text>
                  <Text style={styles.bookingStaffRole}>{item.role}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.bookingStatusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.bookingStatusText}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.bookingCardBody}>
              <View style={styles.bookingDetailRow}>
                <View style={styles.bookingDetailItem}>
                  {/* <FontAwesome5
                  name={getDepartmentIcon(item.department)}
                  size={14}
                  color="#757575"
                  solid
                /> */}
                  <Text style={styles.bookingDetailText}>
                    {item.department}
                  </Text>
                </View>
                <View style={styles.bookingDetailItem}>
                  <FontAwesome5
                    name="calendar-alt"
                    size={14}
                    color="#757575"
                    solid
                  />
                  <Text style={styles.bookingDetailText}>
                    {formatDate(item.booking_date)}
                  </Text>
                </View>
                <View style={styles.bookingDetailItem}>
                  <FontAwesome5 name="clock" size={14} color="#757575" solid />
                  <Text style={styles.bookingDetailText}>
                    {formatTime(item.booking_date)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookingActions}>
                {/* <TouchableOpacity
                style={[styles.bookingActionButton, styles.rescheduleButton]}
                accessibilityLabel="Reschedule appointment"
                accessibilityRole="button"
              >
                <FontAwesome5 name="calendar-alt" size={14} color="#F39C12" />
                <Text style={styles.rescheduleButtonText}>Reschedule</Text>
              </TouchableOpacity> */}

                <TouchableOpacity
                  style={[styles.bookingActionButton, styles.cancelButton]}
                  onPress={() => handleCancelAppointment(item.id)}
                  accessibilityLabel="Cancel appointment"
                  accessibilityRole="button"
                >
                  <FontAwesome5 name="times" size={14} color="#F44336" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderDepartmentItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.departmentButton,
        selectedDepartment === item.name && styles.selectedDepartmentButton,
      ]}
      onPress={() => setSelectedDepartment(item.name)}
      accessibilityLabel={`Filter by ${item.name} department`}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedDepartment === item.name }}
    >
      <LinearGradient
        colors={
          selectedDepartment === item.name
            ? ["#F39C12", "#E67E22"]
            : ["#FFFFFF", "#F5F5F5"]
        }
        style={styles.departmentButtonGradient}
      >
        <FontAwesome5
          name={item.icon}
          size={16}
          color={selectedDepartment === item.name ? "#FFF" : "#F39C12"}
          solid
        />
        <Text
          style={[
            styles.departmentButtonText,
            selectedDepartment === item.name &&
              styles.selectedDepartmentButtonText,
          ]}
        >
          {item.name}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmptyState = (type) => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <LinearGradient
          colors={["#F5F5F5", "#E0E0E0"]}
          style={styles.emptyStateIconGradient}
        >
          <FontAwesome5
            name={type === "staff" ? "user-md" : "calendar-check"}
            size={50}
            color="#BDBDBD"
            solid
          />
        </LinearGradient>
      </View>
      <Text style={styles.emptyStateTitle}>
        {type === "staff" ? "No Medical Staff Available" : "No Bookings Yet"}
      </Text>
      <Text style={styles.emptyStateDescription}>
        {type === "staff"
          ? "There are currently no medical staff members available for hire."
          : "You haven't made any bookings yet. Browse our medical staff to get started."}
      </Text>
      {type === "bookings" && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => setActiveTab("staff")}
          accessibilityLabel="Browse medical staff"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={["#F39C12", "#E67E22"]}
            style={styles.emptyStateButtonGradient}
          >
            <Text style={styles.emptyStateButtonText}>Browse Staff</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = (message) => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#F39C12" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );

  const renderErrorState = (errorMessage, retryFunction) => (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <FontAwesome5
          name="exclamation-circle"
          size={50}
          color="#F44336"
          solid
        />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={retryFunction}
          accessibilityLabel="Retry loading"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={["#F39C12", "#E67E22"]}
            style={styles.retryButtonGradient}
          >
            <FontAwesome5 name="redo" size={14} color="#fff" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.container}>
        {/* Animated Header */}
        <Animated.View style={[styles.header, { height: headerHeight }]}>
          <LinearGradient
            colors={["#FFFFFF", "#FFF8E1"]}
            style={styles.headerGradient}
          >
            {/* Top Navigation */}
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => navigation.pop()}
                style={styles.backButton}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <FontAwesome5 name="arrow-left" size={18} color="#333" />
              </TouchableOpacity>

              <Animated.View
                style={[
                  styles.headerTitleSmall,
                  { opacity: headerTitleOpacity },
                ]}
              >
                <Text style={styles.headerTitleSmallText}>Medical Staff</Text>
              </Animated.View>

              <TouchableOpacity
                onPress={fetchMyBookings}
                style={styles.notificationButton}
                accessibilityLabel="Refresh"
                accessibilityRole="button"
              >
                <Ionicons name="refresh" size={28} color="#007AFF" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>

            {/* Header Content */}
            <Animated.View
              style={[styles.headerContent, { opacity: headerOpacity }]}
            >
              <Text style={styles.headerTitle}>Medical Staff</Text>
              <Text style={styles.headerSubtitle}>
                Find and hire the best healthcare professionals
              </Text>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "staff" && styles.activeTab]}
            onPress={() => setActiveTab("staff")}
            accessibilityLabel="Staff list tab"
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "staff" }}
          >
            <FontAwesome5
              name="user-md"
              size={16}
              color={activeTab === "staff" ? "#F39C12" : "#757575"}
              solid
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "staff" && styles.activeTabText,
              ]}
            >
              Available Staff
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "bookings" && styles.activeTab]}
            onPress={() => setActiveTab("bookings")}
            accessibilityLabel="My bookings tab"
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "bookings" }}
          >
            <FontAwesome5
              name="calendar-check"
              size={16}
              color={activeTab === "bookings" ? "#F39C12" : "#757575"}
              solid
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "bookings" && styles.activeTabText,
              ]}
            >
              My Bookings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "staff" ? (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <FontAwesome5
                  name="search"
                  size={16}
                  color="#757575"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, role..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#9E9E9E"
                  accessibilityLabel="Search medical staff"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => setSearchQuery("")}
                    accessibilityLabel="Clear search"
                    accessibilityRole="button"
                  >
                    <FontAwesome5
                      name="times-circle"
                      size={16}
                      color="#757575"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Department Filters */}
            <View style={styles.departmentsContainer}>
              <FlatList
                data={departments}
                renderItem={renderDepartmentItem}
                keyExtractor={(item) => item.name}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.departmentsList}
              />
            </View>

            {/* Staff List */}
            {loading ? (
              renderLoadingState("Loading medical staff...")
            ) : error ? (
              renderErrorState(error, fetchMedicalStaff)
            ) : filteredStaff.length === 0 ? (
              renderEmptyState("staff")
            ) : (
              <Animated.FlatList
                data={filteredStaff}
                renderItem={renderStaffCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.staffList}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  {
                    useNativeDriver: false,
                  }
                )}
                scrollEventThrottle={16}
              />
            )}
          </>
        ) : (
          <>
            {/* Bookings List */}
            {bookingsLoading ? (
              renderLoadingState("Loading your bookings...")
            ) : bookingsError ? (
              renderErrorState(bookingsError, fetchMyBookings)
            ) : myBookings.length === 0 ? (
              renderEmptyState("bookings")
            ) : (
              <Animated.FlatList
                data={myBookings}
                renderItem={renderBookingCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.bookingsList}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  {
                    useNativeDriver: false,
                  }
                )}
                scrollEventThrottle={16}
              />
            )}
          </>
        )}

        {/* Staff Details Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowModal(false)}
        >
          <BlurView intensity={50} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Staff Details</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowModal(false)}
                  accessibilityLabel="Close modal"
                  accessibilityRole="button"
                >
                  <FontAwesome5 name="times" size={20} color="#333" />
                </TouchableOpacity>
              </View>

              {selectedStaff && (
                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.staffProfileHeader}>
                    <View style={styles.staffProfileImageContainer}>
                      {selectedStaff.image_url ? (
                        <Image
                          source={{ uri: selectedStaff.image_url }}
                          style={styles.staffProfileImage}
                        />
                      ) : (
                        <View style={styles.staffProfileDefaultImage}>
                          <FontAwesome5
                            name="user-md"
                            size={50}
                            color="#F39C12"
                          />
                        </View>
                      )}
                    </View>
                    <Text style={styles.staffProfileName}>
                      {selectedStaff.full_name}
                    </Text>
                    <Text style={styles.staffProfileRole}>
                      {selectedStaff.role}
                    </Text>

                    <View style={styles.staffProfileRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FontAwesome5
                          key={star}
                          name="star"
                          size={16}
                          color={
                            star <= Math.floor(selectedStaff.rating)
                              ? "#F39C12"
                              : "#E0E0E0"
                          }
                          solid
                          style={{ marginRight: 4 }}
                        />
                      ))}
                      <Text style={styles.staffProfileRatingText}>
                        {selectedStaff.rating} ({selectedStaff.reviews} reviews)
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.staffProfileAvailability,
                        {
                          backgroundColor: getAvailabilityColor(
                            selectedStaff.availability
                          ),
                        },
                      ]}
                    >
                      <FontAwesome5
                        name={
                          selectedStaff.availability === "Available"
                            ? "check-circle"
                            : "clock"
                        }
                        size={14}
                        color="#FFF"
                        solid
                      />
                      <Text style={styles.staffProfileAvailabilityText}>
                        {selectedStaff.availability}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.staffProfileDetails}>
                    <View style={styles.staffProfileSection}>
                      <Text style={styles.staffProfileSectionTitle}>
                        Professional Information
                      </Text>

                      <View style={styles.staffProfileDetailRow}>
                        <View style={styles.staffProfileDetailIcon}>
                          <FontAwesome5
                            name={getDepartmentIcon(selectedStaff.department)}
                            size={16}
                            color="#F39C12"
                            solid
                          />
                        </View>
                        <View style={styles.staffProfileDetailContent}>
                          <Text style={styles.staffProfileDetailLabel}>
                            Department
                          </Text>
                          <Text style={styles.staffProfileDetailValue}>
                            {selectedStaff.department}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.staffProfileDetailRow}>
                        <View style={styles.staffProfileDetailIcon}>
                          <FontAwesome5
                            name="medal"
                            size={16}
                            color="#F39C12"
                            solid
                          />
                        </View>
                        <View style={styles.staffProfileDetailContent}>
                          <Text style={styles.staffProfileDetailLabel}>
                            Experience
                          </Text>
                          <Text style={styles.staffProfileDetailValue}>
                            {selectedStaff.experience} years
                          </Text>
                        </View>
                      </View>

                      <View style={styles.staffProfileDetailRow}>
                        <View style={styles.staffProfileDetailIcon}>
                          <FontAwesome5
                            name="graduation-cap"
                            size={16}
                            color="#F39C12"
                            solid
                          />
                        </View>
                        <View style={styles.staffProfileDetailContent}>
                          <Text style={styles.staffProfileDetailLabel}>
                            Education
                          </Text>
                          <Text style={styles.staffProfileDetailValue}>
                            {selectedStaff.education}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.staffProfileDetailRow}>
                        <View style={styles.staffProfileDetailIcon}>
                          <FontAwesome5
                            name="language"
                            size={16}
                            color="#F39C12"
                            solid
                          />
                        </View>
                        <View style={styles.staffProfileDetailContent}>
                          <Text style={styles.staffProfileDetailLabel}>
                            Languages
                          </Text>
                          <Text style={styles.staffProfileDetailValue}>
                            {selectedStaff.languages.join(", ")}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.staffProfileDetailRow}>
                        <View style={styles.staffProfileDetailIcon}>
                          <FontAwesome5
                            name="phone-alt"
                            size={16}
                            color="#F39C12"
                            solid
                          />
                        </View>
                        <View style={styles.staffProfileDetailContent}>
                          <Text style={styles.staffProfileDetailLabel}>
                            Contact
                          </Text>
                          <Text style={styles.staffProfileDetailValue}>
                            {selectedStaff.contact_info}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.staffProfileSection}>
                      <Text style={styles.staffProfileSectionTitle}>
                        Specializations
                      </Text>
                      <View style={styles.specializationTags}>
                        {selectedStaff.specializations.map(
                          (specialization, index) => (
                            <View key={index} style={styles.specializationTag}>
                              <Text style={styles.specializationTagText}>
                                {specialization}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>

                    <View style={styles.staffProfileSection}>
                      <Text style={styles.staffProfileSectionTitle}>
                        Pricing Options
                      </Text>
                      <View style={styles.pricingOptions}>
                        <TouchableOpacity
                          style={[
                            styles.pricingOption,
                            selectedDuration === "day" &&
                              styles.selectedPricingOption,
                          ]}
                          onPress={() => setSelectedDuration("day")}
                          accessibilityLabel={`Select per day pricing: $${Number.parseFloat(
                            selectedStaff.perdaycost
                          ).toFixed(2)}`}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: selectedDuration === "day",
                          }}
                        >
                          <View style={styles.pricingOptionHeader}>
                            <FontAwesome5
                              name="calendar-day"
                              size={18}
                              color={
                                selectedDuration === "day"
                                  ? "#F39C12"
                                  : "#757575"
                              }
                              solid
                            />
                            <Text
                              style={[
                                styles.pricingOptionTitle,
                                selectedDuration === "day" &&
                                  styles.selectedPricingOptionTitle,
                              ]}
                            >
                              Per Day
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.pricingOptionPrice,
                              selectedDuration === "day" &&
                                styles.selectedPricingOptionPrice,
                            ]}
                          >
                            Rs. 
                            {Number.parseFloat(
                              selectedStaff.perdaycost
                            ).toFixed(2)}
                          </Text>
                          <Text style={styles.pricingOptionDescription}>
                            Full day service
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.pricingOption,
                            selectedDuration === "hour" &&
                              styles.selectedPricingOption,
                          ]}
                          onPress={() => setSelectedDuration("hour")}
                          accessibilityLabel={`Select per hour pricing: $${Number.parseFloat(
                            selectedStaff.perhourcost
                          ).toFixed(2)}`}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: selectedDuration === "hour",
                          }}
                        >
                          <View style={styles.pricingOptionHeader}>
                            <FontAwesome5
                              name="clock"
                              size={18}
                              color={
                                selectedDuration === "hour"
                                  ? "#F39C12"
                                  : "#757575"
                              }
                              solid
                            />
                            <Text
                              style={[
                                styles.pricingOptionTitle,
                                selectedDuration === "hour" &&
                                  styles.selectedPricingOptionTitle,
                              ]}
                            >
                              Per Hour
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.pricingOptionPrice,
                              selectedDuration === "hour" &&
                                styles.selectedPricingOptionPrice,
                            ]}
                          >
                            Rs. 
                            {Number.parseFloat(
                              selectedStaff.perhourcost
                            ).toFixed(2)}
                          </Text>
                          <Text style={styles.pricingOptionDescription}>
                            Hourly service
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.hireNowButton}
                      onPress={handleHire}
                      accessibilityLabel={`Hire ${selectedStaff.full_name}`}
                      accessibilityRole="button"
                      disabled={selectedStaff.availability !== "Available"}
                    >
                      <LinearGradient
                        colors={
                          selectedStaff.availability === "Available"
                            ? ["#F39C12", "#E67E22"]
                            : ["#BDBDBD", "#9E9E9E"]
                        }
                        style={styles.hireNowButtonGradient}
                      >
                        <FontAwesome5
                          name="user-plus"
                          size={16}
                          color="#FFF"
                          solid
                        />
                        <Text style={styles.hireNowButtonText}>
                          {selectedStaff.availability === "Available"
                            ? "Hire Now"
                            : "Currently Unavailable"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </BlurView>
        </Modal>

        {/* Booking Modal */}
        <Modal
          visible={showBookingModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowBookingModal(false)}
        >
          <BlurView intensity={50} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Schedule Appointment</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowBookingModal(false)}
                  accessibilityLabel="Close booking modal"
                  accessibilityRole="button"
                >
                  <FontAwesome5 name="times" size={20} color="#333" />
                </TouchableOpacity>
              </View>

              {selectedStaff && (
                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.bookingSummary}>
                    <Text style={styles.bookingSummaryTitle}>
                      Booking Summary
                    </Text>

                    <View style={styles.bookingSummaryContent}>
                      <View style={styles.bookingSummaryImageContainer}>
                        {selectedStaff.image_url ? (
                          <Image
                            source={{ uri: selectedStaff.image_url }}
                            style={styles.bookingSummaryImage}
                          />
                        ) : (
                          <View style={styles.bookingSummaryDefaultImage}>
                            <FontAwesome5
                              name="user-md"
                              size={30}
                              color="#F39C12"
                            />
                          </View>
                        )}
                      </View>

                      <View style={styles.bookingSummaryDetails}>
                        <Text style={styles.bookingSummaryName}>
                          {selectedStaff.full_name}
                        </Text>
                        <Text style={styles.bookingSummaryRole}>
                          {selectedStaff.role}
                        </Text>
                        <Text style={styles.bookingSummaryDepartment}>
                          {selectedStaff.department}
                        </Text>

                        <View style={styles.bookingSummaryPricing}>
                          <Text style={styles.bookingSummaryPricingLabel}>
                            {selectedDuration === "day"
                              ? "Day Rate:"
                              : "Hour Rate:"}
                          </Text>
                          <Text style={styles.bookingSummaryPricingValue}>
                            Rs. 
                            {selectedDuration === "day"
                              ? Number.parseFloat(
                                  selectedStaff.perdaycost
                                ).toFixed(2)
                              : Number.parseFloat(
                                  selectedStaff.perhourcost
                                ).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.bookingForm}>
                    <Text style={styles.bookingFormTitle}>
                      Schedule Details
                    </Text>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Date</Text>
                      <View style={styles.formInputContainer}>
                        <FontAwesome5
                          name="calendar-alt"
                          size={16}
                          color="#757575"
                          style={styles.formInputIcon}
                        />
                        <TextInput
                          style={styles.formInput}
                          value={bookingDateString}
                          onChangeText={setBookingDateString}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#9E9E9E"
                          accessibilityLabel="Booking date"
                        />
                      </View>
                      <Text style={styles.formHelperText}>
                        Format: YYYY-MM-DD (e.g., 2025-06-15)
                      </Text>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Time</Text>
                      <View style={styles.formInputContainer}>
                        <FontAwesome5
                          name="clock"
                          size={16}
                          color="#757575"
                          style={styles.formInputIcon}
                        />
                        <TextInput
                          style={styles.formInput}
                          value={bookingTimeString}
                          onChangeText={setBookingTimeString}
                          placeholder="HH:MM"
                          placeholderTextColor="#9E9E9E"
                          accessibilityLabel="Booking time"
                        />
                      </View>
                      <Text style={styles.formHelperText}>
                        Format: HH:MM (e.g., 14:30 for 2:30 PM)
                      </Text>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Additional Notes</Text>
                      <View style={styles.formInputContainer}>
                        <FontAwesome5
                          name="sticky-note"
                          size={16}
                          color="#757575"
                          style={styles.formInputIcon}
                        />
                        <TextInput
                          style={[styles.formInput, styles.formTextarea]}
                          value={bookingNotes}
                          onChangeText={setBookingNotes}
                          placeholder="Any special requirements or notes..."
                          placeholderTextColor="#9E9E9E"
                          multiline={true}
                          numberOfLines={4}
                          textAlignVertical="top"
                          accessibilityLabel="Additional notes"
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.confirmBookingButton,
                        (!bookingDateString ||
                          !bookingTimeString ||
                          isSubmittingBooking) &&
                          styles.disabledButton,
                      ]}
                      onPress={handleBooking}
                      disabled={
                        !bookingDateString ||
                        !bookingTimeString ||
                        isSubmittingBooking
                      }
                      accessibilityLabel="Confirm booking"
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled:
                          !bookingDateString ||
                          !bookingTimeString ||
                          isSubmittingBooking,
                      }}
                    >
                      <LinearGradient
                        colors={
                          !bookingDateString ||
                          !bookingTimeString ||
                          isSubmittingBooking
                            ? ["#BDBDBD", "#9E9E9E"]
                            : ["#F39C12", "#E67E22"]
                        }
                        style={styles.confirmBookingButtonGradient}
                      >
                        {isSubmittingBooking ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <FontAwesome5
                              name="check-circle"
                              size={16}
                              color="#FFF"
                              solid
                            />
                            <Text style={styles.confirmBookingButtonText}>
                              Confirm Booking
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </BlurView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: 25,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    width: "100%",
    overflow: "hidden",
  },
  headerGradient: {
    flex: 1,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    },
  headerTitleSmall: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerTitleSmallText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#757575",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 5,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFF8E1",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#757575",
    marginLeft: 8,
  },
  activeTabText: {
    color: "#F39C12",
  },
  searchContainer: {
    paddingHorizontal: 20,
    // marginTop: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 3,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearSearchButton: {
    padding: 5,
  },
  departmentsContainer: {
    marginBottom: 15,
  },
  departmentsList: {
    paddingHorizontal: 15,
  },
  departmentButton: {
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
  departmentButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
  },
  departmentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  selectedDepartmentButton: {
    elevation: 3,
    shadowColor: "#F39C12",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  selectedDepartmentButtonText: {
    color: "#FFF",
  },
  staffList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  staffCardContainer: {
    marginBottom: 15,
  },
  staffCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  staffCardContent: {
    padding: 15,
  },
  staffImageSection: {
    position: "relative",
    alignItems: "center",
    marginBottom: 15,
  },
  staffImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#FFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  staffImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  defaultImageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  availabilityBadge: {
    position: "absolute",
    bottom: 0,
    right: "30%",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  availabilityText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  staffInfo: {
    alignItems: "center",
  },
  staffName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  staffRole: {
    fontSize: 16,
    color: "#F39C12",
    marginBottom: 10,
    textAlign: "center",
  },
  staffDetailRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  staffDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  staffDetailText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  ratingStars: {
    flexDirection: "row",
    marginRight: 5,
  },
  ratingText: {
    fontSize: 14,
    color: "#757575",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    width: "100%",
    paddingHorizontal: 10,
  },
  priceItem: {
    flex: 1,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  priceDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 15,
  },
  hireButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  hireButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  hireButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  bookingsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bookingCardContainer: {
    marginBottom: 15,
  },
  bookingCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  bookingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  bookingHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bookingAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginRight: 15,
  },
  bookingAvatarGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  bookingHeaderInfo: {
    flex: 1,
  },
  bookingStaffName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  bookingStaffRole: {
    fontSize: 14,
    color: "#F39C12",
  },
  bookingStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bookingStatusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  bookingCardBody: {
    padding: 15,
  },
  bookingDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  bookingDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bookingDetailText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 6,
  },
  bookingActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  bookingActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  rescheduleButton: {
    backgroundColor: "#FFF8E1",
  },
  rescheduleButtonText: {
    color: "#F39C12",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: "#FFEBEE",
  },
  cancelButtonText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#757575",
    marginTop: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorContent: {
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 10,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  retryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateIconContainer: {
    marginBottom: 20,
  },
  emptyStateIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 25,
  },
  emptyStateButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyStateButtonGradient: {
    paddingHorizontal: 25,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: height * 0.1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    flex: 1,
  },
  staffProfileHeader: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#FFF8E1",
  },
  staffProfileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#FFF",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 15,
  },
  staffProfileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  staffProfileDefaultImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  staffProfileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
  },
  staffProfileRole: {
    fontSize: 18,
    color: "#F39C12",
    marginBottom: 10,
    textAlign: "center",
  },
  staffProfileRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  staffProfileRatingText: {
    fontSize: 16,
    color: "#757575",
    marginLeft: 8,
  },
  staffProfileAvailability: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  staffProfileAvailabilityText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
  staffProfileDetails: {
    padding: 20,
  },
  staffProfileSection: {
    marginBottom: 25,
  },
  staffProfileSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  staffProfileDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  staffProfileDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF8E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  staffProfileDetailContent: {
    flex: 1,
  },
  staffProfileDetailLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 2,
  },
  staffProfileDetailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  specializationTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  specializationTag: {
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  specializationTagText: {
    fontSize: 14,
    color: "#F39C12",
    fontWeight: "600",
  },
  pricingOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pricingOption: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedPricingOption: {
    backgroundColor: "#FFF8E1",
    borderColor: "#F39C12",
  },
  pricingOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  pricingOptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  selectedPricingOptionTitle: {
    color: "#F39C12",
  },
  pricingOptionPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  selectedPricingOptionPrice: {
    color: "#F39C12",
  },
  pricingOptionDescription: {
    fontSize: 14,
    color: "#757575",
  },
  hireNowButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  hireNowButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  hireNowButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  bookingSummary: {
    backgroundColor: "#FFF8E1",
    padding: 20,
  },
  bookingSummaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  bookingSummaryContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookingSummaryImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#FFF",
    marginRight: 15,
  },
  bookingSummaryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bookingSummaryDefaultImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  bookingSummaryDetails: {
    flex: 1,
  },
  bookingSummaryName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  bookingSummaryRole: {
    fontSize: 16,
    color: "#F39C12",
    marginBottom: 4,
  },
  bookingSummaryDepartment: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  bookingSummaryPricing: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookingSummaryPricingLabel: {
    fontSize: 14,
    color: "#757575",
    marginRight: 8,
  },
  bookingSummaryPricingValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F39C12",
  },
  bookingForm: {
    padding: 20,
  },
  bookingFormTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  formInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  formInputIcon: {
    marginRight: 10,
  },
  formInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  formTextarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  formHelperText: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 5,
    fontStyle: "italic",
  },
  confirmBookingButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmBookingButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  confirmBookingButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
