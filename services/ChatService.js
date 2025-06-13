import supabase from './supabaseService';

class ChatService {
  constructor() {
    this.subscription = null;
  }

  // Subscribe to messages for a specific conversation
  subscribeToMessages = (conversationId, onMessageReceived) => {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => onMessageReceived(payload.new)
      )
      .subscribe();
  };

  // Send a message
  sendMessage = async (conversationId, senderId, receiverId, content) => {
    try {
      const { data, error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: content
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Load previous messages
  loadMessages = async (conversationId) => {
    try {
      // First get the messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      if (!messages || messages.length === 0) return [];

      // Then get all unique user IDs from the messages
      const userIds = [...new Set([...messages.map(m => m.sender_id), ...messages.map(m => m.receiver_id)])];
      
      // Fetch all relevant profiles in one query
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user IDs to profiles for quick lookup
      const profileMap = profiles.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});

      // Combine messages with profile information
      const messagesWithProfiles = messages.map(message => ({
        ...message,
        sender: profileMap[message.sender_id],
        receiver: profileMap[message.receiver_id]
      }));

      return messagesWithProfiles;
    } catch (error) {
      console.error('Error loading messages:', error);
      throw error;
    }
  };

  // Mark messages as read
  markAsRead = async (conversationId, userId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  };

  // Clean up subscription
  cleanup = () => {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  };
}

export default new ChatService();
