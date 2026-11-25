# 8. Built-in Functions

## 8.1 String Functions

| Function | Example | Result |
|----------|---------|--------|
| `CONCAT(a, b, ...)` | `CONCAT('Amit',' ','Sharma')` | Amit Sharma (NULL if any arg is NULL) |
| `CONCAT_WS(sep, a, b)` | `CONCAT_WS('-', '2024','01')` | 2024-01 (skips NULLs) |
| `LENGTH(s)` / `CHAR_LENGTH(s)` | `LENGTH('Amit')` | 4 (LENGTH counts bytes, CHAR_LENGTH counts characters) |
| `UPPER(s)` / `LOWER(s)` | `UPPER('qa')` | QA |
| `SUBSTRING(s, pos, len)` | `SUBSTRING('Testing', 1, 4)` | Test (positions start at 1) |
| `LEFT(s, n)` / `RIGHT(s, n)` | `RIGHT('Testing', 3)` | ing |
| `INSTR(s, sub)` / `LOCATE(sub, s)` | `INSTR('a@b.com','@')` | 2 |
| `SUBSTRING_INDEX(s, delim, n)` | `SUBSTRING_INDEX('a@b.com','@',-1)` | b.com |
| `TRIM / LTRIM / RTRIM` | `TRIM('  hi  ')` | hi |
| `REPLACE(s, from, to)` | `REPLACE('QA-Team','-',' ')` | QA Team |
| `REVERSE(s)` | `REVERSE('abc')` | cba |
| `LPAD / RPAD` | `LPAD('7', 3, '0')` | 007 |

**Example:** split an email into username and domain

```sql
SELECT CONCAT(first_name,' ',last_name) AS full_name,
       UPPER(last_name),
       SUBSTRING(email, 1, INSTR(email,'@') - 1) AS username,
       SUBSTRING_INDEX(email, '@', -1)           AS domain
FROM employees WHERE emp_id IN (1, 2);
```

| full_name | UPPER(last_name) | username | domain |
|-----------|------------------|----------|--------|
| Amit Sharma | SHARMA | amit | corp.com |
| Priya Iyer | IYER | priya | corp.com |

## 8.2 Numeric Functions

| Function | Example | Result |
|----------|---------|--------|
| `ROUND(x, d)` | `ROUND(78333.333, 2)` | 78333.33 |
| `CEIL(x)` / `FLOOR(x)` | `CEIL(4.1)`, `FLOOR(4.9)` | 5, 4 |
| `TRUNCATE(x, d)` | `TRUNCATE(4.567, 1)` | 4.5 (cuts, does not round) |
| `MOD(a, b)` / `a % b` | `MOD(7, 2)` | 1 |
| `ABS(x)`, `POWER(x,y)`, `SQRT(x)` | `POWER(2,3)` | 8 |
| `RAND()` | `ORDER BY RAND() LIMIT 1` | random row |

## 8.3 Date and Time Functions

| Function | Example / Meaning |
|----------|-------------------|
| `NOW()` / `CURRENT_TIMESTAMP` | current date + time |
| `CURDATE()` / `CURTIME()` | current date / time |
| `YEAR(d), MONTH(d), DAY(d), DAYNAME(d), MONTHNAME(d)` | parts of a date |
| `DATE_ADD(d, INTERVAL n unit)` / `DATE_SUB` | `DATE_ADD('2024-01-31', INTERVAL 1 MONTH)` → 2024-02-29 |
| `DATEDIFF(d1, d2)` | days between: `DATEDIFF('2024-02-11','2024-01-05')` → 37 |
| `TIMESTAMPDIFF(unit, d1, d2)` | difference in YEAR / MONTH / DAY / HOUR... |
| `DATE_FORMAT(d, fmt)` | `DATE_FORMAT('2024-03-18','%d-%b-%Y')` → 18-Mar-2024 |
| `STR_TO_DATE(s, fmt)` | `STR_TO_DATE('18/03/2024','%d/%m/%Y')` → 2024-03-18 |
| `LAST_DAY(d)` | last day of that month |
| `DATE(datetime)` | date part only |

