-- Finance dataset schema
CREATE TABLE accounts (
    id INT PRIMARY KEY,
    holder_name VARCHAR(100) NOT NULL,
    acct_type VARCHAR(20) NOT NULL,
    balance DECIMAL(12,2) NOT NULL,
    opened_date DATE NOT NULL
);

CREATE TABLE transactions (
    id INT PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(id),
    txn_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    txn_type VARCHAR(20) NOT NULL,
    description VARCHAR(200)
);

CREATE TABLE budgets (
    id INT PRIMARY KEY,
    department VARCHAR(50) NOT NULL,
    fiscal_year INT NOT NULL,
    allocated DECIMAL(12,2) NOT NULL,
    spent DECIMAL(12,2) NOT NULL
);

CREATE TABLE invoices (
    id INT PRIMARY KEY,
    vendor VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    issued_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) NOT NULL
);

CREATE TABLE investments (
    id INT PRIMARY KEY,
    fund_name VARCHAR(100) NOT NULL,
    principal DECIMAL(12,2) NOT NULL,
    current_value DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL
);
