CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    format TEXT NOT NULL,
    description TEXT,
    mainboard JSONB DEFAULT '[]'::jsonb,
    sideboard JSONB DEFAULT '[]'::jsonb,
    considering JSONB DEFAULT '[]'::jsonb,
    color_identity TEXT[] DEFAULT ARRAY[]::text[],
    tags TEXT[] DEFAULT ARRAY[]::text[],
    is_public INTEGER DEFAULT 0,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);