```sql
SELECT first_name, hire_date,
       TIMESTAMPDIFF(YEAR, hire_date, '2026-01-01') AS yrs,
       DATE_ADD(hire_date, INTERVAL 6 MONTH)        AS probation_end,
       DAYNAME(hire_date)
FROM employees WHERE emp_id IN (1, 9);
```

| first_name | hire_date | yrs | probation_end | DAYNAME(hire_date) |
|------------|-----------|-----|---------------|--------------------|
| Amit | 2015-03-10 | 10 | 2015-09-10 | Tuesday |
| Rohit | 2022-04-18 | 3 | 2022-10-18 | Monday |

(In real use, replace `'2026-01-01'` with `CURDATE()`.)

## 8.4 Conditional Logic: CASE and IF

```sql
SELECT first_name, salary,
       CASE
         WHEN salary >= 100000 THEN 'High'
         WHEN salary >= 75000  THEN 'Medium'
         ELSE 'Low'
       END AS band
FROM employees ORDER BY salary DESC;
```

| first_name | salary | band |
|------------|--------|------|
| Amit | 150000 | High |
| Priya | 120000 | High |
| Rohit | 95000 | Medium |
| Rahul | 90000 | Medium |
| Sneha | 90000 | Medium |
| Neha | 85000 | Medium |
| Anjali | 75000 | Medium |
| Vikram | 70000 | Low |
| Karan | 60000 | Low |
| Pooja | 50000 | Low |

`IF(condition, value_if_true, value_if_false)` is MySQL's short form: `IF(salary > 80000, 'Yes', 'No')`. CASE is ANSI standard and works in every database, so prefer it in interviews. CASE can be used in SELECT, WHERE, ORDER BY, GROUP BY and inside aggregates (see the pivot question in Part B).

# 9. Aggregate Functions, GROUP BY and HAVING

Aggregate functions turn many rows into one value: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `GROUP_CONCAT`.

```sql
SELECT COUNT(*), SUM(salary), AVG(salary), MIN(salary), MAX(salary) FROM employees;
-- 10 | 885000.00 | 88500.00 | 50000.00 | 150000.00
```

**GROUP BY** makes one group per distinct value, and the aggregate is calculated per group.

```sql
SELECT d.dept_name,
       COUNT(e.emp_id)          AS emp_count,
       ROUND(AVG(e.salary), 2)  AS avg_salary
FROM departments d
LEFT JOIN employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name
ORDER BY emp_count DESC, d.dept_name;
```

| dept_name | emp_count | avg_salary |
|-----------|-----------|------------|
| Engineering | 3 | 120000.00 |
| QA | 3 | 78333.33 |
| Sales | 2 | 90000.00 |
| HR | 1 | 60000.00 |
| Finance | 0 | NULL |

Note `COUNT(e.emp_id)` (not `COUNT(*)`) so that Finance shows 0 instead of 1.

**Rule:** every column in SELECT must either be inside an aggregate or be listed in GROUP BY. MySQL 8 enforces this with the `ONLY_FULL_GROUP_BY` SQL mode (otherwise error 1055).

**HAVING** filters groups (after GROUP BY). **WHERE** filters rows (before GROUP BY).

```sql
-- departments with more than 2 employees
SELECT dept_id, COUNT(*) FROM employees GROUP BY dept_id HAVING COUNT(*) > 2;
```

| dept_id | COUNT(\*) |
|---------|----------|
| 1 | 3 |
| 2 | 3 |

| WHERE | HAVING |
|-------|--------|
| Filters individual rows | Filters groups |
| Runs before GROUP BY | Runs after GROUP BY |
| Cannot use aggregate functions | Usually uses aggregate functions |
| Works with SELECT, UPDATE, DELETE | Only with SELECT |

Both together: `SELECT dept_id, AVG(salary) FROM employees WHERE gender = 'F' GROUP BY dept_id HAVING AVG(salary) > 80000;`

**GROUP_CONCAT** — join the values of a group into one string:

