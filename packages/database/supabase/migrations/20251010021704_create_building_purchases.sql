-- Create building_purchases table for tracking building purchases

CREATE TABLE building_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

    usdc_cost DECIMAL(18, 6) NOT NULL DEFAULT 100,
    slot_number INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_building_purchases_user_id ON building_purchases(user_id);
CREATE INDEX idx_building_purchases_building_id ON building_purchases(building_id);
CREATE INDEX idx_building_purchases_created_at ON building_purchases(created_at DESC);
