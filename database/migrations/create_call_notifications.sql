-- Create call_notifications table for video call management
CREATE TABLE IF NOT EXISTS public.call_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    call_id TEXT NOT NULL UNIQUE,
    call_type TEXT DEFAULT 'video' CHECK (call_type IN ('video', 'audio')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'declined', 'ended', 'missed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_call_notifications_receiver_id ON public.call_notifications(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_notifications_sender_id ON public.call_notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_call_notifications_call_id ON public.call_notifications(call_id);
CREATE INDEX IF NOT EXISTS idx_call_notifications_status ON public.call_notifications(status);
CREATE INDEX IF NOT EXISTS idx_call_notifications_created_at ON public.call_notifications(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.call_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can see call notifications where they are either sender or receiver
CREATE POLICY "Users can view their own call notifications" ON public.call_notifications
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Users can insert call notifications where they are the sender
CREATE POLICY "Users can create call notifications as sender" ON public.call_notifications
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Users can update call notifications where they are the receiver (to answer/decline)
CREATE POLICY "Users can update call notifications as receiver" ON public.call_notifications
    FOR UPDATE USING (
        auth.uid() = receiver_id OR auth.uid() = sender_id
    );

-- Users can delete their own call notifications
CREATE POLICY "Users can delete their own call notifications" ON public.call_notifications
    FOR DELETE USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_call_notifications_updated_at 
    BEFORE UPDATE ON public.call_notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.call_notifications TO authenticated;
GRANT ALL ON public.call_notifications TO service_role; 