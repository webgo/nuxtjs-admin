-- CreateTable
CREATE TABLE `sys_file` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NOT NULL,
    `storage_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `file_type` VARCHAR(100) NULL,
    `extension` VARCHAR(20) NULL,
    `module` VARCHAR(50) NULL,
    `upload_by` INTEGER NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `storage_type` VARCHAR(20) NOT NULL DEFAULT 'local',
    `remark` VARCHAR(500) NULL,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sys_file_storage_name_key`(`storage_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
