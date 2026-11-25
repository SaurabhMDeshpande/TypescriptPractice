# How to Use This Book

This book is written for a **QA engineer with about 4 years of experience** preparing for interviews where SQL / MySQL is tested.
At this level, interviewers expect you to:

1. Write correct queries **live** (joins, GROUP BY, subqueries, window functions, "Nth highest salary"-type problems).
2. Explain concepts clearly (keys, constraints, normalization, indexes, transactions, ACID).
3. Explain **how you use SQL as a tester**: data validation, backend checks after UI/API actions, test data setup and clean-up, and DB checks inside automation frameworks.

**Every query in this book was run on a real MySQL-compatible server**, and the result tables shown are the real output.
Load the sample database with the file `sample_schema.sql` (in the same folder as this book) and practise along:

```bash
mysql -u root -p < sample_schema.sql
```

> Version note: window functions, CTEs (`WITH`) and enforced `CHECK` constraints need **MySQL 8.0+**.
> `INTERSECT` / `EXCEPT` need **MySQL 8.0.31+**. Interviewers usually assume MySQL 8.

## The Sample Database: `qa_company`

**departments**

| dept_id | dept_name   | location  |
|---------|-------------|-----------|
| 1       | Engineering | Pune      |
| 2       | QA          | Bangalore |
| 3       | HR          | Mumbai    |
| 4       | Sales       | Delhi     |
| 5       | Finance     | Pune      |

*Finance has no employees (useful for LEFT JOIN questions).*

**employees**

| emp_id | first_name | last_name | email           | gender | salary | hire_date  | dept_id | manager_id |
|--------|------------|-----------|-----------------|--------|--------|------------|---------|------------|
| 1  | Amit   | Sharma | amit@corp.com   | M | 150000 | 2015-03-10 | 1    | NULL |
| 2  | Priya  | Iyer   | priya@corp.com  | F | 120000 | 2016-07-01 | 1    | 1 |
| 3  | Rahul  | Verma  | rahul@corp.com  | M | 90000  | 2018-01-15 | 1    | 2 |
| 4  | Sneha  | Patil  | sneha@corp.com  | F | 90000  | 2019-05-20 | 2    | 1 |
| 5  | Vikram | Rao    | vikram@corp.com | M | 70000  | 2020-02-11 | 2    | 4 |
| 6  | Anjali | Gupta  | anjali@corp.com | F | 75000  | 2021-08-30 | 2    | 4 |
| 7  | Karan  | Mehta  | karan@corp.com  | M | 60000  | 2017-11-05 | 3    | 1 |
| 8  | Neha   | Joshi  | neha@corp.com   | F | 85000  | 2019-09-09 | 4    | 1 |
| 9  | Rohit  | Singh  | rohit@corp.com  | M | 95000  | 2022-04-18 | 4    | 8 |
| 10 | Pooja  | Nair   | NULL            | F | 50000  | 2023-01-02 | NULL | 4 |

*Two people share salary 90000 (for RANK vs DENSE_RANK). Pooja has no department and no email (for NULL questions). Rohit earns more than his manager Neha.*

**customers**

| customer_id | name        | email          | city   | signup_date |
|-------------|-------------|----------------|--------|-------------|
| 1 | Ravi Kumar  | ravi@mail.com  | Pune   | 2023-12-01 |
| 2 | Meera Shah  | meera@mail.com | Mumbai | 2023-12-15 |
| 3 | Arjun Das   | arjun@mail.com | Delhi  | 2024-01-10 |
| 4 | Kavya Reddy | kavya@mail.com | Pune   | 2024-02-01 |
| 5 | Ravi Kumar  | ravi@mail.com  | Pune   | 2024-03-01 |

*Customer 5 is a duplicate of customer 1. Kavya has never ordered.*

**products**

| product_id | name     | category    | price |
|------------|----------|-------------|-------|
| 1 | Laptop   | Electronics | 55000 |
| 2 | Mouse    | Electronics | 800   |
| 3 | Desk     | Furniture   | 12000 |
| 4 | Chair    | Furniture   | 7000  |
| 5 | Notebook | Stationery  | 100   |

**orders** and **order_items**

| order_id | customer_id | order_date | status    |
|----------|-------------|------------|-----------|
| 101 | 1 | 2024-01-05 | DELIVERED |
| 102 | 2 | 2024-01-20 | DELIVERED |
| 103 | 1 | 2024-02-11 | CANCELLED |
| 104 | 3 | 2024-02-15 | DELIVERED |
| 105 | 2 | 2024-03-01 | PENDING   |
| 106 | 1 | 2024-03-18 | DELIVERED |
| 107 | 5 | 2024-03-25 | DELIVERED |

