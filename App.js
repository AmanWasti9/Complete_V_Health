import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './services/AuthContext';
import { GlobalCallProvider } from './components/GlobalCallProvider';
import setupSupabaseTables from './utils/setupSupabaseTables';

// Auth & Onboarding Screens
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import AdminLoginScreen from './screens/admin/AdminLoginScreen';
import AdminDashboard from './screens/admin/AdminDashboard';
import AddMedicineScreen from './screens/admin/AddMedicineScreen';
import AddMedicalStaff from './screens/admin/AddMedicalStaff';

// Patient Screens
import DashboardScreen from './screens/DashboardScreen';
import ConsultationScreen from './screens/ConsultationScreen';
import PatientChatScreen from './screens/PatientChatScreen';
import DoctorAppointmentScreen from './screens/DoctorAppointmentScreen';
import LabTestScreen from './screens/LabTestScreen';
import PharmacyScreen from './screens/PharmacyScreen';
import HireMedicalStaffScreen from './screens/HireMedicalStaffScreen';
import AIChatScreen from './screens/AIChatScreen';
import ProfileEditScreen from './screens/ProfileEditScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

// Doctor Screens
import DoctorDashboardScreen from './screens/doctor/DoctorDashboardScreen';
import DoctorChatScreen from './screens/doctor/DoctorChatScreen';
import PatientDetailsScreen from './screens/doctor/PatientDetailsScreen';
import DoctorAppointmentsScreen from './screens/doctor/DoctorAppointmentsScreen';
import DoctorAvailabilityScreen from './screens/doctor/DoctorAvailabilityScreen';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    console.log(user);
    console.log(userProfile);
    // Setup Supabase tables when the app starts
    setupSupabaseTables();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <GlobalCallProvider>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "none", // Disable default screen transitions
            animationEnabled: false, // Disable screen transitions
          }}
          initialRouteName={
            !user
              ? "Onboarding"
              : userProfile?.user_type === "admin"
              ? "AdminDashboard"
              : userProfile?.user_type === "doctor"
              ? "DoctorDashboard"
              : "Dashboard"
          }
        >
        {/* Auth & Onboarding Screens */}
        <Stack.Group>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen
            name="AdminLogin"
            component={AdminLoginScreen}
            options={{
              headerShown: false,
              title: "Admin Login",
              headerBackTitle: "Back",
            }}
          />
        </Stack.Group>

        {/* Admin Screens */}
        <Stack.Group screenOptions={{ gestureEnabled: false }}>
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboard}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="AddMedicine"
            component={AddMedicineScreen}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="AddMedicalStaff"
            component={AddMedicalStaff}
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
        </Stack.Group>

        {/* Patient Screens */}
        <Stack.Group screenOptions={{ gestureEnabled: false }}>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="Consultation" component={ConsultationScreen} />
          <Stack.Screen
            name="DoctorAppointment"
            component={DoctorAppointmentScreen}
          />
          <Stack.Screen name="LabTest" component={LabTestScreen} />
          <Stack.Screen name="Pharmacy" component={PharmacyScreen} />
          <Stack.Screen
            name="HireMedicalStaff"
            component={HireMedicalStaffScreen}
          />
          <Stack.Screen
            name="DoctorPatientChat"
            component={PatientChatScreen}
          />
          <Stack.Screen name="AIChat" component={AIChatScreen} />
          <Stack.Screen 
            name="ProfileEdit" 
            component={ProfileEditScreen} 
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen} 
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </Stack.Group>

        {/* Doctor Screens */}
        <Stack.Group screenOptions={{ gestureEnabled: false }}>
          <Stack.Screen
            name="DoctorDashboard"
            component={DoctorDashboardScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="DoctorChat" component={DoctorChatScreen} />
          <Stack.Screen
            name="PatientDetails"
            component={PatientDetailsScreen}
          />
          <Stack.Screen
            name="DoctorAvailability"
            component={DoctorAvailabilityScreen}
          />
          <Stack.Screen
            name="DoctorAppointments"
            component={DoctorAppointmentsScreen}
          />
        </Stack.Group>
      </Stack.Navigator>
      <StatusBar style="auto" />
      </GlobalCallProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
