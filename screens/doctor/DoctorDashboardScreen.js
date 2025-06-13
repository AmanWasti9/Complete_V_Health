import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../services/AuthContext";
import supabase from "../../services/supabaseService";

export default function DoctorDashboardScreen({ navigation }) {
  const { user, userProfile, signOut, setUserProfile } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState(0);
  
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Specialty states
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
  const [specialty, setSpecialty] = useState("");
  const [updatingSpecialty, setUpdatingSpecialty] = useState(false);
  const [specialtyError, setSpecialtyError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchPatients();
      fetchUnreadMessages();
      fetchTodayAppointments();
      // Set initial specialty from userProfile
      if (userProfile?.specialty) {
        setSpecialty(userProfile.specialty);
      }
    }
  }, [user, userProfile]);

  const fetchPatients = async () => {
    try {
      setLoading(true);

      // Fetch appointments for the logged-in doctor
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          patient_id,
          appointment_date,
          appointment_time,
          reason,
          status,
          created_at
        `
        )
        .eq("doctor_id", user.id)
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      if (appointments && appointments.length > 0) {
        // Get unique patient IDs
        const patientIds = [
          ...new Set(appointments.map((app) => app.patient_id)),
        ];

        // Fetch patient profiles
        const { data: patientProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", patientIds);

        if (profilesError) throw profilesError;

        // Combine appointment data with patient profiles
        const patientData = patientIds.map((patientId) => {
          const profile = patientProfiles.find((p) => p.id === patientId);
          const patientAppointments = appointments.filter(
            (a) => a.patient_id === patientId
          );
          const nextAppointment = patientAppointments
            .filter(
              (a) =>
                new Date(`${a.appointment_date}T${a.appointment_time}`) >=
                new Date()
            )
            .sort(
              (a, b) =>
                new Date(`${a.appointment_date}T${a.appointment_time}`) -
                new Date(`${b.appointment_date}T${b.appointment_time}`)
            )[0];

          return {
            id: patientId,
            name: profile?.full_name || "Unknown Patient",
            reason: patientAppointments[0]?.reason || "NA",
            lastVisit:
              patientAppointments[0]?.appointment_date.toString() ||
              "No appointments found",
          };
        });

        setPatients(patientData);
      }
    } catch (error) {
      // console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      // Fetch unread messages count from chats table
      const { data, error } = await supabase
        .from("chats")
        .select("id, sender_id")
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      if (data) {
        setUnreadMessages(data.length);

        // Update unread messages count for each patient
        const updatedPatients = [...patients];
        data.forEach((message) => {
          const patientIndex = updatedPatients.findIndex(
            (p) => p.id === message.sender_id
          );
          if (patientIndex !== -1) {
            updatedPatients[patientIndex].unreadMessages += 1;
          }
        });

        setPatients(updatedPatients);
      }
    } catch (error) {
      // console.error("Error fetching unread messages:", error);
    }
  };

  const fetchTodayAppointments = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Fetch appointments for today
      const { data, error } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", user.id)
        .eq("appointment_date", today);

      if (error) throw error;

      if (data) {
        setTodayAppointments(data.length);
      }
    } catch (error) {
      // console.error("Error fetching today's appointments:", error);
    }
  };

  const renderPatientCard = ({ item }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => navigation.navigate("PatientDetails", { patient: item })}
    >
      <View style={styles.patientImageContainer}>
        <Ionicons name="person-circle" size={60} color="#666" />
        {item.unreadMessages > 0 && (
          <View style={styles.messageBadge}>
            <Text style={styles.messageBadgeText}>{item.unreadMessages}</Text>
          </View>
        )}
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>Reason: {item.reason}</Text>
        <Text style={styles.patientCondition}>{item.condition}</Text>
        <View style={styles.appointmentInfo}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.appointmentText}>
            Appointment: {item.lastVisit}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => navigation.navigate("DoctorChat", { patient: item })}
      >
        <Ionicons name="chatbubble-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Filter patients based on selected filter
  const getFilteredPatients = () => {
    switch (selectedFilter) {
      case "upcoming":
        return patients.filter(
          (patient) =>
            patient.nextAppointment &&
            patient.nextAppointment !== "No upcoming appointments"
        );
      case "messages":
        return patients.filter((patient) => patient.unreadMessages > 0);
      default:
        return patients;
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError(null);

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (updateError) throw updateError;

      Alert.alert("Success", "Password updated successfully");
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSpecialtyUpdate = async () => {
    if (!specialty.trim()) {
      setSpecialtyError("Please enter your specialty");
      return;
    }

    try {
      setUpdatingSpecialty(true);
      setSpecialtyError(null);

      const { error } = await supabase
        .from("profiles")
        .update({
          specialty: specialty.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update the local userProfile state
      const updatedProfile = {
        ...userProfile,
        specialty: specialty.trim(),
        updated_at: new Date().toISOString(),
      };
      
      // Update the local state
      setUserProfile(updatedProfile);

      Alert.alert("Success", "Specialty updated successfully");
      setShowSpecialtyModal(false);
    } catch (error) {
      setSpecialtyError(error.message);
    } finally {
      setUpdatingSpecialty(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, </Text>
          <Text style={styles.welcomeText}>
            Dr. {userProfile?.full_name || "Doctor"}
          </Text>
          <Text style={styles.subtitle}>Your Patients Dashboard</Text>
          
          {/* Specialty Display/Add Button */}
          <View style={styles.specialtyContainer}>
            {userProfile?.specialty ? (
              <View style={styles.specialtyDisplay}>
                <Ionicons name="medical" size={16} color="#4F46E5" />
                <Text style={styles.specialtyText}>{userProfile.specialty}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSpecialty(userProfile.specialty);
                    setShowSpecialtyModal(true);
                  }}
                  style={styles.editSpecialtyButton}
                >
                  <Ionicons name="pencil" size={14} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addSpecialtyButton}
                onPress={() => setShowSpecialtyModal(true)}
              >
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text style={styles.addSpecialtyText}>Add Specialty</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={async () => {
              try {
                await signOut();
                navigation.replace("Onboarding");
              } catch (error) {
                Alert.alert("Error", "Failed to sign out. Please try again.");
              }
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("DoctorAppointments")}
        >
          <Ionicons name="calendar-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("DoctorAvailability")}
        >
          <Ionicons name="calendar" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Availability</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{unreadMessages}</Text>
          <Text style={styles.statLabel}>Total Messages</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "all" && styles.selectedFilter,
            ]}
            onPress={() => setSelectedFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "all" && styles.selectedFilterText,
              ]}
            >
              All Patients
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : patients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No patients found</Text>
          <Text style={styles.emptySubText}>
            Patients will appear here when they book appointments with you
          </Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredPatients()}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.patientList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editForm}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) =>
                    setPasswordForm({ ...passwordForm, currentPassword: text })
                  }
                  placeholder="Enter current password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordForm.newPassword}
                  onChangeText={(text) =>
                    setPasswordForm({ ...passwordForm, newPassword: text })
                  }
                  placeholder="Enter new password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.formInput}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: text })
                  }
                  placeholder="Confirm new password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                />
              </View>

              {passwordError && (
                <View style={styles.errorMessage}>
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handlePasswordChange}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#fff" />
                    <Text style={styles.updateButtonText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Specialty Modal */}
      <Modal
        visible={showSpecialtyModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {userProfile?.specialty ? "Update Specialty" : "Add Specialty"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowSpecialtyModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.editForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Medical Specialty</Text>
                <TextInput
                  style={styles.formInput}
                  value={specialty}
                  onChangeText={setSpecialty}
                  placeholder="Enter your medical specialty"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {specialtyError && (
                <View style={styles.errorMessage}>
                  <Text style={styles.errorText}>{specialtyError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleSpecialtyUpdate}
                disabled={updatingSpecialty}
              >
                {updatingSpecialty ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#fff" />
                    <Text style={styles.updateButtonText}>
                      {userProfile?.specialty ? "Update Specialty" : "Add Specialty"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#4F46E5",
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  signOutButton: {
    backgroundColor: "#ff4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: "#fff",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    width: "48%",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4F46E5",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedFilter: {
    backgroundColor: "#4F46E5",
  },
  filterText: {
    color: "#666",
    fontWeight: "500",
  },
  selectedFilterText: {
    color: "#fff",
  },
  patientList: {
    padding: 20,
  },
  patientCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  patientImageContainer: {
    position: "relative",
    marginRight: 15,
  },
  messageBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  patientCondition: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
    marginBottom: 4,
  },
  appointmentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  chatButton: {
    backgroundColor: "#4F46E5",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 5,
    paddingHorizontal: 20,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  settingsButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    backgroundColor: "#4F46E5",
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
  specialtyContainer: {
    marginTop: 8,
  },
  specialtyDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(79, 70, 229, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  specialtyText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
    marginLeft: 6,
    marginRight: 4,
  },
  editSpecialtyButton: {
    padding: 4,
  },
  addSpecialtyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  addSpecialtyText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 6,
  },
});
