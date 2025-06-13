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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../services/AuthContext";
import MistralAIService from "../services/MistralAIService";

export default function AIChatScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Add initial welcome message from AI
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        message: "Hello! I'm your health assistant. How can I help you today? You can ask me about health concerns, symptoms, or if you need a doctor recommendation.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  // Send a message to the AI
  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    try {
      // Add user message to the chat
      const userMessage = {
        id: Date.now().toString(),
        sender: "user",
        message: messageText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        created_at: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);

      // Scroll to the bottom
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }

      // Format conversation history for the AI
      const conversationHistory = messages
        .filter(msg => msg.id !== "welcome") // Exclude welcome message
        .map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.message
        }));

      // Process the message with Mistral AI
      const aiResponse = await MistralAIService.processMessage(
        messageText,
        conversationHistory
      );

      // Add AI response to the chat
      const aiMessage = {
        id: Date.now().toString() + "-ai",
        sender: "ai",
        message: aiResponse.content,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        created_at: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      // Scroll to the bottom again
      if (flatListRef.current) {
        setTimeout(() => {
          flatListRef.current.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message to AI:", error);
      Alert.alert("Error", "Failed to get a response from the AI assistant");
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
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
      new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 60000 // 1 minute
    );
  };

  // Render a message
  const renderMessage = ({ item, index }) => {
    const isUser = item.sender === "user";
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    const isGrouped = shouldGroupWithPrevious(item, prevMessage);
    const isLastInGroup =
      !nextMessage ||
      nextMessage.sender !== item.sender ||
      new Date(nextMessage.created_at).getTime() - new Date(item.created_at).getTime() >= 60000;

    const showDateSeparator =
      !nextMessage || new Date(item.created_at).toDateString() !== new Date(nextMessage.created_at).toDateString();

    return (
      <View>
        <View
          style={[
            styles.messageContainer,
            isUser ? styles.userMessage : styles.aiMessage,
            isGrouped && styles.groupedMessage,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.aiBubble,
              isGrouped && (isUser ? styles.groupedUserBubble : styles.groupedAIBubble),
            ]}
          >
            <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
              {item.message}
            </Text>
            {isLastInGroup && (
              <View style={styles.messageFooter}>
                <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
                  {formatMessageTime(item.created_at)}
                </Text>
                {isUser && (
                  <Ionicons name="checkmark-done" size={14} color="rgba(255, 255, 255, 0.7)" style={styles.readIcon} />
                )}
              </View>
            )}
          </View>
        </View>
        {showDateSeparator && renderDateSeparator(item.created_at)}
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

            <View style={styles.aiInfo}>
              <View style={styles.avatarContainer}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="medical" size={24} color="#fff" />
                </View>
              </View>

              <View style={styles.aiDetails}>
                <Text style={styles.aiName}>Health Assistant</Text>
                <Text style={styles.aiDescription}>AI-powered medical chat</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chat Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading conversation...</Text>
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
            />
          </View>
        )}

        {/* Enhanced Input Container */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Ask me about health concerns..."
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  aiDetails: {
    flex: 1,
  },
  aiName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  aiDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
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
  userMessage: {
    alignSelf: "flex-end",
  },
  aiMessage: {
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
  userBubble: {
    backgroundColor: "#4F46E5",
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  groupedUserBubble: {
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
  },
  groupedAIBubble: {
    borderBottomLeftRadius: 20,
    borderTopLeftRadius: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#fff",
  },
  aiMessageText: {
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
    marginRight: 4,
  },
  userTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  aiTimestamp: {
    color: "#999",
  },
  readIcon: {
    marginLeft: 2,
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
    color: "#999",
    marginHorizontal: 10,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e1e8ed",
    backgroundColor: "#fff",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    color: "#333",
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: "#4F46E5",
  },
  sendButtonInactive: {
    backgroundColor: "#e1e8ed",
  },
});