# Content dataset

A publishing/content schema for SQL problems: authors, articles, comments, tags, article-tag mappings, and likes. Deterministic seed for reproducible tests.

## Tables

- `authors` — 4 content authors
- `articles` — 9 articles with categories and statuses
- `comments` — 8 reader comments on articles
- `tags` — 6 content tags
- `article_tags` — many-to-many article-tag mapping
- `likes` — 12 article likes by users
