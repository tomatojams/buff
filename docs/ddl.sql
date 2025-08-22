-- Database and schema selection
CREATE DATABASE IF NOT EXISTS buff;
USE buff;

-- 1. users table (phone에서 UNIQUE 제거, social_provider와 social_id 기본값 NULL, role 추가)
CREATE TABLE users (
                       id CHAR(36) PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password VARCHAR(255) DEFAULT NULL,
                       social_provider ENUM('kakao', 'naver', 'apple') DEFAULT NULL, -- NULL 허용, 기본값 NULL
                       social_id VARCHAR(255) DEFAULT NULL, -- NULL 허용, 기본값 NULL
                       phone VARCHAR(20), -- UNIQUE 제거
                       points DECIMAL(10, 2) DEFAULT 0.00,
                       push_notification_enabled BOOLEAN DEFAULT TRUE,
                       role ENUM('admin', 'user') NOT NULL DEFAULT 'user', -- 기본값 'user'
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       revoked_at TIMESTAMP
) ENGINE=InnoDB;

-- 2. addresses table (users 참조)
CREATE TABLE addresses (
                           id CHAR(36) PRIMARY KEY,
                           user_id CHAR(36) NOT NULL,
                           address TEXT NOT NULL,
                           latitude DOUBLE,
                           longitude DOUBLE,
                           is_default BOOLEAN DEFAULT FALSE,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                           revoked_at TIMESTAMP,
                           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 3. partners table (restaurants에서 참조)
CREATE TABLE partners (
                          id CHAR(36) PRIMARY KEY,
                          email VARCHAR(100) NOT NULL UNIQUE,
                          password VARCHAR(100) NOT NULL,
                          phone_number VARCHAR(15) NOT NULL UNIQUE,
                          name VARCHAR(30) NOT NULL,
                          status ENUM('active', 'inactive', 'pending', 'suspended') NOT NULL DEFAULT 'pending',
                          business_registration_number VARCHAR(20) UNIQUE,
                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          revoked_at TIMESTAMP
) ENGINE=InnoDB;

-- 4. categories table (restaurants에서 참조)
CREATE TABLE categories (
                            id CHAR(36) PRIMARY KEY,
                            name VARCHAR(100) NOT NULL,
                            icon_url VARCHAR(255),
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            revoked_at TIMESTAMP
) ENGINE=InnoDB;

-- 5. restaurants table (partner_id 포함)
CREATE TABLE restaurants (
                             id CHAR(36) PRIMARY KEY,
                             name VARCHAR(100) NOT NULL,
                             category_id CHAR(36) NOT NULL,
                             partner_id CHAR(36) NOT NULL,
                             latitude DOUBLE NOT NULL,
                             longitude DOUBLE NOT NULL,
                             images JSON,
                             min_order_amount DECIMAL(10, 2) NOT NULL,
                             delivery_fee DECIMAL(10, 2) NOT NULL,
                             naver_place_url VARCHAR(255),
                             is_takeout_available BOOLEAN DEFAULT FALSE,
                             luckybox_enabled BOOLEAN DEFAULT FALSE,
                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                             revoked_at TIMESTAMP,
                             FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                             FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 6. payment_methods table (users 참조)
CREATE TABLE payment_methods (
                                 id CHAR(36) PRIMARY KEY,
                                 user_id CHAR(36) NOT NULL,
                                 method_type ENUM('card', 'bank', 'other'),
                                 details VARCHAR(255),
                                 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 revoked_at TIMESTAMP,
                                 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 7. coupons table (restaurants 참조)
CREATE TABLE coupons (
                         id CHAR(36) PRIMARY KEY,
                         restaurant_id CHAR(36) NOT NULL,
                         code VARCHAR(50) UNIQUE NOT NULL,
                         discount DECIMAL(10, 2) NOT NULL,
                         expiration_date DATE,
                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                         revoked_at TIMESTAMP,
                         FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 8. orders table (users, restaurants, addresses, payment_methods, coupons 참조)
CREATE TABLE orders (
                        id CHAR(36) PRIMARY KEY,
                        user_id CHAR(36) NOT NULL,
                        restaurant_id CHAR(36) NOT NULL,
                        address_id CHAR(36),
                        payment_method_id CHAR(36),
                        total_price DECIMAL(10, 2) NOT NULL,
                        status ENUM('pending', 'preparing', 'delivering', 'completed', 'cancelled'),
                        coupon_id CHAR(36),
                        points_used DECIMAL(10, 2) DEFAULT 0.00,
                        points_earned DECIMAL(10, 2) DEFAULT 0.00,
                        order_type ENUM('delivery', 'takeout', 'dine_in') NOT NULL,
                        pickup_code VARCHAR(10),
                        pickup_deadline_at TIMESTAMP,
                        ready_at TIMESTAMP,
                        picked_up_at TIMESTAMP,
                        pickup_time TIMESTAMP,
                        special_request TEXT,
                        order_source ENUM('app', 'web', 'admin') NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        revoked_at TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                        FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 9. menus table (restaurants 참조)
CREATE TABLE menus (
                       id CHAR(36) PRIMARY KEY,
                       restaurant_id CHAR(36) NOT NULL,
                       name VARCHAR(100) NOT NULL,
                       price DECIMAL(10, 2) NOT NULL,
                       options JSON,
                       is_luckybox_item BOOLEAN DEFAULT FALSE,
                       original_price DECIMAL(10, 2),
                       discounted_price DECIMAL(10, 2),
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       revoked_at TIMESTAMP,
                       FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 10. carts table (users, restaurants 참조)
CREATE TABLE carts (
                       id CHAR(36) PRIMARY KEY,
                       user_id CHAR(36) NOT NULL,
                       restaurant_id CHAR(36) NOT NULL,
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                       revoked_at TIMESTAMP,
                       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                       FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 11. cart_items table (carts, menus 참조)
CREATE TABLE cart_items (
                            id CHAR(36) PRIMARY KEY,
                            cart_id CHAR(36) NOT NULL,
                            menu_id CHAR(36) NOT NULL,
                            quantity INT NOT NULL,
                            selected_options JSON,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            revoked_at TIMESTAMP,
                            FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                            FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 12. order_items table (orders, menus 참조)
CREATE TABLE order_items (
                             id CHAR(36) PRIMARY KEY,
                             order_id CHAR(36) NOT NULL,
                             menu_id CHAR(36) NOT NULL,
                             quantity INT NOT NULL,
                             selected_options JSON,
                             price DECIMAL(10, 2) NOT NULL,
                             created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                             revoked_at TIMESTAMP,
                             FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                             FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 13. user_coupons table (users, coupons 참조)
CREATE TABLE user_coupons (
                              id CHAR(36) PRIMARY KEY,
                              user_id CHAR(36) NOT NULL,
                              coupon_id CHAR(36) NOT NULL,
                              used BOOLEAN DEFAULT FALSE,
                              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                              revoked_at TIMESTAMP,
                              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                              FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 14. lotteries table (users, orders 참조)
CREATE TABLE lotteries (
                           id CHAR(36) PRIMARY KEY,
                           user_id CHAR(36) NOT NULL,
                           order_id CHAR(36) NOT NULL,
                           lottery_number VARCHAR(50) NOT NULL,
                           game_count INT NOT NULL,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                           revoked_at TIMESTAMP,
                           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                           FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 15. lottery_draws table (독립적)
CREATE TABLE lottery_draws (
                               id CHAR(36) PRIMARY KEY,
                               draw_number INT NOT NULL,
                               draw_date DATE NOT NULL,
                               winning_numbers VARCHAR(50) NOT NULL,
                               bonus_number INT NOT NULL,
                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                               revoked_at TIMESTAMP
) ENGINE=InnoDB;

-- 16. winners table (lotteries, lottery_draws 참조)
CREATE TABLE winners (
                         id CHAR(36) PRIMARY KEY,
                         lottery_id CHAR(36) NOT NULL,
                         lottery_draw_id CHAR(36) NOT NULL,
                         rank ENUM('1st', '2nd', '3rd'),
                         prize DECIMAL(10, 2),
                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                         revoked_at TIMESTAMP,
                         FOREIGN KEY (lottery_id) REFERENCES lotteries(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                         FOREIGN KEY (lottery_draw_id) REFERENCES lottery_draws(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 17. banners table (독립적)
CREATE TABLE banners (
                         id CHAR(36) PRIMARY KEY,
                         image_url VARCHAR(255) NOT NULL,
                         link_url VARCHAR(255),
                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                         revoked_at TIMESTAMP
) ENGINE=InnoDB;

-- 18. favorites table (users, restaurants 참조)
CREATE TABLE favorites (
                           id CHAR(36) PRIMARY KEY,
                           user_id CHAR(36) NOT NULL,
                           restaurant_id CHAR(36) NOT NULL,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                           revoked_at TIMESTAMP,
                           FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                           FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 19. search_histories table (users 참조)
CREATE TABLE search_histories (
                                  id CHAR(36) PRIMARY KEY,
                                  user_id CHAR(36) NOT NULL,
                                  query VARCHAR(255) NOT NULL,
                                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                  revoked_at TIMESTAMP,
                                  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 20. order_status_histories table (orders, users 참조, changed_by_id는 admin만 가능)
CREATE TABLE order_status_histories (
                                        id CHAR(36) PRIMARY KEY,
                                        order_id CHAR(36) NOT NULL,
                                        status ENUM('pending', 'preparing', 'delivering', 'completed', 'cancelled') NOT NULL,
                                        changed_by_id CHAR(36), -- role이 'admin'인 users(id)만 가능 (애플리케이션 로직에서 제어)
                                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                        revoked_at TIMESTAMP,
                                        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                                        FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 21. reviews table (orders, restaurants, users 참조)
CREATE TABLE reviews (
                         id CHAR(36) PRIMARY KEY,
                         order_id CHAR(36) NOT NULL,
                         restaurant_id CHAR(36) NOT NULL,
                         user_id CHAR(36) NOT NULL,
                         rating DECIMAL(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
                         comment TEXT,
                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                         revoked_at TIMESTAMP,
                         FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                         FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 22. notifications table (users 참조)
CREATE TABLE notifications (
                               id CHAR(36) PRIMARY KEY,
                               user_id CHAR(36) NOT NULL,
                               title VARCHAR(100) NOT NULL,
                               message TEXT NOT NULL,
                               type ENUM('promotion', 'lottery_win', 'order_update', 'other') NOT NULL,
                               read_at TIMESTAMP,
                               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                               revoked_at TIMESTAMP,
                               FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 23. payments table (orders, payment_methods 참조)
CREATE TABLE payments (
                          id CHAR(36) PRIMARY KEY,
                          order_id CHAR(36) NOT NULL,
                          amount DECIMAL(10,2) NOT NULL,
                          payment_method_id CHAR(36) NOT NULL,
                          status ENUM('paid', 'failed', 'refunded') NOT NULL,
                          refund_status ENUM('none', 'pending', 'completed', 'rejected') DEFAULT 'none',
                          refund_amount DECIMAL(10,2),
                          payment_gateway ENUM('kakaopay', 'tosspay', 'other') NOT NULL,
                          transaction_id VARCHAR(100) NOT NULL,
                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          revoked_at TIMESTAMP,
                          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                          FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 24. restaurant_hours table (restaurants 참조)
CREATE TABLE restaurant_hours (
                                  id CHAR(36) PRIMARY KEY,
                                  restaurant_id CHAR(36) NOT NULL,
                                  day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
                                  open_time TIME,
                                  close_time TIME,
                                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                  revoked_at TIMESTAMP,
                                  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- 25. events table (독립적)
CREATE TABLE events (
                        id CHAR(36) PRIMARY KEY,
                        title VARCHAR(100) NOT NULL,
                        description TEXT,
                        start_date DATE NOT NULL,
                        end_date DATE NOT NULL,
                        reward_type ENUM('discount', 'points', 'coupon', 'other') NOT NULL,
                        reward_value DECIMAL(10,2) NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        revoked_at TIMESTAMP
) ENGINE=InnoDB;

-- 26. luckyboxes table (restaurants, menus 참조)
CREATE TABLE luckyboxes (
                            id CHAR(36) PRIMARY KEY,
                            restaurant_id CHAR(36) NOT NULL,
                            menu_id CHAR(36) NOT NULL,
                            stock INT NOT NULL,
                            discount_price DECIMAL(10, 2) NOT NULL,
                            start_time TIMESTAMP NOT NULL,
                            end_time TIMESTAMP NOT NULL,
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            revoked_at TIMESTAMP,
                            FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
                            FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_search_queries ON search_histories(query);
CREATE INDEX idx_order_id_status ON order_status_histories(order_id, status);
CREATE INDEX idx_restaurant_id ON reviews(restaurant_id);
CREATE INDEX idx_user_id ON reviews(user_id);
CREATE INDEX idx_draw_number ON lottery_draws(draw_number);
CREATE INDEX idx_draw_date ON lottery_draws(draw_date);
CREATE INDEX idx_lottery_id ON winners(lottery_id);
CREATE INDEX idx_lottery_draw_id ON winners(lottery_draw_id);
CREATE INDEX idx_user_id ON lotteries(user_id);
CREATE INDEX idx_order_id ON lotteries(order_id);
CREATE INDEX idx_user_id ON notifications(user_id);
CREATE INDEX idx_type_created_at ON notifications(type, created_at);
CREATE INDEX idx_order_id ON payments(order_id);
CREATE INDEX idx_status ON payments(status);
CREATE INDEX idx_transaction_id ON payments(transaction_id);
CREATE INDEX idx_restaurant_id ON restaurant_hours(restaurant_id);
CREATE INDEX idx_day_of_week ON restaurant_hours(day_of_week);
CREATE INDEX idx_start_date_end_date ON events(start_date, end_date);
CREATE INDEX idx_reward_type ON events(reward_type);
CREATE INDEX idx_user_id ON user_coupons(user_id);
CREATE INDEX idx_coupon_id ON user_coupons(coupon_id);
CREATE INDEX idx_user_id ON carts(user_id);
CREATE INDEX idx_restaurant_id ON carts(restaurant_id);
CREATE INDEX idx_restaurant_id ON luckyboxes(restaurant_id);
CREATE INDEX idx_menu_id ON luckyboxes(menu_id);