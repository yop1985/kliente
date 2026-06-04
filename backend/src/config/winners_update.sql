USE kliente_db;

CREATE TABLE IF NOT EXISTS winners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  contest_id INT NOT NULL,
  customer_id INT NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  customer_rut VARCHAR(30) NULL,
  total_points INT NOT NULL DEFAULT 0,
  draw_reason ENUM('auto_end_date', 'auto_target_points', 'manual') NOT NULL DEFAULT 'manual',
  selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_winners_business_id (business_id),
  INDEX idx_winners_contest_id (contest_id),
  INDEX idx_winners_customer_id (customer_id),

  CONSTRAINT fk_winners_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_winners_contest
    FOREIGN KEY (contest_id)
    REFERENCES contests(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_winners_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE
);

ALTER TABLE winners
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(160) NOT NULL DEFAULT '' AFTER customer_id,
  ADD COLUMN IF NOT EXISTS customer_rut VARCHAR(30) NULL AFTER customer_name,
  ADD COLUMN IF NOT EXISTS total_points INT NOT NULL DEFAULT 0 AFTER customer_rut,
  ADD COLUMN IF NOT EXISTS draw_reason ENUM('auto_end_date', 'auto_target_points', 'manual') NOT NULL DEFAULT 'manual' AFTER total_points,
  ADD COLUMN IF NOT EXISTS selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER draw_reason;

ALTER TABLE contests
  ADD COLUMN IF NOT EXISTS winner_selected TINYINT(1) NOT NULL DEFAULT 0;