-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: kliente_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('owner','admin','cashier') NOT NULL DEFAULT 'admin',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0,
  `security_pin_hash` varchar(255) DEFAULT NULL,
  `pin_must_change` tinyint(1) NOT NULL DEFAULT 0,
  `last_password_change_at` timestamp NULL DEFAULT NULL,
  `pin_failed_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_by_pin` tinyint(1) NOT NULL DEFAULT 0,
  `locked_at` timestamp NULL DEFAULT NULL,
  `locked_reason` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_users_email` (`email`),
  KEY `idx_admin_users_business_id` (`business_id`),
  CONSTRAINT `fk_admin_users_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,1,'Administrador','admin@kliente.cl','$2a$12$01zrA.unP90fBEIjQk23LuNdjd1XO2Us6vuTjo296wSMk2JECTlye','owner',1,'2026-05-12 02:57:16','2026-06-04 03:46:50',0,'$2a$12$iFYrvqbsRs4EiKOhq7PoFeU96kvHs5EOtIUURypsiTmg/tifw7StK',0,'2026-06-04 03:46:38',0,0,NULL,NULL),(2,2,'luis','lslubricantes@gmail.com','$2a$10$iFOdL9TGwMgx4OpKFwDFP.pSZJp3aNGb2JcL/E1Mixwfek7uvXqpi','admin',1,'2026-06-03 03:21:45',NULL,1,NULL,1,NULL,0,0,NULL,NULL);
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `businesses`
--

DROP TABLE IF EXISTS `businesses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `businesses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(120) DEFAULT NULL,
  `rut` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('active','suspended','cancelled') NOT NULL DEFAULT 'active',
  `plan_name` varchar(80) DEFAULT NULL,
  `payment_status` enum('paid','pending','overdue') NOT NULL DEFAULT 'paid',
  `activated_at` date DEFAULT NULL,
  `paid_until` date DEFAULT NULL,
  `suspended_at` timestamp NULL DEFAULT NULL,
  `suspended_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `businesses`
--

LOCK TABLES `businesses` WRITE;
/*!40000 ALTER TABLE `businesses` DISABLE KEYS */;
INSERT INTO `businesses` VALUES (1,'kliente','demo','76.000.000-0','las golondrinas 8887','+56912345678','demo@kliente.cl',NULL,1,'active','Mensual','paid','2026-06-03','2026-07-03',NULL,NULL,'2026-05-12 02:18:21','2026-06-04 03:45:48'),(2,'lubricantesls','lubricantesls',NULL,NULL,NULL,NULL,NULL,1,'active','Anual','paid','2026-06-02','2027-06-02',NULL,NULL,'2026-06-03 03:21:45',NULL);
/*!40000 ALTER TABLE `businesses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contest_products`
--

DROP TABLE IF EXISTS `contest_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contest_products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contest_id` int(11) NOT NULL,
  `name` varchar(160) NOT NULL,
  `sku` varchar(80) DEFAULT NULL,
  `unit` enum('unit','kg') NOT NULL DEFAULT 'unit',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_contest_products_contest_id` (`contest_id`),
  CONSTRAINT `fk_contest_products_contest` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contest_products`
--

LOCK TABLES `contest_products` WRITE;
/*!40000 ALTER TABLE `contest_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `contest_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contests`
--

DROP TABLE IF EXISTS `contests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `title` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `prize_title` varchar(180) NOT NULL,
  `prize_description` text DEFAULT NULL,
  `contest_period` enum('weekly','biweekly','monthly','custom') NOT NULL DEFAULT 'monthly',
  `product_name` varchar(160) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `minimum_purchase_amount` int(11) NOT NULL DEFAULT 0,
  `minimum_purchase_kg` decimal(10,2) NOT NULL DEFAULT 0.00,
  `points_per_purchase` int(11) NOT NULL DEFAULT 1,
  `target_points` int(11) NOT NULL DEFAULT 0,
  `status` enum('draft','active','finished','cancelled') NOT NULL DEFAULT 'draft',
  `winner_selected` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_contests_business_id` (`business_id`),
  KEY `idx_contests_status` (`status`),
  KEY `idx_contests_dates` (`start_date`,`end_date`),
  CONSTRAINT `fk_contests_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contests`
--

