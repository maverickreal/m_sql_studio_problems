#!/usr/bin/env python3
"""Mint original first-party YAML for C3. Does not overwrite existing slugs."""
from __future__ import annotations

import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROBLEMS_DIR = ROOT / "problems"

TABLES = {
    "content": [
        "authors(id, name, email, joined_date)",
        "articles(id, title, author_id, category, published_date, word_count, status)",
        "comments(id, article_id, commenter_name, body, posted_date)",
        "tags(id, name)",
        "article_tags(article_id, tag_id)",
        "likes(id, article_id, user_name, liked_date)",
    ],
    "finance": [
        "accounts(id, holder_name, acct_type, balance, opened_date)",
        "transactions(id, account_id, txn_date, amount, txn_type, description)",
        "budgets(id, department, fiscal_year, allocated, spent)",
        "invoices(id, vendor, amount, issued_date, due_date, paid_date, status)",
        "investments(id, fund_name, principal, current_value, start_date)",
    ],
    "commerce": [
        "customers(id, name, email, city, signup_date)",
        "products(id, name, category, price, stock)",
        "orders(id, customer_id, order_date, status)",
        "order_items(id, order_id, product_id, quantity, unit_price)",
        "payments(id, order_id, amount, method, paid_at)",
    ],
    "ops-logistics": [
        "warehouses(id, name, city, capacity)",
        "shipments(id, origin_warehouse_id, dest_warehouse_id, ship_date, delivery_date, status, weight_kg)",
        "inventory(id, warehouse_id, product_name, quantity, reorder_level)",
        "carriers(id, name, type)",
        "shipment_carriers(shipment_id, carrier_id, cost)",
    ],
    "education": [
        "students(id, name, cohort_year, major)",
        "courses(id, code, title, credits, dept)",
        "enrollments(student_id, course_id, term)",
        "grades(student_id, course_id, term, letter, points)",
        "instructors(id, name, dept)",
        "course_instructors(course_id, instructor_id, term)",
    ],
    "hr": [
        "employees(id, name, dept_id, salary, hire_date, manager_id)",
        "departments(id, name)",
        "projects(id, name, dept_id, budget)",
        "employee_projects(employee_id, project_id, role)",
    ],
}


def uuidv7() -> str:
    ms = int(time.time() * 1000)
    import secrets

    time_hex = f"{ms:012x}"
    rand = secrets.token_hex(10)
    return f"{time_hex[:8]}-{time_hex[8:12]}-7{rand[:3]}-8{rand[4:7]}-{rand[8:20]}"


