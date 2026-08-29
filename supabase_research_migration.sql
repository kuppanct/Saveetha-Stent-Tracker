-- =========================================================================
-- SAVEETHA MEDICAL COLLEGE & HOSPITAL - UROLOGY DEPARTMENT
-- CLINICAL RESEARCH MODULE: STENT ENCRUSTATION & BIOCOMPATIBILITY STUDY
-- SUPABASE POSTGRESQL SCHEMA MIGRATION & STORAGE BUCKET CONFIGURATION
-- =========================================================================

-- 1. Create Research Encrustation Table (1-to-1 with stents table)
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
    
    -- Pre-op Urine Microbiology & Chemistry
    urine_culture VARCHAR(50) DEFAULT 'Sterile' CHECK (urine_culture IN ('Sterile', 'E.coli', 'Proteus', 'Klebsiella', 'Pseudomonas', 'Other')),
    urine_ph NUMERIC(3,1),
    
    -- Surgery Details
    procedure_type VARCHAR(50) DEFAULT 'URSL' CHECK (procedure_type IN ('URSL', 'RIRS', 'PCNL', 'ESWL', 'Endopyelotomy', 'Stricture Dilatation', 'Malignancy', 'Other')),
    stone_clearance_status VARCHAR(50) DEFAULT 'Complete' CHECK (stone_clearance_status IN ('Complete', 'Residual Fragments', 'Not Applicable')),
    stent_size_fr NUMERIC(3,1) DEFAULT 6.0,
    stent_length_cm INTEGER DEFAULT 26,
    
    -- Encrustation Findings (Visual / Tactile)
    encrustation_grade INTEGER DEFAULT 0 CHECK (encrustation_grade IN (0, 1, 2, 3)),
    encrustation_location TEXT[] DEFAULT '{}',
    removal_difficulty VARCHAR(50) DEFAULT 'Simple' CHECK (removal_difficulty IN ('Simple', 'Moderate', 'Complex')),
    ancillary_procedure_required BOOLEAN DEFAULT FALSE,
    
    -- Additional Variables
    alkalinizer_used BOOLEAN DEFAULT FALSE,
    symptomatic_indwelling BOOLEAN DEFAULT FALSE,
    
    -- Media (Visual Artifact Storage)
    stent_image_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_research_encrustation_stent_id ON research_encrustation(stent_id);
CREATE INDEX IF NOT EXISTS idx_research_encrustation_patient_id ON research_encrustation(patient_id);
CREATE INDEX IF NOT EXISTS idx_research_encrustation_grade ON research_encrustation(encrustation_grade);
CREATE INDEX IF NOT EXISTS idx_research_encrustation_proc_type ON research_encrustation(procedure_type);

-- 3. Row Level Security (RLS)
ALTER TABLE research_encrustation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access research_encrustation" ON research_encrustation;
CREATE POLICY "Public full access research_encrustation" ON research_encrustation FOR ALL USING (true) WITH CHECK (true);

-- 4. Supabase Storage Bucket Setup for Stent Photography
INSERT INTO storage.buckets (id, name, public) 
VALUES ('stent_images', 'stent_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public full access stent_images storage" ON storage.objects;
CREATE POLICY "Public full access stent_images storage" ON storage.objects 
FOR ALL USING (bucket_id = 'stent_images') WITH CHECK (bucket_id = 'stent_images');
