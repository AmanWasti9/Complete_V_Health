-- Create the chat table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure we can efficiently query chats between two users
  CONSTRAINT different_users CHECK (sender_id <> receiver_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS chats_sender_id_idx ON chats(sender_id);
CREATE INDEX IF NOT EXISTS chats_receiver_id_idx ON chats(receiver_id);
CREATE INDEX IF NOT EXISTS chats_created_at_idx ON chats(created_at);

-- Create a combined index for conversation queries
CREATE INDEX IF NOT EXISTS chats_conversation_idx ON chats(
  LEAST(sender_id, receiver_id), 
  GREATEST(sender_id, receiver_id), 
  created_at
);

-- Row Level Security Policies
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Policy for inserting messages (can only insert messages you send)
CREATE POLICY insert_own_messages ON chats 
  FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

-- Policy for reading messages (can only read messages you sent or received)
CREATE POLICY read_own_messages ON chats 
  FOR SELECT 
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Policy for updating messages (can only update messages you sent)
CREATE POLICY update_own_messages ON chats 
  FOR UPDATE 
  USING (sender_id = auth.uid());

-- Policy for deleting messages (can only delete messages you sent)
CREATE POLICY delete_own_messages ON chats 
  FOR DELETE 
  USING (sender_id = auth.uid());
