-- CreateTable
CREATE TABLE `sys_language` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `remark` VARCHAR(500) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_language_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_translation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namespace` VARCHAR(50) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `locale` VARCHAR(10) NOT NULL,
    `value` VARCHAR(2000) NOT NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    INDEX `sys_translation_locale_idx`(`locale`),
    INDEX `sys_translation_namespace_idx`(`namespace`),
    UNIQUE INDEX `sys_translation_namespace_key_locale_key`(`namespace`, `key`, `locale`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_translation` ADD CONSTRAINT `sys_translation_locale_fkey` FOREIGN KEY (`locale`) REFERENCES `sys_language`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;
