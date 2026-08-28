-- =========================================================================
-- SAVEETHA MEDICAL COLLEGE & HOSPITAL - UROLOGY DEPARTMENT
-- DOUBLE-J (DJ) STENT TRACKER - SUPABASE POSTGRESQL SCHEMA
-- =========================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Enum or Check Types
DO $$ BEGIN
    CREATE TYPE language_enum AS ENUM ('Tamil', 'Hindi');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE unit_enum AS ENUM ('Unit 1', 'Unit 2');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE laterality_enum AS ENUM ('Left', 'Right', 'Bilateral');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE material_enum AS ENUM ('Regular', 'Carbothane', 'Silicone');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stent_status_enum AS ENUM ('Active', 'Removed', 'Exchanged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uhid VARCHAR(64) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    second_language VARCHAR(10) NOT NULL CHECK (second_language IN ('Tamil', 'Hindi')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STENTS TABLE
CREATE TABLE IF NOT EXISTS stents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    unit VARCHAR(10) NOT NULL CHECK (unit IN ('Unit 1', 'Unit 2')),
    laterality VARCHAR(15) NOT NULL CHECK (laterality IN ('Left', 'Right', 'Bilateral')),
    material VARCHAR(20) NOT NULL CHECK (material IN ('Regular', 'Carbothane', 'Silicone')),
    insertion_date DATE NOT NULL,
    planned_removal_date DATE NOT NULL,
    removal_date DATE,
    status VARCHAR(15) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Removed', 'Exchanged')),
    residual_stone BOOLEAN NOT NULL DEFAULT FALSE,
    inserted_by TEXT NOT NULL,
    exchanged_from_id UUID REFERENCES stents(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CALL LOGS TABLE (Technician Calling Queue)
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stent_id UUID NOT NULL REFERENCES stents(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    outcome VARCHAR(64) NOT NULL,
    notes TEXT,
    logged_by TEXT DEFAULT 'Technician',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NOTIFICATION LOGS TABLE (WhatsApp Gateway audit)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stent_id UUID NOT NULL REFERENCES stents(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    trigger_type VARCHAR(32) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED', 'PENDING')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT
);

-- INDEXES FOR HIGH-SPEED QUERIES & SORTING
CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);
CREATE INDEX IF NOT EXISTS idx_stents_patient_id ON stents(patient_id);
CREATE INDEX IF NOT EXISTS idx_stents_status ON stents(status);
CREATE INDEX IF NOT EXISTS idx_stents_planned_removal ON stents(planned_removal_date);
CREATE INDEX IF NOT EXISTS idx_call_logs_stent_id ON call_logs(stent_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_stent_id ON notification_logs(stent_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stents ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES (Allow full access for authenticated/anon keys)
CREATE POLICY "Allow public read-write for patients" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for stents" ON stents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for call_logs" ON call_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for notification_logs" ON notification_logs FOR ALL USING (true) WITH CHECK (true);

-- SAMPLE SEED DATA FOR DEMO & TESTING
INSERT INTO patients (id, uhid, name, phone, address, second_language, created_at)
VALUES 
    ('a1111111-1111-1111-1111-111111111111', 'SMCH-2026-00101', 'Kavitha Murugan', '9840123456', 'Thandalam, Chennai - 602105', 'Tamil', NOW() - INTERVAL '40 days'),
    ('b2222222-2222-2222-2222-222222222222', 'SMCH-2026-00142', 'Rajesh Sharma', '9876543210', 'Poonamallee, Chennai - 600056', 'Hindi', NOW() - INTERVAL '100 days'),
    ('c3333333-3333-3333-3333-333333333333', 'SMCH-2026-00205', 'Annamalai S', '9444112233', 'Kanchipuram Main Road', 'Tamil', NOW() - INTERVAL '90 days'),
    ('d4444444-4444-4444-4444-444444444444', 'SMCH-2026-00318', 'Priya Velu (Bilateral)', '9176998877', 'Sriperumbudur', 'Tamil', NOW() - INTERVAL '60 days')
ON CONFLICT (uhid) DO NOTHING;

INSERT INTO stents (id, patient_id, unit, laterality, material, insertion_date, planned_removal_date, status, residual_stone, inserted_by, created_at)
VALUES 
    -- 1. Kavitha: Regular Stent, Due in 50 days (Pre-expiry coming up)
    ('s1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Unit 1', 'Right', 'Regular', (CURRENT_DATE - INTERVAL '40 days'), (CURRENT_DATE + INTERVAL '50 days'), 'Active', false, 'Dr. Arunkumar MS, MCh (Uro)', NOW() - INTERVAL '40 days'),
    
    -- 2. Rajesh: Regular Stent inserted 100 days ago (Overdue by 10 days!)
    ('s2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Unit 2', 'Left', 'Regular', (CURRENT_DATE - INTERVAL '100 days'), (CURRENT_DATE - INTERVAL '10 days'), 'Active', true, 'Dr. Balaji MD, MCh (Uro)', NOW() - INTERVAL '100 days'),
    
    -- 3. Annamalai: Due TODAY (T-0)
    ('s3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Unit 1', 'Left', 'Regular', (CURRENT_DATE - INTERVAL '90 days'), CURRENT_DATE, 'Active', false, 'Dr. Saravanan MCh (Uro)', NOW() - INTERVAL '90 days'),
    
    -- 4. Priya: Bilateral case with Left Stent due in 10 days and Right Stent due in 30 days
    ('s4444444-4444-4444-4444-444444444444', 'd4444444-4444-4444-4444-444444444444', 'Unit 1', 'Bilateral', 'Regular', (CURRENT_DATE - INTERVAL '60 days'), (CURRENT_DATE + INTERVAL '30 days'), 'Active', true, 'Dr. Arunkumar MS, MCh (Uro)', NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;