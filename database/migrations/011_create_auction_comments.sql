CREATE TABLE IF NOT EXISTS auction_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  is_question BOOLEAN DEFAULT FALSE,
  parent_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES auction_comments(id) ON DELETE CASCADE,
  INDEX idx_auction (auction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
