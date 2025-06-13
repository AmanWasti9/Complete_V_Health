import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

export default function GlobalCallModal({
  visible,
  callNotification,
  onAccept,
  onReject,
  onClose,
  userType,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      // Start slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Start pulse animation for avatar
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // Reset animations
      slideAnim.setValue(height);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const handleAccept = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onAccept();
    });
  };

  const handleReject = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onReject();
    });
  };

  if (!visible || !callNotification) {
    return null;
  }

  const callerName = callNotification.sender?.full_name || 
                    callNotification.sender?.name || 
                    (userType === 'doctor' ? 'Patient' : 'Doctor');
  const callerAvatar = DEFAULT_AVATAR; // Use default avatar since avatar_url doesn't exist in profiles
  const callType = callNotification.call_type || 'video';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.8)" barStyle="light-content" />
      
      {/* Background Blur */}
      <BlurView intensity={20} style={styles.blurContainer}>
        <View style={styles.overlay} />
      </BlurView>

      {/* Call Content */}
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
          </Text>
        </View>

        {/* Caller Info */}
        <View style={styles.callerSection}>
          <Animated.View 
            style={[
              styles.avatarContainer,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}
          >
            <Image source={{ uri: callerAvatar }} style={styles.avatar} />
            <View style={styles.callTypeIndicator}>
              <Ionicons 
                name={callType === 'video' ? 'videocam' : 'call'} 
                size={16} 
                color="#fff" 
              />
            </View>
          </Animated.View>
          
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callerSubtitle}>
            {userType === 'doctor' ? 'Patient calling...' : 'Doctor calling...'}
          </Text>
        </View>

        {/* Call Actions */}
        <View style={styles.actionsContainer}>
          {/* Reject Button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            activeOpacity={0.8}
          >
            <View style={styles.buttonRipple}>
              <Ionicons name="call" size={28} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <View style={styles.buttonRipple}>
              <Ionicons name="call" size={28} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Additional Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton}>
            <Ionicons name="chatbubble" size={20} color="#666" />
            <Text style={styles.optionText}>Message</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 40,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  callerSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  callTypeIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  callerName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  callerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },
  actionButton: {
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
  rejectButton: {
    backgroundColor: '#FF4757',
    transform: [{ rotate: '135deg' }],
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  buttonRipple: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
}); 