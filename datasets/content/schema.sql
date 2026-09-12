-- Content dataset schema
CREATE TABLE authors (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    joined_date DATE NOT NULL
);

CREATE TABLE articles (
    id INT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author_id INT NOT NULL REFERENCES authors(id),
    category VARCHAR(50) NOT NULL,
    published_date DATE NOT NULL,
    word_count INT NOT NULL,
    status VARCHAR(20) NOT NULL
);

CREATE TABLE comments (
    id INT PRIMARY KEY,
    article_id INT NOT NULL REFERENCES articles(id),
    commenter_name VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    posted_date DATE NOT NULL
);

CREATE TABLE tags (
    id INT PRIMARY KEY,
    name VARCHAR(30) NOT NULL
);

CREATE TABLE article_tags (
    article_id INT NOT NULL REFERENCES articles(id),
    tag_id INT NOT NULL REFERENCES tags(id),
    PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE likes (
    id INT PRIMARY KEY,
    article_id INT NOT NULL REFERENCES articles(id),
    user_name VARCHAR(100) NOT NULL,
    liked_date DATE NOT NULL
);
