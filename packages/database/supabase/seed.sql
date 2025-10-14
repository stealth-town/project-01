-- First user ID - 155a5707-ef8a-4508-b3ad-515a34f73506
-- Second user ID - 2628ddc0-4250-40b4-af78-a74825acaf45


INSERT INTO users (id, energy, tokens, usdc, town_level) VALUES
  ('155a5707-ef8a-4508-b3ad-515a34f73506', 100, 0, 150, 1),
  ('2628ddc0-4250-40b4-af78-a74825acaf45', 100, 0, 200, 1);

INSERT INTO characters (id, user_id, damage_rating) VALUES
  (gen_random_uuid(), '155a5707-ef8a-4508-b3ad-515a34f73506', 0),
  (gen_random_uuid(), '2628ddc0-4250-40b4-af78-a74825acaf45', 0);

INSERT INTO towns (id, user_id, level, max_slots) VALUES
  (gen_random_uuid(), '155a5707-ef8a-4508-b3ad-515a34f73506', 1, 3),
  (gen_random_uuid(), '2628ddc0-4250-40b4-af78-a74825acaf45', 1, 3);'
  

-- TODO - add items or something 