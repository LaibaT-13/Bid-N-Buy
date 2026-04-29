SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE admin (
    admin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    a_name VARCHAR(255) NOT NULL,
    a_email VARCHAR(255) NOT NULL UNIQUE,
    a_password VARCHAR(255) NOT NULL,
    a_phone VARCHAR(20) NOT NULL,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    department VARCHAR(100),
    INDEX idx_admin_email (a_email),
    INDEX idx_admin_status (status)
);

CREATE TABLE user (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    u_name VARCHAR(255) NOT NULL UNIQUE,
    u_phone VARCHAR(20) NOT NULL,
    u_cus_mail VARCHAR(255) NOT NULL UNIQUE,
    u_password VARCHAR(255) NOT NULL,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role ENUM('BUYER', 'SELLER') DEFAULT 'BUYER',
    status ENUM('ACTIVE', 'WARNED', 'BANNED') DEFAULT 'ACTIVE',
    address TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    warning_reason TEXT,
    banned_date TIMESTAMP NULL,
    warned_date TIMESTAMP NULL,
    banned_by BIGINT NULL,
    warned_by BIGINT NULL,
    reset_otp VARCHAR(10),
    otp_expiry TIMESTAMP NULL,
    INDEX idx_user_email (u_cus_mail),
    INDEX idx_user_name (u_name),
    INDEX idx_user_status (status),
    INDEX idx_user_role (role),
    FOREIGN KEY (banned_by) REFERENCES user(user_id) ON DELETE SET NULL,
    FOREIGN KEY (warned_by) REFERENCES user(user_id) ON DELETE SET NULL
);

CREATE TABLE pending_registrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    u_name VARCHAR(255) NOT NULL,
    u_phone VARCHAR(20) NOT NULL,
    u_cus_mail VARCHAR(255) NOT NULL UNIQUE,
    u_password VARCHAR(255) NOT NULL,
    address TEXT,
    otp VARCHAR(10) NOT NULL,
    otp_expiry TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pending_email (u_cus_mail),
    INDEX idx_pending_otp (otp),
    INDEX idx_pending_expiry (otp_expiry)
);

CREATE TABLE item (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    i_name VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    item_condition ENUM('like-new', 'good', 'fair', 'needs-fixing') DEFAULT 'good',
    location VARCHAR(255),
    post_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    category VARCHAR(100),
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'SOLD', 'UNSOLD') DEFAULT 'PENDING',
    available BOOLEAN DEFAULT TRUE,
    bidding_enabled BOOLEAN DEFAULT FALSE,
    approved_by BIGINT NULL,
    approved_date TIMESTAMP NULL,
    rejection_reason TEXT,
    u_id BIGINT NOT NULL,
    INDEX idx_item_status (status),
    INDEX idx_item_category (category),
    INDEX idx_item_available (available),
    INDEX idx_item_bidding (bidding_enabled),
    INDEX idx_item_post_date (post_date),
    INDEX idx_item_price (price),
    FOREIGN KEY (u_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES admin(admin_id) ON DELETE SET NULL
);

CREATE TABLE auction (
    auction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL UNIQUE,
    starting_bid DECIMAL(10,2) NOT NULL,
    current_highest_bid DECIMAL(10,2),
    minimum_increment DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL,
    status ENUM('SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED', 'SOLD') DEFAULT 'ACTIVE',
    current_winner_id BIGINT NULL,
    reserve_price DECIMAL(10,2),
    auto_extend_on_late_bid BOOLEAN DEFAULT FALSE,
    extension_time_minutes INT DEFAULT 5,
    buy_now_price DECIMAL(10,2),
    allow_buy_now BOOLEAN DEFAULT TRUE,
    INDEX idx_auction_status (status),
    INDEX idx_auction_end_time (end_time),
    INDEX idx_auction_start_time (start_time),
    INDEX idx_auction_current_highest_bid (current_highest_bid),
    FOREIGN KEY (item_id) REFERENCES item(item_id) ON DELETE CASCADE,
    FOREIGN KEY (current_winner_id) REFERENCES user(user_id) ON DELETE SET NULL
);

