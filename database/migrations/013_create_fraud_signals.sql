CREATE TABLE IF NOT EXISTS fraud_signals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id INT NOT NULL,
  signal_type ENUM('same_ip', 'min_increment_pattern', 'bid_retract_pattern', 'new_account_high_value', 'velocity_spike') NOT NULL,
  description TEXT NOT NULL,
  risk_score DECIMAL(3,2) NOT NULL,
  flagged_user_id INT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (flagged_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_auction_risk (auction_id, risk_score DESC),
  INDEX idx_unresolved (is_resolved, risk_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