```sql
SELECT d.dept_name, GROUP_CONCAT(e.first_name ORDER BY e.first_name SEPARATOR ', ') AS members
FROM departments d JOIN employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name;
```

| dept_name | members |
|-----------|---------|
| Engineering | Amit, Priya, Rahul |
| HR | Karan |
| QA | Anjali, Sneha, Vikram |
| Sales | Neha, Rohit |

`WITH ROLLUP` adds subtotal / grand-total rows: `SELECT dept_id, SUM(salary) FROM employees GROUP BY dept_id WITH ROLLUP;`

<div class="pb"></div>

# 10. JOINS

A join combines rows from two or more tables based on a related column.

| Join | Returns |
|------|---------|
| `INNER JOIN` (or just `JOIN`) | Only rows that match in **both** tables |
| `LEFT JOIN` (LEFT OUTER) | **All rows of the left table** + matching rows of the right; NULLs where no match |
| `RIGHT JOIN` (RIGHT OUTER) | All rows of the right table + matching rows of the left |
| `FULL OUTER JOIN` | All rows from both. **MySQL does not support it** — emulate with `LEFT JOIN UNION RIGHT JOIN` |
| `CROSS JOIN` | Cartesian product: every row × every row (m × n rows) |
| `SELF JOIN` | A table joined to itself (employee → manager) |
| `NATURAL JOIN` | Joins automatically on same-named columns (risky, avoid) |

**Join diagram (sets)**

```
   INNER            LEFT             RIGHT            FULL OUTER
  (A ∩ B)         (all A)           (all B)          (A ∪ B)
  A [##] B       A[####] B         A [####]B        A[######]B
```

**INNER JOIN** — employees with their department (Pooja has no department, so she is excluded): **9 rows**

```sql
SELECT e.first_name, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.dept_id;
```

**LEFT JOIN** — all employees, department if any: **10 rows** (Pooja appears with NULL dept_name).

**LEFT JOIN + IS NULL = "find the missing ones"** (anti-join) — departments with no employees:

```sql
SELECT d.dept_name
FROM departments d
LEFT JOIN employees e ON d.dept_id = e.dept_id
WHERE e.emp_id IS NULL;
```

| dept_name |
|-----------|
| Finance |

**FULL OUTER JOIN emulation**

```sql
SELECT e.first_name, d.dept_name FROM employees e LEFT  JOIN departments d ON e.dept_id = d.dept_id
UNION
SELECT e.first_name, d.dept_name FROM employees e RIGHT JOIN departments d ON e.dept_id = d.dept_id;
```

Result: 11 rows — the 9 matched pairs, plus `Pooja | NULL` and `NULL | Finance`.

**SELF JOIN** — employee with manager name:

```sql
SELECT e.first_name AS employee, COALESCE(m.first_name, 'No Manager') AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.emp_id;
```

| employee | manager |
|----------|---------|
| Amit | No Manager |
| Priya | Amit |
| Rahul | Priya |
| Sneha | Amit |
| Vikram | Sneha |
| Anjali | Sneha |
| Karan | Amit |
| Neha | Amit |
| Rohit | Neha |
| Pooja | Sneha |

**CROSS JOIN:** `SELECT COUNT(*) FROM departments CROSS JOIN products;` → **25** (5 × 5). Used to generate combinations, e.g. every size × every colour for test data.

**Joining 3+ tables** — revenue per customer:

```sql
SELECT c.name, SUM(oi.quantity * oi.unit_price) AS spent
FROM customers c
JOIN orders o       ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id    = oi.order_id
WHERE o.status = 'DELIVERED'
GROUP BY c.customer_id, c.name;
```

**ON vs WHERE in a LEFT JOIN (tricky)** — a condition on the right table in `WHERE` removes the NULL rows and turns the LEFT JOIN into an INNER JOIN. Put it in `ON` to keep all left rows:

```sql
-- keeps every customer; only DELIVERED orders are attached
SELECT c.name, o.order_id FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id AND o.status = 'DELIVERED';
```

