"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import supabase from "../services/supabaseService";
import { useAuth } from "../services/AuthContext";

const { width, height } = Dimensions.get("window");

// Color theme based on #E74C3C
const COLORS = {
  primary: "#E74C3C",
  primaryLight: "#EC7063",
  primaryDark: "#C0392B",
  secondary: "#FDF2F2",
  accent: "#F39C12",
  success: "#27AE60",
  warning: "#F39C12",
  background: "#FAFAFA",
  surface: "#FFFFFF",
  text: "#2C3E50",
  textSecondary: "#7F8C8D",
  border: "#ECF0F1",
  shadow: "rgba(231, 76, 60, 0.15)",
};

// Placeholder for when data is loading
const PLACEHOLDER_MEDICINES = [
  {
    id: "1",
    name: "Paracetamol",
    brand: "Tylenol",
    price: 8.99,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Pain Relief",
    description: "For relief of minor aches and pains, reduces fever.",
    dosage: "500mg",
    quantity: 20,
    prescription: false,
  },
  {
    id: "2",
    name: "Ibuprofen",
    brand: "Advil",
    price: 10.49,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Pain Relief",
    description: "Reduces inflammation, pain, and fever.",
    dosage: "200mg",
    quantity: 30,
    prescription: false,
  },
  {
    id: "3",
    name: "Amoxicillin",
    brand: "Amoxil",
    price: 15.99,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Antibiotics",
    description: "Treats bacterial infections.",
    dosage: "500mg",
    quantity: 14,
    prescription: true,
  },
  {
    id: "4",
    name: "Loratadine",
    brand: "Claritin",
    price: 12.99,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Allergy",
    description:
      "Relieves allergy symptoms such as sneezing, runny nose, and itchy eyes.",
    dosage: "10mg",
    quantity: 30,
    prescription: false,
  },
  {
    id: "5",
    name: "Omeprazole",
    brand: "Prilosec",
    price: 18.49,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Digestive Health",
    description: "Reduces stomach acid production, treats heartburn.",
    dosage: "20mg",
    quantity: 28,
    prescription: false,
  },
  {
    id: "6",
    name: "Atorvastatin",
    brand: "Lipitor",
    price: 25.99,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Cholesterol",
    description: "Lowers cholesterol and triglycerides in the blood.",
    dosage: "10mg",
    quantity: 30,
    prescription: true,
  },
  {
    id: "7",
    name: "Metformin",
    brand: "Glucophage",
    price: 14.99,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Diabetes",
    description: "Controls blood sugar levels in type 2 diabetes.",
    dosage: "500mg",
    quantity: 60,
    prescription: true,
  },
  {
    id: "8",
    name: "Cetirizine",
    brand: "Zyrtec",
    price: 13.49,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Allergy",
    description:
      "Relieves allergy symptoms such as sneezing, itchy eyes, and runny nose.",
    dosage: "10mg",
    quantity: 30,
    prescription: false,
  },
  {
    id: "9",
    name: "Lisinopril",
    brand: "Zestril",
    price: 19.99,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Blood Pressure",
    description: "Treats high blood pressure and heart failure.",
    dosage: "10mg",
    quantity: 30,
    prescription: true,
  },
  {
    id: "10",
    name: "Aspirin",
    brand: "Bayer",
    price: 7.99,
    image:
      "https://img.freepik.com/free-vector/realistic-white-pill-bottle-with-plastic-lid_1284-66462.jpg?size=626&ext=jpg",
    category: "Pain Relief",
    description: "Relieves pain, reduces inflammation and fever.",
    dosage: "325mg",
    quantity: 100,
    prescription: false,
  },
];

// Initial categories before data loads
const INITIAL_CATEGORIES = ["All"];

// Category icons mapping
const CATEGORY_ICONS = {
  All: "pills",
  "Pain Relief": "band-aid",
  Antibiotics: "bacteria",
  Allergy: "wind",
  "Digestive Health": "stomach",
  Cholesterol: "heartbeat",
  Diabetes: "syringe",
  "Blood Pressure": "heart",
  Vitamins: "apple-alt",
  "First Aid": "first-aid",
  "Cold & Flu": "head-side-cough",
  "Eye Care": "eye",
};

