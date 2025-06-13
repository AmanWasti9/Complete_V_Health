"use client"

import React, { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
} from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import supabase from "../../services/supabaseService"
import { useAuth } from "../../services/AuthContext"

const { width } = Dimensions.get("window")

// Modern color palette matching the dashboard
const COLORS = {
  primary: "#3E64FF",
  primaryDark: "#2C4CC3",
  primaryLight: "#5A7DFF",
  secondary: "#5E60CE",
  accent: "#5390D9",
  success: "#48BF84",
  warning: "#FFBE0B",
  danger: "#FF5A5F",
  background: "#F7F9FC",
  card: "#FFFFFF",
  text: "#2D3748",
  textSecondary: "#718096",
  border: "#E2E8F0",
  shadow: "rgba(62, 100, 255, 0.16)",
}

// Fallback dummy appointments data in case there are no real appointments
const DUMMY_APPOINTMENTS = [
  {
    id: "1",
    patientName: "John Smith",
    date: "2024-03-20",
    time: "09:00 AM",
    status: "pending",
    reason: "New patient consultation",
  },
]

export default function DoctorAppointmentsScreen({ navigation }) {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState("all")

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const translateY = React.useRef(new Animated.Value(30)).current

  useEffect(() => {
    if (user) {
      fetchAppointments()
    }

    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [user])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      // Fetch appointments where the current user is the doctor
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          doctor_id,
          patient_id,
          appointment_date,
          appointment_time,
          reason,
          status,
          created_at
        `)
        .eq("doctor_id", user.id)
        .order("appointment_date", { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        // Fetch patient profiles for each appointment
        const patientIds = [...new Set(data.map((appointment) => appointment.patient_id))]

        // Get patient names from profiles table
        const { data: patientProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", patientIds)

        if (profilesError) {
          // console.error("Error fetching patient profiles:", profilesError)
        }

        // Create a map of patient IDs to names
        const patientMap = {}
        if (patientProfiles) {
          patientProfiles.forEach((profile) => {
            patientMap[profile.id] = profile.full_name
          })
        }

        // Transform the data to match our UI format
        const formattedAppointments = data.map((appointment) => ({
          id: appointment.id,
          patientName: patientMap[appointment.patient_id] || "Unknown Patient",
          date: appointment.appointment_date,
          time: appointment.appointment_time,
          status: appointment.status,
          reason: appointment.reason || "No reason provided",
          patient_id: appointment.patient_id,
          created_at: appointment.created_at,
        }))

        setAppointments(formattedAppointments)
      } else {
        // If no appointments found, use dummy data
        setAppointments(DUMMY_APPOINTMENTS)
      }
    } catch (error) {
      // console.error("Error fetching appointments:", error)
      Alert.alert("Error", "Failed to load appointments")
      setAppointments(DUMMY_APPOINTMENTS)
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentAction = async (appointment, action) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to perform this action")
      return
    }

    setActionLoading(true)
    try {
      // Update the appointment status in Supabase
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: action })
        .eq("id", appointment.id)

      if (updateError) throw updateError

      // If confirming appointment, update doctor_availability to mark the slot as unavailable
      if (action === "confirmed") {
        // Find the doctor availability record for this date and time
        const { data: availabilityData, error: availabilityError } = await supabase
          .from("doctor_availability")
          .select("*")
          .eq("doctor_id", user.id)
          .eq("date", appointment.date)
          .eq("time_slot", appointment.time)

        if (availabilityError) throw availabilityError

        // If availability record exists, update it to mark as unavailable
        if (availabilityData && availabilityData.length > 0) {
          const { error: updateAvailabilityError } = await supabase
            .from("doctor_availability")
            .update({ is_available: false })
            .eq("doctor_id", user.id)
            .eq("date", appointment.date)
            .eq("time_slot", appointment.time)

          if (updateAvailabilityError) throw updateAvailabilityError
        }
      }

      // Update local state
      setAppointments((prev) => prev.map((apt) => (apt.id === appointment.id ? { ...apt, status: action } : apt)))

      Alert.alert("Success", `Appointment ${action === "confirmed" ? "confirmed" : "rejected"} successfully`)
    } catch (error) {
      // console.error(`Error ${action} appointment:`, error)
      Alert.alert("Error", `Failed to ${action} appointment. Please try again.`)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case "confirmed":
        return {
          color: COLORS.success,
          icon: "checkmark-circle",
          label: "Confirmed",
          bgColor: `${COLORS.success}15`,
        }
      case "rejected":
        return {
          color: COLORS.danger,
          icon: "close-circle",
          label: "Rejected",
          bgColor: `${COLORS.danger}15`,
        }
      default:
        return {
          color: COLORS.warning,
          icon: "time",
          label: "Pending",
          bgColor: `${COLORS.warning}15`,
        }
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    }
  }

  const renderAppointmentCard = ({ item, index }) => {
    const statusConfig = getStatusConfig(item.status)

    return (
      <Animated.View
        style={[
          styles.appointmentCardContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(translateY, new Animated.Value(1 + index * 0.1)) }],
          },
        ]}
      >
        <View style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <View style={styles.patientInfoSection}>
              <View style={styles.patientAvatarContainer}>
                <View style={[styles.patientAvatar, { backgroundColor: getPatientColor(item.patientName) }]}>
                  <Text style={styles.patientInitials}>
                    {item.patientName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.patientDetails}>
                <Text style={styles.patientName} numberOfLines={1}>
                  {item.patientName}
                </Text>
                <View style={styles.appointmentTimeInfo}>
                  <View style={styles.dateTimeContainer}>
                    <Ionicons name="calendar" size={14} color={COLORS.primary} />
                    <Text style={styles.appointmentDate}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={styles.dateTimeContainer}>
                    <Ionicons name="time" size={14} color={COLORS.accent} />
                    <Text style={styles.appointmentTime}>{item.time}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>

          <View style={styles.reasonSection}>
            <View style={styles.reasonContainer}>
              <MaterialCommunityIcons name="medical-bag" size={16} color={COLORS.primary} />
              <Text style={styles.reasonText} numberOfLines={2}>
                {item.reason}
              </Text>
            </View>
          </View>

          {item.status === "pending" && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton, actionLoading && styles.disabledButton]}
                onPress={() => handleAppointmentAction(item, "rejected")}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton, actionLoading && styles.disabledButton]}
                onPress={() => handleAppointmentAction(item, "confirmed")}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Confirm</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    )
  }

  const getPatientColor = (name) => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#FFD166",
      "#06D6A0",
      "#118AB2",
      "#073B4C",
      "#7209B7",
      "#3A86FF",
      "#FB5607",
      "#8338EC",
    ]
    const charCodeSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
    return colors[charCodeSum % colors.length]
  }

  const getFilterCount = (status) => {
    if (status === "all") return appointments.length
    return appointments.filter((apt) => apt.status === status).length
  }

  const filteredAppointments = appointments.filter((appointment) => {
    if (selectedFilter === "all") return true
    return appointment.status === selectedFilter
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <LinearGradient colors={[COLORS.card, COLORS.background]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleSection}>
            <Text style={styles.title}>Appointments</Text>
            <Text style={styles.subtitle}>{appointments.length} total appointments</Text>
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={fetchAppointments}>
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <Animated.View
        style={[
          styles.filterContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(translateY, new Animated.Value(0.5)) }],
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === "all" && styles.selectedFilter]}
            onPress={() => setSelectedFilter("all")}
          >
            <Ionicons
              name="list"
              size={16}
              color={selectedFilter === "all" ? "#fff" : COLORS.textSecondary}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, selectedFilter === "all" && styles.selectedFilterText]}>
              All ({getFilterCount("all")})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === "pending" && styles.selectedFilter]}
            onPress={() => setSelectedFilter("pending")}
          >
            <Ionicons
              name="time"
              size={16}
              color={selectedFilter === "pending" ? "#fff" : COLORS.warning}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, selectedFilter === "pending" && styles.selectedFilterText]}>
              Pending ({getFilterCount("pending")})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === "confirmed" && styles.selectedFilter]}
            onPress={() => setSelectedFilter("confirmed")}
          >
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={selectedFilter === "confirmed" ? "#fff" : COLORS.success}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, selectedFilter === "confirmed" && styles.selectedFilterText]}>
              Confirmed ({getFilterCount("confirmed")})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === "rejected" && styles.selectedFilter]}
            onPress={() => setSelectedFilter("rejected")}
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={selectedFilter === "rejected" ? "#fff" : COLORS.danger}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, selectedFilter === "rejected" && styles.selectedFilterText]}>
              Rejected ({getFilterCount("rejected")})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : filteredAppointments.length > 0 ? (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.appointmentsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <View style={styles.noDataIconContainer}>
            <Ionicons name="calendar-outline" size={60} color={COLORS.primary} />
          </View>
          <Text style={styles.noDataTitle}>No appointments found</Text>
          <Text style={styles.noDataText}>
            {selectedFilter === "all"
              ? "You don't have any appointments yet"
              : `No ${selectedFilter} appointments at the moment`}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleSection: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    paddingVertical: 20,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    marginRight: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedFilter: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  selectedFilterText: {
    color: "#fff",
  },
  appointmentsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  appointmentCardContainer: {
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  patientInfoSection: {
    flexDirection: "row",
    flex: 1,
    marginRight: 12,
  },
  patientAvatarContainer: {
    marginRight: 12,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  patientInitials: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  appointmentTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  appointmentDate: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 6,
  },
  appointmentTime: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: "600",
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  reasonSection: {
    marginBottom: 16,
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  reasonText: {
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.danger,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noDataIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: "80%",
  },
})
