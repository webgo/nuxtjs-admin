-- CreateTable
CREATE TABLE `sys_merchant_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `icon` VARCHAR(255) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_merchant_category_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_merchant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `logo` VARCHAR(500) NULL,
    `cover_image` VARCHAR(500) NULL,
    `category_id` INTEGER NOT NULL,
    `contact_name` VARCHAR(50) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `level` INTEGER NOT NULL DEFAULT 0,
    `tags` TEXT NULL,
    `delivery_fee` DECIMAL(10, 2) NULL,
    `min_order_amount` DECIMAL(10, 2) NULL,
    `estimated_delivery_time` INTEGER NULL,
    `open_time` VARCHAR(10) NULL,
    `close_time` VARCHAR(10) NULL,
    `rating` DECIMAL(2, 1) NULL,
    `rating_count` INTEGER NULL,
    `monthly_sales` INTEGER NULL,
    `is_featured` INTEGER NOT NULL DEFAULT 0,
    `is_new` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(500) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_merchant_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_product_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `merchant_id` INTEGER NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `category_id` INTEGER NULL,
    `merchant_id` INTEGER NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sales` INTEGER NOT NULL DEFAULT 0,
    `unit` VARCHAR(10) NULL,
    `is_recommended` INTEGER NOT NULL DEFAULT 0,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(500) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_product_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_product_spec` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `original_price` DECIMAL(10, 2) NULL,
    `is_default` INTEGER NOT NULL DEFAULT 0,
    `stock` INTEGER NULL DEFAULT 0,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_no` VARCHAR(30) NOT NULL,
    `merchant_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `delivery_fee` DECIMAL(10, 2) NULL,
    `service_fee` DECIMAL(10, 2) NULL,
    `delivery_type` VARCHAR(10) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `delivery_address` VARCHAR(255) NULL,
    `contact_name` VARCHAR(50) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `remark` VARCHAR(500) NULL,
    `payment_method` VARCHAR(20) NULL,
    `payment_time` DATETIME(3) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_order_order_no_key`(`order_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_order_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `product_name` VARCHAR(100) NOT NULL,
    `product_image` VARCHAR(500) NULL,
    `spec_name` VARCHAR(50) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_rating` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `merchant_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `rating` INTEGER NOT NULL,
    `content` TEXT NULL,
    `images` TEXT NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sys_rating_order_id_key`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_cart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `merchant_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `spec_name` VARCHAR(50) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_merchant` ADD CONSTRAINT `sys_merchant_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `sys_merchant_category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_product_category` ADD CONSTRAINT `sys_product_category_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `sys_merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_product` ADD CONSTRAINT `sys_product_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `sys_product_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_product` ADD CONSTRAINT `sys_product_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `sys_merchant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_product_spec` ADD CONSTRAINT `sys_product_spec_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `sys_product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_order` ADD CONSTRAINT `sys_order_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `sys_merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_order_item` ADD CONSTRAINT `sys_order_item_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `sys_order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_order_item` ADD CONSTRAINT `sys_order_item_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `sys_product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_rating` ADD CONSTRAINT `sys_rating_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `sys_merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_rating` ADD CONSTRAINT `sys_rating_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `sys_product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_cart` ADD CONSTRAINT `sys_cart_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `sys_merchant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_cart` ADD CONSTRAINT `sys_cart_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `sys_product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