**Interview question: Table A has 3 rows, B has 4 rows. How many rows can each join return?**
INNER: 0 to 12. LEFT: 3 to 12. RIGHT: 4 to 12. CROSS: always 12. (With duplicate key values a join can return more rows than either table — e.g. A = {1,1,1}, B = {1,1,1,1} → INNER returns 12.)

<div class="pb"></div>

# 11. Subqueries

A subquery is a query inside another query.

| Type | Returns | Example use |
|------|---------|-------------|
| Scalar | 1 value | `WHERE salary > (SELECT AVG(salary) FROM employees)` |
| Multi-row | 1 column, many rows | `WHERE dept_id IN (SELECT ...)` with `IN`, `ANY`, `ALL` |
| Multi-column | many columns | `WHERE (dept_id, salary) IN (SELECT dept_id, MAX(salary) ...)` |
| Correlated | Runs once per outer row, refers to the outer query | above-department-average |
| Derived table | Subquery in `FROM` (must have an alias) | `FROM (SELECT ...) AS t` |

**Scalar subquery** — employees earning more than the company average (88,500):

```sql
SELECT first_name, salary FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);
```

| first_name | salary |
|------------|--------|
| Amit | 150000 |
| Priya | 120000 |
| Rahul | 90000 |
| Sneha | 90000 |
| Rohit | 95000 |

**Correlated subquery** — employees earning more than **their own department's** average:

```sql
SELECT e.first_name, e.dept_id, e.salary
FROM employees e
WHERE e.salary > (SELECT AVG(x.salary) FROM employees x WHERE x.dept_id = e.dept_id);
```

| first_name | dept_id | salary |
|------------|---------|--------|
| Amit | 1 | 150000 |
| Sneha | 2 | 90000 |
| Rohit | 4 | 95000 |

**EXISTS / NOT EXISTS** — true as soon as one matching row is found:

```sql
SELECT dept_name FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id);   -- Finance
```

**IN vs EXISTS:** `IN` compares a value with a list returned by the subquery; `EXISTS` only checks whether any row exists and stops at the first match. EXISTS is usually better when the subquery is large and correlated; IN is fine for small lists. The optimizer in MySQL 8 often rewrites both into the same semi-join.

**The NOT IN + NULL trap (favourite tricky question)**

```sql
SELECT COUNT(*) FROM departments
WHERE dept_id NOT IN (SELECT dept_id FROM employees);     -- returns 0 !
```

The subquery contains a NULL (Pooja). `x NOT IN (1, 2, NULL)` means `x<>1 AND x<>2 AND x<>NULL`, and `x<>NULL` is unknown, so no row ever qualifies. Fix: add `WHERE dept_id IS NOT NULL` in the subquery (returns 1 — Finance), or use `NOT EXISTS`, which handles NULLs correctly.

**ANY / ALL:** `salary > ALL (SELECT salary FROM employees WHERE dept_id = 2)` = greater than the maximum of QA; `> ANY (...)` = greater than the minimum.

**Subquery vs JOIN:** joins are usually faster and easier to read for combining columns from tables; subqueries are clearer for "filter by an aggregate" logic. Most correlated subqueries can be rewritten as a join with a derived table.

# 12. Set Operators — UNION, UNION ALL, INTERSECT, EXCEPT

Rules: same number of columns, compatible data types; column names come from the first query.

| Operator | Meaning |
|----------|---------|
| `UNION` | Rows from both, **duplicates removed** (slower, needs a sort/distinct) |
| `UNION ALL` | Rows from both, **duplicates kept** (faster) |
| `INTERSECT` | Rows present in both (MySQL 8.0.31+) |
| `EXCEPT` | Rows in the first but not in the second (MySQL 8.0.31+; Oracle calls it MINUS) |

```sql
SELECT city FROM customers UNION SELECT location FROM departments;
-- Pune, Mumbai, Delhi, Bangalore   (4 rows)
SELECT city FROM customers UNION ALL SELECT location FROM departments;
-- 10 rows (5 + 5, duplicates kept)
SELECT city FROM customers INTERSECT SELECT location FROM departments;
-- Pune, Mumbai, Delhi
SELECT location FROM departments EXCEPT SELECT city FROM customers;
-- Bangalore
```

