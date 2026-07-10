-- AlterTable
ALTER TABLE `sys_merchant` ADD COLUMN `region_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `sys_region` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `nameTw` VARCHAR(100) NULL,
    `nameEn` VARCHAR(100) NULL,
    `nameJp` VARCHAR(100) NULL,
    `level` INTEGER NOT NULL,
    `parent_id` INTEGER NULL,
    `lang` VARCHAR(5) NOT NULL DEFAULT 'tw',
    `lng` DOUBLE NULL,
    `lat` DOUBLE NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_region` ADD CONSTRAINT `sys_region_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `sys_region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_merchant` ADD CONSTRAINT `sys_merchant_region_id_fkey` FOREIGN KEY (`region_id`) REFERENCES `sys_region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
