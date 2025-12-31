-- Create enum for channel types
CREATE TYPE public.channel_type AS ENUM ('text', 'announcements', 'trades');

-- Create community channels table
CREATE TABLE public.community_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '💬',
  channel_type channel_type DEFAULT 'text',
  position INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel permissions table
CREATE TABLE public.channel_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT true,
  can_upload BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, role)
);

-- Create community messages table
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  file_name TEXT,
  trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
  reply_to_id UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create user presence table for typing indicators
CREATE TABLE public.user_channel_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_channel_presence ENABLE ROW LEVEL SECURITY;

-- Channels policies (everyone can read, only admins can modify)
CREATE POLICY "Everyone can view channels" 
  ON public.community_channels FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create channels" 
  ON public.community_channels FOR INSERT 
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update channels" 
  ON public.community_channels FOR UPDATE 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete channels" 
  ON public.community_channels FOR DELETE 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Channel permissions policies
CREATE POLICY "Everyone can view channel permissions" 
  ON public.channel_permissions FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage permissions" 
  ON public.channel_permissions FOR ALL 
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Messages policies
CREATE POLICY "Users can view messages in channels they have access to" 
  ON public.community_messages FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can create messages" 
  ON public.community_messages FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
  ON public.community_messages FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own messages or admins can delete any" 
  ON public.community_messages FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Reactions policies
CREATE POLICY "Everyone can view reactions" 
  ON public.message_reactions FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can add their own reactions" 
  ON public.message_reactions FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions" 
  ON public.message_reactions FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Presence policies
CREATE POLICY "Everyone can view presence" 
  ON public.user_channel_presence FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own presence" 
  ON public.user_channel_presence FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_community_channels_updated_at
  BEFORE UPDATE ON public.community_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_messages_updated_at
  BEFORE UPDATE ON public.community_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_channel_presence;

-- Insert default channels
INSERT INTO public.community_channels (name, description, icon, channel_type, position, is_default) VALUES
  ('כללי', 'צ''אט כללי לקהילה', '💬', 'text', 1, true),
  ('שיתופי עסקאות', 'שתפו את העסקאות שלכם', '📊', 'trades', 2, false),
  ('ניתוחים יומיים', 'ניתוחי שוק ותחזיות', '🧠', 'text', 3, false),
  ('הודעות', 'עדכונים והודעות חשובות', '📢', 'announcements', 0, false);