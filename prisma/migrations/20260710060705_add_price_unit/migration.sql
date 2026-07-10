-- AlterTable
ALTER TABLE `sys_product_spec` ADD COLUMN `unit_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `sys_price_unit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `symbol` VARCHAR(10) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_product_spec` ADD CONSTRAINT `sys_product_spec_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `sys_price_unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
