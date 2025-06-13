"use client"

import { useState, useEffect, useRef } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  TextInput,
} from "react-native"
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import supabase from "../services/supabaseService"
import { useAuth } from "../services/AuthContext"

const { width, height } = Dimensions.get("window")

// Enhanced dummy data for labs with more comprehensive information
const LABS = [
  {
    id: "1",
    name: "HealthPlus Diagnostics",
    rating: 4.8,
    reviews: 1250,
    address: "123 Medical Avenue, Suite 101",
    distance: "2.3 km",
    image:
      "https://img.freepik.com/free-photo/medical-laboratory-with-modern-equipment_23-2149214013.jpg?size=626&ext=jpg",
    tests: ["Blood Test", "Urine Analysis", "Cholesterol Test", "Thyroid Panel", "Complete Blood Count"],
    specialties: ["Cardiology", "Endocrinology", "General Health"],
    openTime: "7:00 AM - 8:00 PM",
    verified: true,
    availableDates: [
      { date: "2025-06-02", slots: ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"] },
      { date: "2025-06-03", slots: ["10:00 AM", "01:30 PM", "04:00 PM", "05:30 PM"] },
      { date: "2025-06-04", slots: ["09:30 AM", "12:00 PM", "03:30 PM", "06:00 PM"] },
    ],
  },
  {
    id: "2",
    name: "CityLab Medical Center",
    rating: 4.7,
    reviews: 980,
    address: "456 Health Street, Building B",
    distance: "1.8 km",
    image:
      "https://img.freepik.com/free-photo/laboratory-equipment-medical-research_23-2149214012.jpg?size=626&ext=jpg",
    tests: ["Complete Blood Count", "Liver Function Test", "Kidney Function Test", "Glucose Test", "Lipid Profile"],
    specialties: ["Pathology", "Clinical Chemistry", "Hematology"],
    openTime: "6:30 AM - 9:00 PM",
    verified: true,
    availableDates: [
      { date: "2025-06-02", slots: ["10:00 AM", "01:00 PM", "03:30 PM"] },
      { date: "2025-06-03", slots: ["11:00 AM", "02:30 PM", "05:00 PM"] },
      { date: "2025-06-05", slots: ["09:00 AM", "12:30 PM", "04:00 PM"] },
    ],
  },
  {
    id: "3",
    name: "PrecisionDiagnostics Lab",
    rating: 4.9,
    reviews: 750,
    address: "789 Wellness Road",
    distance: "3.1 km",
    image:
      "https://img.freepik.com/free-photo/scientist-working-laboratory-with-test-tubes_23-2149214014.jpg?size=626&ext=jpg",
    tests: ["Allergy Testing", "Hormone Panel", "Vitamin D Test", "Iron Panel", "Autoimmune Panel"],
    specialties: ["Immunology", "Endocrinology", "Nutrition"],
    openTime: "8:00 AM - 7:00 PM",
    verified: true,
    availableDates: [
      { date: "2025-06-03", slots: ["09:30 AM", "12:00 PM", "03:00 PM"] },
      { date: "2025-06-04", slots: ["11:00 AM", "02:00 PM", "04:30 PM"] },
      { date: "2025-06-06", slots: ["10:00 AM", "01:30 PM", "05:00 PM"] },
    ],
  },
  {
    id: "4",
    name: "MetroHealth Laboratories",
    rating: 4.6,
    reviews: 1100,
    address: "321 Science Boulevard",
    distance: "4.2 km",
    image: "https://img.freepik.com/free-photo/scientist-with-petri-dish-laboratory_23-2149214016.jpg?size=626&ext=jpg",
    tests: ["COVID-19 Test", "STD Panel", "Lipid Profile", "Electrolyte Panel", "Tumor Markers"],
    specialties: ["Infectious Disease", "Oncology", "Cardiology"],
    openTime: "24/7 Available",
    verified: true,
    availableDates: [
      { date: "2025-06-02", slots: ["08:30 AM", "11:00 AM", "02:30 PM"] },
      { date: "2025-06-04", slots: ["10:30 AM", "01:00 PM", "03:30 PM"] },
      { date: "2025-06-05", slots: ["09:00 AM", "12:30 PM", "04:00 PM"] },
    ],
  },
  {
    id: "5",
    name: "Advanced Diagnostic Services",
    rating: 4.9,
    reviews: 650,
    address: "555 Healthcare Lane",
    distance: "2.7 km",
    image: "https://img.freepik.com/free-photo/scientist-working-modern-laboratory_23-2149214015.jpg?size=626&ext=jpg",
    tests: [
      "Genetic Testing",
      "Micronutrient Testing",
      "Food Sensitivity Test",
      "Heavy Metal Testing",
      "Metabolic Panel",
    ],
    specialties: ["Genetics", "Toxicology", "Nutrition"],
    openTime: "7:30 AM - 6:30 PM",
    verified: true,
    availableDates: [
      { date: "2025-06-03", slots: ["09:00 AM", "11:30 AM", "02:00 PM"] },
      { date: "2025-06-05", slots: ["10:00 AM", "01:30 PM", "04:00 PM"] },
      { date: "2025-06-06", slots: ["09:30 AM", "12:00 PM", "03:30 PM"] },
    ],
  },
]

export default function LabTestScreen({ navigation }) {
  const { user } = useAuth()
  const [selectedLab, setSelectedLab] = useState(null)
  const [selectedTest, setSelectedTest] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [appointmentBooked, setAppointmentBooked] = useState(false)
  const [bookingInProgress, setBookingInProgress] = useState(false)
  const [activeTab, setActiveTab] = useState("labs")
  const [myBookings, setMyBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLabs, setFilteredLabs] = useState(LABS)
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false)
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null)
  const [rescheduleTest, setRescheduleTest] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState(null)
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState(null)
  const [reschedulingInProgress, setReschedulingInProgress] = useState(false)

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scrollY = useRef(new Animated.Value(0)).current

  // Header animation
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 120],
    extrapolate: "clamp",
  })

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  })

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [0, 0.7, 1],
    extrapolate: "clamp",
  })

  useEffect(() => {
    // Entrance animation
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
    ]).start()
  }, [])

  useEffect(() => {
    if (user && activeTab === "bookings") {
      fetchMyLabBookings()
    }
  }, [user, activeTab])

  useEffect(() => {
    // Filter labs based on search query
    if (searchQuery.trim() === "") {
      setFilteredLabs(LABS)
    } else {
      const filtered = LABS.filter(
        (lab) =>
          lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lab.tests.some((test) => test.toLowerCase().includes(searchQuery.toLowerCase())) ||
          lab.specialties.some((specialty) => specialty.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredLabs(filtered)
    }
  }, [searchQuery])

  const fetchMyLabBookings = async () => {
    if (!user) return

    setLoadingBookings(true)
    try {
      const { data, error } = await supabase
        .from("lab_appointment")
        .select("*")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setMyBookings(data || [])
    } catch (error) {
      console.error("Error fetching lab bookings:", error)
      Alert.alert("Error", "Failed to load your lab test bookings")
    } finally {
      setLoadingBookings(false)
    }
  }

  const openBookingModal = (lab) => {
    if (!user) {
      Alert.alert("Login Required", "Please login to book a lab test")
      return
    }

    setSelectedLab(lab)
    setSelectedTest(null)
    setSelectedDate(null)
    setSelectedTimeSlot(null)
    setAppointmentBooked(false)
    setModalVisible(true)
  }

  const handleTestSelection = (test) => {
    setSelectedTest(test)
  }

  const handleDateSelection = (date) => {
    setSelectedDate(date)
    setSelectedTimeSlot(null)
  }

  const handleTimeSlotSelection = (timeSlot) => {
    setSelectedTimeSlot(timeSlot)
  }

  const bookAppointment = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to book a lab test")
      return
    }

    if (!selectedLab || !selectedTest || !selectedDate || !selectedTimeSlot) {
      Alert.alert("Error", "Please select all booking details")
      return
    }

    setBookingInProgress(true)

    try {
      // Save the lab test booking to Supabase
      const { data, error } = await supabase
        .from("lab_appointment")
        .insert([
          {
            patient_id: user.id,
            lab_id: selectedLab.id,
            lab_name: selectedLab.name,
            test_name: selectedTest,
            appointment_date: selectedDate,
            appointment_time: selectedTimeSlot,
            status: "pending",
          },
        ])
        .select()

      if (error) throw error

      setAppointmentBooked(true)

      // Close modal after 3 seconds to show success message
      setTimeout(() => {
        setModalVisible(false)
        setSelectedLab(null)
        setSelectedTest(null)
        setSelectedDate(null)
        setSelectedTimeSlot(null)

        // If we were on the bookings tab, refresh the bookings
        if (activeTab === "bookings") {
          fetchMyLabBookings()
        }
      }, 3000)
    } catch (error) {
      console.error("Error booking lab test:", error)
      Alert.alert("Error", "Failed to book lab test. Please try again.")
    } finally {
      setBookingInProgress(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#50C878"
      case "cancelled":
        return "#FF6B6B"
      case "pending":
        return "#FFB347"
      default:
        return "#FFB347"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "check-circle"
      case "cancelled":
        return "times-circle"
      case "pending":
        return "clock"
      default:
        return "clock"
    }
  }

  const handleReschedule = (appointment) => {
    setAppointmentToReschedule(appointment)
    setRescheduleTest(appointment.test_name)
    setRescheduleDate(appointment.appointment_date)
    setRescheduleTimeSlot(appointment.appointment_time)
    setRescheduleModalVisible(true)
  }

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
                .from("lab_appointment")
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

  const handleRescheduleSubmit = async () => {
    if (!rescheduleTest || !rescheduleDate || !rescheduleTimeSlot) {
      Alert.alert("Error", "Please select all booking details")
      return
    }

    setReschedulingInProgress(true)

    try {
      const { error } = await supabase
        .from("lab_appointment")
        .update({
          test_name: rescheduleTest,
          appointment_date: rescheduleDate,
          appointment_time: rescheduleTimeSlot,
          status: "pending"
        })
        .eq("id", appointmentToReschedule.id)

      if (error) throw error

      // Update local state
      setMyBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === appointmentToReschedule.id
            ? {
                ...booking,
                test_name: rescheduleTest,
                appointment_date: rescheduleDate,
                appointment_time: rescheduleTimeSlot,
                status: "pending"
              }
            : booking
        )
      )

      setRescheduleModalVisible(false)
      Alert.alert("Success", "Appointment rescheduled successfully")
    } catch (error) {
      console.error("Error rescheduling appointment:", error)
      Alert.alert("Error", "Failed to reschedule appointment. Please try again.")
    } finally {
      setReschedulingInProgress(false)
    }
  }

  const renderLabItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.labCardContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: Animated.multiply(slideAnim, new Animated.Value(1 + index * 0.1)),
            },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.labCard}
        onPress={() => openBookingModal(item)}
        activeOpacity={0.9}
        accessibilityLabel={`Book test at ${item.name}`}
        accessibilityRole="button"
      >
        <View style={styles.labImageContainer}>
          <Image source={{ uri: item.image }} style={styles.labImage} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.imageOverlay} />
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <FontAwesome5 name="check-circle" size={16} color="#50C878" />
            </View>
          )}
          <View style={styles.distanceBadge}>
            <FontAwesome5 name="map-marker-alt" size={12} color="#fff" />
            <Text style={styles.distanceText}>{item.distance}</Text>
          </View>
        </View>

        <View style={styles.labCardContent}>
          <View style={styles.labHeader}>
            <Text style={styles.labName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.ratingContainer}>
              <FontAwesome5 name="star" size={14} color="#FFD700" solid />
              <Text style={styles.ratingText}>{item.rating}</Text>
              <Text style={styles.reviewsText}>({item.reviews})</Text>
            </View>
          </View>

          <View style={styles.labDetails}>
            <View style={styles.detailRow}>
              <FontAwesome5 name="map-marker-alt" size={12} color="#666" />
              <Text style={styles.labAddress} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={12} color="#666" />
              <Text style={styles.openTime}>{item.openTime}</Text>
            </View>
          </View>

          <View style={styles.testsContainer}>
            <Text style={styles.testsLabel}>Available Tests ({item.tests.length})</Text>
            <View style={styles.testChips}>
              {item.tests.slice(0, 3).map((test, testIndex) => (
                <View key={testIndex} style={styles.testChip}>
                  <Text style={styles.testChipText} numberOfLines={1}>
                    {test}
                  </Text>
                </View>
              ))}
              {item.tests.length > 3 && (
                <View style={styles.moreTestsChip}>
                  <Text style={styles.moreTestsText}>+{item.tests.length - 3}</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => openBookingModal(item)}
            accessibilityLabel={`Book test at ${item.name}`}
            accessibilityRole="button"
          >
            <LinearGradient colors={["#50C878", "#3CB371"]} style={styles.bookButtonGradient}>
              <FontAwesome5 name="calendar-plus" size={16} color="#fff" />
              <Text style={styles.bookButtonText}>Book Test</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )

  const renderBookingItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.bookingCardContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: Animated.multiply(slideAnim, new Animated.Value(1 + index * 0.1)),
            },
          ],
        },
      ]}
    >
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingLabInfo}>
            <View style={styles.labIconContainer}>
              <LinearGradient colors={["#50C878", "#3CB371"]} style={styles.labIconGradient}>
                <FontAwesome5 name="flask" size={20} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.bookingTextInfo}>
              <Text style={styles.bookingLabName} numberOfLines={1}>
                {item.lab_name}
              </Text>
              <Text style={styles.bookingTestName}>{item.test_name}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <FontAwesome5 name={getStatusIcon(item.status)} size={12} color="#fff" style={styles.statusIcon} />
            <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.bookingDetailRow}>
            <FontAwesome5 name="calendar-alt" size={14} color="#666" />
            <Text style={styles.bookingDateTime}>
              {formatDate(item.appointment_date)} at {item.appointment_time}
            </Text>
          </View>

          <View style={styles.bookingDetailRow}>
            <FontAwesome5 name="clock" size={14} color="#666" />
            <Text style={styles.bookingCreatedAt}>Booked on {new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.bookingActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rescheduleButton]}
            onPress={() => handleReschedule(item)}
            accessibilityLabel="Reschedule appointment"
            accessibilityRole="button"
          >
            <FontAwesome5 name="calendar-alt" size={14} color="#50C878" />
            <Text style={styles.rescheduleText}>Reschedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelAppointment(item.id)}
            accessibilityLabel="Cancel appointment"
            accessibilityRole="button"
          >
            <FontAwesome5 name="times" size={14} color="#FF6B6B" />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )

  const renderEmptyBookings = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient colors={["#F0F8F0", "#E8F5E8"]} style={styles.emptyIconGradient}>
          <MaterialCommunityIcons name="test-tube-empty" size={60} color="#50C878" />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No Lab Tests Booked</Text>
      <Text style={styles.emptyText}>
        You haven't booked any lab tests yet. Browse our available labs to get started.
      </Text>
      <TouchableOpacity
        style={styles.bookNowButton}
        onPress={() => setActiveTab("labs")}
        accessibilityLabel="Book a test now"
        accessibilityRole="button"
      >
        <LinearGradient colors={["#50C878", "#3CB371"]} style={styles.bookNowGradient}>
          <FontAwesome5 name="plus" size={16} color="#fff" />
          <Text style={styles.bookNowButtonText}>Book a Test Now</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  const renderEmptySearch = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient colors={["#F0F8F0", "#E8F5E8"]} style={styles.emptyIconGradient}>
          <FontAwesome5 name="search" size={60} color="#50C878" />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No Labs Found</Text>
      <Text style={styles.emptyText}>We couldn't find any labs matching your search. Try different keywords.</Text>
      <TouchableOpacity
        style={styles.clearSearchButton}
        onPress={() => setSearchQuery("")}
        accessibilityLabel="Clear search"
        accessibilityRole="button"
      >
        <LinearGradient colors={["#50C878", "#3CB371"]} style={styles.clearSearchGradient}>
          <FontAwesome5 name="times" size={16} color="#fff" />
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  const renderRescheduleModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={rescheduleModalVisible}
      onRequestClose={() => setRescheduleModalVisible(false)}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <TouchableOpacity
              onPress={() => setRescheduleModalVisible(false)}
              style={styles.closeButton}
              accessibilityLabel="Close modal"
              accessibilityRole="button"
            >
              <FontAwesome5 name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bookingContainer} showsVerticalScrollIndicator={false}>
            {/* Test Selection */}
            <Text style={styles.sectionTitle}>Select Test</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.testContainer}
              contentContainerStyle={styles.testContainerContent}
            >
              {LABS.find(lab => lab.name === appointmentToReschedule?.lab_name)?.tests.map((test, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.testCard, rescheduleTest === test && styles.selectedTestCard]}
                  onPress={() => setRescheduleTest(test)}
                  accessibilityLabel={`Select ${test}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: rescheduleTest === test }}
                >
                  <MaterialCommunityIcons
                    name={rescheduleTest === test ? "test-tube" : "test-tube-empty"}
                    size={20}
                    color={rescheduleTest === test ? "#fff" : "#50C878"}
                    style={styles.testIcon}
                  />
                  <Text style={[styles.testText, rescheduleTest === test && styles.selectedTestText]}>
                    {test}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Date Selection */}
            <Text style={styles.sectionTitle}>Select Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateContainer}
              contentContainerStyle={styles.dateContainerContent}
            >
              {LABS.find(lab => lab.name === appointmentToReschedule?.lab_name)?.availableDates.map((dateObj, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateCard, rescheduleDate === dateObj.date && styles.selectedDateCard]}
                  onPress={() => setRescheduleDate(dateObj.date)}
                  accessibilityLabel={`Select date ${formatDate(dateObj.date)}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: rescheduleDate === dateObj.date }}
                >
                  <Text style={[styles.dateDay, rescheduleDate === dateObj.date && styles.selectedDateText]}>
                    {new Date(dateObj.date).getDate()}
                  </Text>
                  <Text style={[styles.dateMonth, rescheduleDate === dateObj.date && styles.selectedDateText]}>
                    {new Date(dateObj.date).toLocaleDateString("en-US", { month: "short" })}
                  </Text>
                  <Text style={[styles.dateWeekday, rescheduleDate === dateObj.date && styles.selectedDateText]}>
                    {new Date(dateObj.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Time Selection */}
            {rescheduleDate && (
              <>
                <Text style={styles.sectionTitle}>Select Time</Text>
                <View style={styles.timeSlotContainer}>
                  {LABS.find(lab => lab.name === appointmentToReschedule?.lab_name)
                    ?.availableDates.find(dateObj => dateObj.date === rescheduleDate)
                    ?.slots.map((slot, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.timeSlot, rescheduleTimeSlot === slot && styles.selectedTimeSlot]}
                        onPress={() => setRescheduleTimeSlot(slot)}
                        accessibilityLabel={`Select time ${slot}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: rescheduleTimeSlot === slot }}
                      >
                        <FontAwesome5
                          name="clock"
                          size={14}
                          color={rescheduleTimeSlot === slot ? "#fff" : "#50C878"}
                          style={styles.timeIcon}
                        />
                        <Text style={[styles.timeSlotText, rescheduleTimeSlot === slot && styles.selectedTimeSlotText]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!rescheduleTest || !rescheduleDate || !rescheduleTimeSlot || reschedulingInProgress) &&
                  styles.disabledButton,
              ]}
              disabled={!rescheduleTest || !rescheduleDate || !rescheduleTimeSlot || reschedulingInProgress}
              onPress={handleRescheduleSubmit}
              accessibilityLabel="Confirm rescheduling"
              accessibilityRole="button"
              accessibilityState={{
                disabled: !rescheduleTest || !rescheduleDate || !rescheduleTimeSlot || reschedulingInProgress,
              }}
            >
              <LinearGradient
                colors={
                  !rescheduleTest || !rescheduleDate || !rescheduleTimeSlot || reschedulingInProgress
                    ? ["#ccc", "#bbb"]
                    : ["#50C878", "#3CB371"]
                }
                style={styles.confirmButtonGradient}
              >
                {reschedulingInProgress ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <FontAwesome5 name="check-circle" size={16} color="#fff" />
                    <Text style={styles.confirmButtonText}>Confirm Rescheduling</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Animated Header */}
        <Animated.View style={[styles.header, { height: headerHeight }]}>
          <LinearGradient colors={["#FFFFFF", "#F0F8F0"]} style={styles.headerGradient}>
            {/* Top Navigation */}
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.pop()}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <FontAwesome5 name="arrow-left" size={18} color="#333" />
              </TouchableOpacity>

              <Animated.View style={[styles.headerTitleSmall, { opacity: headerTitleOpacity }]}>
                <Text style={styles.headerTitleSmallText}>Lab Tests</Text>
              </Animated.View>
            </View>

            {/* Header Content */}
            <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
              <Text style={styles.headerTitle}>Lab Tests</Text>
              <Text style={styles.headerSubtitle}>Book your health checkups with trusted labs</Text>

              {/* Quick Stats
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{LABS.length}</Text>
                  <Text style={styles.statLabel}>Labs Available</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>50+</Text>
                  <Text style={styles.statLabel}>Test Types</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>24/7</Text>
                  <Text style={styles.statLabel}>Support</Text>
                </View>
              </View> */}
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "labs" && styles.activeTab]}
            onPress={() => setActiveTab("labs")}
            accessibilityLabel="Book test tab"
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "labs" }}
          >
            <FontAwesome5
              name={activeTab === "labs" ? "flask" : "flask"}
              size={16}
              color={activeTab === "labs" ? "#50C878" : "#666"}
              solid={activeTab === "labs"}
            />
            <Text style={[styles.tabText, activeTab === "labs" && styles.activeTabText]}>Book Test</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "bookings" && styles.activeTab]}
            onPress={() => setActiveTab("bookings")}
            accessibilityLabel="My bookings tab"
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "bookings" }}
          >
            <FontAwesome5
              name={activeTab === "bookings" ? "calendar-check" : "calendar-alt"}
              size={16}
              color={activeTab === "bookings" ? "#50C878" : "#666"}
              solid={activeTab === "bookings"}
            />
            <Text style={[styles.tabText, activeTab === "bookings" && styles.activeTabText]}>My Bookings</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "labs" ? (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <FontAwesome5 name="search" size={16} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search labs, tests, or specialties..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999"
                  accessibilityLabel="Search labs"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearSearchIcon}
                    onPress={() => setSearchQuery("")}
                    accessibilityLabel="Clear search"
                    accessibilityRole="button"
                  >
                    <FontAwesome5 name="times-circle" size={16} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Labs List */}
            {filteredLabs.length > 0 ? (
              <Animated.FlatList
                data={filteredLabs}
                renderItem={renderLabItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.labList}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                  useNativeDriver: false,
                })}
                scrollEventThrottle={16}
              />
            ) : (
              renderEmptySearch()
            )}
          </>
        ) : (
          <>
            {loadingBookings ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#50C878" />
                <Text style={styles.loadingText}>Loading your bookings...</Text>
              </View>
            ) : myBookings.length > 0 ? (
              <FlatList
                data={myBookings}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.bookingsList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              renderEmptyBookings()
            )}
          </>
        )}

        {/* Booking Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <BlurView intensity={20} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {appointmentBooked ? (
                <View style={styles.successContainer}>
                  <View style={styles.successIconContainer}>
                    <LinearGradient colors={["#50C878", "#3CB371"]} style={styles.successIconGradient}>
                      <FontAwesome5 name="check" size={40} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.successText}>Test Booked Successfully!</Text>
                  <Text style={styles.successSubtext}>
                    Your {selectedTest} appointment at {selectedLab?.name} has been confirmed for{" "}
                    {formatDate(selectedDate)} at {selectedTimeSlot}.
                  </Text>
                  <View style={styles.successDetails}>
                    <View style={styles.successDetailItem}>
                      <FontAwesome5 name="calendar-alt" size={16} color="#50C878" />
                      <Text style={styles.successDetailText}>{formatDate(selectedDate)}</Text>
                    </View>
                    <View style={styles.successDetailItem}>
                      <FontAwesome5 name="clock" size={16} color="#50C878" />
                      <Text style={styles.successDetailText}>{selectedTimeSlot}</Text>
                    </View>
                    <View style={styles.successDetailItem}>
                      <FontAwesome5 name="map-marker-alt" size={16} color="#50C878" />
                      <Text style={styles.successDetailText} numberOfLines={1}>
                        {selectedLab?.address}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Book Lab Test</Text>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.closeButton}
                      accessibilityLabel="Close modal"
                      accessibilityRole="button"
                    >
                      <FontAwesome5 name="times" size={20} color="#333" />
                    </TouchableOpacity>
                  </View>

                  {selectedLab && (
                    <ScrollView style={styles.bookingContainer} showsVerticalScrollIndicator={false}>
                      {/* Lab Info */}
                      <View style={styles.labInfoModal}>
                        <Image source={{ uri: selectedLab.image }} style={styles.labImageModal} />
                        <View style={styles.labInfoTextModal}>
                          <Text style={styles.labNameModal} numberOfLines={2}>
                            {selectedLab.name}
                          </Text>
                          <View style={styles.ratingContainerModal}>
                            <FontAwesome5 name="star" size={14} color="#FFD700" solid />
                            <Text style={styles.ratingTextModal}>{selectedLab.rating}</Text>
                            <Text style={styles.reviewsTextModal}>({selectedLab.reviews} reviews)</Text>
                          </View>
                          <View style={styles.addressContainerModal}>
                            <FontAwesome5 name="map-marker-alt" size={12} color="#666" />
                            <Text style={styles.labAddressModal} numberOfLines={2}>
                              {selectedLab.address}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Test Selection */}
                      <Text style={styles.sectionTitle}>Select Test</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.testContainer}
                        contentContainerStyle={styles.testContainerContent}
                      >
                        {selectedLab.tests.map((test, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[styles.testCard, selectedTest === test && styles.selectedTestCard]}
                            onPress={() => handleTestSelection(test)}
                            accessibilityLabel={`Select ${test}`}
                            accessibilityRole="button"
                            accessibilityState={{ selected: selectedTest === test }}
                          >
                            <MaterialCommunityIcons
                              name={selectedTest === test ? "test-tube" : "test-tube-empty"}
                              size={20}
                              color={selectedTest === test ? "#fff" : "#50C878"}
                              style={styles.testIcon}
                            />
                            <Text style={[styles.testText, selectedTest === test && styles.selectedTestText]}>
                              {test}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Date Selection */}
                      {selectedTest && (
                        <>
                          <Text style={styles.sectionTitle}>Select Date</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.dateContainer}
                            contentContainerStyle={styles.dateContainerContent}
                          >
                            {selectedLab.availableDates.map((dateObj, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[styles.dateCard, selectedDate === dateObj.date && styles.selectedDateCard]}
                                onPress={() => handleDateSelection(dateObj.date)}
                                accessibilityLabel={`Select date ${formatDate(dateObj.date)}`}
                                accessibilityRole="button"
                                accessibilityState={{ selected: selectedDate === dateObj.date }}
                              >
                                <Text
                                  style={[styles.dateDay, selectedDate === dateObj.date && styles.selectedDateText]}
                                >
                                  {new Date(dateObj.date).getDate()}
                                </Text>
                                <Text
                                  style={[styles.dateMonth, selectedDate === dateObj.date && styles.selectedDateText]}
                                >
                                  {new Date(dateObj.date).toLocaleDateString("en-US", { month: "short" })}
                                </Text>
                                <Text
                                  style={[styles.dateWeekday, selectedDate === dateObj.date && styles.selectedDateText]}
                                >
                                  {new Date(dateObj.date).toLocaleDateString("en-US", { weekday: "short" })}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </>
                      )}

                      {/* Time Selection */}
                      {selectedDate && (
                        <>
                          <Text style={styles.sectionTitle}>Select Time</Text>
                          <View style={styles.timeSlotContainer}>
                            {selectedLab.availableDates
                              .find((dateObj) => dateObj.date === selectedDate)
                              .slots.map((slot, index) => (
                                <TouchableOpacity
                                  key={index}
                                  style={[styles.timeSlot, selectedTimeSlot === slot && styles.selectedTimeSlot]}
                                  onPress={() => handleTimeSlotSelection(slot)}
                                  accessibilityLabel={`Select time ${slot}`}
                                  accessibilityRole="button"
                                  accessibilityState={{ selected: selectedTimeSlot === slot }}
                                >
                                  <FontAwesome5
                                    name="clock"
                                    size={14}
                                    color={selectedTimeSlot === slot ? "#fff" : "#50C878"}
                                    style={styles.timeIcon}
                                  />
                                  <Text
                                    style={[
                                      styles.timeSlotText,
                                      selectedTimeSlot === slot && styles.selectedTimeSlotText,
                                    ]}
                                  >
                                    {slot}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                          </View>
                        </>
                      )}

                      {/* Confirm Button */}
                      <TouchableOpacity
                        style={[
                          styles.confirmButton,
                          (!selectedTest || !selectedDate || !selectedTimeSlot || bookingInProgress) &&
                            styles.disabledButton,
                        ]}
                        disabled={!selectedTest || !selectedDate || !selectedTimeSlot || bookingInProgress}
                        onPress={bookAppointment}
                        accessibilityLabel="Confirm booking"
                        accessibilityRole="button"
                        accessibilityState={{
                          disabled: !selectedTest || !selectedDate || !selectedTimeSlot || bookingInProgress,
                        }}
                      >
                        <LinearGradient
                          colors={
                            !selectedTest || !selectedDate || !selectedTimeSlot || bookingInProgress
                              ? ["#ccc", "#bbb"]
                              : ["#50C878", "#3CB371"]
                          }
                          style={styles.confirmButtonGradient}
                        >
                          {bookingInProgress ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <>
                              <FontAwesome5 name="check-circle" size={16} color="#fff" />
                              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </ScrollView>
                  )}
                </>
              )}
            </View>
          </BlurView>
        </Modal>

        {renderRescheduleModal()}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
    backgroundColor: "#fff",
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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  
  
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
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
    backgroundColor: "#F0F8F0",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 8,
  },
  activeTabText: {
    color: "#50C878",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
  clearSearchIcon: {
    padding: 5,
  },
  labList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  labCardContainer: {
    marginBottom: 20,
  },
  labCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  labImageContainer: {
    position: "relative",
    height: 160,
  },
  labImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  verifiedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 6,
  },
  distanceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  distanceText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  labCardContent: {
    padding: 16,
  },
  labHeader: {
    marginBottom: 12,
  },
  labName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
    fontWeight: "600",
  },
  reviewsText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
  labDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  labAddress: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  openTime: {
    fontSize: 14,
    color: "#50C878",
    marginLeft: 8,
    fontWeight: "600",
  },
  testsContainer: {
    marginBottom: 16,
  },
  testsLabel: {
    fontSize: 14,
    color: "#50C878",
    fontWeight: "600",
    marginBottom: 8,
  },
  testChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  testChip: {
    backgroundColor: "#F0F8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  testChipText: {
    color: "#50C878",
    fontSize: 12,
    fontWeight: "500",
  },
  moreTestsChip: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  moreTestsText: {
    color: "#3CB371",
    fontSize: 12,
    fontWeight: "600",
  },
  bookButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  bookButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  bookingsList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  bookingCardContainer: {
    marginBottom: 16,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bookingLabInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  labIconContainer: {
    marginRight: 12,
  },
  labIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingTextInfo: {
    flex: 1,
  },
  bookingLabName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  bookingTestName: {
    fontSize: 14,
    color: "#50C878",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bookingDetails: {
    marginBottom: 12,
  },
  bookingDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  bookingDateTime: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  bookingCreatedAt: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  bookingActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  rescheduleButton: {
    backgroundColor: "#F0F8F0",
  },
  rescheduleText: {
    color: "#50C878",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  cancelButton: {
    backgroundColor: "#FFF0F0",
  },
  cancelText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 25,
  },
  bookNowButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  bookNowGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bookNowButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  clearSearchButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  clearSearchGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  clearSearchText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: height * 0.1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  bookingContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  labInfoModal: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  labImageModal: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 15,
  },
  labInfoTextModal: {
    flex: 1,
  },
  labNameModal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  ratingContainerModal: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingTextModal: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  reviewsTextModal: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
  addressContainerModal: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  labAddressModal: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    marginTop: 5,
  },
  testContainer: {
    marginBottom: 20,
  },
  testContainerContent: {
    paddingRight: 20,
    paddingBottom: 5,
  },
  testCard: {
    backgroundColor: "#F5F7FF",
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 130,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  selectedTestCard: {
    backgroundColor: "#50C878",
    borderColor: "#50C878",
  },
  testIcon: {
    marginRight: 8,
  },
  testText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  selectedTestText: {
    color: "#fff",
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateContainerContent: {
    paddingRight: 20,
    paddingBottom: 5,
  },
  dateCard: {
    backgroundColor: "#F5F7FF",
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  selectedDateCard: {
    backgroundColor: "#50C878",
    borderColor: "#50C878",
  },
  dateDay: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  dateMonth: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  dateWeekday: {
    fontSize: 12,
    color: "#999",
  },
  selectedDateText: {
    color: "#fff",
  },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 30,
  },
  timeSlot: {
    backgroundColor: "#F5F7FF",
    borderRadius: 12,
    padding: 12,
    margin: 5,
    minWidth: width / 3 - 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8EAF6",
  },
  selectedTimeSlot: {
    backgroundColor: "#50C878",
    borderColor: "#50C878",
  },
  timeIcon: {
    marginRight: 6,
  },
  timeSlotText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  selectedTimeSlotText: {
    color: "#fff",
  },
  confirmButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    paddingTop: 40,
    paddingBottom: 50,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  successSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 25,
  },
  successDetails: {
    width: "100%",
    backgroundColor: "#F0F8F0",
    borderRadius: 12,
    padding: 15,
  },
  successDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  successDetailText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 10,
  },
})
