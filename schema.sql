-- =========================================================================
-- SAVEETHA MEDICAL COLLEGE & HOSPITAL - UROLOGY DEPARTMENT
-- DOUBLE-J (DJ) STENT TRACKER - SUPABASE POSTGRESQL SCHEMA (CLEAN SQL)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uhid VARCHAR(64) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    gender VARCHAR(15),
    dob VARCHAR(30),
    blood_group VARCHAR(10),
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
    actual_removal_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Removed', 'Exchanged')),
    residual_stone BOOLEAN DEFAULT FALSE,
    inserted_by TEXT NOT NULL,
    indication TEXT,
    notes TEXT,
    removal_notes TEXT,
    exchanged_from_id UUID REFERENCES stents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CALL LOGS TABLE (Technician Follow-up Tracker)
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stent_id UUID NOT NULL REFERENCES stents(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    call_timestamp TIMESTAMPTZ DEFAULT NOW(),
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN (
        'Patient not answering',
        'Promised to come',
        'Refused - High Risk',
        'Scheduled for OPD',
        'Family Notified',
        'Number Invalid / Switched Off',
        'Other'
    )),
    notes TEXT,
    logged_by TEXT DEFAULT 'Technician'
);

-- 4. NOTIFICATION AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stent_id UUID NOT NULL REFERENCES stents(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    trigger_type VARCHAR(30) NOT NULL,
    sent_timestamp TIMESTAMPTZ DEFAULT NOW(),
    recipient_phone VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    delivery_status VARCHAR(20) NOT NULL CHECK (delivery_status IN ('SENT', 'FAILED', 'QUEUED')),
    error_message TEXT
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_patients_uhid ON patients(uhid);
CREATE INDEX IF NOT EXISTS idx_stents_patient_id ON stents(patient_id);
CREATE INDEX IF NOT EXISTS idx_stents_status_due_date ON stents(status, planned_removal_date);
CREATE INDEX IF NOT EXISTS idx_stents_laterality ON stents(laterality);
CREATE INDEX IF NOT EXISTS idx_call_logs_stent_id ON call_logs(stent_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_stent_id ON notification_logs(stent_id);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stents ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon & authenticated roles
DROP POLICY IF EXISTS "Public full access patients" ON patients;
CREATE POLICY "Public full access patients" ON patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access stents" ON stents;
CREATE POLICY "Public full access stents" ON stents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access call_logs" ON call_logs;
CREATE POLICY "Public full access call_logs" ON call_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access notification_logs" ON notification_logs;
CREATE POLICY "Public full access notification_logs" ON notification_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. RESEARCH ENCRUSTATION MODULE TABLE (1-to-1 with stents)
CREATE TABLE IF NOT EXISTS research_encrustation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stent_id UUID NOT NULL UNIQUE REFERENCES stents(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Patient Factors
    weight_kg NUMERIC(5,2),
    height_cm NUMERIC(5,2),
    bmi NUMERIC(4,1),
    is_diabetic BOOLEAN DEFAULT FALSE,
    has_ckd BOOLEAN DEFAULT FALSE,
    pregnancy_status BOOLEAN DEFAULT FALSE,
    recurrent_stone_former BOOLEAN DEFAULT FALSE,
    anatomical_abnormality VARCHAR(60) DEFAULT 'None',
    
    -- Pre-op Urine
    urine_culture VARCHAR(50) DEFAULT 'Sterile' CHECK (urine_culture IN ('Sterile', 'E.coli', 'Proteus', 'Klebsiella', 'Pseudomonas', 'Other')),
    urine_ph NUMERIC(3,1),
    
    -- Surgery Details
    procedure_type VARCHAR(50) DEFAULT 'URSL' CHECK (procedure_type IN ('URSL', 'RIRS', 'PCNL', 'ESWL', 'Endopyelotomy', 'Stricture Dilatation', 'Malignancy', 'Other')),
    stone_clearance_status VARCHAR(50) DEFAULT 'Complete' CHECK (stone_clearance_status IN ('Complete', 'Residual Fragments', 'Not Applicable')),
    stent_size_fr NUMERIC(3,1) DEFAULT 6.0,
    stent_length_cm INTEGER DEFAULT 26,
    
    -- Encrustation Findings
    encrustation_grade INTEGER DEFAULT 0 CHECK (encrustation_grade IN (0, 1, 2, 3)),
    encrustation_location TEXT[] DEFAULT '{}',
    removal_difficulty VARCHAR(50) DEFAULT 'Simple' CHECK (removal_difficulty IN ('Simple', 'Moderate', 'Complex')),
    ancillary_procedure_required BOOLEAN DEFAULT FALSE,
    
    -- Additional Variables
    alkalinizer_used BOOLEAN DEFAULT FALSE,
    symptomatic_indwelling BOOLEAN DEFAULT FALSE,
    
    -- Media
    stent_image_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_encrustation_stent_id ON research_encrustation(stent_id);
CREATE INDEX IF NOT EXISTS idx_research_encrustation_patient_id ON research_encrustation(patient_id);
CREATE INDEX IF NOT EXISTS idx_research_encrustation_grade ON research_encrustation(encrustation_grade);

ALTER TABLE research_encrustation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access research_encrustation" ON research_encrustation;
CREATE POLICY "Public full access research_encrustation" ON research_encrustation FOR ALL USING (true) WITH CHECK (true);

-- 8. Storage Bucket for Stent Images (Public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stent_images', 'stent_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public full access stent_images storage" ON storage.objects;
CREATE POLICY "Public full access stent_images storage" ON storage.objects 
FOR ALL USING (bucket_id = 'stent_images') WITH CHECK (bucket_id = 'stent_images');