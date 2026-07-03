-- Ethiopian attendance workflow migration

-- Add new enum value for lunch return missing
ALTER TABLE `attendances` MODIFY `morning_status` ENUM('PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'LUNCH_MISSING') NULL;
ALTER TABLE `attendances` MODIFY `afternoon_status` ENUM('PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'LUNCH_MISSING') NULL;

-- Rename punch columns
ALTER TABLE `attendances` CHANGE `morning_check_in` `morning_in` DATETIME(3) NULL;
ALTER TABLE `attendances` CHANGE `morning_check_out` `lunch_out` DATETIME(3) NULL;
ALTER TABLE `attendances` CHANGE `afternoon_check_in` `lunch_return` DATETIME(3) NULL;
ALTER TABLE `attendances` CHANGE `afternoon_check_out` `final_out` DATETIME(3) NULL;
ALTER TABLE `attendances` CHANGE `check_in_ip` `ip_address` VARCHAR(191) NULL;

-- Add consolidated status and Ethiopian date
ALTER TABLE `attendances` ADD COLUMN `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'LUNCH_MISSING') NULL AFTER `final_out`;
ALTER TABLE `attendances` ADD COLUMN `ethiopian_date` VARCHAR(10) NOT NULL DEFAULT '' AFTER `date`;

-- Migrate existing status into single status column
UPDATE `attendances`
SET `status` = COALESCE(`morning_status`, `afternoon_status`)
WHERE `status` IS NULL;

-- Drop old per-session status columns
ALTER TABLE `attendances` DROP COLUMN `morning_status`;
ALTER TABLE `attendances` DROP COLUMN `afternoon_status`;

-- Rebuild indexes for renamed IP column
DROP INDEX `attendances_check_in_ip_date_idx` ON `attendances`;
CREATE INDEX `attendances_ip_address_date_idx` ON `attendances`(`ip_address`, `date`);
CREATE INDEX `attendances_ethiopian_date_idx` ON `attendances`(`ethiopian_date`);
