import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://fgarksnsdfvkclhzahmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnYXJrc25zZGZ2a2NsaHphaG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2ODY5MjUsImV4cCI6MjA2NDI2MjkyNX0.hWWR-y9ZcTvgdZOp7sQpRO2f-3l2-mpgdi6YWk1BK_w';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
