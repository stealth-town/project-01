-- Add slot type validation to enforce item category matches equipment slot
-- Slot mappings:
-- 1: helmet
-- 2: weapon1
-- 3: weapon2
-- 4: boots
-- 5: trinket
-- 6: armor

-- Create a function to validate item can be equipped in slot
CREATE OR REPLACE FUNCTION validate_item_slot()
RETURNS TRIGGER AS $$
DECLARE
    item_category item_category_enum;
    expected_category item_category_enum;
BEGIN
    -- Only validate when item is being equipped
    IF NEW.is_equipped = true AND NEW.equipped_slot IS NOT NULL THEN
        -- Get the item's category from concrete_items
        SELECT ci.category INTO item_category
        FROM concrete_items ci
        WHERE ci.id = NEW.concrete_item_id;

        -- Determine expected category for the slot
        expected_category := CASE NEW.equipped_slot
            WHEN 1 THEN 'helmet'::item_category_enum
            WHEN 2 THEN 'weapon1'::item_category_enum
            WHEN 3 THEN 'weapon2'::item_category_enum
            WHEN 4 THEN 'boots'::item_category_enum
            WHEN 5 THEN 'trinket'::item_category_enum
            WHEN 6 THEN 'armor'::item_category_enum
            ELSE NULL
        END;

        -- Validate category matches slot
        IF item_category != expected_category THEN
            RAISE EXCEPTION 'Item category % cannot be equipped in slot % (expected %)',
                item_category, NEW.equipped_slot, expected_category;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate slot type before insert/update
DROP TRIGGER IF EXISTS validate_item_slot_trigger ON items;
CREATE TRIGGER validate_item_slot_trigger
    BEFORE INSERT OR UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION validate_item_slot();

-- Add comment for documentation
COMMENT ON FUNCTION validate_item_slot() IS 'Validates that items can only be equipped in slots matching their category type';
