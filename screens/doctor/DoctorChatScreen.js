"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import supabase from "../../services/supabaseService";
import { useAuth } from "../../services/AuthContext";
import VideoCallOverlay from "../../components/VideoCallOverlay";
import streamVideoService from "../../services/streamVideoService";
import callNotificationService from "../../services/callNotificationService";

const DEFAULT_AVATAR =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

export default function DoctorChatScreen({ route, navigation }) {
  const { patient } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCallType, setOutgoingCallType] = useState('video');
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle auto-start call from global call manager
  useEffect(() => {
    if (route.params?.autoStartCall && route.params?.callId) {
      setCurrentCallId(route.params.callId);
      setIncomingCall(route.params.isIncomingCall ? { 
        call_id: route.params.callId,
        call_type: route.params.callType || 'video'
      } : null);
      setShowVideoCall(true);
    }
  }, [route.params]);

  // Fetch messages on component mount
  useEffect(() => {
    if (user && patient) {
      fetchMessages();

      // Subscribe to new messages
      const subscription = supabase
        .channel("chats")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chats",
            filter: `(sender_id=eq.${user.id} AND receiver_id=eq.${patient.id}) OR (sender_id=eq.${patient.id} AND receiver_id=eq.${user.id})`,
          },
          (payload) => {
            // Only add the message if it's not from the current user (to avoid duplicates)
            if (payload.new.sender_id !== user.id) {
              const newMsg = formatMessage(payload.new);
              setMessages((prevMessages) => [...prevMessages, newMsg]);

              // Scroll to the bottom
              if (flatListRef.current) {
                setTimeout(() => {
                  flatListRef.current.scrollToEnd({ animated: true });
                }, 100);
              }
            }
          }
        )
        .subscribe();

      // Clean up subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, patient]);

  useEffect(() => {
    fetchMessages();
  }, []);

  // Format a message from the database
  const formatMessage = (dbMessage) => {
    return {
      id: dbMessage.id,
      sender: dbMessage.sender_id === user.id ? "doctor" : "patient",
      message: dbMessage.message,
      timestamp: new Date(dbMessage.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      created_at: dbMessage.created_at,
    };
  };

  // Fetch messages from Supabase
  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Get messages between the doctor and patient
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${patient.id}),and(sender_id.eq.${patient.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Format messages
      const formattedMessages = data.map(formatMessage);
      setMessages(formattedMessages);

      // Mark messages from patient as read
      const unreadMessages = data.filter(
        (msg) =>
          msg.sender_id === patient.id &&
          msg.receiver_id === user.id &&
          !msg.is_read
      );

      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map((msg) => msg.id);
        await supabase
          .from("chats")
          .update({ is_read: true })
          .in("id", unreadIds);
      }

      // Scroll to the bottom
      if (flatListRef.current && formattedMessages.length > 0) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      // console.error("Error fetching messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !patient) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      // Insert message into Supabase
      const { data, error } = await supabase
        .from("chats")
        .insert({
          sender_id: user.id,
          receiver_id: patient.id,
          message: messageText,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Add new message to state
      const formattedMessage = formatMessage(data);
      setMessages((prevMessages) => [...prevMessages, formattedMessage]);

      // Scroll to the bottom
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }

      // Simulate patient typing after doctor sends a message
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }, 1000);
    } catch (error) {
      // console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
      // Restore the message text if sending failed
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // Start video call
  const startVideoCall = async () => {
    try {
      const callId = streamVideoService.generateCallId('doctor_patient');
      setCurrentCallId(callId);
      setOutgoingCallType('video'); // Set outgoing call type
      setShowVideoCall(true);

      // Send call notification to the patient
      await callNotificationService.sendCallNotification(
        user.id,
        patient.id,
        callId,
        'video'
      );

      // Send a chat message about the video call
      const callMessage = `📹 Started a video call`;
      await supabase
        .from("chats")
        .insert({
          sender_id: user.id,
          receiver_id: patient.id,
          message: callMessage,
          is_read: false,
        });
    } catch (error) {
      // console.error('Failed to start video call:', error);
      Alert.alert('Error', 'Failed to start video call');
    }
  };

  // Start audio call
  const startAudioCall = async () => {
    try {
      const callId = streamVideoService.generateCallId('doctor_patient_audio');
      setCurrentCallId(callId);
      setOutgoingCallType('audio'); // Set outgoing call type
      setShowVideoCall(true);

      // Send call notification to the patient
      await callNotificationService.sendCallNotification(
        user.id,
        patient.id,
        callId,
        'audio'
      );

      // Send a chat message about the audio call
      const callMessage = `📞 Started an audio call`;
      await supabase
        .from("chats")
        .insert({
          sender_id: user.id,
          receiver_id: patient.id,
          message: callMessage,
          is_read: false,
        });
    } catch (error) {
      // console.error('Failed to start audio call:', error);
      Alert.alert('Error', 'Failed to start audio call');
    }
  };

  // Close video call
  const closeVideoCall = async () => {
    try {
      // Update call status if there's an active call
      if (currentCallId) {
        await callNotificationService.updateCallStatus(currentCallId, 'ended');
      }
    } catch (error) {
      // console.error('Failed to update call status:', error);
    } finally {
      setShowVideoCall(false);
      setCurrentCallId(null);
      setIncomingCall(null);
      setOutgoingCallType('video');
    }
  };

  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return messageDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  const renderDateSeparator = (date) => (
    <View style={styles.dateSeparator}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>
        {new Date(date).toLocaleDateString([], {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
      </Text>
      <View style={styles.dateLine} />
    </View>
  );

  // Group messages by sender for better visual appearance
  const shouldGroupWithPrevious = (currentMsg, prevMsg) => {
    if (!prevMsg) return false;
    return (
      currentMsg.sender === prevMsg.sender &&
      new Date(currentMsg.created_at).getTime() -
        new Date(prevMsg.created_at).getTime() <
        60000 // 1 minute
    );
  };

  // Render a message
  const renderMessage = ({ item, index }) => {
    const isDoctor = item.sender === "doctor";
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage =
      index < messages.length - 1 ? messages[index + 1] : null;
    const isGrouped = shouldGroupWithPrevious(item, prevMessage);
    const isLastInGroup =
      !nextMessage ||
      nextMessage.sender !== item.sender ||
      new Date(nextMessage.created_at).getTime() -
        new Date(item.created_at).getTime() >=
        60000;

    const showDateSeparator =
      !nextMessage ||
      new Date(item.created_at).toDateString() !==
        new Date(nextMessage.created_at).toDateString();

    return (
      <View>
        <View
          style={[
            styles.messageContainer,
            isDoctor ? styles.doctorMessage : styles.patientMessage,
            isGrouped && styles.groupedMessage,
          ]}
        >
          {!isDoctor && !isGrouped && (
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: patient.avatar_url || DEFAULT_AVATAR }}
                style={styles.messageAvatar}
              />
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isDoctor ? styles.doctorBubble : styles.patientBubble,
              isGrouped &&
                (isDoctor
                  ? styles.groupedDoctorBubble
                  : styles.groupedPatientBubble),
              !isDoctor && isGrouped && styles.groupedPatientBubbleWithSpace,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isDoctor ? styles.doctorMessageText : styles.patientMessageText,
              ]}
            >
              {item.message}
            </Text>
            {isLastInGroup && (
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.timestamp,
                    isDoctor ? styles.doctorTimestamp : styles.patientTimestamp,
                  ]}
                >
                  {formatMessageTime(item.created_at)}
                </Text>
                {isDoctor && (
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color="rgba(255, 255, 255, 0.7)"
                    style={styles.readIcon}
                  />
                )}
              </View>
            )}
          </View>
        </View>
        {showDateSeparator && renderDateSeparator(item.created_at)}
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.messageContainer}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: patient.avatar_url || DEFAULT_AVATAR }}
            style={styles.messageAvatar}
          />
        </View>
        <View
          style={[
            styles.messageBubble,
            styles.patientBubble,
            styles.typingBubble,
          ]}
        >
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.patientInfo}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: patient.avatar_url || DEFAULT_AVATAR }}
                  style={styles.patientAvatar}
                />
                <View style={styles.onlineIndicator} />
              </View>

              <View style={styles.patientDetails}>
                <Text style={styles.patientName}>
                  {patient.full_name || patient.name}
                </Text>
                <Text style={styles.patientStatus}>
                  {patient.reason}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerAction} onPress={startAudioCall}>
                <Ionicons name="call" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerAction, styles.headerActionMargin]} onPress={startVideoCall}>
                <Ionicons name="videocam" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Chat Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          </View>
        ) : (
          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={64}
                      color="#E1E8ED"
                    />
                  </View>
                  <Text style={styles.emptyText}>No messages yet</Text>
                  <Text style={styles.emptySubtext}>
                    Send a message to start the conversation with your patient
                  </Text>
                </View>
              }
              ListFooterComponent={renderTypingIndicator}
            />
          </View>
        )}

        {/* Enhanced Input Container */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton} onPress={fetchMessages}>
              <Ionicons name="refresh" size={24} color="#4F46E5" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
              editable={!sending}
              maxLength={1000}
            />

            {sending ? (
              <View style={styles.sendButton}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  newMessage.trim()
                    ? styles.sendButtonActive
                    : styles.sendButtonInactive,
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={newMessage.trim() ? "#fff" : "#999"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Video Call Overlay */}
        <VideoCallOverlay
          visible={showVideoCall}
          onClose={closeVideoCall}
          user={user}
          targetUser={patient}
          callId={currentCallId}
          isIncoming={!!incomingCall}
          callType={incomingCall?.call_type || outgoingCallType}
          incomingCallData={incomingCall}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#4F46E5",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderRadius:10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  patientInfo: {
    marginTop: 5,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  patientStatus: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActionMargin: {
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingContent: {
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: "85%",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  groupedMessage: {
    marginVertical: 1,
  },
  doctorMessage: {
    alignSelf: "flex-end",
  },
  patientMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  doctorBubble: {
    backgroundColor: "#4F46E5",
    borderBottomRightRadius: 6,
  },
  patientBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  groupedDoctorBubble: {
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
  },
  groupedPatientBubble: {
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 20,
  },
  groupedPatientBubbleWithSpace: {
    marginLeft: 40,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  doctorMessageText: {
    color: "#fff",
  },
  patientMessageText: {
    color: "#333",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: "500",
  },
  doctorTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  patientTimestamp: {
    color: "#999",
  },
  readIcon: {
    marginLeft: 4,
  },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e1e8ed",
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    fontWeight: "500",
  },
  inputContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e1e8ed",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f8f9fa",
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    minHeight: 36,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  sendButtonActive: {
    backgroundColor: "#4F46E5",
  },
  sendButtonInactive: {
    backgroundColor: "transparent",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E1E8ED",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  typingBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 60,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 20,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#999",
    marginHorizontal: 2,
    opacity: 0.6,
  },
  typingDot1: {
    animationName: "bounce",
    animationDuration: "0.6s",
    animationIterationCount: "infinite",
  },
  typingDot2: {
    animationName: "bounce",
    animationDuration: "0.6s",
    animationDelay: "0.2s",
    animationIterationCount: "infinite",
  },
  typingDot3: {
    animationName: "bounce",
    animationDuration: "0.6s",
    animationDelay: "0.4s",
    animationIterationCount: "infinite",
  },
});