Before 8.0.31, emulate INTERSECT with `IN`/`EXISTS` or an INNER JOIN, and EXCEPT with `NOT IN` / `NOT EXISTS` / `LEFT JOIN ... IS NULL`.

**JOIN vs UNION:** JOIN combines **columns** side by side from related tables; UNION stacks **rows** of similar queries on top of each other.

# 13. Common Table Expressions (CTE) — `WITH`

A CTE is a named, temporary result set that exists only for one statement. It makes long queries readable and can be referenced several times.

```sql
WITH dept_avg AS (
  SELECT dept_id, AVG(salary) AS avg_sal FROM employees GROUP BY dept_id
)
SELECT e.first_name, e.salary, ROUND(a.avg_sal) AS dept_avg
FROM employees e JOIN dept_avg a ON e.dept_id = a.dept_id
WHERE e.salary > a.avg_sal;
```

**Recursive CTE** — generate numbers 1 to 5:

```sql
WITH RECURSIVE n AS (
  SELECT 1 AS x            -- anchor member
  UNION ALL
  SELECT x + 1 FROM n WHERE x < 5   -- recursive member + stop condition
)
SELECT * FROM n;           -- 1, 2, 3, 4, 5
```

**Recursive CTE** — full organisation hierarchy:

```sql
WITH RECURSIVE org AS (
  SELECT emp_id, first_name, manager_id, 1 AS level, CAST(first_name AS CHAR(200)) AS path
  FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.emp_id, e.first_name, e.manager_id, o.level + 1, CONCAT(o.path, ' > ', e.first_name)
  FROM employees e JOIN org o ON e.manager_id = o.emp_id
)
SELECT * FROM org ORDER BY level, emp_id;
```

| emp_id | first_name | manager_id | level | path |
|--------|------------|------------|-------|------|
| 1 | Amit | NULL | 1 | Amit |
| 2 | Priya | 1 | 2 | Amit > Priya |
| 4 | Sneha | 1 | 2 | Amit > Sneha |
| 7 | Karan | 1 | 2 | Amit > Karan |
| 8 | Neha | 1 | 2 | Amit > Neha |
| 3 | Rahul | 2 | 3 | Amit > Priya > Rahul |
| 5 | Vikram | 4 | 3 | Amit > Sneha > Vikram |
| 6 | Anjali | 4 | 3 | Amit > Sneha > Anjali |
| 9 | Rohit | 8 | 3 | Amit > Neha > Rohit |
| 10 | Pooja | 4 | 3 | Amit > Sneha > Pooja |

**CTE vs subquery vs temporary table vs view**

| | Lives for | Reusable in the same query | Stored |
|---|-----------|---------------------------|--------|
| Subquery / derived table | One query | No (must repeat it) | No |
| CTE | One statement | Yes, by name; can be recursive | No |
| Temporary table (`CREATE TEMPORARY TABLE`) | The session | Yes, across many queries | Yes, until session ends |
| View | Permanent | Yes | Only the definition |

<div class="pb"></div>

# 14. Window Functions (MySQL 8+)

A window function calculates a value **across a set of related rows without collapsing them** (unlike GROUP BY, every row stays in the result).

```
function_name(...) OVER (
   PARTITION BY column     -- split into groups (optional)
   ORDER BY column         -- order inside each group
   ROWS BETWEEN ...        -- frame (optional)
)
```

| Category | Functions |
|----------|-----------|
| Ranking | `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `NTILE(n)`, `PERCENT_RANK()`, `CUME_DIST()` |
| Value | `LAG(col, n)`, `LEAD(col, n)`, `FIRST_VALUE(col)`, `LAST_VALUE(col)`, `NTH_VALUE(col, n)` |
| Aggregate | `SUM`, `AVG`, `COUNT`, `MIN`, `MAX` with `OVER()` |

## 14.1 ROW_NUMBER vs RANK vs DENSE_RANK (asked in almost every interview)

```sql
SELECT first_name, salary,
       ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn,
       RANK()       OVER (ORDER BY salary DESC) AS rnk,
       DENSE_RANK() OVER (ORDER BY salary DESC) AS drnk
