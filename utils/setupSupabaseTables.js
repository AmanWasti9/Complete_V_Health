import supabase from '../services/supabaseService';

/**
 * This utility checks if the required tables (doctor_availability, appointments, and lab_appointment) 
 * exist in Supabase and provides instructions for creating them if they don't.
 * 
 * Note: Supabase doesn't allow direct table creation via the JavaScript client,
 * so this utility only checks if the tables exist and logs instructions.
 */
const setupSupabaseTables = async () => {
  try {
    // Check if doctor_availability table exists
    const { error: doctorAvailabilityError } = await supabase
      .from('doctor_availability')
      .select('id')
      .limit(1);

    if (doctorAvailabilityError && doctorAvailabilityError.code === '42P01') {
      console.log('doctor_availability table does not exist. Please create it in the Supabase dashboard with the following schema:');
      console.log(`
        Table Name: doctor_availability
        Columns:
        - id: uuid (primary key, default: uuid_generate_v4())
        - doctor_id: uuid (references auth.users.id)
        - date: date
        - time_slot: text
        - is_available: boolean
        - created_at: timestamptz (default: now())
        - updated_at: timestamptz (default: now())
      `);
    } else {
      console.log('doctor_availability table exists.');
    }
    
    // Check if appointments table exists
    const { error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);
      
    if (appointmentsError && appointmentsError.code === '42P01') {
      console.log('appointments table does not exist. Please create it in the Supabase dashboard with the following schema:');
      console.log(`
        Table Name: appointments
        Columns:
        - id: uuid (primary key, default: uuid_generate_v4())
        - doctor_id: uuid (references auth.users.id)
        - patient_id: uuid (references auth.users.id)
        - appointment_date: date
        - appointment_time: text
        - reason: text
        - status: text (default: 'pending')
        - created_at: timestamptz (default: now())
        - updated_at: timestamptz (default: now())
        
        Row Level Security (RLS) Policies:
        - Allow authenticated users to select their own appointments (as doctor or patient)
        - Allow patients to insert appointments
        - Allow doctors to update their appointments
      `);
    } else {
      console.log('appointments table exists.');
    }
    
    // Check if lab_appointment table exists
    const { error: labAppointmentError } = await supabase
      .from('lab_appointment')
      .select('id')
      .limit(1);
      
    if (labAppointmentError && labAppointmentError.code === '42P01') {
      console.log('lab_appointment table does not exist. Please create it in the Supabase dashboard with the following schema:');
      console.log(`
        Table Name: lab_appointment
        Columns:
        - id: uuid (primary key, default: uuid_generate_v4())
        - patient_id: uuid (references auth.users.id)
        - lab_id: text
        - lab_name: text
        - test_name: text
        - appointment_date: date
        - appointment_time: text
        - status: text (default: 'pending')
        - created_at: timestamptz (default: now())
        - updated_at: timestamptz (default: now())
        
        Row Level Security (RLS) Policies:
        - Allow authenticated users to select their own lab appointments
        - Allow patients to insert lab appointments
        - Allow lab staff to update lab appointments
      `);
    } else {
      console.log('lab_appointment table exists.');
    }

    // Check if call_notifications table exists
    const { error: callNotificationsError } = await supabase
      .from('call_notifications')
      .select('id')
      .limit(1);
      
    if (callNotificationsError && callNotificationsError.code === '42P01') {
      console.log('call_notifications table does not exist. Please create it in the Supabase dashboard with the following schema:');
      console.log(`
        Table Name: call_notifications
        Columns:
        - id: uuid (primary key, default: gen_random_uuid())
        - sender_id: uuid (references auth.users.id)
        - receiver_id: uuid (references auth.users.id)
        - call_id: text (unique)
        - call_type: text (default: 'video', check constraint: 'video' or 'audio')
        - status: text (default: 'pending', check constraint: 'pending', 'answered', 'declined', 'ended', 'missed')
        - created_at: timestamptz (default: now())
        - updated_at: timestamptz (default: now())
        
        Row Level Security (RLS) Policies:
        - Allow users to view call notifications where they are sender or receiver
        - Allow users to create call notifications as sender
        - Allow users to update call notifications as receiver
      `);
    } else {
      console.log('call_notifications table exists.');
    }

    // Check if profiles table exists and has required fields
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, user_type')
      .limit(1);
      
    if (profilesError && profilesError.code === '42P01') {
      console.log('profiles table does not exist. Please create it in the Supabase dashboard.');
    } else if (profilesError) {
      console.log('profiles table exists but may be missing required fields:', profilesError.message);
    } else {
      console.log('profiles table exists with required fields.');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up Supabase tables:', error);
    return false;
  }
};

/**
 * SQL commands for creating the appointments table in Supabase SQL Editor:
 * 
 * -- Create appointments table
 * CREATE TABLE appointments (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   doctor_id UUID REFERENCES auth.users(id) NOT NULL,
 *   patient_id UUID REFERENCES auth.users(id) NOT NULL,
 *   appointment_date DATE NOT NULL,
 *   appointment_time TEXT NOT NULL,
 *   reason TEXT,
 *   status TEXT DEFAULT 'pending',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Add RLS policies for appointments table
 * ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
 * 
 * -- Allow authenticated users to select their own appointments (as doctor or patient)
 * CREATE POLICY "Users can view their own appointments"
 *   ON appointments FOR SELECT
 *   USING (auth.uid() = doctor_id OR auth.uid() = patient_id);
 * 
 * -- Allow authenticated users to insert appointments
 * CREATE POLICY "Patients can create appointments"
 *   ON appointments FOR INSERT
 *   WITH CHECK (auth.uid() = patient_id);
 * 
 * -- Allow doctors to update their appointments
 * CREATE POLICY "Doctors can update their appointments"
 *   ON appointments FOR UPDATE
 *   USING (auth.uid() = doctor_id);
 */

/**
 * SQL commands for creating the lab_appointment table in Supabase SQL Editor:
 * 
 * -- Create lab_appointment table
 * CREATE TABLE lab_appointment (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   patient_id UUID REFERENCES auth.users(id) NOT NULL,
 *   lab_id TEXT NOT NULL,
 *   lab_name TEXT NOT NULL,
 *   test_name TEXT NOT NULL,
 *   appointment_date DATE NOT NULL,
 *   appointment_time TEXT NOT NULL,
 *   status TEXT DEFAULT 'pending',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * 
 * -- Add RLS policies for lab_appointment table
 * ALTER TABLE lab_appointment ENABLE ROW LEVEL SECURITY;
 * 
 * -- Allow authenticated users to select their own lab appointments
 * CREATE POLICY "Users can view their own lab appointments"
 *   ON lab_appointment FOR SELECT
 *   USING (auth.uid() = patient_id);
 * 
 * -- Allow authenticated users to insert lab appointments
 * CREATE POLICY "Patients can create lab appointments"
 *   ON lab_appointment FOR INSERT
 *   WITH CHECK (auth.uid() = patient_id);
 * 
 * -- Allow lab staff to update lab appointments (would need implementation)
 * CREATE POLICY "Lab staff can update lab appointments"
 *   ON lab_appointment FOR UPDATE
 *   USING (true); -- This would need to be restricted to lab staff in a real implementation
 */

export default setupSupabaseTables;
