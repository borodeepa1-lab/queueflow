-- =====================================================
-- RESET DATABASE
-- =====================================================

DROP DATABASE IF EXISTS queueflow;

CREATE DATABASE queueflow;

USE queueflow;


-- =====================================================
-- EVENTS TABLE
-- Stores event information (Admission Verification etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255),
    event_type VARCHAR(100),
    start_date DATETIME,
    end_date DATETIME,
    status ENUM('UPCOMING','LIVE','ENDED') DEFAULT 'UPCOMING',
    admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);


-- =====================================================
-- DEPARTMENTS TABLE
-- Stores academic departments
-- =====================================================

CREATE TABLE departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE
);


-- =====================================================
-- REGISTRATIONS TABLE
-- Stores student registration before joining queue
-- =====================================================

CREATE TABLE IF NOT EXISTS registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(255),
    roll_number VARCHAR(100) UNIQUE,
    department_id INT,
    category ENUM('GENERAL','RESERVED','PWD'),
    phone VARCHAR(15),
    event_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);


-- =====================================================
-- SERVICES TABLE
-- Defines available queue services
-- =====================================================

CREATE TABLE services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    token_prefix VARCHAR(5) NOT NULL
);


-- =====================================================
-- COUNTERS TABLE
-- Physical counters where service is provided
-- =====================================================

CREATE TABLE IF NOT EXISTS counters (
    counter_id INT AUTO_INCREMENT PRIMARY KEY,
    counter_name VARCHAR(100),
    service_type VARCHAR(100),
    event_id INT,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);


-- =====================================================
-- STAFF TABLE
-- Staff assigned to counters
-- =====================================================

CREATE TABLE IF NOT EXISTS staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    event_id INT,
    counter_id INT,
    role ENUM('STAFF','ADMIN') DEFAULT 'STAFF',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (counter_id) REFERENCES counters(counter_id)
);


-- =====================================================
-- QUEUE TOKENS TABLE (CORE SYSTEM TABLE)
-- Handles queue generation and processing
-- =====================================================

CREATE TABLE queue_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    token_number VARCHAR(10) UNIQUE,

    registration_id INT,
    event_id INT,
    service_id INT,
    counter_id INT,

    priority_level INT DEFAULT 1,

    status ENUM(
        'WAITING',
        'IN_PROGRESS',
        'COMPLETED',
        'SKIPPED',
        'EXPIRED'
    ) DEFAULT 'WAITING',

    token_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    called_time DATETIME,
    completed_time DATETIME,

    FOREIGN KEY (registration_id)
    REFERENCES registrations(registration_id),

    FOREIGN KEY (event_id)
    REFERENCES events(event_id),

    FOREIGN KEY (service_id)
    REFERENCES services(service_id),

    FOREIGN KEY (counter_id)
    REFERENCES counters(counter_id)
);


-- =====================================================
-- ADMINS TABLE
-- Admin users who manage the system
-- =====================================================

CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('SUPER_ADMIN','STAFF') DEFAULT 'STAFF'
);


-- =====================================================
-- AUDIT LOGS TABLE
-- Records important system actions
-- =====================================================

CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    token_id INT,
    admin_id INT,
    action VARCHAR(100),
    log_time DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (token_id)
    REFERENCES queue_tokens(token_id),

    FOREIGN KEY (admin_id)
    REFERENCES admins(admin_id)
);


-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================


-- Departments

INSERT INTO departments (department_name)
VALUES
('CSE'),
('IT'),
('ECE'),
('ME');


-- Services

INSERT INTO services (service_name, token_prefix)
VALUES
('DOCUMENT_VERIFICATION','N'),
('PWD_ASSISTANCE','P'),
('LOAN_ASSISTANCE','L');


-- Counters

INSERT INTO counters (counter_name, service_id)
VALUES
('Verification Counter 1',1),
('Verification Counter 2',1),
('PWD Assistance Counter',2),
('Loan Desk',3);


-- Admin User

INSERT INTO admins (username,password_hash,role)
VALUES
('admin','admin123','SUPER_ADMIN');


-- Example Event

INSERT INTO events (event_name, event_type, start_date, end_date, status, admin_id)
VALUES ('Admission 2026', 'ADMISSION', NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 'LIVE', 1);
