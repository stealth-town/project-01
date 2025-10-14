-- Create energy_purchases table for tracking energy purchases

CREATE TYPE energy_package AS ENUM (
    'small',   -- 1 energy / 1 USDC
    'medium',  -- 11 energy / 10 USDC
    'large'    -- 60 energy / 50 USDC
);

CREATE TABLE energy_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    package_type energy_package NOT NULL,
    energy_amount INTEGER NOT NULL,
    usdc_cost DECIMAL(18, 6) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_energy_purchases_user_id ON energy_purchases(user_id);
CREATE INDEX idx_energy_purchases_created_at ON energy_purchases(created_at DESC);
