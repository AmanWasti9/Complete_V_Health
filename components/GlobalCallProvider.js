import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '../services/AuthContext';
import callNotificationService from '../services/callNotificationService';
import GlobalCallModal from './GlobalCallModal';
import { useNavigation } from '@react-navigation/native';

const GlobalCallContext = createContext({});

export function useGlobalCall() {
  return useContext(GlobalCallContext);
}

export function GlobalCallProvider({ children }) {
  const { user, userProfile } = useAuth();
  const navigation = useNavigation();
  const [incomingCall, setIncomingCall] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isProcessingCall, setIsProcessingCall] = useState(false);

  // Subscribe to incoming calls globally
  useEffect(() => {
    if (user) {
      console.log('🌐 Setting up global call notifications for user:', user.id);
      
      const handleIncomingCall = (notification) => {
        console.log('🔔 Global incoming call received:', notification);
        
        // Only show call modal if not already processing a call
        if (!isProcessingCall && !showCallModal) {
          setIncomingCall(notification);
          setShowCallModal(true);
        }
      };

      // Subscribe to incoming call notifications
      const subscription = callNotificationService.subscribeToIncomingCalls(user.id, handleIncomingCall);

      return () => {
        console.log('🌐 Cleaning up global call notifications');
        callNotificationService.unsubscribeFromCalls(user.id);
      };
    }
  }, [user, isProcessingCall, showCallModal]);

  const acceptCall = async (callNotification) => {
    try {
      setIsProcessingCall(true);
      
      // Update call status to answered
      await callNotificationService.updateCallStatus(callNotification.call_id, 'answered');
      
      // Navigate to appropriate chat screen based on user type
      if (userProfile?.user_type === 'doctor') {
        // Doctor receiving call from patient
        const patientData = callNotification.sender || {
          id: callNotification.sender_id,
          name: 'Patient',
          full_name: 'Patient'
        };
        
        navigation.navigate('DoctorChat', { 
          patient: patientData,
          autoStartCall: true,
          callId: callNotification.call_id,
          isIncomingCall: true,
          callType: callNotification.call_type || 'video'
        });
      } else {
        // Patient receiving call from doctor
        const doctorData = callNotification.sender || {
          id: callNotification.sender_id,
          name: 'Doctor',
          full_name: 'Doctor'
        };
        
        navigation.navigate('DoctorPatientChat', { 
          doctor: doctorData,
          autoStartCall: true,
          callId: callNotification.call_id,
          isIncomingCall: true,
          callType: callNotification.call_type || 'video'
        });
      }
      
      closeCallModal();
    } catch (error) {
      console.error('Failed to accept call:', error);
      closeCallModal();
    }
  };

  const rejectCall = async (callNotification) => {
    try {
      setIsProcessingCall(true);
      
      // Update call status to declined
      await callNotificationService.updateCallStatus(callNotification.call_id, 'declined');
      
      closeCallModal();
    } catch (error) {
      console.error('Failed to reject call:', error);
      closeCallModal();
    }
  };

  const closeCallModal = () => {
    setShowCallModal(false);
    setIncomingCall(null);
    setIsProcessingCall(false);
  };

  const contextValue = {
    incomingCall,
    showCallModal,
    acceptCall,
    rejectCall,
    closeCallModal,
  };

  return (
    <GlobalCallContext.Provider value={contextValue}>
      {children}
      <GlobalCallModal
        visible={showCallModal}
        callNotification={incomingCall}
        onAccept={() => acceptCall(incomingCall)}
        onReject={() => rejectCall(incomingCall)}
        onClose={closeCallModal}
        userType={userProfile?.user_type}
      />
    </GlobalCallContext.Provider>
  );
} 