| order_id | product_id | quantity | unit_price |
|----------|------------|----------|------------|
| 101 | 1 | 1 | 55000 |
| 101 | 2 | 2 | 800   |
| 102 | 3 | 1 | 12000 |
| 102 | 4 | 2 | 7000  |
| 103 | 2 | 1 | 800   |
| 104 | 1 | 1 | 55000 |
| 105 | 4 | 4 | 7000  |
| 106 | 2 | 3 | 800   |
| 106 | 3 | 1 | 12000 |
| 107 | 1 | 1 | 55000 |

**logins** (for the "consecutive days" question): user 1 logged in on Jan 1, 2, 3, 5; user 2 on Jan 1, 3; user 3 on Jan 10, 11, 12, 13 (all 2024).

<div class="pb"></div>

# PART A — CONCEPTS

# 1. Database Fundamentals

**Database** — an organised collection of data that is stored and accessed electronically.

**DBMS** — software used to create and manage databases (store, read, update, secure, back up).

**RDBMS (Relational DBMS)** — stores data in **tables** (relations) made of **rows** (records / tuples) and **columns** (fields / attributes). Tables are linked to each other through **keys**. Examples: MySQL, PostgreSQL, Oracle, SQL Server.

**SQL (Structured Query Language)** — the standard language used to talk to a relational database. **MySQL** is an open-source RDBMS (owned by Oracle) that uses SQL.

| Term | Meaning |
|------|---------|
| Table / Relation | Set of rows with the same columns |
| Row / Record / Tuple | One entry, e.g. one employee |
| Column / Field / Attribute | One property, e.g. salary |
| Schema | Structure of the database: tables, columns, types, constraints. In MySQL, `SCHEMA` and `DATABASE` mean the same thing |
| Degree | Number of columns in a table |
| Cardinality | Number of rows in a table (or the uniqueness of values in a column, when talking about indexes) |

**SQL vs NoSQL (frequently asked)**

| SQL (MySQL) | NoSQL (MongoDB, Cassandra, Redis) |
|-------------|-----------------------------------|
| Fixed schema, tables | Flexible schema: documents, key-value, column-family, graph |
| Strong ACID transactions | Often eventual consistency (many now support transactions) |
| Scales vertically (bigger server) mostly | Designed to scale horizontally (more servers) |
| Best for structured, related data (banking, orders) | Best for huge / unstructured / fast-changing data |

**MySQL storage engines** — **InnoDB** is the default: supports transactions, row-level locking and foreign keys. **MyISAM** (old): no transactions and no foreign keys, uses table-level locking. Interview line: *"We use InnoDB because it is ACID compliant and supports foreign keys."*

## 1.1 Categories of SQL Commands

