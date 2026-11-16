-- ============================================================
-- Xenotrack Institute Management System
-- MySQL Complete Database Setup (Schema + Initial Seed)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create Database
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS xenotrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE xenotrack;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ------------------------------------------------------------
-- 2. Drop existing tables if re-running
-- ------------------------------------------------------------
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS payment_reversals;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS fee_records;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS group_staff_assignments;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS fee_plans;
DROP TABLE IF EXISTS staff_profiles;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS institute_settings;
DROP TABLE IF EXISTS gender_options;
DROP TABLE IF EXISTS institutes;

-- ------------------------------------------------------------
-- 3. Table Definitions
-- ------------------------------------------------------------

-- 3.1 institutes
CREATE TABLE institutes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  logo_url      VARCHAR(500),
  address       TEXT,
  phone         VARCHAR(20),
  email         VARCHAR(150),
  timezone      VARCHAR(60)  NOT NULL DEFAULT 'Asia/Kolkata',
  currency      VARCHAR(10)  NOT NULL DEFAULT 'INR',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.2 users
CREATE TABLE users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id    INT UNSIGNED NOT NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  full_name       VARCHAR(150) NOT NULL,
  phone           VARCHAR(20),
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  last_login      DATETIME,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_email_institute (institute_id, email),
  CONSTRAINT fk_users_institute FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.3 refresh_tokens