# dataset, slug, title, description, difficulty, mode, sql
SPECS: list[tuple[str, str, str, str, str, str, str]] = [
    ("content", "published-articles-per-author", "Published articles per author", "Return each author and how many published articles they have, including authors with zero.", "easy", "read",
     "SELECT a.name AS author_name, COUNT(ar.id) FILTER (WHERE ar.status = 'published') AS published_count FROM authors a LEFT JOIN articles ar ON ar.author_id = a.id GROUP BY a.name ORDER BY published_count DESC, author_name"),
    ("content", "draft-articles", "Draft articles", "List titles of articles that are still drafts.", "easy", "read",
     "SELECT title FROM articles WHERE status = 'draft' ORDER BY title"),
    ("content", "articles-without-comments", "Articles with no comments", "Return published article titles that have no comments.", "easy", "read",
     "SELECT ar.title FROM articles ar LEFT JOIN comments c ON c.article_id = ar.id WHERE ar.status = 'published' GROUP BY ar.title HAVING COUNT(c.id) = 0 ORDER BY ar.title"),
    ("content", "avg-word-count-by-category", "Average word count by category", "Average word_count per article category.", "easy", "read",
     "SELECT category, AVG(word_count) AS avg_words FROM articles GROUP BY category ORDER BY category"),
    ("content", "most-commented-article", "Most commented article", "Article title with the highest comment count.", "easy", "read",
     "SELECT ar.title FROM articles ar JOIN comments c ON c.article_id = ar.id GROUP BY ar.title ORDER BY COUNT(c.id) DESC, ar.title LIMIT 1"),
    ("content", "authors-joined-in-2023", "Authors who joined in 2023", "Names of authors whose joined_date is in 2023.", "easy", "read",
     "SELECT name FROM authors WHERE joined_date >= DATE '2023-01-01' AND joined_date < DATE '2024-01-01' ORDER BY name"),
    ("content", "tutorial-tag-articles", "Articles tagged tutorial", "Titles of articles that have the tutorial tag.", "medium", "read",
     "SELECT ar.title FROM articles ar JOIN article_tags at ON at.article_id = ar.id JOIN tags t ON t.id = at.tag_id WHERE t.name = 'tutorial' ORDER BY ar.title"),
    ("content", "articles-with-sql-and-advanced-tags", "Articles tagged sql and advanced", "Titles that have both sql and advanced tags.", "medium", "read",
     "SELECT ar.title FROM articles ar JOIN article_tags at ON at.article_id = ar.id JOIN tags t ON t.id = at.tag_id WHERE t.name IN ('sql', 'advanced') GROUP BY ar.title HAVING COUNT(DISTINCT t.name) = 2 ORDER BY ar.title"),
    ("content", "like-count-by-article", "Like counts by article", "Each article title with its like count, including zero.", "easy", "read",
     "SELECT ar.title, COUNT(l.id) AS like_count FROM articles ar LEFT JOIN likes l ON l.article_id = ar.id GROUP BY ar.title ORDER BY like_count DESC, ar.title"),
    ("content", "commenters-on-multiple-articles", "Commenters on more than one article", "Commenter names who commented on at least two distinct articles.", "medium", "read",
     "SELECT commenter_name FROM comments GROUP BY commenter_name HAVING COUNT(DISTINCT article_id) >= 2 ORDER BY commenter_name"),
    ("content", "longest-published-article", "Longest published article", "Title of the published article with the highest word_count.", "easy", "read",
     "SELECT title FROM articles WHERE status = 'published' ORDER BY word_count DESC, title LIMIT 1"),
    ("content", "performance-category-authors", "Authors of performance articles", "Distinct author names who wrote a Performance category article.", "easy", "read",
     "SELECT DISTINCT a.name FROM authors a JOIN articles ar ON ar.author_id = a.id WHERE ar.category = 'Performance' ORDER BY a.name"),
    ("content", "articles-published-in-march-2024", "Articles published in March 2024", "Titles published during March 2024.", "easy", "read",
     "SELECT title FROM articles WHERE published_date >= DATE '2024-03-01' AND published_date < DATE '2024-04-01' ORDER BY title"),
    ("content", "tag-usage-counts", "How often each tag is used", "Tag name and number of articles it is attached to.", "easy", "read",
     "SELECT t.name AS tag_name, COUNT(at.article_id) AS article_count FROM tags t LEFT JOIN article_tags at ON at.tag_id = t.id GROUP BY t.name ORDER BY article_count DESC, tag_name"),
    ("content", "authors-above-avg-word-count", "Authors above average article length", "Authors whose average article word_count is above the overall average.", "medium", "read",
     "SELECT a.name FROM authors a JOIN articles ar ON ar.author_id = a.id GROUP BY a.name HAVING AVG(ar.word_count) > (SELECT AVG(word_count) FROM articles) ORDER BY a.name"),
    ("content", "running-word-count-by-publish-date", "Running word count by publish date", "Each published article title with a running sum of word_count ordered by published_date.", "hard", "read",
     "SELECT title, SUM(word_count) OVER (ORDER BY published_date, title) AS running_words FROM articles WHERE status = 'published' ORDER BY published_date, title"),
    ("content", "rank-articles-by-likes", "Rank articles by likes", "Article title and like-rank (1 = most liked). Ties share rank.", "medium", "read",
     "SELECT ar.title, RANK() OVER (ORDER BY COUNT(l.id) DESC) AS like_rank FROM articles ar LEFT JOIN likes l ON l.article_id = ar.id GROUP BY ar.title ORDER BY like_rank, ar.title"),
    ("content", "unpublished-with-likes", "Drafts that already have likes", "Draft article titles that have at least one like.", "medium", "read",
     "SELECT ar.title FROM articles ar JOIN likes l ON l.article_id = ar.id WHERE ar.status = 'draft' GROUP BY ar.title ORDER BY ar.title"),
    ("content", "author-first-published-date", "Each author's first published date", "Author name and MIN published_date among published articles.", "easy", "read",
     "SELECT a.name, MIN(ar.published_date) AS first_published FROM authors a JOIN articles ar ON ar.author_id = a.id WHERE ar.status = 'published' GROUP BY a.name ORDER BY first_published, a.name"),
    ("content", "comments-after-article-publish", "Comments posted after publish date", "Commenter name and article title where posted_date is after published_date.", "medium", "read",
     "SELECT c.commenter_name, ar.title FROM comments c JOIN articles ar ON ar.id = c.article_id WHERE c.posted_date > ar.published_date ORDER BY c.commenter_name, ar.title"),
    ("content", "beginner-tagged-published", "Published beginner-tagged articles", "Published titles that have the beginner tag.", "easy", "read",
     "SELECT ar.title FROM articles ar JOIN article_tags at ON at.article_id = ar.id JOIN tags t ON t.id = at.tag_id WHERE t.name = 'beginner' AND ar.status = 'published' ORDER BY ar.title"),
    ("content", "authors-with-no-published-work", "Authors with no published work", "Author names who have zero published articles.", "easy", "read",
     "SELECT a.name FROM authors a LEFT JOIN articles ar ON ar.author_id = a.id AND ar.status = 'published' GROUP BY a.name HAVING COUNT(ar.id) = 0 ORDER BY a.name"),
    ("content", "category-share-of-published", "Share of published articles by category", "Category and count of published articles.", "easy", "read",
     "SELECT category, COUNT(*) AS n FROM articles WHERE status = 'published' GROUP BY category ORDER BY n DESC, category"),
    ("content", "second-most-liked-article", "Second most liked article", "Title of the article with the second-highest like count (dense ranks).", "hard", "read",
     "SELECT title FROM (SELECT ar.title, DENSE_RANK() OVER (ORDER BY COUNT(l.id) DESC) AS r FROM articles ar LEFT JOIN likes l ON l.article_id = ar.id GROUP BY ar.title) x WHERE r = 2 ORDER BY title"),
    ("content", "insert-draft-note", "Add a draft note article", "Insert a draft article titled 'Office Hours' by author 4 in Guide with word_count 400 dated 2024-05-01.", "medium", "write",
     "INSERT INTO articles (id, title, author_id, category, published_date, word_count, status) VALUES (10, 'Office Hours', 4, 'Guide', DATE '2024-05-01', 400, 'draft')"),
    ("finance", "checking-account-holders", "Checking account holders", "Names of holders with a checking account.", "easy", "read",
     "SELECT holder_name FROM accounts WHERE acct_type = 'checking' ORDER BY holder_name"),
    ("finance", "account-balances-desc", "Accounts by balance", "Holder name and balance, richest first.", "easy", "read",
     "SELECT holder_name, balance FROM accounts ORDER BY balance DESC, holder_name"),
    ("finance", "deposit-totals-by-account", "Deposit totals by account", "Holder name and SUM of deposit amounts.", "easy", "read",
     "SELECT a.holder_name, COALESCE(SUM(t.amount) FILTER (WHERE t.txn_type = 'deposit'), 0) AS deposits FROM accounts a LEFT JOIN transactions t ON t.account_id = a.id GROUP BY a.holder_name ORDER BY deposits DESC, a.holder_name"),
    ("finance", "overdue-invoices", "Overdue invoices", "Vendor names with overdue invoices.", "easy", "read",
     "SELECT vendor FROM invoices WHERE status = 'overdue' ORDER BY vendor"),
    ("finance", "unpaid-invoice-total", "Unpaid invoice total", "SUM of amount for invoices that are not paid.", "easy", "read",
     "SELECT SUM(amount) AS unpaid FROM invoices WHERE status <> 'paid'"),
    ("finance", "budget-remaining", "Budget remaining by department", "Department and (allocated - spent) as remaining.", "easy", "read",
     "SELECT department, allocated - spent AS remaining FROM budgets ORDER BY remaining DESC, department"),
    ("finance", "departments-over-80-percent-spent", "Departments over 80 percent spent", "Departments where spent/allocated > 0.8.", "medium", "read",
     "SELECT department FROM budgets WHERE spent::numeric / allocated > 0.8 ORDER BY department"),
    ("finance", "investment-gain-or-loss", "Investment gain or loss", "Fund name and current_value - principal.", "easy", "read",
     "SELECT fund_name, current_value - principal AS pnl FROM investments ORDER BY pnl DESC, fund_name"),
    ("finance", "losing-funds", "Investments below principal", "Fund names where current_value is less than principal.", "easy", "read",
     "SELECT fund_name FROM investments WHERE current_value < principal ORDER BY fund_name"),
    ("finance", "payroll-deposits", "Payroll deposits", "Account holder names who received a Payroll deposit.", "easy", "read",
     "SELECT DISTINCT a.holder_name FROM accounts a JOIN transactions t ON t.account_id = a.id WHERE t.description = 'Payroll' ORDER BY a.holder_name"),
    ("finance", "net-flow-by-account", "Net transaction flow by account", "Holder name and SUM(amount) of all transactions.", "medium", "read",
     "SELECT a.holder_name, COALESCE(SUM(t.amount), 0) AS net_flow FROM accounts a LEFT JOIN transactions t ON t.account_id = a.id GROUP BY a.holder_name ORDER BY net_flow, a.holder_name"),
    ("finance", "invoices-paid-before-due", "Invoices paid before due date", "Vendors paid on or before due_date.", "medium", "read",
     "SELECT vendor FROM invoices WHERE paid_date IS NOT NULL AND paid_date <= due_date ORDER BY vendor"),
    ("finance", "avg-invoice-by-status", "Average invoice amount by status", "Status and AVG(amount).", "easy", "read",
     "SELECT status, AVG(amount) AS avg_amount FROM invoices GROUP BY status ORDER BY status"),
    ("finance", "accounts-opened-after-march-2022", "Accounts opened after March 2022", "Holders opened on or after 2022-04-01.", "easy", "read",
     "SELECT holder_name FROM accounts WHERE opened_date >= DATE '2022-04-01' ORDER BY holder_name"),
    ("finance", "largest-withdrawal", "Largest withdrawal", "Description of the most negative withdrawal amount.", "easy", "read",
     "SELECT description FROM transactions WHERE txn_type = 'withdrawal' ORDER BY amount ASC, description LIMIT 1"),
    ("finance", "budget-spend-rank", "Budget spend rank", "Department and rank by spent descending.", "medium", "read",
     "SELECT department, RANK() OVER (ORDER BY spent DESC) AS spend_rank FROM budgets ORDER BY spend_rank, department"),
    ("finance", "running-deposits-alice", "Running deposits for Alice", "Alice Johnson deposit dates and running sum of deposit amounts.", "hard", "read",
     "SELECT t.txn_date, SUM(t.amount) OVER (ORDER BY t.txn_date, t.id) AS running_deposits FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE a.holder_name = 'Alice Johnson' AND t.txn_type = 'deposit' ORDER BY t.txn_date"),
    ("finance", "vendors-with-multiple-invoices", "Vendors with more than one invoice", "Vendor names appearing more than once.", "easy", "read",
     "SELECT vendor FROM invoices GROUP BY vendor HAVING COUNT(*) > 1 ORDER BY vendor"),
    ("finance", "savings-vs-checking-count", "Savings vs checking counts", "acct_type and how many accounts.", "easy", "read",
     "SELECT acct_type, COUNT(*) AS n FROM accounts GROUP BY acct_type ORDER BY acct_type"),
    ("finance", "positive-pnl-funds", "Funds with positive PnL", "Fund names with current_value > principal.", "easy", "read",
     "SELECT fund_name FROM investments WHERE current_value > principal ORDER BY fund_name"),
    ("finance", "txn-count-by-type", "Transaction counts by type", "txn_type and COUNT(*).", "easy", "read",
     "SELECT txn_type, COUNT(*) AS n FROM transactions GROUP BY txn_type ORDER BY txn_type"),
    ("finance", "mark-invoice-paid", "Mark the pending invoice paid", "Set status to paid and paid_date to 2024-03-20 for the pending invoice.", "medium", "write",
     "UPDATE invoices SET status = 'paid', paid_date = DATE '2024-03-20' WHERE status = 'pending'"),
    ("education", "cs-majors", "CS majors", "Names of students whose major is CS.", "easy", "read",
     "SELECT name FROM students WHERE major = 'CS' ORDER BY name"),
    ("education", "courses-in-math-dept", "Math department courses", "Course codes in the Math department.", "easy", "read",
     "SELECT code FROM courses WHERE dept = 'Math' ORDER BY code"),
    ("education", "enrollment-count-by-course", "Enrollment count by course", "Course code and number of enrollments.", "easy", "read",
     "SELECT c.code, COUNT(e.student_id) AS n FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id GROUP BY c.code ORDER BY n DESC, c.code"),
    ("education", "students-with-no-grades", "Students with no grades yet", "Student names who have enrollments but no grade rows.", "medium", "read",
     "SELECT DISTINCT s.name FROM students s JOIN enrollments e ON e.student_id = s.id LEFT JOIN grades g ON g.student_id = s.id AND g.course_id = e.course_id AND g.term = e.term GROUP BY s.name HAVING COUNT(g.letter) = 0 ORDER BY s.name"),
    ("education", "gpa-by-student", "GPA by student", "Student name and AVG(points) across graded courses.", "easy", "read",
     "SELECT s.name, AVG(g.points) AS gpa FROM students s JOIN grades g ON g.student_id = s.id GROUP BY s.name ORDER BY gpa DESC, s.name"),
    ("education", "a-letter-grades", "Students who earned an A", "Distinct student names with at least one A (not A-).", "easy", "read",
     "SELECT DISTINCT s.name FROM students s JOIN grades g ON g.student_id = s.id WHERE g.letter = 'A' ORDER BY s.name"),
    ("education", "cs101-roster", "CS101 roster", "Student names enrolled in CS101.", "easy", "read",
     "SELECT s.name FROM students s JOIN enrollments e ON e.student_id = s.id JOIN courses c ON c.id = e.course_id WHERE c.code = 'CS101' ORDER BY s.name"),
    ("education", "instructors-teaching-2025s", "Instructors teaching in 2025S", "Instructor names assigned in term 2025S.", "easy", "read",
     "SELECT DISTINCT i.name FROM instructors i JOIN course_instructors ci ON ci.instructor_id = i.id WHERE ci.term = '2025S' ORDER BY i.name"),
    ("education", "courses-with-no-instructor", "Courses missing an instructor in 2024F", "Course codes with no course_instructors row for 2024F.", "medium", "read",
     "SELECT c.code FROM courses c WHERE NOT EXISTS (SELECT 1 FROM course_instructors ci WHERE ci.course_id = c.id AND ci.term = '2024F') ORDER BY c.code"),
    ("education", "credit-load-2024f", "Credit load in 2024F", "Student name and SUM of credits enrolled in 2024F.", "medium", "read",
     "SELECT s.name, COALESCE(SUM(c.credits), 0) AS credits FROM students s LEFT JOIN enrollments e ON e.student_id = s.id AND e.term = '2024F' LEFT JOIN courses c ON c.id = e.course_id GROUP BY s.name ORDER BY credits DESC, s.name"),
    ("education", "cohort-2024-students", "2024 cohort", "Names of students in cohort_year 2024.", "easy", "read",
     "SELECT name FROM students WHERE cohort_year = 2024 ORDER BY name"),
    ("education", "math-majors-in-math-courses", "Math majors in Math courses", "Math majors enrolled in a Math dept course.", "medium", "read",
     "SELECT DISTINCT s.name FROM students s JOIN enrollments e ON e.student_id = s.id JOIN courses c ON c.id = e.course_id WHERE s.major = 'Math' AND c.dept = 'Math' ORDER BY s.name"),
    ("education", "avg-points-by-course", "Average grade points by course", "Course code and AVG(points).", "easy", "read",
     "SELECT c.code, AVG(g.points) AS avg_points FROM courses c JOIN grades g ON g.course_id = c.id GROUP BY c.code ORDER BY avg_points DESC, c.code"),
    ("education", "students-above-3-5-gpa", "Students with GPA above 3.5", "Names whose average points exceed 3.5.", "medium", "read",
     "SELECT s.name FROM students s JOIN grades g ON g.student_id = s.id GROUP BY s.name HAVING AVG(g.points) > 3.5 ORDER BY s.name"),
    ("education", "dr-shaw-courses", "Courses taught by Dr. Shaw", "Course codes Dr. Shaw has taught (any term).", "easy", "read",
     "SELECT DISTINCT c.code FROM courses c JOIN course_instructors ci ON ci.course_id = c.id JOIN instructors i ON i.id = ci.instructor_id WHERE i.name = 'Dr. Shaw' ORDER BY c.code"),
    ("education", "unenrolled-students", "Students with no enrollments", "Student names who appear in students but not enrollments.", "easy", "read",
     "SELECT s.name FROM students s LEFT JOIN enrollments e ON e.student_id = s.id WHERE e.student_id IS NULL ORDER BY s.name"),
    ("education", "term-enrollment-totals", "Enrollment totals by term", "Term and COUNT(*) of enrollment rows.", "easy", "read",
     "SELECT term, COUNT(*) AS n FROM enrollments GROUP BY term ORDER BY term"),
    ("education", "rank-students-by-gpa", "Rank students by GPA", "Student name and RANK by average points descending.", "medium", "read",
     "SELECT name, RANK() OVER (ORDER BY gpa DESC) AS gpa_rank FROM (SELECT s.name, AVG(g.points) AS gpa FROM students s JOIN grades g ON g.student_id = s.id GROUP BY s.name) x ORDER BY gpa_rank, name"),
    ("education", "four-credit-courses", "Four-credit courses", "Titles of courses with 4 credits.", "easy", "read",
     "SELECT title FROM courses WHERE credits = 4 ORDER BY title"),
    ("education", "physics-majors", "Physics majors", "Names of Physics majors.", "easy", "read",
     "SELECT name FROM students WHERE major = 'Physics' ORDER BY name"),
    ("education", "cs-dept-instructors", "CS department instructors", "Instructor names in CS.", "easy", "read",
     "SELECT name FROM instructors WHERE dept = 'CS' ORDER BY name"),
    ("education", "enroll-theo-cs101", "Enroll Theo in CS101 for 2025S", "Insert enrollment for student 6 in course 1 term 2025S.", "medium", "write",
     "INSERT INTO enrollments (student_id, course_id, term) VALUES (6, 1, '2025S')"),
    ("commerce", "electronics-products", "Electronics products", "Product names in Electronics.", "easy", "read",
     "SELECT name FROM products WHERE category = 'Electronics' ORDER BY name"),
    ("commerce", "products-under-50", "Products under 50", "Product names priced below 50.", "easy", "read",
     "SELECT name FROM products WHERE price < 50 ORDER BY name"),
    ("commerce", "completed-orders", "Completed orders", "Order ids with status completed.", "easy", "read",
     "SELECT id FROM orders WHERE status = 'completed' ORDER BY id"),
    ("commerce", "customers-in-new-york", "Customers in New York", "Customer names in New York.", "easy", "read",
     "SELECT name FROM customers WHERE city = 'New York' ORDER BY name"),
    ("commerce", "items-per-order", "Line items per order", "order_id and COUNT of order_items.", "easy", "read",
     "SELECT order_id, COUNT(*) AS n FROM order_items GROUP BY order_id ORDER BY order_id"),
    ("commerce", "avg-unit-price-by-order", "Average unit price by order", "order_id and AVG(unit_price).", "easy", "read",
     "SELECT order_id, AVG(unit_price) AS avg_price FROM order_items GROUP BY order_id ORDER BY order_id"),
    ("commerce", "customers-who-ordered-electronics", "Customers who ordered electronics", "Distinct customer names who bought an Electronics product.", "medium", "read",
     "SELECT DISTINCT c.name FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE p.category = 'Electronics' ORDER BY c.name"),
    ("commerce", "stock-value-by-category", "Inventory value by category", "Category and SUM(price * stock).", "medium", "read",
     "SELECT category, SUM(price * stock) AS stock_value FROM products GROUP BY category ORDER BY stock_value DESC, category"),
    ("commerce", "orders-in-march-2024", "Orders in March 2024", "Order ids placed in March 2024.", "easy", "read",
     "SELECT id FROM orders WHERE order_date >= DATE '2024-03-01' AND order_date < DATE '2024-04-01' ORDER BY id"),
    ("commerce", "shipped-not-completed", "Shipped orders not completed", "Order ids with status shipped.", "easy", "read",
     "SELECT id FROM orders WHERE status = 'shipped' ORDER BY id"),
    ("commerce", "quantity-sold-by-product", "Quantity sold by product", "Product name and SUM(quantity) from order_items.", "medium", "read",
     "SELECT p.name, SUM(oi.quantity) AS qty FROM products p JOIN order_items oi ON oi.product_id = p.id GROUP BY p.name ORDER BY qty DESC, p.name"),
    ("commerce", "customers-signed-up-q1-2023", "Customers who signed up in Q1 2023", "Names with signup_date in Jan–Mar 2023.", "easy", "read",
     "SELECT name FROM customers WHERE signup_date >= DATE '2023-01-01' AND signup_date < DATE '2023-04-01' ORDER BY name"),
    ("commerce", "orders-with-more-than-one-item", "Orders with more than one line", "order_ids having COUNT(order_items) > 1.", "easy", "read",
     "SELECT order_id FROM order_items GROUP BY order_id HAVING COUNT(*) > 1 ORDER BY order_id"),
    ("commerce", "most-expensive-product", "Most expensive product", "Name of the product with the highest price.", "easy", "read",
     "SELECT name FROM products ORDER BY price DESC, name LIMIT 1"),
    ("commerce", "rank-customers-by-order-count", "Rank customers by order count", "Customer name and RANK by number of orders.", "medium", "read",
     "SELECT c.name, RANK() OVER (ORDER BY COUNT(o.id) DESC) AS order_rank FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.name ORDER BY order_rank, c.name"),
    ("commerce", "reduce-mouse-stock", "Reduce wireless mouse stock by 5", "Subtract 5 from stock for Wireless Mouse.", "easy", "write",
     "UPDATE products SET stock = stock - 5 WHERE name = 'Wireless Mouse'"),
    ("ops-logistics", "warehouses-by-capacity", "Warehouses by capacity", "Warehouse name and capacity, largest first.", "easy", "read",
     "SELECT name, capacity FROM warehouses ORDER BY capacity DESC, name"),
    ("ops-logistics", "in-transit-shipments", "In-transit shipments", "Shipment ids with status in_transit or equivalent in-transit wording in data. List ids whose status is not delivered.", "easy", "read",
     "SELECT id FROM shipments WHERE status <> 'delivered' ORDER BY id"),
    ("ops-logistics", "inventory-by-warehouse", "Inventory units by warehouse", "Warehouse name and SUM(quantity).", "easy", "read",
     "SELECT w.name, COALESCE(SUM(i.quantity), 0) AS units FROM warehouses w LEFT JOIN inventory i ON i.warehouse_id = w.id GROUP BY w.name ORDER BY units DESC, w.name"),
    ("ops-logistics", "products-needing-reorder", "Products at or below reorder level", "product_name where quantity <= reorder_level.", "easy", "read",
     "SELECT product_name FROM inventory WHERE quantity <= reorder_level ORDER BY product_name"),
    ("ops-logistics", "carrier-types", "Carrier types in use", "Distinct carrier types.", "easy", "read",
     "SELECT DISTINCT type FROM carriers ORDER BY type"),
    ("ops-logistics", "avg-cost-by-carrier", "Average shipment cost by carrier", "Carrier name and AVG(cost).", "medium", "read",
     "SELECT c.name, AVG(sc.cost) AS avg_cost FROM carriers c JOIN shipment_carriers sc ON sc.carrier_id = c.id GROUP BY c.name ORDER BY avg_cost DESC, c.name"),
    ("ops-logistics", "shipments-same-city-forbidden", "Shipments between different warehouses", "Shipment ids where origin != dest.", "easy", "read",
     "SELECT id FROM shipments WHERE origin_warehouse_id <> dest_warehouse_id ORDER BY id"),
    ("ops-logistics", "heaviest-shipment", "Heaviest shipment", "Id of the shipment with max weight_kg.", "easy", "read",
     "SELECT id FROM shipments ORDER BY weight_kg DESC, id LIMIT 1"),
    ("ops-logistics", "warehouse-net-outbound", "Outbound shipment count by origin warehouse", "Warehouse name and COUNT of shipments originating there.", "medium", "read",
     "SELECT w.name, COUNT(s.id) AS outbound FROM warehouses w LEFT JOIN shipments s ON s.origin_warehouse_id = w.id GROUP BY w.name ORDER BY outbound DESC, w.name"),
    ("ops-logistics", "undelivered-with-date", "Undelivered shipments that have a delivery_date", "Ids with delivery_date IS NOT NULL and status <> delivered — or none.", "medium", "read",
     "SELECT id FROM shipments WHERE delivery_date IS NOT NULL AND status <> 'delivered' ORDER BY id"),
    ("ops-logistics", "multi-carrier-shipments", "Shipments with more than one carrier", "shipment_id appearing more than once in shipment_carriers.", "medium", "read",
     "SELECT shipment_id FROM shipment_carriers GROUP BY shipment_id HAVING COUNT(*) > 1 ORDER BY shipment_id"),
    ("ops-logistics", "total-carrier-spend", "Total carrier spend", "SUM of shipment_carriers.cost.", "easy", "read",
     "SELECT SUM(cost) AS total_cost FROM shipment_carriers"),
    ("ops-logistics", "rank-warehouses-by-capacity", "Rank warehouses by capacity", "Name and RANK by capacity desc.", "easy", "read",
     "SELECT name, RANK() OVER (ORDER BY capacity DESC) AS cap_rank FROM warehouses ORDER BY cap_rank, name"),
    ("ops-logistics", "shipments-in-march", "Shipments that left in March 2024", "Ids with ship_date in March 2024.", "easy", "read",
     "SELECT id FROM shipments WHERE ship_date >= DATE '2024-03-01' AND ship_date < DATE '2024-04-01' ORDER BY id"),
    ("ops-logistics", "mark-shipment-delivered", "Mark shipment 1 delivered", "Set status delivered and delivery_date 2024-03-20 for id 1.", "easy", "write",
     "UPDATE shipments SET status = 'delivered', delivery_date = DATE '2024-03-20' WHERE id = 1"),
]


