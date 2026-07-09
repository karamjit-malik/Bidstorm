CREATE TABLE IF NOT EXISTS auction_state_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  from_state VARCHAR(20),
  to_state VARCHAR(20) NOT NULL,
  triggered_by ENUM('system', 'seller', 'admin', 'anti_snipe') NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  INDEX idx_auction (auction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
