-- Commerce dataset schema
CREATE TABLE customers (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    signup_date DATE NOT NULL
);

CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL
);

CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id),
    order_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL
);

CREATE TABLE order_items (
    id INT PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id),
    product_id INT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE payments (
    id INT PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id),
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) NOT NULL,
    paid_at DATE NOT NULL
);
