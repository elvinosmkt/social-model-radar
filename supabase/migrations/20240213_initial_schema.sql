-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- 'instagram' or 'tiktok'
  platform_id TEXT,
  handle TEXT UNIQUE NOT NULL,
  name TEXT,
  bio TEXT,
  followers INTEGER,
  age_range TEXT, -- Estimated age range
  avatar_url TEXT,
  external_link TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'approaching', 'approached', 'in_conversation', 'selected', 'converted', 'lost'
  niche TEXT,
  ai_summary TEXT,
  ai_characteristics TEXT, -- Extra traits
  ai_score INTEGER,
  tags TEXT[],
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interactions Table
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT, -- 'note', 'status_change', 'dm_sent', 'response_received'
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster handle lookups
CREATE INDEX IF NOT EXISTS idx_leads_handle ON leads(handle);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
