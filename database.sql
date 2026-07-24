-- ============================================================
--  ZOYERIA JEWELS — MySQL Database Setup
--  Run once:  mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS zoyeria
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE zoyeria;

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  phone      VARCHAR(20)   DEFAULT NULL,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200)  NOT NULL,
  description TEXT,
  meta        VARCHAR(255),
  badge       VARCHAR(50)   DEFAULT NULL,
  image_url   VARCHAR(500),
  price       DECIMAL(10,2) DEFAULT NULL,
  stock       INT           DEFAULT 1,
  is_active   TINYINT(1)    DEFAULT 1,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inquiries (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           DEFAULT NULL,
  product_id   INT           DEFAULT NULL,
  product_name VARCHAR(200),
  message      TEXT,
  phone        VARCHAR(20),
  status       ENUM('pending','replied','closed') DEFAULT 'pending',
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
