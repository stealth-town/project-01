-- Drop table and enum if they already exist (optional safety)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_category_enum') THEN
        DROP TYPE item_category_enum;
    END IF;
END$$;

DROP TABLE IF EXISTS concrete_items;

-- Create enum type for item categories
CREATE TYPE item_category_enum AS ENUM (
    'helmet',
    'weapon1',
    'weapon2',
    'boots',
    'trinket',
    'armor'
);

-- Create concrete_items table using enum for category
CREATE TABLE concrete_items (
    id SERIAL PRIMARY KEY,
    category item_category_enum NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    dmg INT NOT NULL
);

-- Insert Helmets
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('helmet', 'Rusted Iron Helm', 2),
('helmet', 'Raider’s Hood', 4),
('helmet', 'Guardian Visor', 6),
('helmet', 'Dragonbone Helm', 8),
('helmet', 'Celestial Crown', 10);

-- Insert Weapon1
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('weapon1', 'Broken Shortsword', 10),
('weapon1', 'Steel Saber', 12),
('weapon1', 'Runed Greatblade', 14),
('weapon1', 'Emberfang Katana', 16),
('weapon1', 'Oblivion Edge', 18);

-- Insert Weapon2
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('weapon2', 'Wooden Dagger', 8),
('weapon2', 'Twin Iron Fangs', 10),
('weapon2', 'Venom Kris', 12),
('weapon2', 'Nightstalker Blades', 14),
('weapon2', 'Specter’s Scythe', 16);

-- Insert Boots
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('boots', 'Muddy Boots', 4),
('boots', 'Swiftstep Sandals', 6),
('boots', 'Tracker’s Greaves', 8),
('boots', 'Shadowrunner Boots', 10),
('boots', 'Phoenix Striders', 12);

-- Insert Trinkets
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('trinket', 'Cracked Pendant', 6),
('trinket', 'Emberstone Charm', 8),
('trinket', 'Blood Opal Ring', 10),
('trinket', 'Soul Prism', 12),
('trinket', 'Chrono Relic', 14);

-- Insert Armors
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('armor', 'Worn Leather Vest', 6),
('armor', 'Chainmail Hauberk', 8),
('armor', 'Obsidian Plate', 10),
('armor', 'Warlord’s Aegis', 12),
('armor', 'Divine Bulwark', 14);


ALTER TABLE items ADD COLUMN concrete_item_id INT REFERENCES concrete_items(id);
CREATE TYPE item_rarity_enum AS ENUM (
    'common',
    'rare',
    'epic',
    'legendary'
);
ALTER TABLE items ADD COLUMN rarity item_rarity_enum NOT NULL DEFAULT 'common';
ALTER TABLE items DROP COLUMN item_type;

