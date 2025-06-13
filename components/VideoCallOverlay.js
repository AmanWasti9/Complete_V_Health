import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  StreamVideo,
  StreamCall,
  CallContent,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-native-sdk';
import streamVideoService from '../services/streamVideoService';

export default function VideoCallOverlay({ 
  visible, 
  onClose, 
  user, 
  targetUser, 
  callId,
  isIncoming = false,
  callType = 'video',
  incomingCallData = null
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [callStarted, setCallStarted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Determine the actual call type from props or incoming call data
  const actualCallType = incomingCallData?.call_type || callType;

  useEffect(() => {
    if (visible) {
      initializeCall();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      cleanup();
    };
  }, [visible]);

  const initializeCall = async () => {
    try {
      setIsConnecting(true);
      
      // Initialize Stream client
      const streamClient = await streamVideoService.initializeClient(user);
      setClient(streamClient);

      // Create or join call
      const videoCall = await streamVideoService.createCall(callId);
      setCall(videoCall);

      if (isIncoming) {
        // For incoming calls, just set up but don't join yet
        setCallStarted(false);
      } else {
        // For outgoing calls, join immediately
        await joinCall(videoCall);
      }
    } catch (error) {
      console.error('Failed to initialize call:', error);
      const callTypeText = callType === 'audio' ? 'audio' : 'video';
      Alert.alert('Error', `Failed to initialize ${callTypeText} call`);
      onClose();
    } finally {
      setIsConnecting(false);
    }
  };

  const joinCall = async (videoCall) => {
    try {
      setIsConnecting(true);
      
      // Join call with default settings - let Stream handle device configuration
      await streamVideoService.joinCall(videoCall, { create: true });
      setCallStarted(true);
      
      // For audio calls, disable video after joining
      if (actualCallType === 'audio') {
        try {
          await videoCall.camera.disable();
        } catch (cameraError) {
          console.log('Camera disable not needed or failed:', cameraError);
        }
      }
    } catch (error) {
      console.error('Failed to join call:', error);
      const callTypeText = actualCallType === 'audio' ? 'audio' : 'video';
      Alert.alert('Error', `Failed to join ${callTypeText} call`);
      onClose();
    } finally {
      setIsConnecting(false);
    }
  };

  const answerCall = async () => {
    if (call) {
      await joinCall(call);
    }
  };

  const declineCall = () => {
    onClose();
  };

  const endCall = async () => {
    try {
      await streamVideoService.endCall();
    } catch (error) {
      console.error('Failed to end call:', error);
    } finally {
      onClose();
    }
  };

  const cleanup = async () => {
    try {
      if (callStarted) {
        await streamVideoService.leaveCall();
      }
      setCallStarted(false);
      setCall(null);
      setClient(null);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              {isIncoming && !callStarted ? (
                <IncomingCallScreen 
                  targetUser={targetUser}
                  onAnswer={answerCall}
                  onDecline={declineCall}
                  isConnecting={isConnecting}
                  callType={actualCallType}
                />
              ) : callStarted ? (
                <ActiveCallScreen onEndCall={endCall} callType={actualCallType} />
              ) : (
                <ConnectingScreen 
                  targetUser={targetUser}
                  isConnecting={isConnecting}
                  onCancel={onClose}
                  callType={actualCallType}
                />
              )}
            </StreamCall>
          </StreamVideo>
        ) : (
          <ConnectingScreen 
            targetUser={targetUser}
            isConnecting={true}
            onCancel={onClose}
            callType={actualCallType}
          />
        )}
      </View>
    </Modal>
  );
}

// Incoming call screen
function IncomingCallScreen({ targetUser, onAnswer, onDecline, isConnecting, callType = 'video' }) {
  const isAudioCall = callType === 'audio';
  
  return (
    <Animated.View style={styles.incomingCallContainer}>
      <View style={styles.incomingCallContent}>
        <Text style={styles.incomingCallLabel}>
          Incoming {isAudioCall ? 'audio' : 'video'} call
        </Text>
        <Text style={styles.callerName}>
          {targetUser.full_name || targetUser.name}
        </Text>
        <Text style={styles.callerRole}>
          {targetUser.specialty || 'Healthcare Professional'}
        </Text>

        <View style={styles.incomingCallActions}>
          <TouchableOpacity
            style={[styles.callButton, styles.declineButton]}
            onPress={onDecline}
            disabled={isConnecting}
          >
            <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.callButton, styles.answerButton]}
            onPress={onAnswer}
            disabled={isConnecting}
          >
            <Ionicons 
              name={isAudioCall ? "call" : "videocam"} 
              size={28} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>

        {isConnecting && (
          <Text style={styles.connectingText}>Connecting...</Text>
        )}
      </View>
    </Animated.View>
  );
}

// Active call screen with Stream CallContent
function ActiveCallScreen({ onEndCall, callType = 'video' }) {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const isAudioCall = callType === 'audio';

  return (
    <View style={styles.activeCallContainer}>
      <View style={styles.callHeader}>
        <Text style={styles.callStatus}>
          {callingState === 'joined' ? `🟢 ${isAudioCall ? 'Audio' : 'Video'} Connected` : '🟡 Connecting...'}
        </Text>
        <Text style={styles.participantCount}>
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.callContentContainer}>
        {isAudioCall ? (
          <View style={styles.audioCallContainer}>
            <View style={styles.audioCallContent}>
              <Ionicons name="call" size={64} color="#4A90E2" />
              <Text style={styles.audioCallText}>Audio Call</Text>
              <Text style={styles.audioCallSubtext}>
                {callingState === 'joined' ? 'Call in progress' : 'Connecting...'}
              </Text>
            </View>
          </View>
        ) : (
          <CallContent />
        )}
      </View>

      <View style={styles.callControls}>
        <TouchableOpacity 
          style={[styles.controlButton, styles.endCallButton]} 
          onPress={onEndCall}
        >
          <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Connecting screen
function ConnectingScreen({ targetUser, isConnecting, onCancel, callType = 'video' }) {
  const isAudioCall = callType === 'audio';
  
  return (
    <View style={styles.connectingContainer}>
      <View style={styles.connectingContent}>
        <Text style={styles.connectingLabel}>
          {isConnecting ? `Connecting ${isAudioCall ? 'audio' : 'video'} call to` : `${isAudioCall ? 'Audio' : 'Video'} calling`}
        </Text>
        <Text style={styles.targetUserName}>
          {targetUser.full_name || targetUser.name}
        </Text>
        <Text style={styles.targetUserRole}>
          {targetUser.specialty || 'Healthcare Professional'}
        </Text>

        <View style={styles.connectingActions}>
          <TouchableOpacity
            style={[styles.callButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  incomingCallContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  incomingCallContent: {
    alignItems: 'center',
  },
  incomingCallLabel: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  callerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  callerRole: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 48,
    textAlign: 'center',
  },
  incomingCallActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: 200,
    marginBottom: 24,
  },
  callButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  answerButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  connectingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  activeCallContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  callStatus: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  participantCount: {
    color: '#ccc',
    fontSize: 14,
  },
  callContentContainer: {
    flex: 1,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  endCallButton: {
    backgroundColor: '#f44336',
  },
  connectingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  connectingContent: {
    alignItems: 'center',
  },
  connectingLabel: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  targetUserName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  targetUserRole: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 48,
    textAlign: 'center',
  },
  connectingActions: {
    alignItems: 'center',
  },
  audioCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  audioCallContent: {
    alignItems: 'center',
  },
  audioCallText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  audioCallSubtext: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
}); 