| Category | Full form | Commands | Auto-commit? |
|----------|-----------|----------|--------------|
| **DDL** | Data Definition Language | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `RENAME` | Yes (implicit commit, cannot be rolled back) |
| **DML** | Data Manipulation Language | `INSERT`, `UPDATE`, `DELETE` (some include `MERGE`) | No, can be rolled back inside a transaction |
| **DQL** | Data Query Language | `SELECT` | — |
| **DCL** | Data Control Language | `GRANT`, `REVOKE` | Yes |
| **TCL** | Transaction Control Language | `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `START TRANSACTION` | — |

# 2. Data Types

| Group | Types | Notes |
|-------|-------|-------|
| Integer | `TINYINT` (1 byte), `SMALLINT` (2), `MEDIUMINT` (3), `INT` (4), `BIGINT` (8) | `UNSIGNED` doubles the positive range |
| Exact decimal | `DECIMAL(p,s)` / `NUMERIC` | Use for **money**. `DECIMAL(10,2)` = 8 digits before the point, 2 after |
| Approximate | `FLOAT`, `DOUBLE` | Rounding errors, never use for money |
| Fixed string | `CHAR(n)` | Always n characters (padded). Fast. Good for codes like 'M', 'IN' |
| Variable string | `VARCHAR(n)` | Stores only the actual length (+1–2 bytes). Max 65,535 bytes per row |
| Long text | `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT` | Cannot have a DEFAULT; indexing needs a prefix length |
| Date / time | `DATE` (YYYY-MM-DD), `TIME`, `DATETIME`, `TIMESTAMP`, `YEAR` | See below |
| Others | `ENUM('A','B')`, `SET`, `BOOLEAN` (= `TINYINT(1)`), `JSON`, `BLOB` | |

**CHAR vs VARCHAR** — `CHAR(10)` always uses 10 characters of storage, `VARCHAR(10)` uses only what is stored. Use CHAR for fixed-length values and VARCHAR for names, emails, etc.

**DATETIME vs TIMESTAMP**

| DATETIME | TIMESTAMP |
|----------|-----------|
| Range 1000-01-01 to 9999-12-31 | Range 1970-01-01 to 2038-01-19 (UTC) |
| Stored as is, no time-zone conversion | Stored in UTC, converted to the session time zone when read |
| 5 bytes (+ fractional seconds) | 4 bytes (+ fractional seconds) |

QA angle: time-zone bugs (an order placed at 11:30 PM shows the next date) often come from TIMESTAMP conversion or from the app server and DB server being in different time zones.

# 3. DDL — Creating and Changing Structure

```sql
CREATE DATABASE qa_company;
USE qa_company;
SHOW DATABASES;
SHOW TABLES;
DESCRIBE employees;          -- or DESC employees; shows columns, types, keys
SHOW CREATE TABLE employees; -- full DDL including constraints and indexes
```

**CREATE TABLE**

```sql
CREATE TABLE employees (
  emp_id      INT PRIMARY KEY AUTO_INCREMENT,
  first_name  VARCHAR(50)  NOT NULL,
  email       VARCHAR(100) UNIQUE,
  gender      CHAR(1)      CHECK (gender IN ('M','F')),
  salary      DECIMAL(10,2) NOT NULL CHECK (salary > 0),
  hire_date   DATE NOT NULL,
  dept_id     INT,
  manager_id  INT,
  CONSTRAINT fk_emp_dept FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
  CONSTRAINT fk_emp_mgr  FOREIGN KEY (manager_id) REFERENCES employees(emp_id)
);

-- copy structure only
CREATE TABLE employees_backup LIKE employees;
-- copy structure + data (constraints/indexes are NOT copied)
CREATE TABLE emp_copy AS SELECT * FROM employees;
-- copy structure only, using a false condition
CREATE TABLE emp_empty AS SELECT * FROM employees WHERE 1 = 0;
```

**ALTER TABLE**

```sql
ALTER TABLE employees ADD COLUMN phone VARCHAR(15);
ALTER TABLE employees ADD COLUMN middle_name VARCHAR(50) AFTER first_name;
ALTER TABLE employees MODIFY COLUMN phone VARCHAR(20) NOT NULL;      -- change type/constraint
ALTER TABLE employees CHANGE COLUMN phone mobile VARCHAR(20);        -- rename + type
ALTER TABLE employees RENAME COLUMN mobile TO contact_no;             -- MySQL 8
ALTER TABLE employees DROP COLUMN contact_no;
ALTER TABLE employees ADD CONSTRAINT uq_email UNIQUE (email);
ALTER TABLE employees DROP FOREIGN KEY fk_emp_dept;
ALTER TABLE employees ADD INDEX idx_salary (salary);
RENAME TABLE emp_copy TO emp_archive;
```

**DROP vs TRUNCATE vs DELETE — the most asked question**

| | DELETE | TRUNCATE | DROP |
|---|--------|----------|------|
| Type | DML | DDL | DDL |
| What it removes | Selected rows (`WHERE` allowed) or all rows | All rows | Whole table: data + structure + indexes + triggers |
| WHERE clause | Yes | No | No |
| Rollback | Yes (inside a transaction) | No (implicit commit) | No |
| Triggers | Fires `DELETE` triggers | Does not fire triggers | — |
| AUTO_INCREMENT | Not reset | Reset to 1 | Gone |
| Speed | Slow (row by row, logged) | Fast (recreates the table) | Fast |
| Foreign key | Allowed, rows checked | Fails if another table references it | Fails if referenced |

```sql
DELETE FROM orders WHERE status = 'CANCELLED';
TRUNCATE TABLE logins;
DROP TABLE IF EXISTS emp_archive;
```

# 4. Constraints and Keys

Constraints are rules that protect data integrity.

| Constraint | Purpose |
|------------|---------|
| `NOT NULL` | Column must have a value |
| `UNIQUE` | No duplicate values (NULL is allowed, and **multiple NULLs are allowed** in MySQL) |
| `PRIMARY KEY` | Uniquely identifies each row = UNIQUE + NOT NULL. **Only one per table** (it can span several columns) |
| `FOREIGN KEY` | Value must exist in the referenced (parent) table — referential integrity |
| `CHECK` | Value must satisfy a condition (enforced from MySQL 8.0.16) |
| `DEFAULT` | Value used when none is supplied |
| `AUTO_INCREMENT` | Automatically generates the next number (usually for the PK) |

**Types of keys**

| Key | Definition | Example |
|-----|------------|---------|
| Super key | Any set of columns that uniquely identifies a row | {emp_id}, {emp_id, email} |
| Candidate key | A minimal super key (no extra column) | emp_id, email |
| Primary key | The candidate key chosen as the main identifier | emp_id |
| Alternate key | Candidate keys not chosen as PK | email |
| Composite key | Key made of 2+ columns | (order_id, product_id) in order_items |
| Foreign key | Column referring to a PK/unique key of another table | employees.dept_id → departments.dept_id |
| Surrogate key | Artificial key with no business meaning | AUTO_INCREMENT id |
| Natural key | Real-world key | PAN number, email |

**PRIMARY KEY vs UNIQUE KEY**

| Primary Key | Unique Key |
|-------------|------------|
| Only one per table | Many per table |
| NULL not allowed | NULL allowed (multiple NULLs) |
| Creates the clustered index in InnoDB | Creates a non-clustered (secondary) index |

**Foreign key actions** — what happens to child rows when the parent row is deleted/updated:

```sql
FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
  ON DELETE CASCADE      -- delete the child rows too
  ON UPDATE CASCADE;     -- update child values too
