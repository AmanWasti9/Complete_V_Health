import supabase from './supabaseService';

class CallNotificationService {
  constructor() {
    this.activeSubscriptions = new Map();
    this.callCallbacks = new Map();
  }

  // Subscribe to incoming call notifications for a user
  subscribeToIncomingCalls(userId, onIncomingCall) {
    const channelName = `call_notifications_${userId}`;
    
    console.log(`📡 Subscribing to incoming calls for user:`, userId);
    
    // Unsubscribe from existing subscription if any
    this.unsubscribeFromCalls(userId);

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_notifications',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('🔔 Incoming call notification received:', payload);
          
          // Fetch sender information
          const callNotification = await this.enrichCallNotification(payload.new);
          
          if (onIncomingCall) {
            onIncomingCall(callNotification);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status for user ${userId}:`, status);
      });

    this.activeSubscriptions.set(userId, subscription);
    this.callCallbacks.set(userId, onIncomingCall);

    return subscription;
  }

  // Send a call notification to another user
  async sendCallNotification(senderId, receiverId, callId, callType = 'video') {
    try {
      console.log(`📤 Sending call notification:`, {
        senderId,
        receiverId,
        callId,
        callType
      });

      // First, let's make sure both users exist in profiles
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', senderId)
        .single();

      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', receiverId)
        .single();

      if (!senderProfile) {
        throw new Error(`Sender profile not found: ${senderId}`);
      }
      if (!receiverProfile) {
        throw new Error(`Receiver profile not found: ${receiverId}`);
      }

      const { data, error } = await supabase
        .from('call_notifications')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          call_id: callId,
          call_type: callType,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to send call notification:', error);
        throw error;
      }
      
      console.log('✅ Call notification sent successfully:', data);
      
      // Enrich with sender information before returning
      const enrichedData = await this.enrichCallNotification(data);
      return enrichedData;
    } catch (error) {
      console.error('Failed to send call notification:', error);
      throw error;
    }
  }

  // Update call notification status (answered, declined, ended)
  async updateCallStatus(callId, status) {
    try {
      console.log(`📝 Updating call status:`, { callId, status });
      
      const { data, error } = await supabase
        .from('call_notifications')
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq('call_id', callId)
        .select();

      if (error) {
        console.error('❌ Update call status error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No call notification found with call_id:', callId);
        return null;
      }

      console.log('✅ Call status updated successfully:', data[0]);
      return data[0];
    } catch (error) {
      console.error('Failed to update call status:', error);
      throw error;
    }
  }

  // Clean up old call notifications
  async cleanupOldNotifications(olderThanHours = 24) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

      const { error } = await supabase
        .from('call_notifications')
        .delete()
        .lt('created_at', cutoffTime.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error);
    }
  }

  // Unsubscribe from call notifications for a user
  unsubscribeFromCalls(userId) {
    const subscription = this.activeSubscriptions.get(userId);
    if (subscription) {
      subscription.unsubscribe();
      this.activeSubscriptions.delete(userId);
      this.callCallbacks.delete(userId);
    }
  }

  // Unsubscribe from all call notifications
  unsubscribeFromAll() {
    this.activeSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.activeSubscriptions.clear();
    this.callCallbacks.clear();
  }

  // Enrich call notification with sender information
  async enrichCallNotification(callNotification) {
    try {
      if (callNotification.sender) {
        return callNotification; // Already has sender info
      }

      const { data: senderData, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_type')
        .eq('id', callNotification.sender_id)
        .single();

      if (error) {
        console.error('Failed to fetch sender info:', error);
        return callNotification;
      }

      return {
        ...callNotification,
        sender: senderData
      };
    } catch (error) {
      console.error('Failed to enrich call notification:', error);
      return callNotification;
    }
  }

  // Get active call notifications for a user
  async getActiveCallNotifications(userId) {
    try {
      const { data, error } = await supabase
        .from('call_notifications')
        .select('*')
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enrich each notification with sender information
      const enrichedData = await Promise.all(
        (data || []).map(notification => this.enrichCallNotification(notification))
      );
      
      return enrichedData;
    } catch (error) {
      console.error('Failed to get active call notifications:', error);
      return [];
    }
  }
}

// Export a singleton instance
export default new CallNotificationService(); 