CREATE TABLE refresh_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_refresh_token (token_hash),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.4 staff_profiles
CREATE TABLE staff_profiles (
  id                            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id                       INT UNSIGNED NOT NULL,
  institute_id                  INT UNSIGNED NOT NULL,
  staff_code                    VARCHAR(30)  NOT NULL,
  designation                   VARCHAR(100),
  joining_date                  DATE,
  can_collect_fees              TINYINT(1)   NOT NULL DEFAULT 0,
  can_edit_attendance           TINYINT(1)   NOT NULL DEFAULT 1,
  attendance_edit_window_hours  INT UNSIGNED NOT NULL DEFAULT 24,
  status                        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  notes                         TEXT,
  created_at                    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_staff_code_institute (institute_id, staff_code),
  UNIQUE KEY uq_staff_user (user_id),
  CONSTRAINT fk_sp_user        FOREIGN KEY (user_id)       REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_sp_institute   FOREIGN KEY (institute_id)  REFERENCES institutes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.5 fee_plans
CREATE TABLE fee_plans (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id          INT UNSIGNED NOT NULL,
  name                  VARCHAR(150) NOT NULL,
  description           TEXT,
  amount                DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  frequency             ENUM('one_time','weekly','monthly','quarterly','half_yearly','yearly','custom') NOT NULL DEFAULT 'monthly',
  due_day               TINYINT UNSIGNED,
  late_fee_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  late_fee_after_days   INT UNSIGNED  NOT NULL DEFAULT 0,
  discount_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_type         ENUM('flat','percentage') NOT NULL DEFAULT 'flat',
  status                ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fp_institute FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.6 programs
CREATE TABLE programs (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id        INT UNSIGNED NOT NULL,
  name                VARCHAR(150) NOT NULL,
  description         TEXT,
  program_type        VARCHAR(100),
  default_fee_plan_id INT UNSIGNED,
  status              ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prog_institute FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_prog_fee_plan  FOREIGN KEY (default_fee_plan_id) REFERENCES fee_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.7 `groups`
CREATE TABLE `groups` (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id    INT UNSIGNED NOT NULL,
  program_id      INT UNSIGNED NOT NULL,
  name            VARCHAR(150) NOT NULL,
  start_date      DATE,
  end_date        DATE,
  scheduled_days  JSON,
  start_time      TIME,
  end_time        TIME,
  capacity        SMALLINT UNSIGNED,
  status          ENUM('active','inactive','completed') NOT NULL DEFAULT 'active',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_grp_institute FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_grp_program   FOREIGN KEY (program_id)   REFERENCES programs(id)   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.8 group_staff_assignments
CREATE TABLE group_staff_assignments (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_id         INT UNSIGNED NOT NULL,
  staff_profile_id INT UNSIGNED NOT NULL,
  is_primary       TINYINT(1)   NOT NULL DEFAULT 0,
  assigned_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_gsa (group_id, staff_profile_id),
  CONSTRAINT fk_gsa_group FOREIGN KEY (group_id)         REFERENCES `groups`(id)      ON DELETE CASCADE,
  CONSTRAINT fk_gsa_staff FOREIGN KEY (staff_profile_id) REFERENCES staff_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.9 members
CREATE TABLE members (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id      INT UNSIGNED NOT NULL,
  member_code       VARCHAR(30)  NOT NULL,
  full_name         VARCHAR(150) NOT NULL,
  phone             VARCHAR(20),
  email             VARCHAR(150),
  dob               DATE,
  gender            VARCHAR(50),
  address           TEXT,
  emergency_contact VARCHAR(200),
  profile_photo     VARCHAR(500),
  registration_date DATE         NOT NULL DEFAULT (CURRENT_DATE),
  status            ENUM('active','inactive','suspended','completed') NOT NULL DEFAULT 'active',
  notes             TEXT,
  created_by        INT UNSIGNED,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_member_code_institute (institute_id, member_code),
  INDEX idx_member_name  (full_name),
  INDEX idx_member_phone (phone),
  CONSTRAINT fk_mem_institute  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_mem_created_by FOREIGN KEY (created_by)   REFERENCES users(id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.10 enrollments
CREATE TABLE enrollments (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id INT UNSIGNED NOT NULL,
  member_id    INT UNSIGNED NOT NULL,
  program_id   INT UNSIGNED NOT NULL,
  group_id     INT UNSIGNED,
  fee_plan_id  INT UNSIGNED,
  enrolled_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status       ENUM('active','completed','dropped') NOT NULL DEFAULT 'active',
  notes        TEXT,
  UNIQUE KEY uq_enrollment (member_id, program_id, group_id),
  CONSTRAINT fk_enr_institute FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_enr_member    FOREIGN KEY (member_id)    REFERENCES members(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_enr_program   FOREIGN KEY (program_id)   REFERENCES programs(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_enr_group     FOREIGN KEY (group_id)     REFERENCES `groups`(id)   ON DELETE SET NULL,
  CONSTRAINT fk_enr_fee_plan  FOREIGN KEY (fee_plan_id)  REFERENCES fee_plans(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.11 fee_records
CREATE TABLE fee_records (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id          INT UNSIGNED  NOT NULL,
  member_id             INT UNSIGNED  NOT NULL,
  enrollment_id         INT UNSIGNED,
  fee_plan_id           INT UNSIGNED,
  billing_period_label  VARCHAR(100),
  original_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  late_fee_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  final_amount          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  amount_paid           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  outstanding_balance   DECIMAL(12,2) GENERATED ALWAYS AS (final_amount - amount_paid) STORED,
  due_date              DATE,
  status                ENUM('unpaid','partially_paid','paid','overdue','waived') NOT NULL DEFAULT 'unpaid',
  notes                 TEXT,
  created_by            INT UNSIGNED,
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fr_member   (member_id),
  INDEX idx_fr_due_date (due_date),
  INDEX idx_fr_status   (status),
  CONSTRAINT fk_fr_institute   FOREIGN KEY (institute_id) REFERENCES institutes(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_fr_member      FOREIGN KEY (member_id)    REFERENCES members(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_fr_enrollment  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL,
  CONSTRAINT fk_fr_fee_plan    FOREIGN KEY (fee_plan_id)  REFERENCES fee_plans(id)   ON DELETE SET NULL,
  CONSTRAINT fk_fr_created_by  FOREIGN KEY (created_by)   REFERENCES users(id)       ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.12 payments
CREATE TABLE payments (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id          INT UNSIGNED  NOT NULL,
  fee_record_id         INT UNSIGNED  NOT NULL,
  member_id             INT UNSIGNED  NOT NULL,
  amount                DECIMAL(12,2) NOT NULL,
  payment_method        ENUM('cash','bank_transfer','upi','card','other') NOT NULL DEFAULT 'cash',
  transaction_reference VARCHAR(200),
  receipt_number        VARCHAR(50)   NOT NULL,
  payment_date          DATE          NOT NULL DEFAULT (CURRENT_DATE),
  collected_by          INT UNSIGNED  NOT NULL,
  notes                 TEXT,
  is_reversed           TINYINT(1)    NOT NULL DEFAULT 0,
  created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_receipt_number_institute (institute_id, receipt_number),
  INDEX idx_pay_member      (member_id),
  INDEX idx_pay_date        (payment_date),
  INDEX idx_pay_collected_by (collected_by),
  CONSTRAINT fk_pay_institute     FOREIGN KEY (institute_id)  REFERENCES institutes(id)  ON DELETE RESTRICT,
  CONSTRAINT fk_pay_fee_record    FOREIGN KEY (fee_record_id) REFERENCES fee_records(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pay_member        FOREIGN KEY (member_id)     REFERENCES members(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_pay_collected_by  FOREIGN KEY (collected_by)  REFERENCES users(id)       ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.13 payment_reversals
CREATE TABLE payment_reversals (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_id   INT UNSIGNED NOT NULL,
  reversed_by  INT UNSIGNED NOT NULL,
  reason       TEXT,
  reversed_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pr_payment     FOREIGN KEY (payment_id)  REFERENCES payments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pr_reversed_by FOREIGN KEY (reversed_by) REFERENCES users(id)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.14 attendance_sessions
CREATE TABLE attendance_sessions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id  INT UNSIGNED NOT NULL,
  group_id      INT UNSIGNED NOT NULL,
  session_date  DATE         NOT NULL,
  start_time    TIME,
  end_time      TIME,
  status        ENUM('pending','completed') NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_by    INT UNSIGNED NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_session_group_date (group_id, session_date),
  INDEX idx_as_date (session_date),
  CONSTRAINT fk_as_institute FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_as_group     FOREIGN KEY (group_id)     REFERENCES `groups`(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_as_created_by FOREIGN KEY (created_by)  REFERENCES users(id)      ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.15 attendance_records
CREATE TABLE attendance_records (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id  INT UNSIGNED NOT NULL,
  member_id   INT UNSIGNED NOT NULL,
  status      ENUM('present','absent','late','excused') NOT NULL DEFAULT 'absent',
  note        VARCHAR(255),
  marked_by   INT UNSIGNED NOT NULL,
  marked_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified_by INT UNSIGNED,
  modified_at DATETIME,
  UNIQUE KEY uq_ar_session_member (session_id, member_id),
  INDEX idx_ar_member (member_id),
  CONSTRAINT fk_ar_session     FOREIGN KEY (session_id)  REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_ar_member      FOREIGN KEY (member_id)   REFERENCES members(id)             ON DELETE RESTRICT,
  CONSTRAINT fk_ar_marked_by   FOREIGN KEY (marked_by)   REFERENCES users(id)               ON DELETE RESTRICT,
  CONSTRAINT fk_ar_modified_by FOREIGN KEY (modified_by) REFERENCES users(id)               ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.16 activity_logs
CREATE TABLE activity_logs (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED,
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(60),
  entity_id    INT UNSIGNED,
  old_values   JSON,
  new_values   JSON,
  ip_address   VARCHAR(45),
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_al_user        (user_id),
  INDEX idx_al_entity      (entity_type, entity_id),
  INDEX idx_al_created_at  (created_at),
  CONSTRAINT fk_al_institute FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_al_user      FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.17 institute_settings
CREATE TABLE institute_settings (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id  INT UNSIGNED NOT NULL,
  setting_key   VARCHAR(100) NOT NULL,
  setting_value TEXT,
  updated_by    INT UNSIGNED,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_setting (institute_id, setting_key),
  CONSTRAINT fk_is_institute  FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE,
  CONSTRAINT fk_is_updated_by FOREIGN KEY (updated_by)   REFERENCES users(id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3.18 gender_options
CREATE TABLE gender_options (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  institute_id  INT UNSIGNED NOT NULL,
  name          VARCHAR(100) NOT NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_gender_option_name_institute (institute_id, name),
  CONSTRAINT fk_go_institute FOREIGN KEY (institute_id) REFERENCES institutes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. Initial Seed Data
-- ------------------------------------------------------------

-- 4.1 Demo Institute
INSERT INTO institutes (id, name, address, phone, email, timezone, currency)
VALUES (1, 'Xenotrack Demo Institute', '123 Main Street, City, State 400001', '+91-9000000001', 'admin@xenotrack.com', 'Asia/Kolkata', 'INR');

-- 4.2 Users
-- Admin: admin@xenotrack.com / 12345xeno
INSERT INTO users (id, institute_id, email, password_hash, role, full_name, phone, is_active)
VALUES (1, 1, 'admin@xenotrack.com',
  '12345xeno',
  'admin', 'Super Admin', '+91-9000000001', 1);

-- Staff: staff@xenotrack.local / Staff@1234
INSERT INTO users (id, institute_id, email, password_hash, role, full_name, phone, is_active)
VALUES (2, 1, 'staff@xenotrack.local',
  'Staff@1234',
  'staff', 'Jane Staff', '+91-9000000002', 1);

-- 4.3 Staff Profile
INSERT INTO staff_profiles (id, user_id, institute_id, staff_code, designation, joining_date, can_collect_fees, can_edit_attendance)
VALUES (1, 2, 1, 'STF-001', 'Instructor', '2024-01-01', 1, 1);

-- 4.4 Fee Plans
INSERT INTO fee_plans (id, institute_id, name, description, amount, frequency, due_day, status)
VALUES
  (1, 1, 'Monthly Standard', 'Standard monthly fee plan', 1500.00, 'monthly', 5, 'active'),
  (2, 1, 'Quarterly Plan', 'Quarterly discounted fee', 4000.00, 'quarterly', 5, 'active'),
  (3, 1, 'Annual Plan', 'Annual fee with discount', 15000.00, 'yearly', 5, 'active'),
  (4, 1, 'One-Time Registration', 'One-time registration fee', 500.00, 'one_time', NULL, 'active');

-- 4.5 Programs
INSERT INTO programs (id, institute_id, name, description, program_type, default_fee_plan_id, status)
VALUES
  (1, 1, 'Mathematics Tuition', 'Grade 8-12 Mathematics coaching', 'Academic', 1, 'active'),
  (2, 1, 'Personal Fitness', 'Individual fitness training', 'Fitness', 1, 'active'),
  (3, 1, 'Football Training', 'Youth football coaching', 'Sports', 1, 'active');

-- 4.6 Groups
INSERT INTO `groups` (id, institute_id, program_id, name, start_date, scheduled_days, start_time, end_time, capacity, status)
VALUES
  (1, 1, 1, 'Math Batch A (Morning)', '2024-06-01', '["Mon","Wed","Fri"]', '08:00:00', '09:30:00', 20, 'active'),
  (2, 1, 1, 'Math Batch B (Evening)', '2024-06-01', '["Tue","Thu","Sat"]', '17:00:00', '18:30:00', 20, 'active'),
  (3, 1, 2, 'Fitness Group Morning', '2024-06-01', '["Mon","Tue","Wed","Thu","Fri"]', '06:00:00', '07:00:00', 15, 'active'),
  (4, 1, 3, 'U-16 Football', '2024-06-01', '["Sat","Sun"]', '09:00:00', '11:00:00', 25, 'active');

-- 4.7 Staff Assignments
INSERT INTO group_staff_assignments (group_id, staff_profile_id, is_primary)
VALUES (1, 1, 1), (2, 1, 1), (3, 1, 0);

-- 4.8 Members
INSERT INTO members (id, institute_id, member_code, full_name, phone, email, dob, gender, registration_date, status, created_by)
VALUES
  (1, 1, 'MEM-001', 'Arjun Sharma', '9876543001', 'arjun@example.com', '2008-03-15', 'Male', '2024-06-01', 'active', 1),
  (2, 1, 'MEM-002', 'Priya Patel', '9876543002', 'priya@example.com', '2007-07-22', 'Female', '2024-06-01', 'active', 1),
  (3, 1, 'MEM-003', 'Rahul Singh', '9876543003', NULL, '2009-01-10', 'Male', '2024-06-05', 'active', 1),
  (4, 1, 'MEM-004', 'Anita Desai', '9876543004', 'anita@example.com', '2008-11-30', 'Female', '2024-06-10', 'active', 1),
  (5, 1, 'MEM-005', 'Karan Mehta', '9876543005', NULL, '2009-05-18', 'Male', '2024-06-15', 'active', 1),
  (6, 1, 'MEM-006', 'Sneha Joshi', '9876543006', 'sneha@example.com', '2007-09-08', 'Female', '2024-06-15', 'active', 1),
  (7, 1, 'MEM-007', 'Dev Kumar', '9876543007', NULL, '2010-02-25', 'Male', '2024-07-01', 'inactive', 1),
  (8, 1, 'MEM-008', 'Meera Nair', '9876543008', 'meera@example.com', '2008-06-12', 'Female', '2024-07-05', 'active', 1);

-- 4.9 Enrollments
INSERT INTO enrollments (id, member_id, program_id, group_id, fee_plan_id, institute_id, status)
VALUES
  (1, 1, 1, 1, 1, 1, 'active'),
  (2, 2, 1, 1, 1, 1, 'active'),
  (3, 3, 1, 2, 1, 1, 'active'),
  (4, 4, 1, 2, 1, 1, 'active'),
  (5, 5, 2, 3, 1, 1, 'active'),
  (6, 6, 2, 3, 1, 1, 'active'),
  (7, 3, 4, 1, 1, 1, 'dropped'),
  (8, 8, 3, 4, 1, 1, 'active');

-- 4.10 Fee Records
INSERT INTO fee_records (id, institute_id, member_id, enrollment_id, fee_plan_id, billing_period_label, original_amount, discount_amount, late_fee_amount, final_amount, amount_paid, due_date, status, created_by)
VALUES
  (1, 1, 1, 1, 1, 'Oct 2026', 1500.00, 0, 0, 1500.00, 1500.00, '2026-10-05', 'paid', 1),
  (2, 1, 2, 2, 1, 'Oct 2026', 1500.00, 0, 0, 1500.00, 1000.00, '2026-10-05', 'partially_paid', 1),
  (3, 1, 3, 3, 1, 'Oct 2026', 1500.00, 0, 0, 1500.00, 0.00,    '2026-10-05', 'overdue', 1),
  (4, 1, 4, 4, 1, 'Oct 2026', 1500.00, 100, 0, 1400.00, 0.00,  '2026-10-05', 'unpaid', 1),
  (5, 1, 5, 5, 1, 'Oct 2026', 1500.00, 0, 0, 1500.00, 1500.00, '2026-10-05', 'paid', 1),
  (6, 1, 6, 6, 1, 'Oct 2026', 1500.00, 0, 0, 1500.00, 0.00,    '2026-10-05', 'unpaid', 1),
  (7, 1, 8, 8, 1, 'Oct 2026', 1500.00, 0, 150, 1650.00, 0.00,  '2026-10-05', 'overdue', 1);

-- 4.11 Payments
INSERT INTO payments (id, institute_id, fee_record_id, member_id, amount, payment_method, receipt_number, payment_date, collected_by)
VALUES
  (1, 1, 1, 1, 1500.00, 'cash',          'RCP-2026-000001', '2026-10-02', 1),
  (2, 1, 2, 2, 1000.00, 'upi',           'RCP-2026-000002', '2026-10-03', 1),
  (3, 1, 5, 5, 1500.00, 'bank_transfer', 'RCP-2026-000003', '2026-10-01', 2);

-- 4.12 Settings
INSERT INTO institute_settings (institute_id, setting_key, setting_value)
VALUES
  (1, 'receipt_prefix', 'RCP'),
  (1, 'member_code_prefix', 'MEM'),
  (1, 'staff_code_prefix', 'STF'),
  (1, 'attendance_edit_window_hours', '24'),
  (1, 'financial_year_start_month', '4');

-- 4.13 Gender Options
INSERT INTO gender_options (institute_id, name, status, display_order)
VALUES
  (1, 'Male', 'active', 1),
  (1, 'Female', 'active', 2),
  (1, 'Other', 'active', 3),
  (1, 'Prefer not to say', 'active', 4);

SET FOREIGN_KEY_CHECKS = 1;
