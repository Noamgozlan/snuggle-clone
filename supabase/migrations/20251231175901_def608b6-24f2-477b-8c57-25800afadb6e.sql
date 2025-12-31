-- Create mentor_messages table for chat between mentors and students
CREATE TABLE public.mentor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  relationship_id UUID NOT NULL REFERENCES public.mentor_relationships(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view messages in their relationships
CREATE POLICY "Users can view messages in their relationships"
ON public.mentor_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mentor_relationships
    WHERE id = relationship_id
    AND (mentor_id = auth.uid() OR student_id = auth.uid())
    AND status = 'accepted'
  )
);

-- Create policy for users to send messages in their relationships
CREATE POLICY "Users can send messages in their relationships"
ON public.mentor_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.mentor_relationships
    WHERE id = relationship_id
    AND (mentor_id = auth.uid() OR student_id = auth.uid())
    AND status = 'accepted'
  )
);

-- Create policy for users to update read status
CREATE POLICY "Users can update read status"
ON public.mentor_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.mentor_relationships
    WHERE id = relationship_id
    AND (mentor_id = auth.uid() OR student_id = auth.uid())
    AND status = 'accepted'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mentor_relationships
    WHERE id = relationship_id
    AND (mentor_id = auth.uid() OR student_id = auth.uid())
    AND status = 'accepted'
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_messages;

-- Create index for faster queries
CREATE INDEX idx_mentor_messages_relationship ON public.mentor_messages(relationship_id);
CREATE INDEX idx_mentor_messages_created_at ON public.mentor_messages(created_at DESC);