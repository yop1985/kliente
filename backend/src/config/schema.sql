CREATE DATABASE IF NOT EXISTS kliente_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kliente_db;

CREATE TABLE IF NOT EXISTS businesses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  rut VARCHAR(20) NULL,
  address VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  logo_url VARCHAR(500) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner', 'admin', 'cashier') NOT NULL DEFAULT 'admin',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_admin_users_email (email),
  INDEX idx_admin_users_business_id (business_id),

  CONSTRAINT fk_admin_users_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  prize_title VARCHAR(180) NOT NULL,
  prize_description TEXT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  minimum_purchase_amount INT NOT NULL DEFAULT 0,
  minimum_purchase_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  points_per_purchase INT NOT NULL DEFAULT 1,
  status ENUM('draft', 'active', 'finished', 'cancelled') NOT NULL DEFAULT 'draft',
  winner_selected TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_contests_business_id (business_id),
  INDEX idx_contests_status (status),
  INDEX idx_contests_dates (start_date, end_date),

  CONSTRAINT fk_contests_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contest_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contest_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  sku VARCHAR(80) NULL,
  unit ENUM('unit', 'kg') NOT NULL DEFAULT 'unit',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_contest_products_contest_id (contest_id),

  CONSTRAINT fk_contest_products_contest
    FOREIGN KEY (contest_id)
    REFERENCES contests(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  name VARCHAR(140) NOT NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  rut VARCHAR(20) NULL,
  total_points INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_customers_business_id (business_id),
  INDEX idx_customers_total_points (total_points),
  INDEX idx_customers_phone (phone),

  CONSTRAINT fk_customers_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  customer_id INT NOT NULL,
  contest_id INT NULL,
  total_amount INT NOT NULL DEFAULT 0,
  total_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  points_generated INT NOT NULL DEFAULT 0,
  ticket_number VARCHAR(80) NULL,
  purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_purchases_business_id (business_id),
  INDEX idx_purchases_customer_id (customer_id),
  INDEX idx_purchases_contest_id (contest_id),
  INDEX idx_purchases_date (purchase_date),

  CONSTRAINT fk_purchases_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_purchases_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_purchases_contest
    FOREIGN KEY (contest_id)
    REFERENCES contests(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  product_name VARCHAR(160) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit ENUM('unit', 'kg') NOT NULL DEFAULT 'unit',
  unit_price INT NOT NULL DEFAULT 0,
  subtotal INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_purchase_items_purchase_id (purchase_id),

  CONSTRAINT fk_purchase_items_purchase
    FOREIGN KEY (purchase_id)
    REFERENCES purchases(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  tag VARCHAR(80) NULL,
  priority INT NOT NULL DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 1,
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_promotions_business_id (business_id),
  INDEX idx_promotions_active (active),
  INDEX idx_promotions_priority (priority),

  CONSTRAINT fk_promotions_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS social_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  label VARCHAR(80) NULL,
  url VARCHAR(500) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_social_links_business_id (business_id),
  INDEX idx_social_links_active (active),
  INDEX idx_social_links_sort_order (sort_order),

  CONSTRAINT fk_social_links_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS winners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  contest_id INT NOT NULL,
  customer_id INT NOT NULL,
  total_points_at_draw INT NOT NULL DEFAULT 0,
  selected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  selection_method ENUM('automatic', 'manual') NOT NULL DEFAULT 'automatic',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_winners_contest_id (contest_id),
  INDEX idx_winners_business_id (business_id),
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

INSERT INTO businesses (
  id,
  name,
  rut,
  address,
  phone,
  email,
  active
)
VALUES (
  1,
  'Panadería Demo',
  '76.000.000-0',
  'Dirección demo',
  '+56912345678',
  'demo@kliente.cl',
  1
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  rut = VALUES(rut),
  address = VALUES(address),
  phone = VALUES(phone),
  email = VALUES(email),
  active = VALUES(active);

INSERT INTO contests (
  id,
  business_id,
  title,
  description,
  prize_title,
  prize_description,
  start_date,
  end_date,
  minimum_purchase_amount,
  minimum_purchase_kg,
  points_per_purchase,
  status,
  winner_selected
)
VALUES (
  1,
  1,
  'Concurso del Mes',
  'Participa por una caja de mercadería comprando sobre 30KG de pan durante el mes.',
  'Caja de mercadería familiar',
  'Premio principal para cliente ganador del mes.',
  '2026-05-01 00:00:00',
  '2026-05-31 23:59:59',
  0,
  30.00,
  1,
  'active',
  0
)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  prize_title = VALUES(prize_title),
  prize_description = VALUES(prize_description),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  minimum_purchase_amount = VALUES(minimum_purchase_amount),
  minimum_purchase_kg = VALUES(minimum_purchase_kg),
  points_per_purchase = VALUES(points_per_purchase),
  status = VALUES(status),
  winner_selected = VALUES(winner_selected);

INSERT INTO promotions (
  business_id,
  title,
  description,
  tag,
  priority,
  active
)
VALUES
  (1, '2x1 en hallullas todos los lunes', 'Promoción válida durante todo el día lunes.', 'Promo 1', 1, 1),
  (1, 'Marraquetas con descuento desde las 18:00 hrs', 'Descuento especial en productos seleccionados.', 'Promo 2', 2, 1),
  (1, 'Compra sobre $5.000 y suma doble puntaje', 'Acumula más puntos para participar en el sorteo.', 'Promo 3', 3, 1),
  (1, 'Pan amasado especial de fin de semana', 'Disponible sábado y domingo hasta agotar stock.', 'Promo 4', 4, 1),
  (1, 'Promoción familiar: lleva más y paga menos', 'Pack familiar disponible en caja.', 'Promo 5', 5, 1);

INSERT INTO social_links (
  business_id,
  name,
  label,
  url,
  active,
  sort_order
)
VALUES
  (1, 'WhatsApp', 'Escanea', 'https://wa.me/56912345678', 1, 1),
  (1, 'Instagram', 'Síguenos', 'https://instagram.com/tu_negocio', 1, 2),
  (1, 'Facebook', 'Visítanos', 'https://facebook.com/tu_negocio', 1, 3);

INSERT INTO customers (
  business_id,
  name,
  phone,
  total_points,
  active
)
VALUES
  (1, 'Juan Pérez', '+56911111111', 125, 1),
  (1, 'María González', '+56922222222', 110, 1),
  (1, 'Pedro Soto', '+56933333333', 95, 1),
  (1, 'Camila Rojas', '+56944444444', 88, 1),
  (1, 'Luis Herrera', '+56955555555', 81, 1),
  (1, 'Ana Torres', '+56966666666', 74, 1),
  (1, 'Diego Muñoz', '+56977777777', 69, 1),
  (1, 'Sofía Vera', '+56988888888', 63, 1),
  (1, 'Carlos Díaz', '+56999999999', 55, 1),
  (1, 'Valentina Silva', '+56910101010', 49, 1);