CREATE TABLE IF NOT EXISTS bids (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  bidder_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  bid_version INT NOT NULL,
  ip_address VARCHAR(45),
  is_winning BOOLEAN DEFAULT FALSE,
  is_retracted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_auction_amount (auction_id, amount DESC),
  INDEX idx_bidder (bidder_id),
  INDEX idx_auction_created (auction_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
