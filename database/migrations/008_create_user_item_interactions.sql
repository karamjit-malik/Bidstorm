CREATE TABLE IF NOT EXISTS user_item_interactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  auction_id INT NOT NULL,
  interaction_type ENUM('view', 'watchlist', 'bid', 'won') NOT NULL,
  weight DECIMAL(3,1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_auction (auction_id),
  INDEX idx_type (interaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Interaction weights: view=1.0, watchlist=3.0, bid=5.0, won=8.0
