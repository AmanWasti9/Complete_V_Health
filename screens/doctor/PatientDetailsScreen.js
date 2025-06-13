"use client"

import React, { useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  Animated,
  Image,
} from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

// Modern color palette
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

// Enhanced medical history data with more details
const medicalHistory = [
  {
    id: "1",
    date: "2025-05-28",
    type: "Consultation",
    description: "Regular checkup for hypertension",
    prescription: "Amlodipine 5mg daily",
    bp: "130/85",
    pulse: "72 bpm",
    temperature: "98.6°F",
    notes: "Patient reported occasional headaches. Blood pressure showing improvement with current medication.",
    severity: "moderate",
    followUp: "2 weeks",
  },
  {
    id: "2",
    date: "2025-05-15",
    type: "Lab Test",
    description: "Blood pressure monitoring and lipid panel",
    results: "BP: 140/90, Cholesterol: 180 mg/dL",
    notes: "Slight elevation in blood pressure. Cholesterol levels within normal range.",
    severity: "mild",
    followUp: "1 month",
  },
  {
    id: "3",
    date: "2025-05-01",
    type: "Consultation",
    description: "Follow-up appointment for medication adjustment",
    prescription: "Continue current medication, increase water intake",
    bp: "135/88",
    pulse: "68 bpm",
    notes: "Patient feeling better with current medication. Lifestyle modifications showing positive results.",
    severity: "mild",
    followUp: "3 weeks",
  },
  {
    id: "4",
    date: "2025-04-20",
    type: "Emergency",
    description: "Acute hypertensive episode",
    prescription: "Emergency medication administered",
    bp: "180/110",
    pulse: "95 bpm",
    notes: "Patient experienced severe headache and dizziness. Immediate treatment provided.",
    severity: "severe",
    followUp: "1 week",
  },
]