export default function PharmacyScreen({ navigation }) {
  const { user, userProfile } = useAuth();
  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Remove animation values that were causing performance issues

  // Remove entrance animation to improve performance

  // Fetch medicines from Supabase
 useEffect(() => {
  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.from("pharmacy").select("*");

      const extractUniqueCategories = (meds) => {
        const categoryMap = new Map();

        meds.forEach((med) => {
          const normalized = med.category?.trim().toLowerCase();
          if (normalized && !categoryMap.has(normalized)) {
            categoryMap.set(normalized, med.category.trim());
          }
        });

        return ["All", ...categoryMap.values()];
      };

      if (error) throw error;

      if (data && data.length > 0) {
        setMedicines(data);
        setCategories(extractUniqueCategories(data));
      } else {
        setMedicines(PLACEHOLDER_MEDICINES);
        setCategories(extractUniqueCategories(PLACEHOLDER_MEDICINES));
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
      setError("Failed to load medicines. Please try again later.");

      setMedicines(PLACEHOLDER_MEDICINES);
      const extractUniqueCategories = (meds) => {
        const categoryMap = new Map();

        meds.forEach((med) => {
          const normalized = med.category?.trim().toLowerCase();
          if (normalized && !categoryMap.has(normalized)) {
            categoryMap.set(normalized, med.category.trim());
          }
        });

        return ["All", ...categoryMap.values()];
      };
      setCategories(extractUniqueCategories(PLACEHOLDER_MEDICINES));
    } finally {
      setLoading(false);
    }
  };

  fetchMedicines();
}, []);

  // Filter medicines based on search query and selected category
  useEffect(() => {
    let result = medicines;

    if (searchQuery) {
      result = result.filter(
        (medicine) =>
          (medicine.medicine_name || medicine.name)
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          medicine.category
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          medicine.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const filteredMedicines =
      selectedCategory === "All"
        ? medicines
        : medicines.filter(
            (med) =>
              med.category?.trim().toLowerCase() ===
              selectedCategory.trim().toLowerCase()
          );


    setFilteredMedicines(filteredMedicines);
  }, [medicines, searchQuery, selectedCategory]);

  // Cart functions
  const addToCart = (medicine) => {
    const existingItem = cart.find((item) => item.id === medicine.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }

    // Show feedback
    Alert.alert(
      "Added to Cart",
      `${medicine.medicine_name || medicine.name} has been added to your cart.`
    );
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter((item) => item.id !== medicineId));
  };

  const updateQuantity = (medicineId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(medicineId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === medicineId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  };

  const placeOrder = async () => {
    try {
      // Set loading state
      setOrderPlaced(true);
      
      if (!user) {
        Alert.alert("Error", "You must be logged in to place an order.");
        setOrderPlaced(false);
        return;
      }
      
      // Format medicines data for Supabase
      const medicinesData = cart.map(item => ({
        id: item.id,
        name: item.medicine_name || item.name,
        quantity: item.quantity,
        price: item.price
      }));
      
      // Calculate total amount
      const totalAmount = parseFloat(getTotalPrice()) + 5; // Adding $5 delivery fee
      
      // Insert order into Supabase
      const { data, error } = await supabase
        .from("medicines_order")
        .insert({
          patient_id: user.id,
          full_name: deliveryAddress.fullName,
          street_address: deliveryAddress.streetAddress,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zip_code: deliveryAddress.zipCode,
          phone: deliveryAddress.phone,
          medicines: medicinesData,
          total_amount: totalAmount,
          status: "pending"
        });
      
      if (error) {
        console.error("Error placing order:", error);
        Alert.alert("Error", "Failed to place your order. Please try again.");
        setOrderPlaced(false);
        return;
      }
      
      console.log("Order placed successfully:", data);
      
      // Reset after order is placed
      setTimeout(() => {
        setCart([]);
        setDeliveryAddress({
          fullName: "",
          streetAddress: "",
          city: "",
          state: "",
          zipCode: "",
          phone: "",
        });
        setOrderPlaced(false);
        setShowCheckout(false);
        
        // Show success message
        Alert.alert(
          "Order Placed",
          "Your order has been placed successfully and will be delivered soon."
        );
      }, 2000);
    } catch (err) {
      console.error("Unexpected error placing order:", err);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      setOrderPlaced(false);
    }
  };

  const viewProductDetails = (product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || "capsules";
  };

  // Render functions - Memoized for better performance
  const renderMedicineItem = React.useCallback(({ item, index }) => {
    // Determine if prescription is required
    const requiresPrescription = item.prescription === true;

    // Get medicine name and image from either Supabase data or placeholder data
    const medicineName = item.medicine_name || item.name;
    const medicineImage =
      item.image_url || item.image || "https://via.placeholder.com/150";

    return (
        <View style={styles.medicineCardContainer}>
          <TouchableOpacity
            style={styles.medicineCard}
            onPress={() => viewProductDetails(item)}
            activeOpacity={0.95}
            accessibilityLabel={`View details for ${medicineName}`}
            accessibilityRole="button"
          >
            <View style={styles.medicineImageContainer}>
              <Image
                source={{ uri: medicineImage }}
                style={styles.medicineImage}
                onError={() =>
                  console.log("Error loading image for", medicineName)
                }
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)"]}
                style={styles.imageOverlay}
              />
              {requiresPrescription && (
                <View style={styles.prescriptionTag}>
                  <FontAwesome5 name="prescription" size={12} color="#fff" />
                  <Text style={styles.prescriptionText}>Rx</Text>
                </View>
              )}
            </View>

            <View style={styles.medicineInfo}>
              <Text style={styles.medicineName} numberOfLines={1}>
                {medicineName}
              </Text>
              <Text style={styles.medicineBrand} numberOfLines={1}>
                {item.brand}
              </Text>
              <View style={styles.medicineMetaRow}>
                <Text style={styles.medicineDosage}>{item.dosage}</Text>
                <View style={styles.categoryBadge}>
                  <FontAwesome5
                    name={getCategoryIcon(item.category)}
                    size={10}
                    color={COLORS.primary}
                  />
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
              </View>

              <View style={styles.medicineBottomRow}>
                <Text style={styles.medicinePrice}>
                  Rs. {Number.parseFloat(item.price).toFixed(2)}
                </Text>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                  accessibilityLabel={`Add ${medicineName} to cart`}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    style={styles.addButtonGradient}
                  >
                    <FontAwesome5 name="plus" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
    );
  }, []);

  const renderCategoryItem = React.useCallback(({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.selectedCategoryButton,
      ]}
      onPress={() => setSelectedCategory(item)}
      accessibilityLabel={`Filter by ${item} category`}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedCategory === item }}
    >
      <LinearGradient
        colors={
          selectedCategory === item
            ? [COLORS.primary, COLORS.primaryDark]
            : [COLORS.surface, COLORS.secondary]
        }
        style={styles.categoryButtonGradient}
      >
        <FontAwesome5
          name={getCategoryIcon(item)}
          size={14}
          color={selectedCategory === item ? "#fff" : COLORS.primary}
          solid
        />
        <Text
          style={[
            styles.categoryText,
            selectedCategory === item && styles.selectedCategoryText,
          ]}
        >
          {item}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  ), [selectedCategory]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={[COLORS.secondary, COLORS.border]}
          style={styles.emptyIconGradient}
        >
          <FontAwesome5 name="search" size={40} color={COLORS.textSecondary} />
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>No Medicines Found</Text>
      <Text style={styles.emptyText}>
        We couldn't find any medicines matching your search criteria.
      </Text>
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          setSearchQuery("");
          setSelectedCategory("All");
        }}
        accessibilityLabel="Reset search"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.resetButtonGradient}
        >
          <Text style={styles.resetButtonText}>Reset Search</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading medicines...</Text>
      </View>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <LinearGradient
          colors={[COLORS.secondary, "#FFEBEE"]}
          style={styles.errorIconGradient}
        >
          <FontAwesome5
            name="exclamation-circle"
            size={40}
            color={COLORS.primary}
          />
        </LinearGradient>
      </View>
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => navigation.replace("PharmacyScreen")}
        accessibilityLabel="Retry loading medicines"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.retryButtonGradient}
        >
          <FontAwesome5 name="redo" size={14} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <View style={styles.container}>
        {/* Static Header - No collapsing for better performance and consistency */}
        <View style={styles.header}>
          <LinearGradient
            colors={[COLORS.surface, COLORS.secondary]}
            style={styles.headerGradient}
          >
            {/* Top Navigation */}
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <FontAwesome5 name="arrow-left" size={18} color={COLORS.text} />
              </TouchableOpacity>

            

              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => setShowCart(true)}
                accessibilityLabel={`View cart with ${cart.length} items`}
                accessibilityRole="button"
              >
                <FontAwesome5
                  name="shopping-cart"
                  size={18}
                  color={COLORS.text}
                />
                {cart.length > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cart.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Header Content */}
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Pharmacy</Text>
              <Text style={styles.headerSubtitle}>
                Find and order medicines online
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <FontAwesome5
              name="search"
              size={16}
              color={COLORS.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search medicines, brands..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textSecondary}
              accessibilityLabel="Search medicines"
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
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Medicine List */}
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : filteredMedicines.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredMedicines}
            renderItem={renderMedicineItem}
            keyExtractor={(item) => {
              // Provide stable keys to prevent re-renders
              if (item.id) return item.id.toString();
              if (item.medicine_name) return `med_${item.medicine_name}_${item.price}`;
              return `item_${item.name}_${item.price}`;
            }}
            contentContainerStyle={styles.medicineList}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            // Performance optimizations
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            // Remove problematic scroll animations
            onScroll={undefined}
            scrollEventThrottle={16}
          />
        )}

        {/* Cart Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showCart}
          onRequestClose={() => setShowCart(false)}
        >
          <BlurView intensity={30} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Your Cart</Text>
                <TouchableOpacity
                  onPress={() => setShowCart(false)}
                  style={styles.closeButton}
                  accessibilityLabel="Close cart"
                  accessibilityRole="button"
                >
                  <FontAwesome5 name="times" size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {cart.length === 0 ? (
                <View style={styles.emptyCartContainer}>
                  <View style={styles.emptyCartIconContainer}>
                    <LinearGradient
                      colors={[COLORS.secondary, COLORS.border]}
                      style={styles.emptyCartIconGradient}
                    >
                      <FontAwesome5
                        name="shopping-cart"
                        size={40}
                        color={COLORS.textSecondary}
                      />
                    </LinearGradient>
                  </View>
                  <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                  <Text style={styles.emptyCartText}>
                    Add medicines to your cart to proceed with checkout.
                  </Text>
                  <TouchableOpacity
                    style={styles.continueShoppingButton}
                    onPress={() => setShowCart(false)}
                    accessibilityLabel="Continue shopping"
                    accessibilityRole="button"
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={styles.continueShoppingGradient}
                    >
                      <Text style={styles.continueShoppingText}>
                        Continue Shopping
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <ScrollView
                    style={styles.cartItemsContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    {cart.map((item) => (
                      <View key={item.id} style={styles.cartItem}>
                        <Image
                          source={{
                            uri:
                              item.image_url ||
                              item.image ||
                              "https://via.placeholder.com/150",
                          }}
                          style={styles.cartItemImage}
                        />
                        <View style={styles.cartItemInfo}>
                          <Text style={styles.cartItemName} numberOfLines={1}>
                            {item.medicine_name || item.name}
                          </Text>
                          <Text style={styles.cartItemDosage}>
                            {item.dosage} • {item.brand}
                          </Text>
                          <View style={styles.cartItemPriceRow}>
                            <Text style={styles.cartItemPrice}>
                              Rs. {item.price.toFixed(2)}
                            </Text>
                            <Text style={styles.cartItemTotal}>
                              Rs. {(item.price * item.quantity).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.quantityControlContainer}>
                          <View style={styles.quantityControl}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              accessibilityLabel="Decrease quantity"
                              accessibilityRole="button"
                            >
                              <FontAwesome5
                                name="minus"
                                size={12}
                                color={COLORS.text}
                              />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>
                              {item.quantity}
                            </Text>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              accessibilityLabel="Increase quantity"
                              accessibilityRole="button"
                            >
                              <FontAwesome5
                                name="plus"
                                size={12}
                                color={COLORS.text}
                              />
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeFromCart(item.id)}
                            accessibilityLabel={`Remove ${
                              item.medicine_name || item.name
                            } from cart`}
                            accessibilityRole="button"
                          >
                            <FontAwesome5
                              name="trash-alt"
                              size={16}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  <View style={styles.cartSummary}>
                    <View style={styles.cartSummaryRow}>
                      <Text style={styles.cartSummaryLabel}>Subtotal</Text>
                      <Text style={styles.cartSummaryValue}>
                      Rs. {getTotalPrice()}
                      </Text>
                    </View>
                    <View style={styles.cartSummaryRow}>
                      <Text style={styles.cartSummaryLabel}>Delivery Fee</Text>
                      <Text style={styles.cartSummaryValue}>Rs. 5.00</Text>
                    </View>
                    <View style={styles.cartSummaryRow}>
                      <Text style={styles.cartSummaryLabelTotal}>Total</Text>
                      <Text style={styles.cartSummaryValueTotal}>
                        Rs. {(Number.parseFloat(getTotalPrice()) + 5).toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.checkoutButton}
                      onPress={() => {
                        setShowCart(false);
                        setShowCheckout(true);
                      }}
                      accessibilityLabel="Proceed to checkout"
                      accessibilityRole="button"
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.primaryDark]}
                        style={styles.checkoutButtonGradient}
                      >
                        <Text style={styles.checkoutButtonText}>
                          Proceed to Checkout
                        </Text>
                        <FontAwesome5
                          name="arrow-right"
                          size={14}
                          color="#fff"
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </BlurView>
        </Modal>

        {/* Product Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showProductDetails}
          onRequestClose={() => setShowProductDetails(false)}
        >
          <BlurView intensity={30} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedProduct && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Product Details</Text>
                    <TouchableOpacity
                      onPress={() => setShowProductDetails(false)}
                      style={styles.closeButton}
                      accessibilityLabel="Close product details"
                      accessibilityRole="button"
                    >
                      <FontAwesome5
                        name="times"
                        size={20}
                        color={COLORS.text}
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.productDetailsContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.productImageContainer}>
                      <Image
                        source={{
                          uri:
                            selectedProduct.image_url || selectedProduct.image,
                        }}
                        style={styles.productDetailImage}
                      />
                      {selectedProduct.prescription && (
                        <View style={styles.productPrescriptionTag}>
                          <FontAwesome5
                            name="prescription"
                            size={14}
                            color="#fff"
                          />
                          <Text style={styles.productPrescriptionText}>
                            Prescription Required
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.productDetailInfo}>
                      <Text style={styles.productDetailName}>
                        {selectedProduct.medicine_name || selectedProduct.name}
                      </Text>
                      <Text style={styles.productDetailBrand}>
                        {selectedProduct.brand}
                      </Text>
                      <Text style={styles.productDetailPrice}>
                        Rs. {Number.parseFloat(selectedProduct.price).toFixed(2)}
                      </Text>

                      <View style={styles.productDetailCard}>
                        <View style={styles.productDetailRow}>
                          <View style={styles.productDetailIconContainer}>
                            <FontAwesome5
                              name={getCategoryIcon(selectedProduct.category)}
                              size={16}
                              color={COLORS.primary}
                            />
                          </View>
                          <View style={styles.productDetailTextContainer}>
                            <Text style={styles.productDetailLabel}>
                              Category
                            </Text>
                            <Text style={styles.productDetailValue}>
                              {selectedProduct.category}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.productDetailRow}>
                          <View style={styles.productDetailIconContainer}>
                            <FontAwesome5
                              name="pills"
                              size={16}
                              color={COLORS.primary}
                            />
                          </View>
                          <View style={styles.productDetailTextContainer}>
                            <Text style={styles.productDetailLabel}>
                              Dosage
                            </Text>
                            <Text style={styles.productDetailValue}>
                              {selectedProduct.dosage}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.productDetailRow}>
                          <View style={styles.productDetailIconContainer}>
                            <FontAwesome5
                              name="box"
                              size={16}
                              color={COLORS.primary}
                            />
                          </View>
                          <View style={styles.productDetailTextContainer}>
                            <Text style={styles.productDetailLabel}>
                              Quantity
                            </Text>
                            <Text style={styles.productDetailValue}>
                              {selectedProduct.quantity} tablets/capsules
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.descriptionTitle}>Description</Text>
                      <Text style={styles.descriptionText}>
                        {selectedProduct.description}
                      </Text>

                      <View style={styles.productActionButtons}>
                        <TouchableOpacity
                          style={styles.addToCartButton}
                          onPress={() => {
                            addToCart(selectedProduct);
                            setShowProductDetails(false);
                          }}
                          accessibilityLabel={`Add ${
                            selectedProduct.medicine_name ||
                            selectedProduct.name
                          } to cart`}
                          accessibilityRole="button"
                        >
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryDark]}
                            style={styles.addToCartButtonGradient}
                          >
                            <FontAwesome5
                              name="shopping-cart"
                              size={16}
                              color="#fff"
                            />
                            <Text style={styles.addToCartButtonText}>
                              Add to Cart
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </BlurView>
        </Modal>

        {/* Checkout Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showCheckout}
          onRequestClose={() => setShowCheckout(false)}
        >
          <BlurView intensity={30} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {orderPlaced ? (
                <View style={styles.orderSuccessContainer}>
                  <View style={styles.orderSuccessIconContainer}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      style={styles.orderSuccessIconGradient}
                    >
                      <FontAwesome5 name="check" size={40} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.orderSuccessTitle}>Order Placed!</Text>
                  <Text style={styles.orderSuccessText}>
                    Your order has been successfully placed and will be
                    delivered soon.
                  </Text>
                  <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                    style={{ marginTop: 20 }}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Checkout</Text>
                    <TouchableOpacity
                      onPress={() => setShowCheckout(false)}
                      style={styles.closeButton}
                      accessibilityLabel="Close checkout"
                      accessibilityRole="button"
                    >
                      <FontAwesome5
                        name="times"
                        size={20}
                        color={COLORS.text}
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.checkoutContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.checkoutSection}>
                      <Text style={styles.checkoutSectionTitle}>
                        Order Summary
                      </Text>
                      <View style={styles.checkoutCard}>
                        {cart.map((item) => (
                          <View key={item.id} style={styles.checkoutItem}>
                            <View style={styles.checkoutItemInfo}>
                              <Text
                                style={styles.checkoutItemName}
                                numberOfLines={1}
                              >
                                {item.medicine_name || item.name}
                              </Text>
                              <Text style={styles.checkoutItemDosage}>
                                {item.dosage}
                              </Text>
                            </View>
                            <Text style={styles.checkoutItemQuantity}>
                              x{item.quantity}
                            </Text>
                            <Text style={styles.checkoutItemPrice}>
                            Rs. {(item.price * item.quantity).toFixed(2)}
                            </Text>
                          </View>
                        ))}

                        <View style={styles.checkoutDivider} />

                        <View style={styles.checkoutSummaryRow}>
                          <Text style={styles.checkoutSummaryLabel}>
                            Subtotal
                          </Text>
                          <Text style={styles.checkoutSummaryValue}>
                            Rs. {getTotalPrice()}
                          </Text>
                        </View>
                        <View style={styles.checkoutSummaryRow}>
                          <Text style={styles.checkoutSummaryLabel}>
                            Delivery Fee
                          </Text>
                          <Text style={styles.checkoutSummaryValue}>Rs. 5.00</Text>
                        </View>
                        <View style={styles.checkoutSummaryRow}>
                          <Text style={styles.checkoutSummaryLabelTotal}>
                            Total
                          </Text>
                          <Text style={styles.checkoutSummaryValueTotal}>
                            Rs.
                            {(Number.parseFloat(getTotalPrice()) + 5).toFixed(
                              2
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.checkoutSection}>
                      <Text style={styles.checkoutSectionTitle}>
                        Delivery Address
                      </Text>
                      <View style={styles.checkoutCard}>
                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>Full Name</Text>
                          <View style={styles.formInputContainer}>
                            <FontAwesome5
                              name="user"
                              size={16}
                              color={COLORS.textSecondary}
                              style={styles.formInputIcon}
                            />
                            <TextInput
                              style={styles.formInput}
                              value={deliveryAddress.fullName}
                              onChangeText={(text) =>
                                setDeliveryAddress({
                                  ...deliveryAddress,
                                  fullName: text,
                                })
                              }
                              placeholder="Enter your full name"
                              placeholderTextColor={COLORS.textSecondary}
                              accessibilityLabel="Full name input"
                            />
                          </View>
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.formLabel}>Street Address</Text>
                          <View style={styles.formInputContainer}>
                            <FontAwesome5
                              name="home"
                              size={16}
                              color={COLORS.textSecondary}
                              style={styles.formInputIcon}
                            />
                            <TextInput
                              style={styles.formInput}
                              value={deliveryAddress.streetAddress}
                              onChangeText={(text) =>
                                setDeliveryAddress({
                                  ...deliveryAddress,
                                  streetAddress: text,
                                })
                              }
                              placeholder="Enter your street address"
                              placeholderTextColor={COLORS.textSecondary}
                              accessibilityLabel="Street address input"
                            />
                          </View>
                        </View>

                        <View style={styles.formRow}>
                          <View
                            style={[
                              styles.formGroup,
                              { flex: 1, marginRight: 10 },
                            ]}
                          >
                            <Text style={styles.formLabel}>City</Text>
                            <View style={styles.formInputContainer}>
                              <FontAwesome5
                                name="city"
                                size={14}
                                color={COLORS.textSecondary}
                                style={styles.formInputIcon}
                              />
                              <TextInput
                                style={styles.formInput}
                                value={deliveryAddress.city}
                                onChangeText={(text) =>
                                  setDeliveryAddress({
                                    ...deliveryAddress,
                                    city: text,
                                  })
                                }
                                placeholder="City"
                                placeholderTextColor={COLORS.textSecondary}
                                accessibilityLabel="City input"
                              />
                            </View>
                          </View>

                          <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.formLabel}>State</Text>
                            <View style={styles.formInputContainer}>
                              <FontAwesome5
                                name="map-marker-alt"
                                size={14}
                                color={COLORS.textSecondary}
                                style={styles.formInputIcon}
                              />
                              <TextInput
                                style={styles.formInput}
                                value={deliveryAddress.state}
                                onChangeText={(text) =>
                                  setDeliveryAddress({
                                    ...deliveryAddress,
                                    state: text,
                                  })
                                }
                                placeholder="State"
                                placeholderTextColor={COLORS.textSecondary}
                                accessibilityLabel="State input"
                              />
                            </View>
                          </View>
                        </View>

                        <View style={styles.formRow}>
                          <View
                            style={[
                              styles.formGroup,
                              { flex: 1, marginRight: 10 },
                            ]}
                          >
                            <Text style={styles.formLabel}>Zip Code</Text>
                            <View style={styles.formInputContainer}>
                              <FontAwesome5
                                name="map-pin"
                                size={14}
                                color={COLORS.textSecondary}
                                style={styles.formInputIcon}
                              />
                              <TextInput
                                style={styles.formInput}
                                value={deliveryAddress.zipCode}
                                onChangeText={(text) =>
                                  setDeliveryAddress({
                                    ...deliveryAddress,
                                    zipCode: text,
                                  })
                                }
                                placeholder="Zip Code"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="numeric"
                                accessibilityLabel="Zip code input"
                              />
                            </View>
                          </View>

                          <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.formLabel}>Phone</Text>
                            <View style={styles.formInputContainer}>
                              <FontAwesome5
                                name="phone"
                                size={14}
                                color={COLORS.textSecondary}
                                style={styles.formInputIcon}
                              />
                              <TextInput
                                style={styles.formInput}
                                value={deliveryAddress.phone}
                                onChangeText={(text) =>
                                  setDeliveryAddress({
                                    ...deliveryAddress,
                                    phone: text,
                                  })
                                }
                                placeholder="Phone Number"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="phone-pad"
                                accessibilityLabel="Phone input"
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.placeOrderButton,
                        (!deliveryAddress.fullName ||
                          !deliveryAddress.streetAddress ||
                          !deliveryAddress.city ||
                          !deliveryAddress.state ||
                          !deliveryAddress.zipCode ||
                          !deliveryAddress.phone) &&
                          styles.disabledButton,
                      ]}
                      disabled={
                        !deliveryAddress.fullName ||
                        !deliveryAddress.streetAddress ||
                        !deliveryAddress.city ||
                        !deliveryAddress.state ||
                        !deliveryAddress.zipCode ||
                        !deliveryAddress.phone
                      }
                      onPress={placeOrder}
                      accessibilityLabel="Place order"
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled:
                          !deliveryAddress.fullName ||
                          !deliveryAddress.streetAddress ||
                          !deliveryAddress.city ||
                          !deliveryAddress.state ||
                          !deliveryAddress.zipCode ||
                          !deliveryAddress.phone,
                      }}
                    >
                      <LinearGradient
                        colors={
                          !deliveryAddress.fullName ||
                          !deliveryAddress.streetAddress ||
                          !deliveryAddress.city ||
                          !deliveryAddress.state ||
                          !deliveryAddress.zipCode ||
                          !deliveryAddress.phone
                            ? [COLORS.textSecondary, "#95A5A6"]
                            : [COLORS.primary, COLORS.primaryDark]
                        }
                        style={styles.placeOrderButtonGradient}
                      >
                        <FontAwesome5
                          name="check-circle"
                          size={16}
                          color="#fff"
                        />
                        <Text style={styles.placeOrderButtonText}>
                          Place Order
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </ScrollView>
                </>
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
    backgroundColor: COLORS.surface,
    paddingTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    width: "100%",
    height: 200,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: COLORS.text,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartBadge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 6,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  clearSearchButton: {
    padding: 5,
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoryButton: {
    marginHorizontal: 5,
    borderRadius: 16,
    overflow: "hidden",
  },
  categoryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 8,
  },
  selectedCategoryButton: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedCategoryText: {
    color: "#FFF",
  },
  medicineList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  medicineCardContainer: {
    width: "50%",
    paddingHorizontal: 5,
    marginBottom: 15,
  },
  medicineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  medicineImageContainer: {
    position: "relative",
    width: "100%",
    height: 140,
  },
  medicineImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  prescriptionTag: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  prescriptionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  medicineInfo: {
    padding: 14,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  medicineBrand: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  medicineMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  medicineDosage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  medicineBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medicinePrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
    color: COLORS.textSecondary,
    marginTop: 15,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 16,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  resetButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  resetButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resetButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginTop: height * 0.1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyCartIconContainer: {
    marginBottom: 20,
  },
  emptyCartIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  emptyCartText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  continueShoppingButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  continueShoppingGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  continueShoppingText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cartItemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  cartItemDosage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  cartItemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartItemPrice: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 10,
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  quantityControlContainer: {
    alignItems: "center",
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    padding: 5,
    marginBottom: 8,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text,
    marginHorizontal: 10,
  },
  removeButton: {
    padding: 5,
  },
  cartSummary: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.secondary,
  },
  cartSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cartSummaryLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  cartSummaryValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },
  cartSummaryLabelTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  cartSummaryValueTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  checkoutButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 15,
  },
  checkoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  checkoutButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 8,
  },
  productDetailsContainer: {
    flex: 1,
  },
  productImageContainer: {
    position: "relative",
  },
  productDetailImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  productPrescriptionTag: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  productPrescriptionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
  productDetailInfo: {
    padding: 20,
  },
  productDetailName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 5,
  },
  productDetailBrand: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  productDetailPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 20,
  },
  productDetailCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
  },
  productDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  productDetailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  productDetailTextContainer: {
    flex: 1,
  },
  productDetailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  productDetailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  productActionButtons: {
    marginTop: 10,
  },
  addToCartButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  addToCartButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  addToCartButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  checkoutContainer: {
    flex: 1,
  },
  checkoutSection: {
    marginBottom: 20,
  },
  checkoutSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  checkoutCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 15,
  },
  checkoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  checkoutItemInfo: {
    flex: 1,
  },
  checkoutItemName: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 2,
  },
  checkoutItemDosage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  checkoutItemQuantity: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginHorizontal: 15,
  },
  checkoutItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  checkoutDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },
  checkoutSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  checkoutSummaryLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  checkoutSummaryValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },
  checkoutSummaryLabelTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  checkoutSummaryValueTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: "row",
  },
  formLabel: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: "600",
  },
  formInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formInputIcon: {
    marginRight: 10,
    paddingVertical: 15,
  },
  formInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
  },
  placeOrderButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  placeOrderButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  placeOrderButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  orderSuccessContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  orderSuccessIconContainer: {
    marginBottom: 20,
  },
  orderSuccessIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  orderSuccessTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },
  orderSuccessText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
