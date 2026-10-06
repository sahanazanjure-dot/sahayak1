-- ====================================================================
-- Sahayak Platform — Supabase Database Schema
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Opportunities / Events Table
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    org_type TEXT,
    category TEXT,
    location TEXT NOT NULL,
    distance_km NUMERIC DEFAULT 0,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    volunteers_needed INTEGER DEFAULT 1,
    volunteers_registered INTEGER DEFAULT 0,
    required_skills JSONB DEFAULT '[]'::jsonb,
    urgency TEXT DEFAULT 'Standard',
    status TEXT DEFAULT 'Open',
    description TEXT,
    coordinator_name TEXT,
    coordinator_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    role TEXT DEFAULT 'volunteer',
    location TEXT,
    bio TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    reliability_score INTEGER DEFAULT 95,
    total_hours NUMERIC DEFAULT 0,
    completed_events INTEGER DEFAULT 0,
    status TEXT DEFAULT 'AVAILABLE', -- 'AVAILABLE' | 'DEPLOYED' | 'STANDBY'
    supervisor_rating NUMERIC DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Deployments / Field Missions Table
CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES opportunities(id) ON DELETE SET NULL,
    event_title TEXT NOT NULL,
    volunteer_id TEXT REFERENCES volunteers(id) ON DELETE CASCADE,
    volunteer_name TEXT NOT NULL,
    assigned_location TEXT NOT NULL,
    status TEXT DEFAULT 'MATCHED', -- 'MATCHED' | 'DEPLOYED' | 'COMPLETED'
    shift_time TEXT,
    shift_hours NUMERIC DEFAULT 4.0,
    check_in_time TEXT,
    check_out_time TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Emergency Alerts Table
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'CRITICAL' | 'HIGH' | 'MEDIUM'
    responders_needed INTEGER DEFAULT 5,
    responders_active INTEGER DEFAULT 0,
    message TEXT NOT NULL,
    broadcast_time TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. NGOs / Partner Organizations Table
CREATE TABLE IF NOT EXISTS ngos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    darpan_id TEXT,
    contact_person TEXT,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    sector TEXT,
    location TEXT,
    website TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- Enable Row Level Security (RLS) and allow public read/write for demo
-- ====================================================================
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the web app (using Supabase Anon Key)
CREATE POLICY "Public full access to opportunities" ON opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to volunteers" ON volunteers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to deployments" ON deployments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to emergency_alerts" ON emergency_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to ngos" ON ngos FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE opportunities, volunteers, deployments, emergency_alerts, ngos;
