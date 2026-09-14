-- ============================================================
-- DISASTER AI PLATFORM — FULL DATABASE INIT
-- Run ONCE on fresh PostGIS-enabled PostgreSQL
-- ============================================================

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. ENUMS
-- ============================================================
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
        'pending', 'verifying', 'verified', 'rejected', 'duplicate'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_severity AS ENUM (
        'low', 'medium', 'high', 'critical'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM (
        'active', 'monitoring', 'resolved', 'archived'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE disaster_type AS ENUM (
        'flood', 'earthquake', 'fire', 'landslide',
        'cyclone', 'tsunami', 'drought', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. USERS (workspace authentication)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    username          VARCHAR(100) NOT NULL UNIQUE,
    hashed_password   VARCHAR(255) NOT NULL,
    full_name         VARCHAR(255),
    role              VARCHAR(50) NOT NULL DEFAULT 'reporter',
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
    reputation_score  INTEGER NOT NULL DEFAULT 50,
    total_reports     INTEGER NOT NULL DEFAULT 0,
    verified_reports  INTEGER NOT NULL DEFAULT 0,
    avatar_url        TEXT,
    phone             VARCHAR(20),
    bio               TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login        TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ============================================================
-- 4. REPORTS TABLE (core user submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User-submitted data
    user_id         VARCHAR(255),
    description     TEXT NOT NULL,
    disaster_type   disaster_type NOT NULL DEFAULT 'other',
    
    -- Media
    image_url       VARCHAR(1024),
    video_url       VARCHAR(1024),
    audio_url       VARCHAR(1024),
    
    -- Location (CRITICAL for PostGIS)
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    location        GEOGRAPHY(POINT, 4326) NOT NULL,
    address_text    VARCHAR(500),
    
    -- Timestamps
    reported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_time      TIMESTAMPTZ,
    
    -- AI Consensus Scores (0-100 each)
    vision_score    DOUBLE PRECISION DEFAULT 0,
    text_nlp_score  DOUBLE PRECISION DEFAULT 0,
    geo_score       DOUBLE PRECISION DEFAULT 0,
    crowd_score     DOUBLE PRECISION DEFAULT 0,
    weather_score   DOUBLE PRECISION DEFAULT 0,
    trust_score     DOUBLE PRECISION DEFAULT 0,
    
    -- Status
    status          report_status NOT NULL DEFAULT 'pending',
    incident_id     UUID,  -- FK added after incidents table
    
    -- Metadata
    source          VARCHAR(50) DEFAULT 'mobile',
    language        VARCHAR(10) DEFAULT 'en',
    metadata        JSONB DEFAULT '{}',
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index (THE most important index for geo queries)
CREATE INDEX IF NOT EXISTS idx_reports_location 
    ON reports USING GIST(location);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reports_status 
    ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_disaster 
    ON reports(disaster_type);
CREATE INDEX IF NOT EXISTS idx_reports_trust 
    ON reports(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_time 
    ON reports(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_incident 
    ON reports(incident_id);

-- ============================================================
-- 4. INCIDENTS TABLE (clustered from verified reports)
-- ============================================================
CREATE TABLE IF NOT EXISTS incidents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    disaster_type   disaster_type NOT NULL,
    severity        incident_severity NOT NULL DEFAULT 'medium',
    status          incident_status NOT NULL DEFAULT 'active',
    
    -- Cluster centroid
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    location        GEOGRAPHY(POINT, 4326) NOT NULL,
    radius_meters   DOUBLE PRECISION DEFAULT 1000,
    
    -- Stats
    report_count    INTEGER DEFAULT 0,
    avg_trust_score DOUBLE PRECISION DEFAULT 0,
    
    -- Timeline
    first_reported  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    
    -- Clustering metadata
    cluster_id      VARCHAR(100),
    dbscan_params   JSONB DEFAULT '{}',
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_location 
    ON incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_incidents_status 
    ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity 
    ON incidents(severity);

-- Now add FK to reports
ALTER TABLE reports 
    ADD CONSTRAINT fk_reports_incident 
    FOREIGN KEY (incident_id) REFERENCES incidents(id) 
    ON DELETE SET NULL;

-- ============================================================
-- 5. VERIFICATION LOGS (AI audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    
    -- Individual AI scores at time of verification
    vision_score    DOUBLE PRECISION,
    text_nlp_score  DOUBLE PRECISION,
    geo_score       DOUBLE PRECISION,
    crowd_score     DOUBLE PRECISION,
    weather_score   DOUBLE PRECISION,
    final_trust     DOUBLE PRECISION NOT NULL,
    
    -- AI reasoning
    vision_details  JSONB DEFAULT '{}',
    text_details    JSONB DEFAULT '{}',
    geo_details     JSONB DEFAULT '{}',
    crowd_details   JSONB DEFAULT '{}',
    weather_details JSONB DEFAULT '{}',
    
    decision        VARCHAR(50) NOT NULL,  -- 'verified','rejected','needs_review'
    confidence      DOUBLE PRECISION,
    
    verified_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vlogs_report 
    ON verification_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_vlogs_time 
    ON verification_logs(verified_at DESC);

-- ============================================================
-- 6. AUDIT EVENTS (system-wide activity log)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    event_type      VARCHAR(100) NOT NULL,  -- 'report.created','incident.escalated', etc.
    entity_type     VARCHAR(50) NOT NULL,   -- 'report','incident','user'
    entity_id       UUID,
    
    actor           VARCHAR(255),           -- user_id or 'system'
    action          TEXT,
    details         JSONB DEFAULT '{}',
    
    ip_address      INET,
    user_agent      TEXT,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_type 
    ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_entity 
    ON audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time 
    ON audit_events(created_at DESC);

-- ============================================================
-- 7. HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reports_updated
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_incidents_updated
    BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-compute location geography from lat/lng
CREATE OR REPLACE FUNCTION sync_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(
        ST_MakePoint(NEW.longitude, NEW.latitude), 4326
    )::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reports_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON reports
    FOR EACH ROW EXECUTE FUNCTION sync_location();

CREATE TRIGGER trg_incidents_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON incidents
    FOR EACH ROW EXECUTE FUNCTION sync_location();

-- ============================================================
-- 8. SEED DATA (optional — for testing)
-- ============================================================
INSERT INTO reports (
    user_id, description, disaster_type,
    latitude, longitude, location,
    vision_score, text_nlp_score, geo_score, 
    crowd_score, weather_score, trust_score,
    status
) VALUES (
    'test-user-001',
    'Major flooding on Main Street. Water level above car tires. People stranded on rooftops.',
    'flood',
    28.6139, 77.2090,
    ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)::geography,
    85, 90, 78, 72, 95, 84,
    'verified'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE ✅
-- ============================================================
SELECT '✅ Database initialized successfully' AS status;
SELECT COUNT(*) AS total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';