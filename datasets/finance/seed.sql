-- Finance dataset seed data
INSERT INTO accounts (id, holder_name, acct_type, balance, opened_date) VALUES
    (1, 'Alice Johnson', 'checking', 5200.00, '2022-01-10'),
    (2, 'Bob Smith', 'savings', 15000.00, '2022-02-15'),
    (3, 'Carol Davis', 'checking', 850.50, '2022-03-20'),
    (4, 'David Wilson', 'savings', 25000.00, '2022-04-05'),
    (5, 'Eva Martinez', 'checking', 3200.75, '2022-05-12');

INSERT INTO transactions (id, account_id, txn_date, amount, txn_type, description) VALUES
    (1, 1, '2024-01-05', 2500.00, 'deposit', 'Payroll'),
    (2, 1, '2024-01-10', -150.00, 'withdrawal', 'ATM'),
    (3, 1, '2024-01-15', -800.00, 'transfer', 'Rent payment'),
    (4, 2, '2024-01-20', 500.00, 'deposit', 'Interest'),
    (5, 3, '2024-02-01', 1200.00, 'deposit', 'Payroll'),
    (6, 3, '2024-02-05', -45.99, 'withdrawal', 'Subscription'),
    (7, 4, '2024-02-10', 1000.00, 'deposit', 'Bonus'),
    (8, 4, '2024-02-15', -200.00, 'transfer', 'Investment'),
    (9, 5, '2024-03-01', 1800.00, 'deposit', 'Payroll'),
    (10, 5, '2024-03-05', -350.00, 'withdrawal', 'Insurance');

INSERT INTO budgets (id, department, fiscal_year, allocated, spent) VALUES
    (1, 'Engineering', 2024, 500000.00, 320000.00),
    (2, 'Marketing', 2024, 150000.00, 95000.00),
    (3, 'Sales', 2024, 200000.00, 175000.00),
    (4, 'HR', 2024, 80000.00, 62000.00),
    (5, 'Operations', 2024, 120000.00, 45000.00);

INSERT INTO invoices (id, vendor, amount, issued_date, due_date, paid_date, status) VALUES
    (1, 'TechSupply Co', 5200.00, '2024-01-05', '2024-02-04', '2024-01-28', 'paid'),
    (2, 'Office Furniture Inc', 3400.00, '2024-01-15', '2024-02-14', '2024-02-10', 'paid'),
    (3, 'Cloud Services Ltd', 1200.00, '2024-02-01', '2024-03-02', NULL, 'overdue'),
    (4, 'Marketing Agency', 8500.00, '2024-02-15', '2024-03-16', '2024-03-01', 'paid'),
    (5, 'Legal Associates', 2800.00, '2024-03-01', '2024-03-31', NULL, 'pending');

INSERT INTO investments (id, fund_name, principal, current_value, start_date) VALUES
    (1, 'Growth Fund A', 10000.00, 11850.00, '2023-01-10'),
    (2, 'Index Tracker B', 25000.00, 27500.00, '2023-03-15'),
    (3, 'Bond Portfolio C', 15000.00, 15450.00, '2023-06-01'),
    (4, 'Tech Equity D', 8000.00, 7200.00, '2023-09-01');
