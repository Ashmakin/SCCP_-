-- 供应商与零件关系管理系统完整数据库结构

-- 公司表
CREATE TABLE `companies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE,
    `company_type` ENUM('BUYER', 'SUPPLIER') NOT NULL,
    `city` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 用户表
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(255),
    `is_admin` BOOLEAN NOT NULL DEFAULT FALSE,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 询价单 (RFQ) 表
CREATE TABLE `rfqs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `buyer_company_id` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `quantity` INT NOT NULL,
    `status` ENUM('OPEN', 'CLOSED', 'AWARDED') NOT NULL DEFAULT 'OPEN',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`buyer_company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 报价单 (Quote) 表
CREATE TABLE `quotes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rfq_id` INT NOT NULL,
    `supplier_company_id` INT NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `lead_time_days` INT NOT NULL,
    `notes` TEXT,
    `status` ENUM('SUBMITTED', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`rfq_id`) REFERENCES `rfqs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`supplier_company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 采购订单 (PO) 表
CREATE TABLE `purchase_orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `quote_id` INT NOT NULL UNIQUE,
    `rfq_id` INT NOT NULL,
    `buyer_company_id` INT NOT NULL,
    `supplier_company_id` INT NOT NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PENDING_CONFIRMATION', 'IN_PRODUCTION', 'SHIPPED', 'COMPLETED') NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    `payment_status` ENUM('UNPAID', 'PAID', 'FAILED') NOT NULL DEFAULT 'UNPAID',
    `stripe_session_id` VARCHAR(255) NULL DEFAULT NULL,
    `quality_rating` TINYINT UNSIGNED NULL COMMENT '1-5 star rating',
    `completed_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`),
    FOREIGN KEY (`rfq_id`) REFERENCES `rfqs`(`id`),
    FOREIGN KEY (`buyer_company_id`) REFERENCES `companies`(`id`),
    FOREIGN KEY (`supplier_company_id`) REFERENCES `companies`(`id`)
) ENGINE=InnoDB;

-- RFQ 附件表
CREATE TABLE `rfq_attachments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rfq_id` INT NOT NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `stored_path` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`rfq_id`) REFERENCES `rfqs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 聊天消息表
CREATE TABLE `chat_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `rfq_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `user_full_name` VARCHAR(255) NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `message_text` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`rfq_id`) REFERENCES `rfqs`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 通知表
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `recipient_user_id` INT NOT NULL,
    `message` VARCHAR(255) NOT NULL,
    `link_url` VARCHAR(255) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`recipient_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 能力标签主表
CREATE TABLE `capabilities` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `category` VARCHAR(50) NOT NULL COMMENT '例如: 加工工艺, 认证, 材料'
) ENGINE=InnoDB;

-- 公司与能力关联表
CREATE TABLE `company_capabilities` (
    `company_id` INT NOT NULL,
    `capability_id` INT NOT NULL,
    PRIMARY KEY (`company_id`, `capability_id`),
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`capability_id`) REFERENCES `capabilities`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
