"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import supabase from "../../services/supabaseService"
import * as ImagePicker from "expo-image-picker"

export default function AddMedicalStaff({ navigation }) {
  const [staffFormData, setStaffFormData] = useState({
    full_name: "",
    role: "",
    department: "",
    availability: "Available",
    perdaycost: "",
    perhourcost: "",
    experience: "",
    contact_info: "",
  })
  const [staffImage, setStaffImage] = useState(null)
  const [addingStaff, setAddingStaff] = useState(false)

  const pickStaffImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        setStaffImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const handleStaffInputChange = (field, value) => {
    setStaffFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetStaffForm = () => {
    setStaffFormData({
      full_name: "",
      role: "",
      department: "",
      availability: "Available",
      perdaycost: "",
      perhourcost: "",
      experience: "",
      contact_info: "",
    })
    setStaffImage(null)
  }

  const validateStaffForm = () => {
    const { full_name, role, department, perdaycost, perhourcost, experience, contact_info } = staffFormData

    if (!full_name || !role || !department || !perdaycost || !perhourcost || !experience || !contact_info) {
      Alert.alert("Validation Error", "Please fill in all required fields")
      return false
    }

    if (!staffImage) {
      Alert.alert("Validation Error", "Please select an image")
      return false
    }

    return true
  }

  const handleAddStaff = async () => {
    if (!validateStaffForm()) return

    try {
      setAddingStaff(true)

      // Upload image to Cloudinary
      const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dsabwyubl/upload"
      const UPLOAD_PRESET = "menuuuu"

      const formData = new FormData()
      const filename = staffImage.split("/").pop()
      const match = /\.([\w\d]+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : "image"

      formData.append("file", {
        uri: staffImage,
        name: filename,
        type,
      })
      formData.append("upload_preset", UPLOAD_PRESET)

      const imageResponse = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      })

      const imageData = await imageResponse.json()

      if (!imageData.secure_url) {
        throw new Error("Failed to upload image")
      }

      // Insert data into Supabase
      const { error } = await supabase.from("medical_staff").insert([
        {
          ...staffFormData,
          perdaycost: Number.parseFloat(staffFormData.perdaycost),
          perhourcost: Number.parseFloat(staffFormData.perhourcost),
          experience: Number.parseInt(staffFormData.experience),
          image_url: imageData.secure_url,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      Alert.alert("Success", "Medical staff added successfully", [{ text: "OK", onPress: () => navigation.goBack() }])
      resetStaffForm()
    } catch (error) {
      console.error("Error adding medical staff:", error)
      Alert.alert("Error", "Failed to add medical staff. Please try again.")
    } finally {
      setAddingStaff(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modern Gradient Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Add Medical Staff</Text>
          <Text style={styles.headerSubtitle}>Create new staff profile</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {staffImage ? (
                <>
                  <Image source={{ uri: staffImage }} style={styles.staffImagePreview} />
                  <TouchableOpacity style={styles.changeImageButton} onPress={pickStaffImage}>
                    <Ionicons name="camera" size={20} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.staffImagePlaceholder}>
                  <Ionicons name="person" size={50} color="#94a3b8" />
                </View>
              )}
            </View>

            {!staffImage && (
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickStaffImage}>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.imagePickerText}>Upload Profile Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Form Sections */}
          <View style={styles.formContainer}>
            {/* Personal Information Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.formInput}
                    value={staffFormData.full_name}
                    onChangeText={(text) => handleStaffInputChange("full_name", text)}
                    placeholder="Enter full name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup]}>
                  <Text style={styles.formLabel}>Role</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="briefcase-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      value={staffFormData.role}
                      onChangeText={(text) => handleStaffInputChange("role", text)}
                      placeholder="e.g. Doctor, Nurse"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={[styles.formGroup]}>
                  <Text style={styles.formLabel}>Department</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="medical-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      value={staffFormData.department}
                      onChangeText={(text) => handleStaffInputChange("department", text)}
                      placeholder="e.g., Cardiology"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Info</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.formInput}
                    value={staffFormData.contact_info}
                    onChangeText={(text) => handleStaffInputChange("contact_info", text)}
                    placeholder="Email or Phone"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </View>

            {/* Professional Details Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Professional Details</Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Experience (years)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="time-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.formInput}
                    value={staffFormData.experience}
                    onChangeText={(text) => handleStaffInputChange("experience", text)}
                    placeholder="Years of experience"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Availability Status</Text>
                <View style={styles.availabilityOptions}>
                  {["Available", "On Leave", "Busy"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.availabilityOption,
                        staffFormData.availability === option && styles.selectedAvailability,
                        option === "Available" && styles.availableOption,
                        option === "On Leave" && styles.onLeaveOption,
                        option === "Busy" && styles.busyOption,
                      ]}
                      onPress={() => handleStaffInputChange("availability", option)}
                    >
                      <Text
                        style={[
                          styles.availabilityText,
                          staffFormData.availability === option && styles.selectedAvailabilityText,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Pricing Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Pricing Information</Text>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 16 }]}>
                  <Text style={styles.formLabel}>Cost Per Day (Rs. )</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      value={staffFormData.perdaycost}
                      onChangeText={(text) => handleStaffInputChange("perdaycost", text)}
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Cost Per Hour (Rs. )</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="time-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      value={staffFormData.perhourcost}
                      onChangeText={(text) => handleStaffInputChange("perhourcost", text)}
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.addStaffButton} onPress={handleAddStaff} disabled={addingStaff}>
            {addingStaff ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>Adding Staff...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="person-add" size={22} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.addStaffButtonText}>Add Medical Staff</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 10 : 50,
    paddingBottom: 20,
    backgroundColor: "#0ea5e9",
  },
  backButton: {
    marginRight: 16,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  staffImagePreview: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#fff",
  },
  staffImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changeImageButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#0ea5e9",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imagePickerText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  formInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
  },
  formRow: {
    justifyContent: "space-between",
  },
  availabilityOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  availabilityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: "#f8fafc",
  },
  availabilityIcon: {
    marginRight: 6,
  },
  selectedAvailability: {
    borderColor: "transparent",
  },
  availableOption: {
    backgroundColor: "#22c55e",
  },
  onLeaveOption: {
    backgroundColor: "#f59e0b",
  },
  busyOption: {
    backgroundColor: "#ef4444",
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  selectedAvailabilityText: {
    color: "#fff",
  },
  addStaffButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0ea5e9",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 40,
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 10,
  },
  addStaffButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
})
