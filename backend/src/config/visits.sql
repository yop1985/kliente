CREATE TABLE IF NOT EXISTS public_page_visits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  visitor_key VARCHAR(120) NULL,
  ip_address VARCHAR(80) NULL,
  user_agent VARCHAR(500) NULL,
  visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_public_page_visits_business_id (business_id),
  INDEX idx_public_page_visits_visited_at (visited_at),

  CONSTRAINT fk_public_page_visits_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE
);