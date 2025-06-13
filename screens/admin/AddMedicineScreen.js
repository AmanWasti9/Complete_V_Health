"use client"

import { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import supabase from "../../services/supabaseService"
import { LinearGradient } from "expo-linear-gradient"

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dsabwyubl/upload"
const UPLOAD_PRESET = "menuuuu"

export default function AddMedicineScreen({ navigation }) {
  const [formData, setFormData] = useState({
    medicine_name: "",
    description: "",
    dosage: "",
    stock: "",
    category: "",
    price: "",
    image: null,
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeField, setActiveField] = useState(null)

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "You need to grant camera roll permissions to upload images.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled) {
        setImagePreview(result.assets[0].uri)
        setFormData({
          ...formData,
          image: result.assets[0],
        })
      }
    } catch (error) {
      // console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  const uploadImageToCloudinary = async (imageUri) => {
    try {
      const formData = new FormData()
      const filename = imageUri.split("/").pop()
      const match = /\.(\w+)$/.exec(filename)
      const type = match ? `image/${match[1]}` : "image"

      formData.append("file", {
        uri: imageUri,
        name: filename,
        type,
      })
      formData.append("upload_preset", UPLOAD_PRESET)

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      })

      const data = await response.json()

      if (data.secure_url) {
        return data.secure_url
      } else {
        throw new Error("Failed to upload image")
      }
    } catch (error) {
      // console.error("Error uploading to Cloudinary:", error)
      throw error
    }
  }

  const validateForm = () => {
    if (!formData.medicine_name.trim()) return "Medicine name is required"
    if (!formData.description.trim()) return "Description is required"
    if (!formData.dosage.trim()) return "Dosage is required"
    if (!formData.stock.trim()) return "Stock is required"
    if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) return "Stock must be a valid number"
    if (!formData.category.trim()) return "Category is required"
    if (!formData.price.trim()) return "Price is required"
    if (isNaN(Number(formData.price)) || Number(formData.price) < 0) return "Price must be a valid number"
    if (!formData.image) return "Image is required"

    return null
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      const validationError = validateForm()

      if (validationError) {
        setError(validationError)
        return
      }

      setLoading(true)

      // Upload image to Cloudinary
      const imageUrl = await uploadImageToCloudinary(formData.image.uri)

      // Insert data into Supabase
      const { data, error: supabaseError } = await supabase.from("pharmacy").insert([
        {
          medicine_name: formData.medicine_name,
          description: formData.description,
          dosage: formData.dosage,
          stock: Number.parseInt(formData.stock),
          category: formData.category,
          price: Number.parseFloat(formData.price),
          image_url: imageUrl,
        },
      ])

      if (supabaseError) {
        throw supabaseError
      }

      Alert.alert("Success", "Medicine added successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setFormData({
              medicine_name: "",
              description: "",
              dosage: "",
              stock: "",
              category: "",
              price: "",
              image: null,
            })
            setImagePreview(null)
          },
        },
      ])
    } catch (error) {
      // console.error("Error adding medicine:", error)
      setError("Failed to add medicine. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderInputField = (
    label,
    field,
    placeholder,
    keyboardType = "default",
    multiline = false,
    numberOfLines = 1,
  ) => {
    const isActive = activeField === field

    return (
      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <Ionicons
            name={getIconForField(field)}
            size={18}
            color={isActive ? "#4361ee" : "#6b7280"}
            style={styles.labelIcon}
          />
          <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
        </View>
        <TextInput
          style={[styles.input, multiline && styles.textArea, isActive && styles.activeInput]}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={formData[field]}
          onChangeText={(text) => handleInputChange(field, text)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setActiveField(field)}
          onBlur={() => setActiveField(null)}
        />
      </View>
    )
  }

  const getIconForField = (field) => {
    switch (field) {
      case "medicine_name":
        return "medical"
      case "description":
        return "document-text"
      case "dosage":
        return "flask"
      case "stock":
        return "cube"
      case "category":
        return "folder"
      case "price":
        return "cash"
      default:
        return "help-circle"
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#4361ee", "#3a0ca3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Add Medicine</Text>
            <Text style={styles.headerSubtitle}>Enter medicine details below</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Medicine Information</Text>

              {renderInputField("Medicine Name", "medicine_name", "Enter medicine name")}
              {renderInputField(
                "Description",
                "description",
                "Enter detailed description of the medicine",
                "default",
                true,
                4,
              )}
              {renderInputField("Dosage", "dosage", "E.g., 500mg, 5ml, etc.")}
            </View>

            <View style={styles.formDivider} />

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Inventory Details</Text>

              {renderInputField("Stock Quantity", "stock", "Enter available quantity", "numeric")}
              {renderInputField("Category", "category", "E.g., Antibiotics, Painkillers, etc.")}
              {renderInputField("Price (Rs. )", "price", "Enter price in Rs", "decimal-pad")}
            </View>

            <View style={styles.formDivider} />

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Medicine Image</Text>

              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <View style={styles.imagePickerContent}>
                  <View style={styles.imageIconContainer}>
                    <Ionicons name="image" size={24} color="#fff" />
                  </View>
                  <Text style={styles.imagePickerText}>{imagePreview ? "Change Image" : "Select Image"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4361ee" />
              </TouchableOpacity>

              {imagePreview && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
                  <View style={styles.imageOverlay}>
                    <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
                      <Ionicons name="camera" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loadingText}>Adding Medicine...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="add-circle" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.submitButtonText}>Add Medicine</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    padding: 24,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  formSection: {
    marginBottom: 25,
  },
  formDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  labelIcon: {
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeLabel: {
    color: "#4361ee",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
  },
  activeInput: {
    borderColor: "#4361ee",
    backgroundColor: "#f0f4ff",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  imagePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f4ff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  imagePickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4361ee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#4361ee",
    fontWeight: "500",
  },
  imagePreviewContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 25,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  changeImageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(67, 97, 238, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 8,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  errorText: {
    color: "#ef4444",
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#4361ee",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
})