LOCK TABLES `contests` WRITE;
/*!40000 ALTER TABLE `contests` DISABLE KEYS */;
INSERT INTO `contests` VALUES (1,1,'concursa por un smartv','por la compra de leche 1l concursa por un smartv','un smartv32','Premio principal para cliente ganador del mes.','weekly','leche','2026-05-01 00:00:00','2026-05-17 18:22:00',0,100.00,1,100,'finished',1,'2026-05-12 02:18:21','2026-05-17 22:24:53'),(2,1,'concursa por una juguera','por la compra de bandeja de huevos concursa por un smartv','juguera','Premio principal para cliente ganador del mes.','monthly','bandeja huevos','2026-05-17 19:05:00','2026-06-16 19:42:00',0,100.00,10,200,'finished',0,'2026-05-17 23:05:46','2026-05-17 23:43:24'),(3,1,'concursa por una juguera','por la compra de bandeja de huevos concursa por un smartv','juguera','Premio principal para cliente ganador del mes.','monthly','bandeja huevos','2026-05-17 19:43:00','2026-06-16 19:43:00',0,100.00,10,200,'active',0,'2026-05-17 23:43:24','2026-05-17 23:43:24');
/*!40000 ALTER TABLE `contests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `name` varchar(140) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `rut` varchar(20) DEFAULT NULL,
  `total_points` int(11) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_customers_business_id` (`business_id`),
  KEY `idx_customers_total_points` (`total_points`),
  KEY `idx_customers_phone` (`phone`),
  CONSTRAINT `fk_customers_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,1,'Juan P├®rez','+56911111111',NULL,NULL,125,NULL,1,'2026-05-12 02:18:21',NULL),(2,1,'Mar├¡a Gonz├ílez','+56922222222',NULL,NULL,110,NULL,1,'2026-05-12 02:18:21',NULL),(3,1,'Pedro Soto','+56933333333',NULL,NULL,95,NULL,1,'2026-05-12 02:18:21',NULL),(4,1,'Camila Rojas','+56944444444',NULL,NULL,88,NULL,1,'2026-05-12 02:18:21',NULL),(5,1,'Luis Herrera','+56955555555',NULL,NULL,81,NULL,1,'2026-05-12 02:18:21',NULL),(6,1,'Ana Torres','+56966666666',NULL,NULL,74,NULL,1,'2026-05-12 02:18:21',NULL),(7,1,'Diego Mu├▒oz','+56977777777',NULL,NULL,69,NULL,1,'2026-05-12 02:18:21',NULL),(8,1,'Sof├¡a Vera','+56988888888',NULL,NULL,63,NULL,1,'2026-05-12 02:18:21',NULL),(9,1,'Carlos D├¡az','+56999999999',NULL,NULL,55,NULL,1,'2026-05-12 02:18:21',NULL),(10,1,'Valentina Silva','+56910101010',NULL,NULL,49,NULL,1,'2026-05-12 02:18:21',NULL),(11,1,'Juan P├®rez','+56911111111',NULL,NULL,125,NULL,1,'2026-05-12 02:20:56',NULL),(12,1,'Mar├¡a Gonz├ílez','+56922222222',NULL,NULL,110,NULL,1,'2026-05-12 02:20:56',NULL),(13,1,'Pedro Soto','+56933333333',NULL,NULL,95,NULL,1,'2026-05-12 02:20:56',NULL),(14,1,'Camila Rojas','+56944444444',NULL,NULL,88,NULL,1,'2026-05-12 02:20:56',NULL),(15,1,'Luis Herrera','+56955555555',NULL,NULL,81,NULL,1,'2026-05-12 02:20:56',NULL),(16,1,'Ana Torres','+56966666666',NULL,NULL,74,NULL,1,'2026-05-12 02:20:56',NULL),(17,1,'Diego Mu├▒oz','+56977777777',NULL,NULL,69,NULL,1,'2026-05-12 02:20:56',NULL),(18,1,'Sof├¡a Vera','+56988888888',NULL,NULL,63,NULL,1,'2026-05-12 02:20:56',NULL),(19,1,'Carlos D├¡az','+56999999999',NULL,NULL,55,NULL,1,'2026-05-12 02:20:56',NULL),(20,1,'Valentina Silva','+56910101010',NULL,NULL,49,NULL,1,'2026-05-12 02:20:56',NULL),(21,1,'MICHEL CONTRERAS',NULL,NULL,'16068254k',111,NULL,1,'2026-05-17 22:23:59','2026-05-17 23:58:36');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_business_payments`
--

DROP TABLE IF EXISTS `master_business_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_business_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `plan_name` varchar(80) NOT NULL,
  `payment_date` date NOT NULL,
  `paid_until` date NOT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_business_payments_business_id` (`business_id`),
  CONSTRAINT `fk_master_business_payments_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_business_payments`
--

LOCK TABLES `master_business_payments` WRITE;
/*!40000 ALTER TABLE `master_business_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `master_business_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `master_support_users`
--

DROP TABLE IF EXISTS `master_support_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `master_support_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(180) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `security_pin_hash` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `master_support_users`
--

LOCK TABLES `master_support_users` WRITE;
/*!40000 ALTER TABLE `master_support_users` DISABLE KEYS */;
INSERT INTO `master_support_users` VALUES (2,'Mitnick Connect','mitnick','$2a$12$t1gv/LiBOu.vgzv4aYY9R.eA9yTrs9ZyxUeLjjTG4y7zTGKHV9E5y','$2a$12$t5U0nC3ehr4tlDNqKHBMeOXgq4DDNx7JnMydFtI5YVerG9idnKKwG',1,'2026-05-18 02:44:25','2026-05-18 02:46:39');
/*!40000 ALTER TABLE `master_support_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promotions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `title` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `tag` varchar(80) DEFAULT NULL,
  `priority` int(11) NOT NULL DEFAULT 1,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_promotions_business_id` (`business_id`),
  KEY `idx_promotions_active` (`active`),
  KEY `idx_promotions_priority` (`priority`),
  CONSTRAINT `fk_promotions_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
INSERT INTO `promotions` VALUES (1,1,'2x1 en hallullas todos los lunes','Promoci├│n v├ílida durante todo el d├¡a lunes.','Promo 1',1,1,NULL,NULL,'2026-05-12 02:18:21','2026-05-12 03:32:23'),(2,1,'Marraquetas con descuento desde las 18:00 hrs','Descuento especial en productos seleccionados.','Promo 2',3,1,NULL,NULL,'2026-05-12 02:18:21','2026-05-12 03:32:23'),(3,1,'Compra sobre $5.000 y suma doble puntaje','Acumula m├ís puntos para participar en el sorteo.','Promo 3',5,1,NULL,NULL,'2026-05-12 02:18:21','2026-05-12 03:32:23'),(4,1,'Pan amasado especial de fin de semana','Disponible s├íbado y domingo hasta agotar stock.','Promo 4',4,1,NULL,NULL,'2026-05-12 02:18:21',NULL),(5,1,'Promoci├│n familiar: lleva m├ís y paga menos','Pack familiar disponible en caja.','Promo 5',5,1,NULL,NULL,'2026-05-12 02:18:21',NULL),(6,1,'2x1 en hallullas todos los lunes','Promoci├│n v├ílida durante todo el d├¡a lunes.','Promo 1',2,1,NULL,NULL,'2026-05-12 02:20:56','2026-05-12 03:32:23'),(7,1,'Marraquetas con descuento desde las 18:00 hrs','Descuento especial en productos seleccionados.','Promo 2',4,1,NULL,NULL,'2026-05-12 02:20:56','2026-05-12 03:32:23'),(8,1,'Compra sobre $5.000 y suma doble puntaje','Acumula m├ís puntos para participar en el sorteo.','Promo 3',3,1,NULL,NULL,'2026-05-12 02:20:56',NULL),(9,1,'Pan amasado especial de fin de semana','Disponible s├íbado y domingo hasta agotar stock.','Promo 4',4,1,NULL,NULL,'2026-05-12 02:20:56',NULL),(10,1,'Promoci├│n familiar: lleva m├ís y paga menos','Pack familiar disponible en caja.','Promo 5',5,1,NULL,NULL,'2026-05-12 02:20:56',NULL);
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_page_visits`
--

DROP TABLE IF EXISTS `public_page_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `public_page_visits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `visitor_key` varchar(120) DEFAULT NULL,
  `ip_address` varchar(80) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `visited_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_public_page_visits_business_id` (`business_id`),
  KEY `idx_public_page_visits_visited_at` (`visited_at`),
  CONSTRAINT `fk_public_page_visits_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_page_visits`
--

LOCK TABLES `public_page_visits` WRITE;
/*!40000 ALTER TABLE `public_page_visits` DISABLE KEYS */;
INSERT INTO `public_page_visits` VALUES (1,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 00:59:28'),(2,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 00:59:28'),(3,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 01:04:45'),(4,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 01:04:45'),(5,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 01:07:37'),(6,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 01:07:37'),(7,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 01:10:54'),(8,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 01:10:54'),(9,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 01:20:56'),(10,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 01:20:57'),(11,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 02:12:25'),(12,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 02:12:25'),(13,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 02:54:10'),(14,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-16 02:54:10'),(15,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 21:54:31'),(16,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 21:54:31'),(17,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:00:04'),(18,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:00:04'),(19,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:04:51'),(20,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:04:51'),(21,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:06:07'),(22,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:06:07'),(23,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:20:53'),(24,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:20:53'),(25,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:25:08'),(26,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:25:08'),(27,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:35:28'),(28,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:35:28'),(29,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:38:05'),(30,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:38:05'),(31,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:44:09'),(32,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:44:09'),(33,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:50:43'),(34,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:50:43'),(35,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:50:52'),(36,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 22:50:52'),(37,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:05:55'),(38,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:05:55'),(39,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:09:39'),(40,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:09:39'),(41,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:09:45'),(42,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:09:45'),(43,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:18:14'),(44,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:18:14'),(45,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:21:59'),(46,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:21:59'),(47,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:27:49'),(48,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:27:50'),(49,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:29:15'),(50,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:29:15'),(51,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:29:22'),(52,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:29:22'),(53,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:30:51'),(54,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:30:51'),(55,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:43:32'),(56,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:43:32'),(57,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:43:39'),(58,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:43:39'),(59,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:51:59'),(60,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:51:59'),(61,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:52:21'),(62,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:52:21'),(63,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:55:31'),(64,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:55:31'),(65,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:58:42'),(66,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-17 23:58:42'),(67,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:01:39'),(68,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:01:39'),(69,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:07:33'),(70,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:07:33'),(71,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:18:24'),(72,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:18:24'),(73,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:24:13'),(74,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:24:13'),(75,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:26:32'),(76,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:26:32'),(77,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:33:21'),(78,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:33:21'),(79,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:46:12'),(80,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 00:46:12'),(81,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36','2026-05-18 00:47:13'),(82,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36','2026-05-18 00:47:13'),(83,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 01:10:43'),(84,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 01:10:43'),(85,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 01:21:55'),(86,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 01:21:55'),(87,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 01:33:00'),(88,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 01:33:00'),(89,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 01:34:32'),(90,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 01:34:32'),(91,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 03:04:58'),(92,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-18 03:04:58'),(93,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 01:37:00'),(94,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 01:37:00'),(95,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 01:41:19'),(96,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 01:41:19'),(97,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 01:50:27'),(98,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 01:55:53'),(99,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 02:01:08'),(100,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 02:06:22'),(101,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 02:16:17'),(102,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-05-23 02:27:45'),(103,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-03 01:13:24'),(104,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-03 01:21:40'),(105,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-03 01:27:31'),(106,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::ffff:127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-03 01:33:10'),(107,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-03 01:35:56'),(108,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-03 03:24:04'),(109,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-04 03:45:57'),(110,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-04 04:24:15'),(111,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-04 04:56:38'),(112,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-04 04:58:13'),(113,1,'3026103f-5ea8-4267-86d9-77dbe9539888','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','2026-06-04 05:12:27');
/*!40000 ALTER TABLE `public_page_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_items`
--

DROP TABLE IF EXISTS `purchase_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_id` int(11) NOT NULL,
  `product_name` varchar(160) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unit` enum('unit','kg') NOT NULL DEFAULT 'unit',
  `unit_price` int(11) NOT NULL DEFAULT 0,
  `subtotal` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_purchase_items_purchase_id` (`purchase_id`),
  CONSTRAINT `fk_purchase_items_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_items`
--

LOCK TABLES `purchase_items` WRITE;
/*!40000 ALTER TABLE `purchase_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchases`
--

DROP TABLE IF EXISTS `purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `contest_id` int(11) DEFAULT NULL,
  `total_amount` int(11) NOT NULL DEFAULT 0,
  `total_kg` decimal(10,2) NOT NULL DEFAULT 0.00,
  `points_generated` int(11) NOT NULL DEFAULT 0,
  `manual_points` int(11) NOT NULL DEFAULT 0,
  `ticket_number` varchar(80) DEFAULT NULL,
  `product_name` varchar(160) DEFAULT NULL,
  `purchase_date` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_purchases_business_id` (`business_id`),
  KEY `idx_purchases_customer_id` (`customer_id`),
  KEY `idx_purchases_contest_id` (`contest_id`),
  KEY `idx_purchases_date` (`purchase_date`),
  CONSTRAINT `fk_purchases_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchases_contest` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_purchases_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchases`
--

LOCK TABLES `purchases` WRITE;
/*!40000 ALTER TABLE `purchases` DISABLE KEYS */;
INSERT INTO `purchases` VALUES (1,1,21,1,0,0.00,100,100,'1568544','leche','2026-05-17 18:24:27','2026-05-17 22:24:27','2026-05-17 23:57:35'),(2,1,21,1,0,100.00,1,1,'123456789','leche','2026-05-17 18:24:59','2026-05-17 22:24:59','2026-05-17 23:57:35'),(3,1,21,3,10000,2.00,10,0,'2589631','bandeja huevos','2026-05-17 19:58:36','2026-05-17 23:58:36','2026-05-17 23:58:36');
/*!40000 ALTER TABLE `purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_links`
--

DROP TABLE IF EXISTS `social_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `social_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `name` varchar(80) NOT NULL,
  `label` varchar(80) DEFAULT NULL,
  `url` varchar(500) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_social_links_business_id` (`business_id`),
  KEY `idx_social_links_active` (`active`),
  KEY `idx_social_links_sort_order` (`sort_order`),
  CONSTRAINT `fk_social_links_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_links`
--

LOCK TABLES `social_links` WRITE;
/*!40000 ALTER TABLE `social_links` DISABLE KEYS */;
INSERT INTO `social_links` VALUES (1,1,'WhatsApp','Escanea','https://wa.me/56912345678',1,1,'2026-05-12 02:18:21','2026-05-12 03:31:42'),(2,1,'Instagram','S├¡guenos','https://instagram.com/tu_negocio',1,3,'2026-05-12 02:18:21','2026-05-12 03:31:42'),(3,1,'Facebook','Vis├¡tanos','https://facebook.com/tu_negocio',1,3,'2026-05-12 02:18:21',NULL),(4,1,'WhatsApp','Escanea','https://wa.me/56912345999',1,2,'2026-05-12 02:20:56','2026-05-12 03:31:42'),(5,1,'Instagram','S├¡guenos','https://instagram.com/tu_negocio',1,2,'2026-05-12 02:20:56',NULL),(6,1,'Facebook','Vis├¡tanos','https://facebook.com/tu_negocio',1,3,'2026-05-12 02:20:56',NULL);
/*!40000 ALTER TABLE `social_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_audit_logs`
--

DROP TABLE IF EXISTS `support_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `master_user_id` int(11) NOT NULL,
  `business_id` int(11) DEFAULT NULL,
  `admin_user_id` int(11) DEFAULT NULL,
  `action` varchar(120) NOT NULL,
  `detail` text DEFAULT NULL,
  `ip_address` varchar(80) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_support_audit_master_user_id` (`master_user_id`),
  KEY `idx_support_audit_business_id` (`business_id`),
  KEY `idx_support_audit_admin_user_id` (`admin_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_audit_logs`
--

LOCK TABLES `support_audit_logs` WRITE;
/*!40000 ALTER TABLE `support_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `winners`
--

DROP TABLE IF EXISTS `winners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `winners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_id` int(11) NOT NULL,
  `contest_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(160) NOT NULL DEFAULT '',
  `customer_rut` varchar(30) DEFAULT NULL,
  `total_points` int(11) NOT NULL DEFAULT 0,
  `draw_reason` enum('auto_end_date','auto_target_points','manual') NOT NULL DEFAULT 'manual',
  `total_points_at_draw` int(11) NOT NULL DEFAULT 0,
  `selected_at` datetime NOT NULL DEFAULT current_timestamp(),
  `selection_method` enum('automatic','manual') NOT NULL DEFAULT 'automatic',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_winners_contest_id` (`contest_id`),
  KEY `idx_winners_business_id` (`business_id`),
  KEY `idx_winners_customer_id` (`customer_id`),
  CONSTRAINT `fk_winners_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_winners_contest` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_winners_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `winners`
--

LOCK TABLES `winners` WRITE;
/*!40000 ALTER TABLE `winners` DISABLE KEYS */;
INSERT INTO `winners` VALUES (1,1,1,21,'MICHEL CONTRERAS','16068254k',100,'auto_end_date',0,'2026-05-17 18:24:53','automatic',NULL,'2026-05-17 22:24:53');
/*!40000 ALTER TABLE `winners` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-08 13:20:17