def emit(spec: tuple[str, str, str, str, str, str, str]) -> Path | None:
    dataset, slug, title, desc, difficulty, mode, sql = spec
    dest = PROBLEMS_DIR / dataset / f"{slug}.yaml"
    if dest.exists():
        return None
    dest.parent.mkdir(parents=True, exist_ok=True)
    sample = "\n".join(f'  - "{t}"' for t in TABLES[dataset])
    body = f"""id: "{uuidv7()}"
slug: "{slug}"
title: "{title}"
description: |
  {desc}
difficulty: {difficulty}
mode: {mode}
category: {dataset}
datasets:
  - {dataset}
sampleInput:
{sample}
sampleOutput: "gold-diff"
initSql: |
  -- Dataset: {dataset}
solutionSql: |
{chr(10).join("  " + line if line else "  " for line in sql.strip().splitlines())}
validationSql: |
  SELECT 1 AS ok
orderMatters: true
origin: first-party
author: "maverickreal"
license: "CC-BY-4.0"
schema_version: 1
"""
    dest.write_text(body)
    return dest


def main() -> None:
    written = 0
    skipped = 0
    for spec in SPECS:
        if emit(spec) is None:
            skipped += 1
        else:
            written += 1
            time.sleep(0.002)
    print(f"written={written} skipped_existing={skipped} specs={len(SPECS)}")


if __name__ == "__main__":
    main()
