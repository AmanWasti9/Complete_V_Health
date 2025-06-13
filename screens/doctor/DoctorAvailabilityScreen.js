"use client";

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import supabase from "../../services/supabaseService";
import { useAuth } from "../../services/AuthContext";

const { width } = Dimensions.get("window");

// Refined color palette for better accessibility and modern look
const COLORS = {
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  primaryLight: "#6366F1",
  secondary: "#06B6D4",
  accent: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F8FAFC",
  card: "#FFFFFF",
  cardSecondary: "#F1F5F9",
  text: "#1E293B",
  textSecondary: "#64748B",
  textLight: "#94A3B8",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  shadow: "rgba(79, 70, 229, 0.12)",
  overlay: "rgba(15, 23, 42, 0.05)",
};

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

export default function DoctorAvailabilityScreen({ navigation }) {
  const [dates, setDates] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Enhanced animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Generate dates for the next 7 days
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
    });

    setDates(next7Days);

    // Initialize availability state
    const initialAvailability = next7Days.reduce((acc, date) => {
      const dateStr = date.toISOString().split("T")[0];
      acc[dateStr] = TIME_SLOTS.reduce((timeAcc, time) => {
        timeAcc[time] = false;
        return timeAcc;
      }, {});
      return acc;
    }, {});

    // Fetch existing availability data from Supabase
    fetchAvailability(initialAvailability);

    // Enhanced entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchAvailability = async (initialAvailability) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        // Convert the stored data back to our state format
        const fetchedAvailability = { ...initialAvailability };

        data.forEach((slot) => {
          const { date, time_slot, is_available } = slot;
          if (
            fetchedAvailability[date] &&
            fetchedAvailability[date][time_slot] !== undefined
          ) {
            fetchedAvailability[date][time_slot] = is_available;
          }
        });

        setAvailability(fetchedAvailability);
      } else {
        setAvailability(initialAvailability);
      }
    } catch (error) {
      // console.error("Error fetching availability:", error);
      Alert.alert("Error", "Failed to load availability data");
      setAvailability(initialAvailability);
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeSlot = (date, time) => {
    const dateStr = date.toISOString().split("T")[0];
    setAvailability((prev) => ({
      ...prev,
      [dateStr]: {
        ...prev[dateStr],
        [time]: !prev[dateStr][time],
      },
    }));
  };

  const toggleAllTimeSlots = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const allSelected = Object.values(availability[dateStr]).every(
      (slot) => slot
    );
    setAvailability((prev) => ({
      ...prev,
      [dateStr]: TIME_SLOTS.reduce((acc, time) => {
        acc[time] = !allSelected;
        return acc;
      }, {}),
    }));
  };

  const formatDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getDateNumber = (date) => {
    return date.getDate();
  };

  const getWeekday = (date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const getSelectedSlotsCount = (dateStr) => {
    return Object.values(availability[dateStr] || {}).filter(Boolean).length;
  };

  const getTotalSelectedSlots = () => {
    return Object.values(availability).reduce((total, daySlots) => {
      return total + Object.values(daySlots).filter(Boolean).length;
    }, 0);
  };

  const saveAvailability = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to save availability");
      return;
    }

    setSaving(true);
    try {
      // First, delete existing records for this doctor
      const { error: deleteError } = await supabase
        .from("doctor_availability")
        .delete()
        .eq("doctor_id", user.id);

      if (deleteError) throw deleteError;

      // Prepare the data for insertion
      const availabilityRecords = [];

      Object.entries(availability).forEach(([date, timeSlots]) => {
        Object.entries(timeSlots).forEach(([timeSlot, isAvailable]) => {
          availabilityRecords.push({
            doctor_id: user.id,
            date,
            time_slot: timeSlot,
            is_available: isAvailable,
            updated_at: new Date().toISOString(),
          });
        });
      });

      // Insert the new availability records
      const { error: insertError } = await supabase
        .from("doctor_availability")
        .insert(availabilityRecords);

      if (insertError) throw insertError;

      Alert.alert("Success", "Your availability has been updated");
      navigation.goBack();
    } catch (error) {
      // console.error("Error saving availability:", error);
      Alert.alert("Error", "Failed to save availability data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Set Availability</Text>
            <Text style={styles.headerSubtitle}>
              Choose your available time slots
            </Text>
          </View>

          <View style={styles.headerBadge}>
            <Text style={styles.badgeNumber}>{getTotalSelectedSlots()}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading availability...</Text>
          </View>
        </View>
      ) : (
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Quick Stats */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.statNumber}>{dates.length}</Text>
                <Text style={styles.statLabel}>Days</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.secondary}
                />
                <Text style={styles.statNumber}>{getTotalSelectedSlots()}</Text>
                <Text style={styles.statLabel}>Slots</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={COLORS.success}
                />
                <Text style={styles.statNumber}>
                  {Math.round(
                    (getTotalSelectedSlots() /
                      (dates.length * TIME_SLOTS.length)) *
                      100
                  )}
                  %
                </Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>

            {/* Date Cards */}
            {dates.map((date, index) => {
              const dateStr = date.toISOString().split("T")[0];
              const selectedCount = getSelectedSlotsCount(dateStr);
              const allSelected = selectedCount === TIME_SLOTS.length;
              const hasSelections = selectedCount > 0;

              return (
                <View key={dateStr} style={styles.dateCard}>
                  {/* Date Header */}
                  <View style={styles.dateHeader}>
                    <View style={styles.dateInfo}>
                      <View
                        style={[
                          styles.dateCircle,
                          hasSelections && styles.dateCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateNumber,
                            hasSelections && styles.dateNumberActive,
                          ]}
                        >
                          {getDateNumber(date)}
                        </Text>
                        <Text
                          style={[
                            styles.weekday,
                            hasSelections && styles.weekdayActive,
                          ]}
                        >
                          {getWeekday(date)}
                        </Text>
                      </View>
                      <View style={styles.dateDetails}>
                        <Text style={styles.dateTitle}>{formatDate(date)}</Text>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${
                                    (selectedCount / TIME_SLOTS.length) * 100
                                  }%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {selectedCount}/{TIME_SLOTS.length}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.toggleAllButton,
                        allSelected && styles.toggleAllButtonActive,
                      ]}
                      onPress={() => toggleAllTimeSlots(date)}
                    >
                      <Ionicons
                        name={allSelected ? "remove-circle" : "add-circle"}
                        size={18}
                        color={allSelected ? "#fff" : COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.toggleAllText,
                          allSelected && styles.toggleAllTextActive,
                        ]}
                      >
                        {allSelected ? "Clear" : "All"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Time Slots Grid */}
                  <View style={styles.timeSlotsGrid}>
                    {TIME_SLOTS.map((time) => {
                      const isSelected = availability[dateStr][time];
                      return (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeSlot,
                            isSelected && styles.timeSlotSelected,
                          ]}
                          onPress={() => toggleTimeSlot(date, time)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.timeSlotContent,
                              isSelected && styles.timeSlotContentSelected,
                            ]}
                          >
                            <Ionicons
                              name={isSelected ? "checkmark" : "time-outline"}
                              size={16}
                              color={isSelected ? "#fff" : COLORS.textSecondary}
                            />
                            <Text
                              style={[
                                styles.timeSlotText,
                                isSelected && styles.timeSlotTextSelected,
                              ]}
                            >
                              {time}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Enhanced Save Button */}
          <View style={styles.saveContainer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (saving || loading) && styles.saveButtonDisabled,
              ]}
              onPress={saveAvailability}
              disabled={saving || loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.success, "#059669"]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Availability</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.card,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 16,
  },
  dateCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.cardSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  dateCircleActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  dateNumberActive: {
    color: COLORS.primary,
  },
  weekday: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  weekdayActive: {
    color: COLORS.primary,
  },
  dateDetails: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    marginRight: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
    minWidth: 35,
  },
  toggleAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  toggleAllButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    marginLeft: 4,
  },
  toggleAllTextActive: {
    color: "#fff",
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeSlot: {
    width: (width - 80) / 4 - 7.5,
    borderRadius: 12,
    overflow: "hidden",
  },
  timeSlotSelected: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeSlotContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: COLORS.cardSecondary,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
  },
  timeSlotContentSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  timeSlotTextSelected: {
    color: "#fff",
  },
  saveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  saveButton: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
