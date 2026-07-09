-- Seed: users. All seeded accounts share the password below (dev only).
-- Plaintext password for every account: Password123!  (bcrypt, cost 10)
INSERT INTO users (email, password_hash, username, full_name, role, is_verified, reputation_score) VALUES
  ('admin@bidstorm.com',   '$2a$10$j1hZbVU8LVtC83.Y0kjaUutyZgEkTbgnWxWaa86vUGamBaI89wNIq', 'admin',     'Ava Admin',        'admin',  TRUE, 5.00),
  ('seller1@bidstorm.com', '$2a$10$j1hZbVU8LVtC83.Y0kjaUutyZgEkTbgnWxWaa86vUGamBaI89wNIq', 'vintagevic','Victor Vintage',   'seller', TRUE, 4.80),
  ('seller2@bidstorm.com', '$2a$10$j1hZbVU8LVtC83.Y0kjaUutyZgEkTbgnWxWaa86vUGamBaI89wNIq', 'gadgetguru','Grace Gadget',     'seller', TRUE, 4.50),
  ('seller3@bidstorm.com', '$2a$10$j1hZbVU8LVtC83.Y0kjaUutyZgEkTbgnWxWaa86vUGamBaI89wNIq', 'artdealer', 'Arthur Dealer',    'seller', TRUE, 4.20),
  ('buyer1@bidstorm.com',  '$2a$10$j1hZbVU8LVtC83.Y0kjaUutyZgEkTbgnWxWaa86vUGamBaI89wNIq', 'bargainbob','Bob Bargain',      'buyer',  TRUE, 3.90),
  ('buyer2@bidstorm.com',  '$2a$10$j1hZbVU8LVtC83.Y0kjaUutyZgEkTbgnWxWaa86vUGamBaI89wNIq', 'collector', 'Clara Collector',  'buyer',  TRUE, 4.10),
  ('buyer3@bidstorm.com',  '$2a$10$j1hZbVU8LVtC83.Y0kjaUutyZgEkTbgnWxWaa86vUGamBaI89wNIq', 'snipequeen','Sara Sniper',      'buyer',  TRUE, 3.75),
  ('buyer4@bidstorm.com',  '$2a$10$j1hZbVU8LVtC83.Y0kjaUutyZgEkTbgnWxWaa86vUGamBaI89wNIq', 'newbie',    'Nate Newcomer',    'buyer',  FALSE, 0.00);
