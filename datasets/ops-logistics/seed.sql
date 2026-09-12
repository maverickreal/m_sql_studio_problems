-- Ops/Logistics dataset seed data
INSERT INTO warehouses (id, name, city, capacity) VALUES
    (1, 'North Hub', 'Seattle', 50000),
    (2, 'South Depot', 'Los Angeles', 75000),
    (3, 'East Center', 'New York', 60000),
    (4, 'West Station', 'Denver', 40000);

INSERT INTO shipments (id, origin_warehouse_id, dest_warehouse_id, ship_date, delivery_date, status, weight_kg) VALUES
    (1, 1, 3, '2024-01-05', '2024-01-12', 'delivered', 500.00),
    (2, 2, 1, '2024-01-10', '2024-01-18', 'delivered', 750.50),
    (3, 3, 4, '2024-02-01', '2024-02-08', 'delivered', 320.00),
    (4, 1, 2, '2024-02-15', NULL, 'in_transit', 1200.00),
    (5, 4, 3, '2024-03-01', '2024-03-07', 'delivered', 450.25),
    (6, 2, 4, '2024-03-10', NULL, 'in_transit', 890.00),
    (7, 3, 1, '2024-03-20', '2024-03-27', 'delivered', 600.00),
    (8, 4, 2, '2024-04-01', NULL, 'pending', 200.00);

INSERT INTO inventory (id, warehouse_id, product_name, quantity, reorder_level) VALUES
    (1, 1, 'Laptop Pro', 150, 50),
    (2, 1, 'Wireless Mouse', 500, 100),
    (3, 2, 'Desk Chair', 80, 30),
    (4, 2, 'Coffee Maker', 200, 50),
    (5, 3, 'Running Shoes', 300, 75),
    (6, 3, 'Yoga Mat', 400, 100),
    (7, 4, 'Blender', 120, 40),
    (8, 4, 'Monitor 27"', 90, 25);

INSERT INTO carriers (id, name, type) VALUES
    (1, 'FastFreight', 'ground'),
    (2, 'AirExpress', 'air'),
    (3, 'SeaShip', 'sea'),
    (4, 'QuickDelivery', 'ground');

INSERT INTO shipment_carriers (shipment_id, carrier_id, cost) VALUES
    (1, 1, 250.00),
    (2, 2, 450.00),
    (3, 1, 180.00),
    (4, 1, 600.00),
    (5, 4, 220.00),
    (6, 2, 520.00),
    (7, 1, 300.00),
    (8, 4, 100.00);
