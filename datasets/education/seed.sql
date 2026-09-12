-- Education dataset seed
INSERT INTO students (id, name, cohort_year, major) VALUES
    (1, 'Mina Patel', 2023, 'CS'),
    (2, 'Omar Haddad', 2023, 'CS'),
    (3, 'Lina Berg', 2022, 'Math'),
    (4, 'Kenji Sato', 2024, 'Physics'),
    (5, 'Nora Klein', 2022, 'CS'),
    (6, 'Theo Rossi', 2024, 'Math');

INSERT INTO courses (id, code, title, credits, dept) VALUES
    (1, 'CS101', 'Intro to Programming', 4, 'CS'),
    (2, 'CS201', 'Data Structures', 4, 'CS'),
    (3, 'MATH200', 'Linear Algebra', 3, 'Math'),
    (4, 'PHYS110', 'Mechanics', 4, 'Physics'),
    (5, 'CS310', 'Databases', 3, 'CS'),
    (6, 'MATH310', 'Probability', 3, 'Math');

INSERT INTO enrollments (student_id, course_id, term) VALUES
    (1, 1, '2024F'), (1, 2, '2025S'), (1, 5, '2025S'),
    (2, 1, '2024F'), (2, 3, '2024F'),
    (3, 3, '2024F'), (3, 6, '2025S'),
    (4, 4, '2024F'),
    (5, 2, '2024F'), (5, 5, '2024F'), (5, 6, '2025S'),
    (6, 3, '2025S');

INSERT INTO grades (student_id, course_id, term, letter, points) VALUES
    (1, 1, '2024F', 'A', 4.00),
    (1, 2, '2025S', 'B+', 3.30),
    (2, 1, '2024F', 'A-', 3.70),
    (2, 3, '2024F', 'B', 3.00),
    (3, 3, '2024F', 'A', 4.00),
    (4, 4, '2024F', 'B-', 2.70),
    (5, 2, '2024F', 'A', 4.00),
    (5, 5, '2024F', 'A-', 3.70);

INSERT INTO instructors (id, name, dept) VALUES
    (1, 'Dr. Shaw', 'CS'),
    (2, 'Dr. Okonkwo', 'Math'),
    (3, 'Dr. Alvarez', 'Physics'),
    (4, 'Dr. Bergstrom', 'CS');

INSERT INTO course_instructors (course_id, instructor_id, term) VALUES
    (1, 1, '2024F'),
    (2, 4, '2024F'),
    (2, 4, '2025S'),
    (3, 2, '2024F'),
    (3, 2, '2025S'),
    (4, 3, '2024F'),
    (5, 1, '2024F'),
    (5, 1, '2025S'),
    (6, 2, '2025S');