CREATE TABLE bid (
    bid_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    bidder_id BIGINT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    bid_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'OUTBID', 'WINNING', 'WON', 'CANCELLED') DEFAULT 'ACTIVE',
    is_auto_bid BOOLEAN DEFAULT FALSE,
    max_auto_bid_amount DECIMAL(10,2),
    INDEX idx_bid_item (item_id),
    INDEX idx_bid_bidder (bidder_id),
    INDEX idx_bid_amount (bid_amount),
    INDEX idx_bid_date (bid_date),
    INDEX idx_bid_status (status),
    FOREIGN KEY (item_id) REFERENCES item(item_id) ON DELETE CASCADE,
    FOREIGN KEY (bidder_id) REFERENCES user(user_id) ON DELETE CASCADE
);

CREATE TABLE message (
    message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    item_id BIGINT NULL,
    content TEXT NOT NULL,
    sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    INDEX idx_message_sender (sender_id),
    INDEX idx_message_receiver (receiver_id),
    INDEX idx_message_item (item_id),
    INDEX idx_message_sent_date (sent_date),
    INDEX idx_message_read (is_read),
    FOREIGN KEY (sender_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item(item_id) ON DELETE SET NULL
);

CREATE TABLE report (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    reported_user_id BIGINT NOT NULL,
    item_id BIGINT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED') DEFAULT 'PENDING',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by BIGINT NULL,
    review_date TIMESTAMP NULL,
    admin_notes TEXT,
    INDEX idx_report_status (status),
    INDEX idx_report_severity (severity),
    INDEX idx_report_date (report_date),
    INDEX idx_report_reporter (reporter_id),
    INDEX idx_report_reported_user (reported_user_id),
    FOREIGN KEY (reporter_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES item(item_id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES admin(admin_id) ON DELETE SET NULL
);

CREATE TABLE message_report (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    reason ENUM('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'SCAM_FRAUD', 'HATE_SPEECH', 'VIOLENCE_THREATS', 'FAKE_INFORMATION', 'OTHER') NOT NULL,
    additional_details TEXT,
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED') DEFAULT 'PENDING',
    reviewed_by BIGINT NULL,
    reviewed_date TIMESTAMP NULL,
    review_notes TEXT,
    INDEX idx_msg_report_status (status),
    INDEX idx_msg_report_reason (reason),
    INDEX idx_msg_report_date (reported_date),
    INDEX idx_msg_report_message (message_id),
    INDEX idx_msg_report_reporter (reporter_id),
    FOREIGN KEY (message_id) REFERENCES message(message_id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES user(user_id) ON DELETE SET NULL
);

DELIMITER //
CREATE TRIGGER item_update_timestamp
    BEFORE UPDATE ON item
    FOR EACH ROW
BEGIN
    SET NEW.update_date = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER auction_set_initial_bid
    BEFORE INSERT ON auction
    FOR EACH ROW
BEGIN
    IF NEW.current_highest_bid IS NULL THEN
        SET NEW.current_highest_bid = NEW.starting_bid;
    END IF;
END//
DELIMITER ;

INSERT INTO admin (a_name, a_email, a_password, a_phone, department) VALUES
('Laiba Tabassum', 'u2204077@student.cuet.ac.bd', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lpiW', '01792597333', 'CSE');

INSERT INTO user (u_name, u_phone, u_cus_mail, u_password, role, email_verified) VALUES 
('john_doe', '+8801111111111', 'john@student.cuet.ac.bd', '$2a$10$example_hashed_password', 'SELLER', TRUE),
('jane_smith', '+8801222222222', 'jane@student.cuet.ac.bd', '$2a$10$example_hashed_password', 'BUYER', TRUE);

INSERT INTO item (i_name, description, image, price, category, status, available, bidding_enabled, u_id) VALUES
('Old Laptop', 'A reliable, used laptop for studies.', '/images/laptop_1.jpg', 5000.00, 'Electronics', 'APPROVED', TRUE, TRUE, 1);

INSERT INTO auction (item_id, starting_bid, current_highest_bid, minimum_increment, end_time) VALUES
(1, 500.00, 500.00, 50.00, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY));

INSERT INTO bid (item_id, bidder_id, bid_amount, status) VALUES
(1, 2, 550.00, 'WINNING');

INSERT INTO bid (item_id, bidder_id, bid_amount, status) VALUES
(1, 1, 600.00, 'OUTBID');

SET FOREIGN_KEY_CHECKS = 1;