export default function PatientDetailsScreen({ route, navigation }) {
  const { patient } = route.params
  const [selectedTab, setSelectedTab] = useState("overview")

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const translateY = React.useRef(new Animated.Value(30)).current

  React.useEffect(() => {
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
  }, [])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "severe":
        return COLORS.danger
      case "moderate":
        return COLORS.warning
      case "mild":
        return COLORS.success
      default:
        return COLORS.textSecondary
    }
  }

  const getRecordTypeIcon = (type) => {
    switch (type) {
      case "Consultation":
        return "medical-bag"
      case "Lab Test":
        return "test-tube"
      case "Emergency":
        return "alert-circle"
      default:
        return "clipboard-text"
    }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const renderMedicalRecord = (record, index) => (
    <Animated.View
      key={record.id}
      style={[
        styles.recordCardContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: Animated.multiply(translateY, new Animated.Value(1 + index * 0.1)) }],
        },
      ]}
    >
      <View style={styles.recordCard}>
        <View style={styles.recordHeader}>
          <View style={styles.recordTypeSection}>
            <View style={[styles.recordTypeIcon, { backgroundColor: `${getSeverityColor(record.severity)}15` }]}>
              <MaterialCommunityIcons
                name={getRecordTypeIcon(record.type)}
                size={20}
                color={getSeverityColor(record.severity)}
              />
            </View>
            <View style={styles.recordHeaderText}>
              <Text style={styles.recordType}>{record.type}</Text>
              <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
            </View>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: `${getSeverityColor(record.severity)}15` }]}>
            <Text style={[styles.severityText, { color: getSeverityColor(record.severity) }]}>{record.severity}</Text>
          </View>
        </View>

        <Text style={styles.recordDescription}>{record.description}</Text>

        <View style={styles.recordDetailsContainer}>
          {record.prescription && (
            <View style={styles.recordDetail}>
              <View style={styles.recordDetailIcon}>
                <MaterialCommunityIcons name="pill" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.recordDetailContent}>
                <Text style={styles.recordDetailLabel}>Prescription</Text>
                <Text style={styles.recordDetailText}>{record.prescription}</Text>
              </View>
            </View>
          )}

          {record.bp && (
            <View style={styles.recordDetail}>
              <View style={styles.recordDetailIcon}>
                <MaterialCommunityIcons name="heart-pulse" size={16} color={COLORS.danger} />
              </View>
              <View style={styles.recordDetailContent}>
                <Text style={styles.recordDetailLabel}>Blood Pressure</Text>
                <Text style={styles.recordDetailText}>{record.bp}</Text>
              </View>
            </View>
          )}

          {record.pulse && (
            <View style={styles.recordDetail}>
              <View style={styles.recordDetailIcon}>
                <MaterialCommunityIcons name="pulse" size={16} color={COLORS.accent} />
              </View>
              <View style={styles.recordDetailContent}>
                <Text style={styles.recordDetailLabel}>Pulse</Text>
                <Text style={styles.recordDetailText}>{record.pulse}</Text>
              </View>
            </View>
          )}

          {record.temperature && (
            <View style={styles.recordDetail}>
              <View style={styles.recordDetailIcon}>
                <MaterialCommunityIcons name="thermometer" size={16} color={COLORS.warning} />
              </View>
              <View style={styles.recordDetailContent}>
                <Text style={styles.recordDetailLabel}>Temperature</Text>
                <Text style={styles.recordDetailText}>{record.temperature}</Text>
              </View>
            </View>
          )}

          {record.results && (
            <View style={styles.recordDetail}>
              <View style={styles.recordDetailIcon}>
                <MaterialCommunityIcons name="clipboard-text" size={16} color={COLORS.success} />
              </View>
              <View style={styles.recordDetailContent}>
                <Text style={styles.recordDetailLabel}>Results</Text>
                <Text style={styles.recordDetailText}>{record.results}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <MaterialCommunityIcons name="note-text" size={16} color={COLORS.textSecondary} />
            <Text style={styles.notesLabel}>Notes</Text>
          </View>
          <Text style={styles.notesText}>{record.notes}</Text>
        </View>

        {record.followUp && (
          <View style={styles.followUpSection}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
            <Text style={styles.followUpText}>Follow-up in {record.followUp}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  )

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Patient Info Cards */}
      <View style={styles.infoCardsContainer}>
        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(translateY, new Animated.Value(0.5)) }],
            },
          ]}
        >
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoCardIcon, { backgroundColor: `${COLORS.primary}15` }]}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.infoCardTitle}>Last Visit</Text>
          </View>
          <Text style={styles.infoCardValue}>{formatDate(patient.lastVisit)}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(translateY, new Animated.Value(0.7)) }],
            },
          ]}
        >
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoCardIcon, { backgroundColor: `${COLORS.success}15` }]}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.infoCardTitle}>Next Appointment</Text>
          </View>
          <Text style={styles.infoCardValue}>
            {patient.nextAppointment === "No upcoming appointments"
              ? "Not scheduled"
              : formatDate(patient.nextAppointment)}
          </Text>
        </Animated.View>
      </View>

      {/* Quick Stats */}
      <Animated.View
        style={[
          styles.quickStatsCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(translateY, new Animated.Value(0.9)) }],
          },
        ]}
      >
        <Text style={styles.quickStatsTitle}>Quick Stats</Text>
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{medicalHistory.length}</Text>
            <Text style={styles.quickStatLabel}>Total Records</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{medicalHistory.filter((r) => r.type === "Consultation").length}</Text>
            <Text style={styles.quickStatLabel}>Consultations</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatNumber}>{medicalHistory.filter((r) => r.type === "Lab Test").length}</Text>
            <Text style={styles.quickStatLabel}>Lab Tests</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  )

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Medical History</Text>
        <Text style={styles.historySubtitle}>{medicalHistory.length} records found</Text>
      </View>
      {medicalHistory.map((record, index) => renderMedicalRecord(record, index))}
    </View>
  )

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
            <Text style={styles.headerTitle}>Patient Details</Text>
            <Text style={styles.headerSubtitle}>Medical Information</Text>
          </View>

          <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate("DoctorChat", { patient })}>
            <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Patient Profile Card */}
      <Animated.View
        style={[
          styles.patientProfileCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(translateY, new Animated.Value(0.3)) }],
          },
        ]}
      >
        <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.patientProfileGradient}>
          <View style={styles.patientProfileContent}>
            <View style={styles.patientImageContainer}>
              {patient.avatar ? (
                <Image source={{ uri: patient.avatar }} style={styles.patientImage} />
              ) : (
                <View style={[styles.patientImagePlaceholder, { backgroundColor: getPatientColor(patient.name) }]}>
                  <Text style={styles.patientInitials}>
                    {patient.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </View>

            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <View style={styles.conditionContainer}>
                <MaterialCommunityIcons name="medical-bag" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.conditionText}>{patient.reason}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "overview" && styles.activeTabButton]}
          onPress={() => setSelectedTab("overview")}
        >
          <Ionicons
            name="grid-outline"
            size={18}
            color={selectedTab === "overview" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabButtonText, selectedTab === "overview" && styles.activeTabButtonText]}>Overview</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === "history" && styles.activeTabButton]}
          onPress={() => setSelectedTab("history")}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={selectedTab === "history" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabButtonText, selectedTab === "history" && styles.activeTabButtonText]}>
            Medical History
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === "overview" ? renderOverviewTab() : renderHistoryTab()}
      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  patientProfileCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  patientProfileGradient: {
    padding: 24,
  },
  patientProfileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  patientImageContainer: {
    position: "relative",
    marginRight: 20,
  },
  patientImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
  },
  patientImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  patientInitials: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: "#fff",
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  patientMetaRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  patientMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  patientMetaText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 6,
    fontWeight: "500",
  },
  conditionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  conditionText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  tabNavigation: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTabButton: {
    backgroundColor: `${COLORS.primary}10`,
  },
  tabButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginLeft: 6,
  },
  activeTabButtonText: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoCardsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoCardHeader: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  infoCardTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  infoCardValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "700",
  },
  quickStatsCard: {
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
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  quickStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickStatItem: {
    alignItems: "center",
  },
  quickStatNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  historyHeader: {
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  recordCardContainer: {
    marginBottom: 16,
  },
  recordCard: {
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
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recordTypeSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recordTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recordHeaderText: {
    flex: 1,
  },
  recordType: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  recordDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  recordDescription: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  recordDetailsContainer: {
    marginBottom: 16,
  },
  recordDetail: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  recordDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recordDetailContent: {
    flex: 1,
  },
  recordDetailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  recordDetailText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  notesSection: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginLeft: 6,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: "500",
  },
  followUpSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}08`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  followUpText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
})
