-- Seed: auctions across several states. Times are relative to load time.
-- Seller ids: 2=vintagevic, 3=gadgetguru, 4=artdealer. Category ids 1-10.
INSERT INTO auctions
  (seller_id, category_id, title, description, starting_price, reserve_price, current_bid, min_bid_increment, bid_count, state, start_time, end_time, original_end_time, winner_id)
VALUES
  -- LIVE auctions (started in the past, end in the future)
  (3, 1, 'Sealed Retro Handheld Console',
     'Brand new, factory-sealed retro handheld with 500 built-in games. A collector favorite.',
     50.00, 120.00, 85.00, 5.00, 4, 'LIVE',
     DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 6 HOUR), DATE_ADD(NOW(), INTERVAL 6 HOUR), NULL),
  (2, 9, 'Mid-Century Teak Sideboard',
     'Restored 1960s Danish teak sideboard in excellent condition. Local pickup preferred.',
     200.00, 450.00, 275.00, 25.00, 3, 'LIVE',
     DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 20 HOUR), DATE_ADD(NOW(), INTERVAL 20 HOUR), NULL),
  (4, 2, 'Signed Limited-Edition Art Print',
     'Numbered 12/50, signed by the artist. Comes with certificate of authenticity.',
     100.00, NULL, 140.00, 10.00, 2, 'LIVE',
     DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_ADD(NOW(), INTERVAL 90 MINUTE), DATE_ADD(NOW(), INTERVAL 90 MINUTE), NULL),

  -- SCHEDULED auctions (start in the future)
  (3, 8, 'Vintage Automatic Dive Watch',
     'Serviced automatic dive watch, water resistant to 200m. Original box included.',
     300.00, 600.00, 0.00, 20.00, 0, 'SCHEDULED',
     DATE_ADD(NOW(), INTERVAL 12 HOUR), DATE_ADD(NOW(), INTERVAL 60 HOUR), DATE_ADD(NOW(), INTERVAL 60 HOUR), NULL),
  (2, 5, 'Carbon Road Bike — Size 56cm',
     'Lightweight carbon frame road bike, recently tuned. Minor cosmetic wear.',
     400.00, 750.00, 0.00, 25.00, 0, 'SCHEDULED',
     DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY), DATE_ADD(NOW(), INTERVAL 4 DAY), NULL),

  -- DRAFT auction (seller still editing)
  (4, 3, 'Designer Leather Handbag',
     'Authentic designer handbag, gently used. Dust bag and authenticity card included.',
     150.00, 350.00, 0.00, 10.00, 0, 'DRAFT',
     DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), NULL),

  -- ENDED auction with a winner (buyer id 6)
  (2, 6, 'First-Edition Hardcover Novel',
     'A sought-after first-edition hardcover in near-mint condition.',
     40.00, 60.00, 95.00, 5.00, 4, 'ENDED',
     DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 6),

  -- COMPLETED auction (settled, buyer id 5)
  (3, 1, 'Noise-Cancelling Headphones',
     'Flagship over-ear noise-cancelling headphones. Lightly used, full accessories.',
     80.00, 100.00, 165.00, 5.00, 5, 'COMPLETED',
     DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), 5);
