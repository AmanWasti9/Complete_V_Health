"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import supabase from "../services/supabaseService";
import { useAuth } from "../services/AuthContext";

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window");

// Primary color theme
const COLORS = {
  primary: "#4A90E2",
  primaryLight: "#6BA3E8",
  primaryDark: "#3A7BC8",
  secondary: "#F8FBFF",
  accent: "#FF6B6B",
  success: "#4ECDC4",
  warning: "#FFE66D",
  background: "#FAFBFC",
  surface: "#FFFFFF",
  text: "#2C3E50",
  textSecondary: "#7F8C8D",
  border: "#E8EDF3",
  shadow: "rgba(74, 144, 226, 0.15)",
};

// Default avatar in case doctor doesn't have an image
const DEFAULT_AVATAR = "https://randomuser.me/api/portraits/lego/1.jpg";

export default function DoctorAppointmentScreen({ navigation }) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [appointmentBooked, setAppointmentBooked] = useState(false);
  const [appointmentReason, setAppointmentReason] = useState("");
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [activeTab, setActiveTab] = useState("doctors");
  const [myAppointments, setMyAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState("All");
  const [modalAnimation] = useState(new Animated.Value(0));
  const [tabIndicatorPosition] = useState(new Animated.Value(0));
  const [headerAnimation] = useState(new Animated.Value(0));

  // List of specialties for filtering
  const specialties = [
    "All",
    "Fever",
    "Neurologist",
    "Dermatologist",
    "Orthopedic",
    "Pediatrician",
  ];

  useEffect(() => {
    if (activeTab === "doctors") {
      fetchDoctors();
    } else if (activeTab === "appointments" && user) {
      fetchMyAppointments();
    }
  }, [activeTab, user]);

  useEffect(() => {
    // Animate tab indicator
    Animated.timing(tabIndicatorPosition, {
      toValue: activeTab === "doctors" ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  useEffect(() => {
    // Header entrance animation
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      // Fetch doctors from profiles table
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_type", "doctor");

      if (doctorsError) throw doctorsError;

      if (doctorsData && doctorsData.length > 0) {
        // For each doctor, fetch their availability
        const doctorsWithAvailability = await Promise.all(
          doctorsData.map(async (doctor) => {
            // Fetch availability for this doctor
            const { data: availabilityData, error: availabilityError } =
              await supabase
                .from("doctor_availability")
                .select("*")
                .eq("doctor_id", doctor.id);

            if (availabilityError) {
              console.error("Error fetching availability:", availabilityError);
              return {
                ...doctor,
                availableDates: [],
              };
            }

            // Transform availability data to match our UI format
            const availableDates = [];
            const dateMap = {};

            if (availabilityData && availabilityData.length > 0) {
              availabilityData.forEach((slot) => {
                if (slot.is_available) {
                  if (!dateMap[slot.date]) {
                    dateMap[slot.date] = { date: slot.date, slots: [] };
                    availableDates.push(dateMap[slot.date]);
                  }
                  dateMap[slot.date].slots.push(slot.time_slot);
                }
              });
            }

            return {
              id: doctor.id,
              name: doctor.full_name || "Dr. Unknown",
              specialty: doctor.specialty || "General Practitioner",
              rating: doctor.rating || 4.5,
              experience: doctor.experience || "5 years",
              image: doctor.avatar_url || DEFAULT_AVATAR,
              user_type: doctor.user_type,
              availableDates:
                availableDates.length > 0
                  ? availableDates
                  : [
                      // Fallback dates if no availability is set
                      { date: "2025-06-02", slots: ["09:00 AM", "11:30 AM"] },
                      { date: "2025-06-03", slots: ["10:00 AM", "01:30 PM"] },
                    ],
            };
          })
        );

        setDoctors(doctorsWithAvailability);
      } else {
        // If no doctors found, use dummy data
        setDoctors(DUMMY_DOCTORS);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      Alert.alert("Error", "Failed to load doctors");
      setDoctors(DUMMY_DOCTORS);
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setAppointmentReason("");
    setAppointmentBooked(false);
    setModalVisible(true);

    // Animate modal opening
    Animated.spring(modalAnimation, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    // Animate modal closing
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const handleDateSelection = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelection = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  const fetchMyAppointments = async () => {
    if (!user) return;

    setLoadingAppointments(true);
    try {
      // Fetch appointments for the current user
      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("appointments")
          .select(
            `
          id,
          doctor_id,
          appointment_date,
          appointment_time,
          reason,
          status,
          created_at
        `
          )
          .eq("patient_id", user.id)
          .order("appointment_date", { ascending: false });

      if (appointmentsError) throw appointmentsError;

      // Fetch doctor profiles for the appointments
      const doctorIds = [
        ...new Set(appointmentsData.map((app) => app.doctor_id)),
      ];
      const { data: doctorProfiles, error: doctorProfilesError } =
        await supabase
          .from("profiles")
          .select("id, full_name, specialty")
          .in("id", doctorIds);

      if (doctorProfilesError) throw doctorProfilesError;

      // Create a map of doctor IDs to their profiles
      const doctorMap = {};
      doctorProfiles.forEach((doctor) => {
        doctorMap[doctor.id] = doctor;
      });

      // Get current date for status comparison
      const currentDate = new Date();
      const today = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      const currentTime = currentDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      // Update appointment status based on date/time
      const formattedAppointments = appointmentsData.map((appointment) => {
        const doctor = doctorMap[appointment.doctor_id] || {
          full_name: "Unknown Doctor",
          specialty: "Unknown Specialty",
        };

        // Check if appointment is in the past
        const isPastAppointment =
          appointment.appointment_date < today ||
          (appointment.appointment_date === today &&
            appointment.appointment_time < currentTime);

        // Only update status to completed if it's not already confirmed or rejected
        let status = appointment.status;
        if (isPastAppointment && status === "pending") {
          status = "completed";
        }

        return {
          ...appointment,
          doctor_name: doctor.full_name,
          doctor_avatar: DEFAULT_AVATAR, // Use default avatar since avatar_url doesn't exist
          doctor_specialty: doctor.specialty || "General Practitioner",
          display_status: status,
        };
      });

      setMyAppointments(formattedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      Alert.alert("Error", "Failed to load your appointments");
      setMyAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) {
      Alert.alert("Error", "Please select all appointment details");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to book an appointment");
      return;
    }

    setBookingInProgress(true);

    try {
      // Send the booking data to Supabase
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert([
          {
            doctor_id: selectedDoctor.id,
            patient_id: user.id,
            appointment_date: selectedDate,
            appointment_time: selectedTimeSlot,
            reason: appointmentReason.trim() || "General consultation",
            status: "pending",
          },
        ])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      setAppointmentBooked(true);

      // Close modal after 2 seconds to show success message
      setTimeout(() => {
        closeModal();
        setSelectedDoctor(null);
        setSelectedDate(null);
        setSelectedTimeSlot(null);
        setAppointmentReason("");

        // If we're on the appointments tab, refresh the appointments
        if (activeTab === "appointments") {
          fetchMyAppointments();
        }
      }, 2000);
    } catch (error) {
      console.error("Error booking appointment:", error);
      Alert.alert("Error", "Failed to book appointment. Please try again.");
    } finally {
      setBookingInProgress(false);
    }
  };

  const navigateToChat = (doctor) => {
    navigation.navigate("DoctorPatientChat", { doctor });
  };

  const formatDate = (dateString) => {
    const options = { weekday: "short", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return COLORS.success;
      case "rejected":
        return COLORS.accent;
      case "completed":
        return COLORS.textSecondary;
      default:
        return COLORS.warning; // pending
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      case "completed":
        return "checkmark-done-circle";
      default:
        return "time"; // pending
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      specialtyFilter === "All" ||
      doctor.specialty.toLowerCase().includes(specialtyFilter.toLowerCase());

    return matchesSearch && matchesSpecialty;
  });

  const renderDoctorItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.doctorCard,
        {
          opacity: headerAnimation,
          transform: [
            {
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.doctorCardContent}
        activeOpacity={0.95}
        onPress={() => openBookingModal(item)}
      >
        <View style={styles.doctorImageContainer}>
          <Image
            source={{ uri: item.image || DEFAULT_AVATAR }}
            style={styles.doctorImage}
          />
          <View style={styles.onlineIndicator} />
        </View>

        <View style={styles.doctorInfo}>
          <View style={styles.doctorNameRow}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={COLORS.warning} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>

          <View style={styles.doctorMetaRow}>
            <View style={styles.specialtyContainer}>
              <MaterialIcons
                name="medical-services"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
            </View>
            <View style={styles.experienceContainer}>
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.experienceText}>{item.experience}</Text>
            </View>
          </View>

          <View style={styles.availabilityContainer}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.success}
            />
            <Text style={styles.availabilityText}>
              Available: {item.availableDates.length} days
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.doctorBtns}>
        <View style={styles.doctorActions}>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigateToChat(item)}
          >
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => openBookingModal(item)}
          >
            <Ionicons name="calendar" size={16} color={COLORS.surface} />
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderAppointmentItem = ({ item, index }) => {
    const statusColor = getStatusColor(item.display_status);
    const statusIcon = getStatusIcon(item.display_status);
    const formattedDate = formatDate(item.appointment_date);

    // Create doctor object for chat navigation
    const doctorObj = {
      id: item.doctor_id,
      full_name: item.doctor_name,
      specialty: item.doctor_specialty,
      avatar_url: item.doctor_avatar,
    };

    return (
      <Animated.View
        style={[
          styles.appointmentCard,
          {
            opacity: headerAnimation,
            transform: [
              {
                translateX: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View
          style={[
            styles.appointmentStatusBar,
            { backgroundColor: statusColor },
          ]}
        />

        <View style={styles.appointmentContent}>
          <View style={styles.appointmentHeader}>
            <View style={styles.appointmentDoctorImageContainer}>
              <Image
                source={{ uri: item.doctor_avatar }}
                style={styles.appointmentDoctorImage}
              />
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
            </View>

            <View style={styles.appointmentDoctorInfo}>
              <Text style={styles.appointmentDoctorName}>
                {item.doctor_name}
              </Text>
              <Text style={styles.appointmentDoctorSpecialty}>
                {item.doctor_specialty}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.appointmentChatButton}
              onPress={() => navigateToChat(doctorObj)
              }
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.appointmentDetails}>
            <View style={styles.appointmentDetailItem}>
              <View style={styles.appointmentDetailIcon}>
                <Ionicons name="calendar" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.appointmentDetailText}>{formattedDate}</Text>
            </View>

            <View style={styles.appointmentDetailItem}>
              <View style={styles.appointmentDetailIcon}>
                <Ionicons name="time" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.appointmentDetailText}>
                {item.appointment_time}
              </Text>
            </View>

            <View style={styles.appointmentDetailItem}>
              <View
                style={[
                  styles.appointmentDetailIcon,
                  { backgroundColor: `${statusColor}20` },
                ]}
              >
                <Ionicons name={statusIcon} size={16} color={statusColor} />
              </View>
              <Text
                style={[
                  styles.appointmentDetailText,
                  { color: statusColor, fontWeight: "600" },
                ]}
              >
                {item.display_status.charAt(0).toUpperCase() +
                  item.display_status.slice(1)}
              </Text>
            </View>
          </View>

          {item.reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>
          )}

          <Text style={styles.appointmentCreatedAt}>
            Booked on {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyDoctors = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <MaterialCommunityIcons
          name="doctor"
          size={80}
          color={COLORS.primary}
        />
      </View>
      <Text style={styles.emptyStateTitle}>No doctors found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  const renderEmptyAppointments = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <MaterialCommunityIcons
          name="calendar-blank"
          size={80}
          color={COLORS.primary}
        />
      </View>
      <Text style={styles.emptyStateTitle}>No appointments yet</Text>
      <Text style={styles.emptyStateText}>
        Book your first appointment with a doctor
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setActiveTab("doctors")}
      >
        <Text style={styles.emptyStateButtonText}>Find a Doctor</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSpecialtyFilter = () => (
    <View style={styles.specialtyFilterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "center", paddingVertical: 0 }}
        style={{ flexGrow: 0 }}
      >
        {specialties.map((specialty, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.specialtyChip,
              specialtyFilter === specialty && styles.specialtyChipActive,
            ]}
            onPress={() => setSpecialtyFilter(specialty)}
          >
            <Text
              style={[
                styles.specialtyChipText,
                specialtyFilter === specialty && styles.specialtyChipTextActive,
              ]}
            >
              {specialty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const translateY = modalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const tabIndicatorLeft = tabIndicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "50%"],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnimation,
            transform: [
              {
                translateY: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Doctor Appointments</Text>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => setShowSearch(!showSearch)}
        >
          <Ionicons
            name={showSearch ? "close" : "search"}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Search Bar */}
      {showSearch && (
        <Animated.View
          style={[
            styles.searchContainer,
            {
              opacity: headerAnimation,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors by name or specialty"
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("doctors")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "doctors" && styles.activeTabText,
            ]}
          >
            Find Doctors
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("appointments")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "appointments" && styles.activeTabText,
            ]}
          >
            My Appointments
          </Text>
        </TouchableOpacity>

        <Animated.View
          style={[styles.tabIndicator, { left: tabIndicatorLeft }]}
        />
      </View>

      {/* Content */}
      {activeTab === "doctors" ? (
        <View style={styles.contentContainer}>
          {/* Specialty Filter */}
          {renderSpecialtyFilter()}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Finding doctors for you...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredDoctors}
              renderItem={renderDoctorItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyDoctors}
            />
          )}
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {loadingAppointments ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>
                Loading your appointments...
              </Text>
            </View>
          ) : (
            <FlatList
              data={myAppointments}
              renderItem={renderAppointmentItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyAppointments}
            />
          )}
        </View>
      )}

      {/* Booking Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY }],
                opacity: modalAnimation,
              },
            ]}
          >
            {appointmentBooked ? (
              <View style={styles.successContainer}>
                <Animated.View
                  style={[
                    styles.successIconContainer,
                    {
                      transform: [
                        {
                          scale: modalAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={80}
                    color={COLORS.success}
                  />
                </Animated.View>
                <Text style={styles.successTitle}>Appointment Booked!</Text>
                <Text style={styles.successMessage}>
                  Your appointment with {selectedDoctor?.name} on{" "}
                  {selectedDate ? formatDate(selectedDate) : ""} at{" "}
                  {selectedTimeSlot} has been confirmed.
                </Text>
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={closeModal}
                >
                  <Text style={styles.successButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Book Appointment</Text>
                  <View style={{ width: 24 }} />
                </View>

                {selectedDoctor && (
                  <ScrollView
                    style={styles.bookingContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.doctorProfileCard}>
                      <Image
                        source={{ uri: selectedDoctor.image }}
                        style={styles.doctorProfileImage}
                      />
                      <View style={styles.doctorProfileInfo}>
                        <Text style={styles.doctorProfileName}>
                          {selectedDoctor.name}
                        </Text>
                        <Text style={styles.doctorProfileSpecialty}>
                          {selectedDoctor.specialty}
                        </Text>
                        <View style={styles.doctorProfileRating}>
                          <Ionicons
                            name="star"
                            size={16}
                            color={COLORS.warning}
                          />
                          <Text style={styles.doctorProfileRatingText}>
                            {selectedDoctor.rating}
                          </Text>
                          <Text style={styles.doctorProfileExperience}>
                            • {selectedDoctor.experience} exp
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={styles.sectionTitle}>Select Date</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.dateScrollContainer}
                    >
                      {selectedDoctor.availableDates.map((dateObj, index) => {
                        const isSelected = selectedDate === dateObj.date;
                        const date = new Date(dateObj.date);
                        const day = date.getDate();
                        const month = date.toLocaleString("default", {
                          month: "short",
                        });
                        const weekday = date.toLocaleString("default", {
                          weekday: "short",
                        });

                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.dateCard,
                              isSelected && styles.selectedDateCard,
                            ]}
                            onPress={() => handleDateSelection(dateObj.date)}
                          >
                            <Text
                              style={[
                                styles.dateMonth,
                                isSelected && styles.selectedDateText,
                              ]}
                            >
                              {month}
                            </Text>
                            <Text
                              style={[
                                styles.dateDay,
                                isSelected && styles.selectedDateText,
                              ]}
                            >
                              {day}
                            </Text>
                            <Text
                              style={[
                                styles.dateWeekday,
                                isSelected && styles.selectedDateText,
                              ]}
                            >
                              {weekday}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {selectedDate && (
                      <>
                        <Text style={styles.sectionTitle}>Select Time</Text>
                        <View style={styles.timeSlotContainer}>
                          {selectedDoctor.availableDates
                            .find((dateObj) => dateObj.date === selectedDate)
                            .slots.map((slot, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.timeSlot,
                                  selectedTimeSlot === slot &&
                                    styles.selectedTimeSlot,
                                ]}
                                onPress={() => handleTimeSlotSelection(slot)}
                              >
                                <Text
                                  style={[
                                    styles.timeSlotText,
                                    selectedTimeSlot === slot &&
                                      styles.selectedTimeSlotText,
                                  ]}
                                >
                                  {slot}
                                </Text>
                              </TouchableOpacity>
                            ))}
                        </View>
                      </>
                    )}

                    {selectedTimeSlot && (
                      <>
                        <Text style={styles.sectionTitle}>
                          Reason for Visit
                        </Text>
                        <View style={styles.reasonInputContainer}>
                          <TextInput
                            style={styles.reasonInput}
                            placeholder="Describe your symptoms or reason for visit"
                            placeholderTextColor={COLORS.textSecondary}
                            value={appointmentReason}
                            onChangeText={setAppointmentReason}
                            multiline
                            numberOfLines={4}
                          />
                        </View>
                      </>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        (!selectedDate ||
                          !selectedTimeSlot ||
                          bookingInProgress) &&
                          styles.disabledButton,
                      ]}
                      disabled={
                        !selectedDate || !selectedTimeSlot || bookingInProgress
                      }
                      onPress={bookAppointment}
                    >
                      {bookingInProgress ? (
                        <ActivityIndicator
                          color={COLORS.surface}
                          size="small"
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="calendar"
                            size={20}
                            color={COLORS.surface}
                            style={styles.confirmButtonIcon}
                          />
                          <Text style={styles.confirmButtonText}>
                            Confirm Appointment
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.secondary,
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.text,
  },
  clearButton: {
    marginLeft: 12,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    position: "relative",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 18,
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: "50%",
    height: 4,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  contentContainer: {
    flex: 1,
  },
  specialtyFilterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.surface,
    height: 75, // Fixed height to prevent stretching
  },
  specialtyChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 40, // Fixed height for consistency
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
    minWidth: 80, // Minimum width to prevent too narrow chips
  },
  specialtyChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  specialtyChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  specialtyChipTextActive: {
    color: COLORS.surface,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  doctorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  doctorCardContent: {
    flexDirection: "row",
    padding: 20,
  },
  doctorImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  doctorImage: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: COLORS.secondary,
  },
  onlineIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.warning}20`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.warning,
    marginLeft: 4,
  },
  doctorMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  experienceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  experienceText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: "600",
  },
  specialtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  availabilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  availabilityText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 8,
    fontWeight: "500",
  },
  doctorActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flex: 1,
  },
  chatButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 8,
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    flex: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    fontSize: 14,
    color: COLORS.surface,
    fontWeight: "600",
    marginLeft: 8,
  },
  appointmentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
    flexDirection: "row",
  },
  appointmentStatusBar: {
    width: 6,
  },
  appointmentContent: {
    flex: 1,
    padding: 20,
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  appointmentDoctorImageContainer: {
    position: "relative",
  },
  appointmentDoctorImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: COLORS.secondary,
  },
  statusDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  appointmentDoctorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  appointmentDoctorName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  appointmentDoctorSpecialty: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  appointmentChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 12,
  },
  appointmentDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  appointmentDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  reasonContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    lineHeight: 20,
  },
  appointmentCreatedAt: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: height * 0.9,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  bookingContainer: {
    flex: 1,
    padding: 20,
  },
  doctorProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  doctorProfileImage: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: COLORS.border,
  },
  doctorProfileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  doctorProfileName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  doctorProfileSpecialty: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 10,
    fontWeight: "600",
  },
  doctorProfileRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorProfileRatingText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.warning,
    marginLeft: 6,
    marginRight: 10,
  },
  doctorProfileExperience: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 20,
  },
  dateScrollContainer: {
    paddingBottom: 12,
  },
  dateCard: {
    width: 85,
    height: 110,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedDateCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dateMonth: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
  },
  dateDay: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  dateWeekday: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  selectedDateText: {
    color: COLORS.surface,
  },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 28,
    gap: 12,
  },
  timeSlot: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedTimeSlot: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  selectedTimeSlotText: {
    color: COLORS.surface,
  },
  reasonInputContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 28,
  },
  reasonInput: {
    padding: 20,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: "top",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 18,
    marginBottom: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmButtonIcon: {
    marginRight: 10,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.surface,
  },
  disabledButton: {
    backgroundColor: COLORS.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  successIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${COLORS.success}20`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 20,
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 40,
  },
  successButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.surface,
  },
  doctorMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  experienceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  experienceText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: "600",
  },
  specialtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
});
