-- Education dataset schema
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cohort_year INT NOT NULL,
    major VARCHAR(50) NOT NULL
);

CREATE TABLE courses (
    id INT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    credits INT NOT NULL,
    dept VARCHAR(50) NOT NULL
);

CREATE TABLE enrollments (
    student_id INT NOT NULL REFERENCES students(id),
    course_id INT NOT NULL REFERENCES courses(id),
    term VARCHAR(20) NOT NULL,
    PRIMARY KEY (student_id, course_id, term)
);

CREATE TABLE grades (
    student_id INT NOT NULL REFERENCES students(id),
    course_id INT NOT NULL REFERENCES courses(id),
    term VARCHAR(20) NOT NULL,
    letter VARCHAR(2) NOT NULL,
    points DECIMAL(3,2) NOT NULL,
    PRIMARY KEY (student_id, course_id, term)
);

CREATE TABLE instructors (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dept VARCHAR(50) NOT NULL
);

CREATE TABLE course_instructors (
    course_id INT NOT NULL REFERENCES courses(id),
    instructor_id INT NOT NULL REFERENCES instructors(id),
    term VARCHAR(20) NOT NULL,
    PRIMARY KEY (course_id, instructor_id, term)
);
