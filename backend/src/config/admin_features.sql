USE kliente_db;

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

ALTER TABLE contests
  ADD COLUMN IF NOT EXISTS contest_period ENUM('weekly', 'biweekly', 'monthly', 'custom') NOT NULL DEFAULT 'monthly' AFTER prize_description,
  ADD COLUMN IF NOT EXISTS product_name VARCHAR(160) NULL AFTER contest_period,
  ADD COLUMN IF NOT EXISTS target_points INT NOT NULL DEFAULT 0 AFTER points_per_purchase;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER total_points;

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS product_name VARCHAR(160) NULL AFTER ticket_number,
  ADD COLUMN IF NOT EXISTS manual_points INT NOT NULL DEFAULT 0 AFTER points_generated;

UPDATE contests
SET
  contest_period = 'monthly',
  product_name = 'Pan',
  target_points = 100,
  points_per_purchase = 1
WHERE id = 1;