-- other options: ON DELETE SET NULL, RESTRICT / NO ACTION (default: block the delete)
```

QA test idea: delete a customer through the app or API and verify in the DB that their orders were deleted (CASCADE) **or** that the delete was blocked with a proper error (RESTRICT), as the requirement says. Also test that inserting an order for a non-existent customer fails:

```sql
INSERT INTO orders VALUES (999, 77, '2024-04-01', 'PENDING');
-- ERROR 1452: Cannot add or update a child row: a foreign key constraint fails
```

# 5. DML — INSERT, UPDATE, DELETE

```sql
-- single row, all columns in table order
INSERT INTO departments VALUES (6, 'Support', 'Chennai');
-- named columns (recommended — safe if the table changes)
INSERT INTO departments (dept_id, dept_name) VALUES (7, 'Legal');
-- multiple rows at once
INSERT INTO products (product_id, name, category, price)
VALUES (6, 'Monitor', 'Electronics', 9000),
       (7, 'Pen', 'Stationery', 20);
-- copy rows from another table
INSERT INTO employees_backup SELECT * FROM employees WHERE dept_id = 2;

-- insert, or update if the PK/UNIQUE value already exists (upsert)
INSERT INTO products (product_id, name, category, price)
VALUES (2, 'Mouse', 'Electronics', 850)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- ignore rows that would violate a unique key instead of failing
INSERT IGNORE INTO departments VALUES (1, 'Engineering', 'Pune');

-- REPLACE = delete the old row + insert a new one when a key matches
REPLACE INTO departments VALUES (6, 'Support', 'Hyderabad');
```

```sql
UPDATE employees SET salary = salary * 1.10 WHERE dept_id = 2;        -- 10% hike for QA
UPDATE employees SET salary = 80000, dept_id = 2 WHERE emp_id = 10;   -- many columns

-- UPDATE with JOIN: 5% hike for everyone located in Pune
UPDATE employees e
JOIN departments d ON e.dept_id = d.dept_id
SET e.salary = e.salary * 1.05
WHERE d.location = 'Pune';

