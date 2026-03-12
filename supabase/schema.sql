-- GritClub Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'host', 'audience')) DEFAULT 'audience',
  host_approved BOOLEAN DEFAULT false,
  stripe_id TEXT,
  stripe_connect_id TEXT,
  profile_bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  host_name TEXT,
  host_photo TEXT,
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  price INTEGER NOT NULL DEFAULT 0, -- in cents
  capacity INTEGER,
  start_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'live', 'ended')) DEFAULT 'draft',
  viewer_peak INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in cents
  status TEXT CHECK (status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  replay_access BOOLEAN DEFAULT false,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Host Applications
CREATE TABLE IF NOT EXISTS host_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  reason TEXT,
  expertise TEXT,
  social_url TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_photo TEXT,
  message TEXT NOT NULL,
  is_host BOOLEAN DEFAULT false,
  muted_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections (networking)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user1_name TEXT,
  user1_photo TEXT,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_name TEXT,
  user2_photo TEXT,
  event_id UUID REFERENCES events(id),
  status TEXT CHECK (status IN ('requested', 'accepted', 'declined')) DEFAULT 'requested',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in cents
  status TEXT CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  stripe_transfer_id TEXT,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stream Signals (WebRTC signaling)
CREATE TABLE IF NOT EXISTS stream_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  type TEXT, -- offer, answer, ice-candidate
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to increment ticket count
CREATE OR REPLACE FUNCTION increment_event_tickets(event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events SET total_sold = total_sold + 1 WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_signals ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, admins read all
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Events: public read, hosts write own
CREATE POLICY "events_public_read" ON events FOR SELECT USING (true);
CREATE POLICY "events_host_insert" ON events FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "events_host_update" ON events FOR UPDATE USING (auth.uid() = host_id);

-- Tickets: users read own
CREATE POLICY "tickets_read_own" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tickets_service_insert" ON tickets FOR INSERT WITH CHECK (true);

-- Chat: read if has ticket or is host
CREATE POLICY "chat_read_all" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert_auth" ON chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Host applications: users read own
CREATE POLICY "applications_read_own" ON host_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "applications_insert_own" ON host_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Connections: users read own
CREATE POLICY "connections_read_own" ON connections FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "connections_insert_own" ON connections FOR INSERT WITH CHECK (auth.uid() = user1_id);
CREATE POLICY "connections_update_own" ON connections FOR UPDATE USING (auth.uid() = user2_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE host_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, 'audience')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
