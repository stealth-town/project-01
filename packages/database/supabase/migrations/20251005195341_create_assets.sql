-- Assets table for the assets we allow to be traded

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decimals INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_name ON assets(name);
CREATE INDEX idx_assets_symbol ON assets(symbol);

-- Default assets for now (only one) - ETH
INSERT INTO assets (name, symbol, decimals) VALUES ('Ethereum', 'ETH', 18);