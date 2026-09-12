-- Ops/Logistics dataset schema
CREATE TABLE warehouses (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    capacity INT NOT NULL
);

CREATE TABLE shipments (
    id INT PRIMARY KEY,
    origin_warehouse_id INT NOT NULL REFERENCES warehouses(id),
    dest_warehouse_id INT NOT NULL REFERENCES warehouses(id),
    ship_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(20) NOT NULL,
    weight_kg DECIMAL(8,2) NOT NULL
);

CREATE TABLE inventory (
    id INT PRIMARY KEY,
    warehouse_id INT NOT NULL REFERENCES warehouses(id),
    product_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    reorder_level INT NOT NULL
);

CREATE TABLE carriers (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL
);

CREATE TABLE shipment_carriers (
    shipment_id INT NOT NULL REFERENCES shipments(id),
    carrier_id INT NOT NULL REFERENCES carriers(id),
    cost DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (shipment_id, carrier_id)
);
