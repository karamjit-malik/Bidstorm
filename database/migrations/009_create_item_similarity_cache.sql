CREATE TABLE IF NOT EXISTS item_similarity_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  auction_id_a INT NOT NULL,
  auction_id_b INT NOT NULL,
  similarity_score DECIMAL(5,4) NOT NULL,
  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id_a) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id_b) REFERENCES auctions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_pair (auction_id_a, auction_id_b),
  INDEX idx_auction_a_score (auction_id_a, similarity_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Only store top 20 similar items per auction. Recomputed nightly.
