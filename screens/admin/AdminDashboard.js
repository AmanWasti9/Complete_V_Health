"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../services/AuthContext"
import supabase from "../../services/supabaseService"
import * as ImagePicker from "expo-image-picker"

export default function AdminDashboard({ navigation }) {
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
  // Medical Staff state variables
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
  const [medicalStaff, setMedicalStaff] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffError, setStaffError] = useState(null)
  const [showEditStaffModal, setShowEditStaffModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [staffSearchQuery, setStaffSearchQuery] = useState("")
  const [filteredStaff, setFilteredStaff] = useState([])
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredMedicines, setFilteredMedicines] = useState([])

  // Fetch medicines and medical staff from Supabase
  useEffect(() => {
    fetchMedicines()
    fetchMedicalStaff()
  }, [])

  // Filter medicines based on search query
  useEffect(() => {
    if (medicines.length > 0) {
      const filtered = medicines.filter(
        (medicine) =>
          medicine.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          medicine.category?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredMedicines(filtered)
    }
  }, [medicines, searchQuery])

  // Filter medical staff based on search query
  useEffect(() => {
    if (medicalStaff.length > 0) {
      const filtered = medicalStaff.filter(
        (staff) =>
          staff.full_name?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
          staff.role?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
          staff.department?.toLowerCase().includes(staffSearchQuery.toLowerCase()),
      )
      setFilteredStaff(filtered)
    }
  }, [medicalStaff, staffSearchQuery])

  const fetchMedicines = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.from("pharmacy").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      if (data) {
        setMedicines(data)
        setFilteredMedicines(data)
      }
    } catch (error) {
      console.error("Error fetching medicines:", error)
      setError("Failed to load medicines. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchMedicalStaff = async () => {
    try {
      setLoadingStaff(true)
      setStaffError(null)

      const { data, error } = await supabase.from("medical_staff").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      if (data) {
        setMedicalStaff(data)
        setFilteredStaff(data)
      }
    } catch (error) {
      console.error("Error fetching medical staff:", error)
      setStaffError("Failed to load medical staff. Please try again.")
    } finally {
      setLoadingStaff(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigation.replace("Onboarding")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleEditMedicine = (medicine) => {
    setSelectedMedicine(medicine)
    setShowEditModal(true)
  }

  const handleUpdateMedicine = async () => {
    if (!selectedMedicine) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from("pharmacy")
        .update({
          medicine_name: selectedMedicine.medicine_name,
          description: selectedMedicine.description,
          dosage: selectedMedicine.dosage,
          stock: selectedMedicine.stock,
          category: selectedMedicine.category,
          price: selectedMedicine.price,
        })
        .eq("id", selectedMedicine.id)

      if (error) throw error

      // Update both medicines and filteredMedicines states
      const updatedMedicines = medicines.map((med) => (med.id === selectedMedicine.id ? selectedMedicine : med))
      setMedicines(updatedMedicines)
      setFilteredMedicines(
        updatedMedicines.filter(
          (medicine) =>
            medicine.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            medicine.category?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )

      setShowEditModal(false)
      Alert.alert("Success", "Medicine updated successfully")
    } catch (error) {
      console.error("Error updating medicine:", error)
      Alert.alert("Error", "Failed to update medicine")
    } finally {
      setLoading(false)
    }
  }

  // Medical Staff functions
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

      Alert.alert("Success", "Medical staff added successfully")
      resetStaffForm()
    } catch (error) {
      console.error("Error adding medical staff:", error)
      Alert.alert("Error", "Failed to add medical staff. Please try again.")
    } finally {
      setAddingStaff(false)
    }
  }

  const handleDeleteMedicine = (medicineId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this medicine?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true)

            const { error } = await supabase.from("pharmacy").delete().eq("id", medicineId)

            if (error) throw error

            // Update both medicines and filteredMedicines states
            const updatedMedicines = medicines.filter((med) => med.id !== medicineId)
            setMedicines(updatedMedicines)
            setFilteredMedicines(
              updatedMedicines.filter(
                (medicine) =>
                  medicine.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  medicine.category?.toLowerCase().includes(searchQuery.toLowerCase()),
              ),
            )
            Alert.alert("Success", "Medicine deleted successfully")
          } catch (error) {
            console.error("Error deleting medicine:", error)
            Alert.alert("Error", "Failed to delete medicine")
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const handleEditStaff = (staff) => {
    setSelectedStaff(staff)
    setShowEditStaffModal(true)
  }

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return

    try {
      setLoadingStaff(true)

      const { error } = await supabase
        .from("medical_staff")
        .update({
          full_name: selectedStaff.full_name,
          role: selectedStaff.role,
          department: selectedStaff.department,
          availability: selectedStaff.availability,
          perdaycost: Number.parseFloat(selectedStaff.perdaycost),
          perhourcost: Number.parseFloat(selectedStaff.perhourcost),
          experience: Number.parseInt(selectedStaff.experience),
          contact_info: selectedStaff.contact_info,
        })
        .eq("id", selectedStaff.id)

      if (error) throw error

      // Update both medicalStaff and filteredStaff states
      const updatedStaff = medicalStaff.map((staff) => (staff.id === selectedStaff.id ? selectedStaff : staff))
      setMedicalStaff(updatedStaff)
      setFilteredStaff(
        updatedStaff.filter(
          (staff) =>
            staff.full_name?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
            staff.role?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
            staff.department?.toLowerCase().includes(staffSearchQuery.toLowerCase()),
        ),
      )

      setShowEditStaffModal(false)
      Alert.alert("Success", "Medical staff updated successfully")
    } catch (error) {
      console.error("Error updating medical staff:", error)
      Alert.alert("Error", "Failed to update medical staff")
    } finally {
      setLoadingStaff(false)
    }
  }

  const handleDeleteStaff = (staffId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this medical staff member?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoadingStaff(true)

            const { error } = await supabase.from("medical_staff").delete().eq("id", staffId)

            if (error) throw error

            // Update both medicalStaff and filteredStaff states
            const updatedStaff = medicalStaff.filter((staff) => staff.id !== staffId)
            setMedicalStaff(updatedStaff)
            setFilteredStaff(
              updatedStaff.filter(
                (staff) =>
                  staff.full_name?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                  staff.role?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                  staff.department?.toLowerCase().includes(staffSearchQuery.toLowerCase()),
              ),
            )
            Alert.alert("Success", "Medical staff deleted successfully")
          } catch (error) {
            console.error("Error deleting medical staff:", error)
            Alert.alert("Error", "Failed to delete medical staff")
          } finally {
            setLoadingStaff(false)
          }
        },
      },
    ])
  }

  // Helper function to get dashboard stats
  const getDashboardStats = () => {
    const totalMedicines = medicines.length
    const totalStaff = medicalStaff.length
    const availableStaff = medicalStaff.filter((staff) => staff.availability === "Available").length
    const lowStockMedicines = medicines.filter((med) => med.stock < 10).length

    return { totalMedicines, totalStaff, availableStaff, lowStockMedicines }
  }

  const stats = getDashboardStats()

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modern Header with Gradient */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Admin Panel</Text>
                <Text style={styles.headerSubtitle}>Healthcare Management</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Enhanced Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "dashboard" && styles.activeTab]}
          onPress={() => setActiveTab("dashboard")}
        >
          <View style={[styles.tabIconContainer, activeTab === "dashboard" && styles.activeTabIconContainer]}>
            <Ionicons name="grid-outline" size={20} color={activeTab === "dashboard" ? "#fff" : "#64748b"} />
          </View>
          <Text style={[styles.tabText, activeTab === "dashboard" && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "medicines" && styles.activeTab]}
          onPress={() => setActiveTab("medicines")}
        >
          <View style={[styles.tabIconContainer, activeTab === "medicines" && styles.activeTabIconContainer]}>
            <Ionicons name="medical-outline" size={20} color={activeTab === "medicines" ? "#fff" : "#64748b"} />
          </View>
          <Text style={[styles.tabText, activeTab === "medicines" && styles.activeTabText]}>Medicines</Text>
          {medicines.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{medicines.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "staff" && styles.activeTab]}
          onPress={() => setActiveTab("staff")}
        >
          <View style={[styles.tabIconContainer, activeTab === "staff" && styles.activeTabIconContainer]}>
            <Ionicons name="people-outline" size={20} color={activeTab === "staff" ? "#fff" : "#64748b"} />
          </View>
          <Text style={[styles.tabText, activeTab === "staff" && styles.activeTabText]}>Staff</Text>
          {medicalStaff.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{medicalStaff.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Dashboard Tab Content */}
      {activeTab === "dashboard" && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome Back, Admin</Text>
            <Text style={styles.subText}>Manage your healthcare system efficiently</Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: "#3b82f6" }]}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="medical" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{stats.totalMedicines}</Text>
                <Text style={styles.statLabel}>Total Medicines</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: "#10b981" }]}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{stats.totalStaff}</Text>
                <Text style={styles.statLabel}>Medical Staff</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: "#8b5cf6" }]}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{stats.availableStaff}</Text>
                <Text style={styles.statLabel}>Available Staff</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: "#f59e0b" }]}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="warning" size={24} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{stats.lowStockMedicines}</Text>
                <Text style={styles.statLabel}>Low Stock</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("AddMedicine")}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#3b82f6" }]}>
                  <Ionicons name="add-circle" size={28} color="#fff" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Add Medicine</Text>
                  <Text style={styles.menuDescription}>Add new medicines to inventory</Text>
                </View>
                <View style={styles.menuArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("AddMedicalStaff")}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#10b981" }]}>
                  <Ionicons name="person-add" size={28} color="#fff" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Add Medical Staff</Text>
                  <Text style={styles.menuDescription}>Register new medical professionals</Text>
                </View>
                <View style={styles.menuArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab("medicines")}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#8b5cf6" }]}>
                  <Ionicons name="list" size={28} color="#fff" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Manage Inventory</Text>
                  <Text style={styles.menuDescription}>View and edit medicine inventory</Text>
                </View>
                <View style={styles.menuArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => setActiveTab("staff")}>
                <View style={[styles.menuIconContainer, { backgroundColor: "#f59e0b" }]}>
                  <Ionicons name="settings" size={28} color="#fff" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>Manage Staff</Text>
                  <Text style={styles.menuDescription}>View and edit staff information</Text>
                </View>
                <View style={styles.menuArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Medical Staff Tab Content */}
      {activeTab === "staff" && (
        <View style={styles.content}>
          {/* Enhanced Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search medical staff..."
                placeholderTextColor="#94a3b8"
                value={staffSearchQuery}
                onChangeText={setStaffSearchQuery}
              />
              {staffSearchQuery.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={() => setStaffSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Enhanced Header */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Medical Staff</Text>
              <Text style={styles.sectionSubtitle}>{filteredStaff.length} staff members</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddMedicalStaff")}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Staff</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.refreshButton} onPress={fetchMedicalStaff}>
                <Ionicons name="refresh" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading State */}
          {loadingStaff && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
              <Text style={styles.loadingText}>Loading medical staff...</Text>
            </View>
          )}

          {/* Error State */}
          {staffError && !loadingStaff && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
              </View>
              <Text style={styles.errorText}>{staffError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchMedicalStaff}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty State */}
          {!loadingStaff && !staffError && filteredStaff.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No Staff Found</Text>
              <Text style={styles.emptyText}>
                {staffSearchQuery
                  ? "No staff match your search criteria"
                  : "Start by adding your first medical staff member"}
              </Text>
              {!staffSearchQuery && (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => navigation.navigate("AddMedicalStaff")}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyActionText}>Add Medical Staff</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Staff List */}
          {!loadingStaff && !staffError && filteredStaff.length > 0 && (
            <FlatList
              data={filteredStaff}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.staffList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.staffCard}>
                  <View style={styles.staffCardHeader}>
                    <Image
                      source={{ uri: item.image_url || "https://via.placeholder.com/150" }}
                      style={styles.staffAvatar}
                      onError={() => console.log("Error loading image for", item.full_name)}
                    />
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{item.full_name}</Text>
                      <Text style={styles.staffRole}>{item.role}</Text>
                      <Text style={styles.staffDepartment}>{item.department}</Text>
                    </View>
                    <View style={styles.staffActions}>
                      <TouchableOpacity style={styles.actionButton} onPress={() => handleEditStaff(item)}>
                        <Ionicons name="pencil" size={18} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteAction]}
                        onPress={() => handleDeleteStaff(item.id)}
                      >
                        <Ionicons name="trash" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.staffCardBody}>
                    <View style={styles.staffDetails}>
                      <View
                        style={[
                          styles.availabilityBadge,
                          item.availability === "Available" && styles.availableBadge,
                          item.availability === "On Leave" && styles.onLeaveBadge,
                          item.availability === "Busy" && styles.busyBadge,
                        ]}
                      >
                        <Ionicons
                          name={
                            item.availability === "Available"
                              ? "checkmark-circle"
                              : item.availability === "On Leave"
                                ? "time"
                                : "close-circle"
                          }
                          size={12}
                          color="#fff"
                        />
                        <Text style={styles.availabilityText}>{item.availability}</Text>
                      </View>
                      <Text style={styles.experienceText}>{item.experience} years experience</Text>
                    </View>

                    <View style={styles.pricingInfo}>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>Per Day</Text>
                        <Text style={styles.priceValue}>Rs. {Number.parseFloat(item.perdaycost).toFixed(2)}</Text>
                      </View>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>Per Hour</Text>
                        <Text style={styles.priceValue}>Rs. {Number.parseFloat(item.perhourcost).toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* Medicines Tab Content */}
      {activeTab === "medicines" && (
        <View style={styles.content}>
          {/* Enhanced Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search medicines..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Enhanced Header */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Medicine Inventory</Text>
              <Text style={styles.sectionSubtitle}>{filteredMedicines.length} medicines available</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchMedicines}>
              <Ionicons name="refresh" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
              <Text style={styles.loadingText}>Loading medicines...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
              </View>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchMedicines}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty State */}
          {!loading && !error && filteredMedicines.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="medical-outline" size={64} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No Medicines Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No medicines match your search criteria"
                  : "Start by adding your first medicine to the inventory"}
              </Text>
              {!searchQuery && (
                <TouchableOpacity style={styles.emptyActionButton} onPress={() => navigation.navigate("AddMedicine")}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyActionText}>Add Medicine</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Medicine List */}
          {!loading && !error && filteredMedicines.length > 0 && (
            <FlatList
              data={filteredMedicines}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.medicinesList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.medicineCard}>
                  <View style={styles.medicineCardHeader}>
                    <Image
                      source={{ uri: item.image_url || "https://via.placeholder.com/150" }}
                      style={styles.medicineImage}
                      onError={() => console.log("Error loading image for", item.medicine_name)}
                    />
                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineName}>{item.medicine_name}</Text>
                      <Text style={styles.medicineCategory}>{item.category}</Text>
                      <Text style={styles.medicineDosage}>Dosage: {item.dosage}</Text>
                    </View>
                    <View style={styles.medicineActions}>
                      <TouchableOpacity style={styles.actionButton} onPress={() => handleEditMedicine(item)}>
                        <Ionicons name="pencil" size={18} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteAction]}
                        onPress={() => handleDeleteMedicine(item.id)}
                      >
                        <Ionicons name="trash" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.medicineCardFooter}>
                    <View style={styles.stockInfo}>
                      <View style={[styles.stockBadge, item.stock < 10 ? styles.lowStockBadge : styles.inStockBadge]}>
                        <Ionicons name={item.stock < 10 ? "warning" : "checkmark-circle"} size={12} color="#fff" />
                        <Text style={styles.stockText}>Stock: {item.stock}</Text>
                      </View>
                    </View>
                    <Text style={styles.medicinePrice}>Rs. {Number.parseFloat(item.price).toFixed(2)}</Text>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* Edit Medicine Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Medicine</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedMedicine && (
              <ScrollView style={styles.editForm} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Medicine Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedMedicine.medicine_name}
                    onChangeText={(text) => setSelectedMedicine({ ...selectedMedicine, medicine_name: text })}
                    placeholder="Enter medicine name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={selectedMedicine.description}
                    onChangeText={(text) => setSelectedMedicine({ ...selectedMedicine, description: text })}
                    placeholder="Enter description"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.formLabel}>Dosage</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedMedicine.dosage}
                      onChangeText={(text) => setSelectedMedicine({ ...selectedMedicine, dosage: text })}
                      placeholder="Enter dosage"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Category</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedMedicine.category}
                      onChangeText={(text) => setSelectedMedicine({ ...selectedMedicine, category: text })}
                      placeholder="Enter category"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.formLabel}>Stock</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedMedicine.stock?.toString()}
                      onChangeText={(text) =>
                        setSelectedMedicine({ ...selectedMedicine, stock: Number.parseInt(text) || 0 })
                      }
                      placeholder="Enter stock"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Price (Rs. )</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedMedicine.price?.toString()}
                      onChangeText={(text) =>
                        setSelectedMedicine({ ...selectedMedicine, price: Number.parseFloat(text) || 0 })
                      }
                      placeholder="Enter price"
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.updateButton} onPress={handleUpdateMedicine} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save" size={20} color="#fff" />
                      <Text style={styles.updateButtonText}>Update Medicine</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Medical Staff Modal */}
      <Modal visible={showEditStaffModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Medical Staff</Text>
              <TouchableOpacity onPress={() => setShowEditStaffModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedStaff && (
              <ScrollView style={styles.editForm} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={selectedStaff.full_name}
                    onChangeText={(text) => setSelectedStaff({ ...selectedStaff, full_name: text })}
                    placeholder="Enter full name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.formLabel}>Role</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedStaff.role}
                      onChangeText={(text) => setSelectedStaff({ ...selectedStaff, role: text })}
                      placeholder="e.g., Doctor, Nurse"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Department</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedStaff.department}
                      onChangeText={(text) => setSelectedStaff({ ...selectedStaff, department: text })}
                      placeholder="e.g., Cardiology"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Availability</Text>
                  <View style={styles.availabilityOptions}>
                    {["Available", "On Leave", "Busy"].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.availabilityOption,
                          selectedStaff.availability === option && styles.selectedAvailability,
                        ]}
                        onPress={() => setSelectedStaff({ ...selectedStaff, availability: option })}
                      >
                        <Text
                          style={[
                            styles.availabilityOptionText,
                            selectedStaff.availability === option && styles.selectedAvailabilityText,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.formLabel}>Cost Per Day (Rs. )</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedStaff.perdaycost?.toString()}
                      onChangeText={(text) => setSelectedStaff({ ...selectedStaff, perdaycost: text })}
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Cost Per Hour (Rs. )</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedStaff.perhourcost?.toString()}
                      onChangeText={(text) => setSelectedStaff({ ...selectedStaff, perhourcost: text })}
                      placeholder="0.00"
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.formLabel}>Experience (years)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedStaff.experience?.toString()}
                      onChangeText={(text) => setSelectedStaff({ ...selectedStaff, experience: text })}
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Contact Info</Text>
                    <TextInput
                      style={styles.formInput}
                      value={selectedStaff.contact_info}
                      onChangeText={(text) => setSelectedStaff({ ...selectedStaff, contact_info: text })}
                      placeholder="Email or Phone"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.updateButton} onPress={handleUpdateStaff} disabled={loadingStaff}>
                  {loadingStaff ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save" size={20} color="#fff" />
                      <Text style={styles.updateButtonText}>Update Staff</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header Styles
  header: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerGradient: {
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    backgroundColor: "#3b82f6",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Tab Navigation Styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 4,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 2,
    position: "relative",
  },
  activeTab: {
    backgroundColor: "#3b82f6",
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  activeTabIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#fff",
  },
  tabBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Dashboard Styles
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: "#64748b",
    lineHeight: 24,
  },

  // Stats Cards
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  menuArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  clearButton: {
    padding: 4,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyActionText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Staff List Styles
  staffList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  staffCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  staffCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  staffAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
    marginBottom: 2,
  },
  staffDepartment: {
    fontSize: 14,
    color: "#64748b",
  },
  staffActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteAction: {
    backgroundColor: "#fef2f2",
  },
  staffCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  staffDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
    gap: 4,
  },
  availableBadge: {
    backgroundColor: "#10b981",
  },
  onLeaveBadge: {
    backgroundColor: "#f59e0b",
  },
  busyBadge: {
    backgroundColor: "#ef4444",
  },
  availabilityText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  experienceText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  pricingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceItem: {
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3b82f6",
  },

  // Medicine List Styles
  medicinesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  medicineCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medicineCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  medicineImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  medicineCategory: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
    marginBottom: 2,
  },
  medicineDosage: {
    fontSize: 14,
    color: "#64748b",
  },
  medicineActions: {
    flexDirection: "row",
    gap: 8,
  },
  medicineCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  stockInfo: {
    flex: 1,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  inStockBadge: {
    backgroundColor: "#10b981",
  },
  lowStockBadge: {
    backgroundColor: "#ef4444",
  },
  stockText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  medicinePrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },

  // Modal Styles
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
  formRow: {
    flexDirection: "row",
    gap: 12,
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  availabilityOptions: {
    flexDirection: "row",
    gap: 8,
  },
  availabilityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
  },
  selectedAvailability: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  availabilityOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  selectedAvailabilityText: {
    color: "#fff",
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
})