DELETE FROM orders WHERE order_date < '2024-01-01';
-- DELETE with JOIN: delete items of cancelled orders
DELETE oi FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status = 'CANCELLED';
```

> **Safe-update tip:** an `UPDATE`/`DELETE` without `WHERE` changes every row. Before running it, run the same `WHERE` as a `SELECT` to see which rows will be hit, and do it inside `START TRANSACTION` so you can `ROLLBACK`. MySQL Workbench enables `SQL_SAFE_UPDATES`, which blocks updates without a key in the WHERE clause.

# 6. SELECT — Querying Data

```sql
SELECT * FROM employees;                                   -- all columns
SELECT first_name, salary FROM employees;                  -- selected columns
SELECT first_name AS name, salary * 12 AS annual_salary FROM employees;   -- alias + expression
SELECT DISTINCT dept_id FROM employees;                    -- unique values
SELECT * FROM employees ORDER BY salary DESC, first_name ASC;
SELECT * FROM employees ORDER BY salary DESC LIMIT 3;      -- top 3
SELECT * FROM employees LIMIT 3 OFFSET 3;                  -- rows 4–6 (pagination)
SELECT * FROM employees LIMIT 3, 3;                        -- same: LIMIT offset, count
```

**WHERE operators**

| Operator | Example |
|----------|---------|
| `=, <>, !=, >, <, >=, <=` | `salary >= 90000` |
| `AND, OR, NOT` | `dept_id = 2 AND gender = 'F'` |
| `BETWEEN a AND b` (inclusive) | `salary BETWEEN 60000 AND 90000` |
| `IN (...)` / `NOT IN` | `dept_id IN (1, 2)` |
| `LIKE` | `'A%'` starts with A, `'%a'` ends with a, `'%it%'` contains, `'_a%'` 2nd letter is a |
| `IS NULL` / `IS NOT NULL` | `email IS NULL` (never `= NULL`) |
| `REGEXP` | `first_name REGEXP '^[AP]'` starts with A or P |

`%` = any number of characters (including zero), `_` = exactly one character. To search for a literal `%` or `_`, escape it: `LIKE '%\_%'`.

**Example:** names that start with "A" or end with "a"

```sql
SELECT first_name FROM employees WHERE first_name LIKE 'A%' OR first_name LIKE '%a';
```

| first_name |
|------------|
| Amit |
| Priya |
| Sneha |
| Anjali |
| Neha |
| Pooja |

**Operator precedence trap:** `AND` is evaluated before `OR`. `WHERE dept_id = 1 OR dept_id = 2 AND salary > 80000` means `dept_id = 1 OR (dept_id = 2 AND salary > 80000)`. Use brackets.

## 6.1 Logical Order of Execution (very important)

You **write** a query in this order: `SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT`.
MySQL **executes** it in this order:

| Step | Clause | What happens |
|------|--------|--------------|
| 1 | `FROM` / `JOIN` | Get the tables and join them |
| 2 | `WHERE` | Filter rows |
| 3 | `GROUP BY` | Make groups |
| 4 | `HAVING` | Filter groups |
| 5 | `SELECT` | Compute columns, window functions, aliases |
| 6 | `DISTINCT` | Remove duplicates |
| 7 | `ORDER BY` | Sort |
| 8 | `LIMIT` / `OFFSET` | Cut the result |

This explains common errors: you **cannot use a SELECT alias in WHERE** (WHERE runs before SELECT), and you **cannot use aggregate functions in WHERE** (groups do not exist yet) — use HAVING. You *can* use an alias in ORDER BY. (MySQL also allows aliases in GROUP BY and HAVING as an extension.)

# 7. NULL Handling

NULL means *unknown / missing*. It is not 0 and not an empty string.

- Any comparison with NULL gives NULL (unknown), so `WHERE email = NULL` returns nothing. Use `IS NULL`.
- Arithmetic with NULL gives NULL: `5 + NULL = NULL`.
- Aggregate functions **ignore NULLs** (except `COUNT(*)`).

```sql
SELECT NULL = NULL, NULL IS NULL, 5 + NULL, IFNULL(NULL,'x'), COALESCE(NULL,NULL,3), NULLIF(5,5);
```

| NULL = NULL | NULL IS NULL | 5 + NULL | IFNULL(NULL,'x') | COALESCE(NULL,NULL,3) | NULLIF(5,5) |
|-------------|--------------|----------|------------------|-----------------------|-------------|
| NULL | 1 | NULL | x | 3 | NULL |

| Function | Meaning |
|----------|---------|
| `IFNULL(a, b)` | b if a is NULL, otherwise a (MySQL specific, 2 arguments) |
| `COALESCE(a, b, c, ...)` | First non-NULL value (ANSI standard, many arguments) |
| `NULLIF(a, b)` | NULL if a = b, otherwise a. Classic use: avoid divide-by-zero → `x / NULLIF(y, 0)` |
| `ISNULL(a)` | 1 if a is NULL, else 0 |

**COUNT(\*) vs COUNT(column) vs COUNT(DISTINCT column)**

```sql
SELECT COUNT(*), COUNT(email), COUNT(dept_id), COUNT(DISTINCT dept_id) FROM employees;
```

| COUNT(\*) | COUNT(email) | COUNT(dept_id) | COUNT(DISTINCT dept_id) |
|----------|--------------|----------------|-------------------------|
| 10 | 9 | 9 | 4 |

`COUNT(*)` counts all rows; `COUNT(col)` skips NULLs (Pooja has no email and no dept); `COUNT(DISTINCT col)` counts unique non-NULL values. `COUNT(1)` is the same as `COUNT(*)`.

**ORDER BY and NULL:** in MySQL NULLs come **first** in ASC order and **last** in DESC order.

<div class="pb"></div>
