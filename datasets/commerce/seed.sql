-- Commerce dataset seed data
INSERT INTO customers (id, name, email, city, signup_date) VALUES
    (1, 'Alice Johnson', 'alice@example.com', 'New York', '2023-01-15'),
    (2, 'Bob Smith', 'bob@example.com', 'Los Angeles', '2023-02-20'),
    (3, 'Carol Davis', 'carol@example.com', 'Chicago', '2023-03-10'),
    (4, 'David Wilson', 'david@example.com', 'Houston', '2023-04-05'),
    (5, 'Eva Martinez', 'eva@example.com', 'Phoenix', '2023-05-12');

INSERT INTO products (id, name, category, price, stock) VALUES
    (1, 'Laptop Pro', 'Electronics', 1299.99, 50),
    (2, 'Wireless Mouse', 'Electronics', 29.99, 200),
    (3, 'Desk Chair', 'Furniture', 249.99, 30),
    (4, 'Coffee Maker', 'Appliances', 89.99, 75),
    (5, 'Running Shoes', 'Sports', 119.99, 100),
    (6, 'Yoga Mat', 'Sports', 39.99, 150),
    (7, 'Blender', 'Appliances', 59.99, 60),
    (8, 'Monitor 27"', 'Electronics', 349.99, 40);

INSERT INTO orders (id, customer_id, order_date, status) VALUES
    (1, 1, '2024-01-10', 'completed'),
    (2, 1, '2024-02-15', 'completed'),
    (3, 2, '2024-01-20', 'completed'),
    (4, 3, '2024-03-05', 'shipped'),
    (5, 4, '2024-03-12', 'processing'),
    (6, 5, '2024-03-18', 'completed'),
    (7, 2, '2024-04-01', 'completed'),
    (8, 3, '2024-04-10', 'shipped');

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 1, 1299.99),
    (2, 1, 2, 2, 29.99),
    (3, 2, 3, 1, 249.99),
    (4, 3, 5, 1, 119.99),
    (5, 3, 6, 2, 39.99),
    (6, 4, 4, 1, 89.99),
    (7, 4, 7, 1, 59.99),
    (8, 5, 8, 2, 349.99),
    (9, 6, 2, 1, 29.99),
    (10, 6, 6, 1, 39.99),
    (11, 7, 1, 1, 1299.99),
    (12, 8, 3, 2, 249.99);

INSERT INTO payments (id, order_id, amount, method, paid_at) VALUES
    (1, 1, 1359.97, 'credit_card', '2024-01-10'),
    (2, 2, 249.99, 'paypal', '2024-02-15'),
    (3, 3, 199.97, 'credit_card', '2024-01-20'),
    (4, 4, 149.98, 'debit_card', '2024-03-05'),
    (5, 5, 699.98, 'credit_card', '2024-03-12'),
    (6, 6, 69.98, 'paypal', '2024-03-18'),
    (7, 7, 1299.99, 'credit_card', '2024-04-01'),
    (8, 8, 499.98, 'debit_card', '2024-04-10');
