import supabase from './services/supabaseService.js';
import callNotificationService from './services/callNotificationService.js';

// Debug function to test call notifications
async function debugCallNotifications() {
  console.log('🔍 Starting call notification debug...');
  
  try {
    // Test 1: Check if table exists and we can query it
    console.log('\n📋 Test 1: Checking call_notifications table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('call_notifications')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table check failed:', tableError);
      return;
    }
    console.log('✅ Table exists and accessible');
    
    // Test 2: Try to insert a test notification
    console.log('\n📝 Test 2: Inserting test notification...');
    const testCallId = `test_${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('call_notifications')
      .insert({
        sender_id: 'b4233e0c-e3df-4991-ba55-ac78fd78b727', // From your example
        receiver_id: '9db320d7-2604-42c7-8c9b-18f856c93a1c', // From your example
        call_id: testCallId,
        call_type: 'video',
        status: 'pending'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    console.log('✅ Test notification inserted:', insertData);
    
    // Test 3: Check if we can retrieve it
    console.log('\n🔍 Test 3: Retrieving test notification...');
    const { data: retrieveData, error: retrieveError } = await supabase
      .from('call_notifications')
      .select('*')
      .eq('call_id', testCallId)
      .single();
    
    if (retrieveError) {
      console.error('❌ Retrieve failed:', retrieveError);
      return;
    }
    console.log('✅ Test notification retrieved:', retrieveData);
    
    // Test 4: Test subscription (wait for 5 seconds)
    console.log('\n📡 Test 4: Testing real-time subscription...');
    let subscriptionTriggered = false;
    
    const subscription = supabase
      .channel('test_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_notifications',
          filter: `receiver_id=eq.9db320d7-2604-42c7-8c9b-18f856c93a1c`,
        },
        (payload) => {
          console.log('🔔 Real-time notification received:', payload);
          subscriptionTriggered = true;
        }
      )
      .subscribe();
    
    // Insert another test notification to trigger the subscription
    setTimeout(async () => {
      const testCallId2 = `test_realtime_${Date.now()}`;
      console.log('📤 Inserting second test notification for real-time test...');
      
      const { error: insertError2 } = await supabase
        .from('call_notifications')
        .insert({
          sender_id: 'b4233e0c-e3df-4991-ba55-ac78fd78b727',
          receiver_id: '9db320d7-2604-42c7-8c9b-18f856c93a1c',
          call_id: testCallId2,
          call_type: 'video',
          status: 'pending'
        });
      
      if (insertError2) {
        console.error('❌ Second insert failed:', insertError2);
      } else {
        console.log('✅ Second test notification inserted');
      }
    }, 2000);
    
    // Check subscription result after 5 seconds
    setTimeout(() => {
      if (subscriptionTriggered) {
        console.log('✅ Real-time subscription working!');
      } else {
        console.log('❌ Real-time subscription not triggered');
      }
      
      subscription.unsubscribe();
      console.log('\n🧹 Cleaning up test notifications...');
      
      // Clean up test notifications
      supabase
        .from('call_notifications')
        .delete()
        .like('call_id', 'test_%')
        .then(({ error }) => {
          if (error) {
            console.error('❌ Cleanup failed:', error);
          } else {
            console.log('✅ Test notifications cleaned up');
          }
          console.log('\n🏁 Debug complete!');
        });
    }, 6000);
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
}

// Run the debug
debugCallNotifications(); 