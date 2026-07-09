-- Seed: bids. Bidders are buyers (ids 5-8); never the auction's seller.
-- The final (highest) bid per auction matches that auction's current_bid / bid_count.
-- bid_version increments per auction, mirroring the auctions.version bump on each bid.
INSERT INTO bids (auction_id, bidder_id, amount, bid_version, ip_address, is_winning, is_retracted) VALUES
  -- Auction 1: Sealed Retro Handheld Console (current_bid 85.00, bid_count 4)
  (1, 5, 55.00, 2, '203.0.113.10', FALSE, FALSE),
  (1, 6, 65.00, 3, '203.0.113.11', FALSE, FALSE),
  (1, 7, 75.00, 4, '203.0.113.12', FALSE, FALSE),
  (1, 6, 85.00, 5, '203.0.113.11', TRUE,  FALSE),

  -- Auction 2: Mid-Century Teak Sideboard (current_bid 275.00, bid_count 3)
  (2, 5, 225.00, 2, '203.0.113.20', FALSE, FALSE),
  (2, 8, 250.00, 3, '203.0.113.21', FALSE, FALSE),
  (2, 5, 275.00, 4, '203.0.113.20', TRUE,  FALSE),

  -- Auction 3: Signed Limited-Edition Art Print (current_bid 140.00, bid_count 2)
  (3, 7, 120.00, 2, '203.0.113.30', FALSE, FALSE),
  (3, 8, 140.00, 3, '203.0.113.31', TRUE,  FALSE),

  -- Auction 7: First-Edition Hardcover Novel (ENDED, winner 6, current_bid 95.00, bid_count 4)
  (7, 5, 46.00, 2, '203.0.113.40', FALSE, FALSE),
  (7, 6, 60.00, 3, '203.0.113.41', FALSE, FALSE),
  (7, 7, 80.00, 4, '203.0.113.42', FALSE, FALSE),
  (7, 6, 95.00, 5, '203.0.113.41', TRUE,  FALSE),

  -- Auction 8: Noise-Cancelling Headphones (COMPLETED, winner 5, current_bid 165.00, bid_count 5)
  (8, 6,  90.00, 2, '203.0.113.50', FALSE, FALSE),
  (8, 7, 110.00, 3, '203.0.113.51', FALSE, FALSE),
  (8, 5, 130.00, 4, '203.0.113.52', FALSE, FALSE),
  (8, 7, 150.00, 5, '203.0.113.51', FALSE, FALSE),
  (8, 5, 165.00, 6, '203.0.113.52', TRUE,  FALSE);