FROM employees;
```

| first_name | salary | rn | rnk | drnk |
|------------|--------|----|-----|------|
| Amit | 150000 | 1 | 1 | 1 |
| Priya | 120000 | 2 | 2 | 2 |
| Rohit | 95000 | 3 | 3 | 3 |
| Sneha | 90000 | 4 | **4** | **4** |
| Rahul | 90000 | 5 | **4** | **4** |
| Neha | 85000 | 6 | **6** | **5** |
| Anjali | 75000 | 7 | 7 | 6 |
| Vikram | 70000 | 8 | 8 | 7 |
| Karan | 60000 | 9 | 9 | 8 |
| Pooja | 50000 | 10 | 10 | 9 |

- **ROW_NUMBER** — always unique 1, 2, 3 … (ties get different numbers, in no guaranteed order).
- **RANK** — ties get the same rank, and the next rank is **skipped** (4, 4, 6).
- **DENSE_RANK** — ties get the same rank, **no gaps** (4, 4, 5). Use it for "Nth highest salary".

## 14.2 PARTITION BY — Ranking Inside Each Group

```sql
-- top 2 salaries in each department
SELECT dept_id, first_name, salary
FROM (
  SELECT dept_id, first_name, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
  FROM employees WHERE dept_id IS NOT NULL
) t
WHERE rnk <= 2
ORDER BY dept_id, salary DESC;
```

| dept_id | first_name | salary |
|---------|------------|--------|
| 1 | Amit | 150000 |
| 1 | Priya | 120000 |
| 2 | Sneha | 90000 |
| 2 | Anjali | 75000 |
| 3 | Karan | 60000 |
| 4 | Rohit | 95000 |
| 4 | Neha | 85000 |

You cannot use a window function in WHERE (it is calculated in the SELECT step), so you wrap it in a derived table or CTE and filter outside.

## 14.3 Aggregate Window Functions

```sql
SELECT first_name, dept_id, salary,
       SUM(salary) OVER (PARTITION BY dept_id) AS dept_total,
       MAX(salary) OVER (PARTITION BY dept_id) AS dept_max
FROM employees WHERE dept_id = 2;
```

| first_name | dept_id | salary | dept_total | dept_max |
|------------|---------|--------|------------|----------|
| Anjali | 2 | 75000 | 235000 | 90000 |
| Vikram | 2 | 70000 | 235000 | 90000 |
| Sneha | 2 | 90000 | 235000 | 90000 |

**GROUP BY vs window function:** GROUP BY returns one row per group; a window function returns every row plus the group value next to it.

## 14.4 LAG and LEAD — Compare with Previous / Next Row

```sql
SELECT customer_id, order_date,
       LEAD(order_date) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_order,
       DATEDIFF(LEAD(order_date) OVER (PARTITION BY customer_id ORDER BY order_date), order_date) AS gap_days
FROM orders WHERE customer_id = 1;
```

| customer_id | order_date | next_order | gap_days |
|-------------|------------|------------|----------|
| 1 | 2024-01-05 | 2024-02-11 | 37 |
| 1 | 2024-02-11 | 2024-03-18 | 36 |
| 1 | 2024-03-18 | NULL | NULL |

## 14.5 Frames: Running Totals and Moving Averages

```sql
SUM(amount) OVER (ORDER BY order_date)                                         -- running total
AVG(amount) OVER (ORDER BY order_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) -- 3-row moving avg
```

Default frame with ORDER BY is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. That is why `LAST_VALUE()` "doesn't work" as expected — you must write `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.

## 14.6 NTILE — Split into Buckets

```sql
SELECT first_name, salary, NTILE(3) OVER (ORDER BY salary DESC) AS bucket FROM employees;
```

10 rows into 3 buckets → sizes 4, 3, 3 (Amit, Priya, Rohit, Sneha = 1; Rahul, Neha, Anjali = 2; Vikram, Karan, Pooja = 3).

<div class="pb"></div>
