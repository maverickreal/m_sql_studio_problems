-- Content dataset seed data
INSERT INTO authors (id, name, email, joined_date) VALUES
    (1, 'Alice Chen', 'alice@content.com', '2023-01-10'),
    (2, 'Bob Rivera', 'bob@content.com', '2023-02-15'),
    (3, 'Carol Nguyen', 'carol@content.com', '2023-03-20'),
    (4, 'David Kim', 'david@content.com', '2023-04-05');

INSERT INTO articles (id, title, author_id, category, published_date, word_count, status) VALUES
    (1, 'Getting Started with SQL', 1, 'Tutorial', '2024-01-10', 1200, 'published'),
    (2, 'Advanced Joins Explained', 1, 'Tutorial', '2024-02-05', 1800, 'published'),
    (3, 'Database Design Tips', 2, 'Guide', '2024-02-15', 950, 'published'),
    (4, 'Window Functions Deep Dive', 1, 'Tutorial', '2024-03-01', 2200, 'published'),
    (5, 'Indexing Strategies', 3, 'Performance', '2024-03-10', 1500, 'published'),
    (6, 'PostgreSQL vs MySQL', 2, 'Comparison', '2024-03-20', 1700, 'draft'),
    (7, 'CTE Best Practices', 3, 'Tutorial', '2024-04-01', 1300, 'published'),
    (8, 'Query Optimization', 4, 'Performance', '2024-04-10', 2000, 'published'),
    (9, 'Data Modeling Basics', 4, 'Guide', '2024-04-15', 1100, 'draft');

INSERT INTO comments (id, article_id, commenter_name, body, posted_date) VALUES
    (1, 1, 'Reader1', 'Great intro!', '2024-01-12'),
    (2, 1, 'Reader2', 'Very helpful', '2024-01-15'),
    (3, 2, 'Reader3', 'Joins finally make sense', '2024-02-08'),
    (4, 3, 'Reader1', 'Nice overview', '2024-02-18'),
    (5, 4, 'Reader4', 'Complex but clear', '2024-03-05'),
    (6, 5, 'Reader2', 'Practical tips', '2024-03-12'),
    (7, 7, 'Reader5', 'Thanks for sharing', '2024-04-03'),
    (8, 8, 'Reader1', 'Optimized my queries', '2024-04-12');

INSERT INTO tags (id, name) VALUES
    (1, 'sql'),
    (2, 'database'),
    (3, 'tutorial'),
    (4, 'performance'),
    (5, 'beginner'),
    (6, 'advanced');

INSERT INTO article_tags (article_id, tag_id) VALUES
    (1, 1), (1, 3), (1, 5),
    (2, 1), (2, 3), (2, 6),
    (3, 1), (3, 2),
    (4, 1), (4, 6),
    (5, 1), (5, 4),
    (6, 1), (6, 2),
    (7, 1), (7, 3),
    (8, 1), (8, 4),
    (9, 1), (9, 5);

INSERT INTO likes (id, article_id, user_name, liked_date) VALUES
    (1, 1, 'Reader1', '2024-01-11'),
    (2, 1, 'Reader2', '2024-01-12'),
    (3, 1, 'Reader3', '2024-01-13'),
    (4, 2, 'Reader1', '2024-02-06'),
    (5, 2, 'Reader4', '2024-02-07'),
    (6, 3, 'Reader5', '2024-02-16'),
    (7, 4, 'Reader2', '2024-03-02'),
    (8, 4, 'Reader3', '2024-03-03'),
    (9, 4, 'Reader5', '2024-03-04'),
    (10, 5, 'Reader1', '2024-03-11'),
    (11, 7, 'Reader4', '2024-04-02'),
    (12, 8, 'Reader2', '2024-04-11');
