# PART B — INTERVIEW QUERY PROBLEMS (WITH VERIFIED OUTPUT)

These are the queries interviewers ask most often. Learn **at least two ways** to solve the salary questions — interviewers often say *"now do it without LIMIT"* or *"now without window functions"*.

## Salary / Ranking Questions

### Q1. Find the second highest salary

**Method 1 — subquery with MAX (works everywhere, most expected answer)**

```sql
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
```

**Method 2 — LIMIT with OFFSET** (DISTINCT is required because of duplicates)

```sql
SELECT DISTINCT salary FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;
```

**Method 3 — DENSE_RANK**

```sql
SELECT DISTINCT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk FROM employees
) t WHERE rnk = 2;
```

| second_highest |
|----------------|
| 120000 |

Follow-up: *"What if there is no second highest (only one distinct salary)?"* Method 1 returns **NULL** (one row with NULL); Method 2 and 3 return **no rows**. To always return a row with NULL, wrap it: `SELECT (SELECT DISTINCT salary ... LIMIT 1 OFFSET 1) AS second_highest;`

### Q2. Find the Nth highest salary (e.g. N = 4)

**Method 1 — DENSE_RANK (best)**

```sql
SELECT DISTINCT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk FROM employees
) t WHERE rnk = 4;
```

**Method 2 — correlated subquery (no window function, no LIMIT)**
"There are exactly N-1 distinct salaries greater than this one."

```sql
SELECT DISTINCT e1.salary
FROM employees e1
WHERE 3 = (SELECT COUNT(DISTINCT e2.salary)      -- N - 1 = 3
           FROM employees e2
           WHERE e2.salary > e1.salary);
```

**Method 3 — LIMIT** : `SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 3;` (OFFSET = N-1)

| salary |
|--------|
| 90000 |

Distinct salaries in order: 150000, 120000, 95000, **90000** → 4th highest is 90000. (With `ROW_NUMBER` you would wrongly treat the two 90000s as 4th and 5th, and with `RANK` the 5th rank would not exist — that's why DENSE_RANK.)

**As a stored function** (sometimes asked):

```sql
DELIMITER //
CREATE FUNCTION getNthHighestSalary(N INT) RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
  SET N = N - 1;
  RETURN (SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET N);
END //
DELIMITER ;
SELECT getNthHighestSalary(2);   -- 120000
```

### Q3. Third highest salary without using LIMIT or window functions

```sql
SELECT MAX(salary) FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees
                WHERE salary < (SELECT MAX(salary) FROM employees));
```

Result: **95000**

### Q4. Top 3 salaries (distinct salary values) / employees having them

```sql
SELECT first_name, salary FROM employees e1
WHERE 2 >= (SELECT COUNT(DISTINCT salary) FROM employees e2 WHERE e2.salary > e1.salary)
ORDER BY salary DESC;
```

| first_name | salary |
|------------|--------|
| Amit | 150000 |
| Priya | 120000 |
| Rohit | 95000 |

(Simpler with MySQL 8: `WHERE drnk <= 3` using DENSE_RANK.)

### Q5. Lowest salary employee(s)

```sql
SELECT first_name, salary FROM employees
WHERE salary = (SELECT MIN(salary) FROM employees);       -- Pooja, 50000
```

Why not `ORDER BY salary LIMIT 1`? It returns only one person even if several share the lowest salary. The subquery returns all of them.

### Q6. Highest salary in each department (with employee name)

```sql
SELECT d.dept_name, e.first_name, e.salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
WHERE (e.dept_id, e.salary) IN (SELECT dept_id, MAX(salary) FROM employees GROUP BY dept_id)
ORDER BY d.dept_name;
```

| dept_name | first_name | salary |
|-----------|------------|--------|
| Engineering | Amit | 150000 |
| HR | Karan | 60000 |
| QA | Sneha | 90000 |
| Sales | Rohit | 95000 |

Common mistake: `SELECT dept_id, first_name, MAX(salary) FROM employees GROUP BY dept_id` — the name is not grouped, so MySQL 8 throws error 1055 (or older versions return a **random** name).

Window function version: `RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) = 1`.

### Q7. Second highest salary in each department

```sql
SELECT dept_id, first_name, salary FROM (
  SELECT dept_id, first_name, salary,
         DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS r
  FROM employees
) t WHERE r = 2;
```

| dept_id | first_name | salary |
|---------|------------|--------|
| 1 | Priya | 120000 |
| 2 | Anjali | 75000 |
| 4 | Neha | 85000 |

HR has only one employee, so it has no second highest.

### Q8. Top 2 earners in each department

See section 14.2 (same pattern with `WHERE rnk <= 2`). This "top N per group" pattern is one of the most important to memorise.

### Q9. Employees who earn more than their manager

```sql
SELECT e.first_name AS employee, e.salary,
       m.first_name AS manager,  m.salary AS manager_salary
FROM employees e
JOIN employees m ON e.manager_id = m.emp_id
WHERE e.salary > m.salary;
```

| employee | salary | manager | manager_salary |
|----------|--------|---------|----------------|
| Rohit | 95000 | Neha | 85000 |

### Q10. Employees earning more than the average salary of their department

Correlated subquery — see section 11 (Amit, Sneha, Rohit). CTE version:

```sql
WITH dept_avg AS (SELECT dept_id, AVG(salary) avg_sal FROM employees GROUP BY dept_id)
SELECT e.first_name, e.salary FROM employees e
JOIN dept_avg a ON e.dept_id = a.dept_id
WHERE e.salary > a.avg_sal;
```

### Q11. Department with the highest total salary

```sql
SELECT d.dept_name, SUM(e.salary) AS total
FROM departments d JOIN employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name
ORDER BY total DESC
LIMIT 1;
```

| dept_name | total |
|-----------|-------|
| Engineering | 360000 |

### Q12. Each employee's salary as a percentage of the total payroll

```sql
SELECT first_name, salary, ROUND(salary * 100 / SUM(salary) OVER (), 2) AS pct
FROM employees ORDER BY salary DESC LIMIT 3;
```

| first_name | salary | pct |
|------------|--------|-----|
| Amit | 150000 | 16.95 |
| Priya | 120000 | 13.56 |
| Rohit | 95000 | 10.73 |

`OVER ()` with nothing inside = the whole table is one window.

### Q13. Median salary

```sql
SELECT AVG(salary) AS median FROM (
  SELECT salary,
         ROW_NUMBER() OVER (ORDER BY salary) AS rn,
         COUNT(*)     OVER ()                AS cnt
  FROM employees
) t
WHERE rn IN (FLOOR((cnt + 1) / 2), CEIL((cnt + 1) / 2));
```

Result: **87500** (10 rows → average of the 5th and 6th values, 85000 and 90000). For an odd count both expressions point to the same middle row.

<div class="pb"></div>

## Duplicate Questions

### Q14. Find duplicate records

```sql
SELECT name, email, COUNT(*) AS cnt
FROM customers
GROUP BY name, email
HAVING COUNT(*) > 1;
```

| name | email | cnt |
|------|-------|-----|
| Ravi Kumar | ravi@mail.com | 2 |

Duplicate salaries: `SELECT salary, COUNT(*) FROM employees GROUP BY salary HAVING COUNT(*) > 1;` → 90000, 2.

To see **the full duplicate rows** (not just the value):

```sql
SELECT * FROM customers
WHERE email IN (SELECT email FROM customers GROUP BY email HAVING COUNT(*) > 1);
```

### Q15. Delete duplicates, keep the row with the lowest id

**Method 1 — self-join DELETE (MySQL specific, classic)**

```sql
DELETE c1 FROM customers c1
JOIN customers c2
  ON c1.email = c2.email
 AND c1.customer_id > c2.customer_id;
```

**Method 2 — ROW_NUMBER**

```sql
DELETE FROM customers
WHERE customer_id IN (
  SELECT customer_id FROM (
    SELECT customer_id,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY customer_id) AS rn
    FROM customers
  ) t WHERE rn > 1
);
```

Both delete **1 row** (customer 5). The extra derived table `t` in Method 2 is needed because MySQL does not allow you to select from the same table you are deleting from directly (error 1093).

**Method 3 — when the table has no unique id:** create a new table with `SELECT DISTINCT *`, then swap.

```sql
CREATE TABLE customers_clean AS SELECT DISTINCT name, email, city FROM customers;
```

> In practice: run the `SELECT` first, do it inside a transaction, and **take a backup** before deleting in any shared environment.

## Join / Missing-Data Questions

### Q16. Customers who have never placed an order

```sql
SELECT c.customer_id, c.name
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;
```

| customer_id | name |
|-------------|------|
| 4 | Kavya Reddy |

Alternatives: `WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)` or `WHERE customer_id NOT IN (SELECT customer_id FROM orders)` (safe here only because `orders.customer_id` is NOT NULL).

### Q17. Departments with no employees

Answer: **Finance** (see section 10 for LEFT JOIN and NOT EXISTS versions).

### Q18. Products that were never ordered

```sql
SELECT p.name FROM products p
WHERE p.product_id NOT IN (SELECT product_id FROM order_items);   -- Notebook
```

### Q19. Orders that have no items (data integrity check — very relevant for QA)

```sql
SELECT o.order_id, o.status
FROM orders o LEFT JOIN order_items oi ON o.order_id = oi.order_id
WHERE oi.order_id IS NULL;     -- 0 rows = data is healthy
```

### Q20. Employee name with manager name (show "No Manager" for the top)

Self LEFT JOIN — see section 10. Using INNER JOIN would drop Amit.

### Q21. Number of direct reports per manager

```sql
SELECT m.first_name AS manager, COUNT(e.emp_id) AS reports
FROM employees e
JOIN employees m ON e.manager_id = m.emp_id
GROUP BY m.emp_id, m.first_name
ORDER BY reports DESC;
```

| manager | reports |
|---------|---------|
| Amit | 4 |
| Sneha | 3 |
| Neha | 1 |
| Priya | 1 |

### Q22. Count employees per department including departments with zero

LEFT JOIN from departments + `COUNT(e.emp_id)` — see section 9 (Finance = 0).

<div class="pb"></div>

## Aggregation / Reporting Questions

### Q23. Departments with more than 2 employees

`GROUP BY dept_id HAVING COUNT(*) > 2` → departments 1 and 2 (section 9).

### Q24. Customers with 2 or more orders

```sql
SELECT c.name, COUNT(o.order_id) AS orders
FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name
HAVING COUNT(o.order_id) >= 2;
```

| name | orders |
|------|--------|
| Ravi Kumar | 3 |
| Meera Shah | 2 |

### Q25. Order totals greater than 50,000

```sql
SELECT order_id, SUM(quantity * unit_price) AS total
FROM order_items
GROUP BY order_id
HAVING total > 50000;
```

| order_id | total |
|----------|-------|
| 101 | 56600 |
| 104 | 55000 |
| 107 | 55000 |

### Q26. Customer who spent the most (delivered orders only)

```sql
SELECT c.customer_id, c.name, SUM(oi.quantity * oi.unit_price) AS spent
FROM customers c
JOIN orders o       ON c.customer_id = o.customer_id
JOIN order_items oi ON o.order_id    = oi.order_id
WHERE o.status = 'DELIVERED'
GROUP BY c.customer_id, c.name
ORDER BY spent DESC
LIMIT 1;
```

| customer_id | name | spent |
|-------------|------|-------|
| 1 | Ravi Kumar | 71000 |

Order 101 (56,600) + order 106 (14,400). Order 103 is cancelled and excluded. Note: group by `customer_id`, not only `name` — otherwise the two "Ravi Kumar" customers would be merged.

### Q27. Best-selling product by quantity

```sql
SELECT p.name, SUM(oi.quantity) AS qty
FROM products p JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.name ORDER BY qty DESC LIMIT 1;     -- Mouse, 6
```

### Q28. Most expensive product in each category

```sql
SELECT category, name, price FROM (
  SELECT category, name, price,
         RANK() OVER (PARTITION BY category ORDER BY price DESC) AS r
  FROM products
) t WHERE r = 1;
```

| category | name | price |
|----------|------|-------|
| Electronics | Laptop | 55000 |
| Furniture | Desk | 12000 |
| Stationery | Notebook | 100 |

### Q29. Monthly revenue

```sql
SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS month,
       SUM(oi.quantity * oi.unit_price)   AS revenue
FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status = 'DELIVERED'
GROUP BY month ORDER BY month;
```

| month | revenue |
|-------|---------|
| 2024-01 | 82600 |
| 2024-02 | 55000 |
| 2024-03 | 69400 |

### Q30. Month-over-month growth % (LAG)

```sql
SELECT DATE_FORMAT(o.order_date, '%Y-%m') AS month,
       SUM(oi.quantity * oi.unit_price) AS revenue,
       LAG(SUM(oi.quantity * oi.unit_price)) OVER (ORDER BY DATE_FORMAT(o.order_date, '%Y-%m')) AS prev_month
FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status = 'DELIVERED'
GROUP BY month ORDER BY month;
-- growth % = (revenue - prev_month) * 100 / prev_month
```

| month | revenue | prev_month | growth % |
|-------|---------|------------|----------|
| 2024-01 | 82600 | NULL | NULL |
| 2024-02 | 55000 | 82600 | -33.41 |
| 2024-03 | 69400 | 55000 | 26.18 |

### Q31. Running total of revenue

```sql
SELECT order_date, order_id, total,
       SUM(total) OVER (ORDER BY order_date) AS running_total
FROM (
  SELECT o.order_id, o.order_date, SUM(oi.quantity * oi.unit_price) AS total
  FROM orders o JOIN order_items oi ON o.order_id = oi.order_id
  WHERE o.status = 'DELIVERED'
  GROUP BY o.order_id, o.order_date
) t
ORDER BY order_date;
```

| order_date | order_id | total | running_total |
|------------|----------|-------|---------------|
| 2024-01-05 | 101 | 56600 | 56600 |
| 2024-01-20 | 102 | 26000 | 82600 |
| 2024-02-15 | 104 | 55000 | 137600 |
| 2024-03-18 | 106 | 14400 | 152000 |
| 2024-03-25 | 107 | 55000 | 207000 |

Without window functions (older MySQL): a correlated subquery `(SELECT SUM(...) FROM ... WHERE t2.order_date <= t1.order_date)`.

### Q32. Percentage of cancelled orders

```sql
SELECT ROUND(100 * SUM(status = 'CANCELLED') / COUNT(*), 2) AS cancel_pct FROM orders;   -- 14.29
```

In MySQL a boolean expression is 1 or 0, so `SUM(condition)` counts matching rows. Portable version: `SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END)`.

### Q33. Pivot — count of male and female employees per department (rows → columns)

```sql
SELECT d.dept_name,
       SUM(CASE WHEN e.gender = 'M' THEN 1 ELSE 0 END) AS male,
       SUM(CASE WHEN e.gender = 'F' THEN 1 ELSE 0 END) AS female
FROM departments d LEFT JOIN employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name ORDER BY d.dept_name;
```

| dept_name | male | female |
|-----------|------|--------|
| Engineering | 2 | 1 |
| Finance | 0 | 0 |
| HR | 1 | 0 |
| QA | 1 | 2 |
| Sales | 1 | 1 |

MySQL has no `PIVOT` keyword; this `SUM(CASE ...)` pattern ("conditional aggregation") is the answer.

<div class="pb"></div>

## Date Questions

### Q34. Employees hired in 2019

```sql
SELECT first_name, hire_date FROM employees
WHERE hire_date BETWEEN '2019-01-01' AND '2019-12-31';     -- index-friendly
-- or: WHERE YEAR(hire_date) = 2019                         -- simple, but cannot use an index
```

Result: Sneha (2019-05-20), Neha (2019-09-09).

### Q35. Employees who joined in the last N days / months

```sql
SELECT * FROM employees WHERE hire_date >= CURDATE() - INTERVAL 30 DAY;
SELECT * FROM employees WHERE hire_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH);
```

### Q36. Three longest-serving employees

```sql
SELECT first_name, hire_date FROM employees ORDER BY hire_date LIMIT 3;
-- Amit 2015-03-10, Priya 2016-07-01, Karan 2017-11-05
```

### Q37. Number of hires per year

```sql
SELECT YEAR(hire_date) AS yr, COUNT(*) AS hires
FROM employees GROUP BY YEAR(hire_date) ORDER BY yr;
```

2015–2023 → 1 each, except 2019 → 2.

### Q38. Days between consecutive orders of a customer (LEAD) — see section 14.4 (37 days, 36 days).

### Q39. First order of every customer

```sql
SELECT customer_id, order_id, order_date FROM (
  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS rn
  FROM orders o
) t WHERE rn = 1;
```

| customer_id | order_id | order_date |
|-------------|----------|------------|
| 1 | 101 | 2024-01-05 |
| 2 | 102 | 2024-01-20 |
| 3 | 104 | 2024-02-15 |
| 5 | 107 | 2024-03-25 |

Same pattern gives the **latest** record per group (`ORDER BY order_date DESC`) — e.g. the latest status of each ticket.

### Q40. Users who logged in on 3 or more consecutive days (advanced — "gaps and islands")

```sql
SELECT user_id, MIN(login_date) AS start_date, MAX(login_date) AS end_date, COUNT(*) AS days
FROM (
  SELECT user_id, login_date,
         DATE_SUB(login_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date) DAY) AS grp
  FROM logins
) t
GROUP BY user_id, grp
HAVING COUNT(*) >= 3;
```

| user_id | start_date | end_date | days |
|---------|------------|----------|------|
| 1 | 2024-01-01 | 2024-01-03 | 3 |
| 3 | 2024-01-10 | 2024-01-13 | 4 |

Trick: for consecutive dates, *date − row_number* is the same constant, so each streak forms one group.

<div class="pb"></div>

## Row / Misc Questions

### Q41. Fetch odd or even rows

```sql
-- by id
SELECT * FROM employees WHERE MOD(emp_id, 2) = 1;          -- odd ids: 1,3,5,7,9
-- by position (correct even if ids have gaps)
SELECT * FROM (
  SELECT emp_id, first_name, ROW_NUMBER() OVER (ORDER BY emp_id) AS rn FROM employees
) t WHERE rn % 2 = 0;                                       -- Priya, Sneha, Anjali, Neha, Pooja
```

### Q42. First / last N records

```sql
SELECT * FROM employees ORDER BY emp_id LIMIT 3;          -- first 3
SELECT * FROM employees ORDER BY emp_id DESC LIMIT 3;     -- last 3: Pooja, Rohit, Neha
SELECT * FROM employees ORDER BY emp_id DESC LIMIT 1;     -- last record
```

A table has no built-in order — "first/last" only means something with `ORDER BY`.

### Q43. Swap values in a column (M ↔ F) with a single UPDATE

```sql
UPDATE employees
SET gender = CASE gender WHEN 'M' THEN 'F' ELSE 'M' END;
```

### Q44. Increase salary by 10% for employees in QA who earn less than 80,000

```sql
UPDATE employees SET salary = salary * 1.10
WHERE dept_id = (SELECT dept_id FROM departments WHERE dept_name = 'QA')
  AND salary < 80000;          -- Vikram and Anjali
```

### Q45. Names starting with a vowel / containing a pattern

```sql
SELECT first_name FROM employees WHERE first_name REGEXP '^[AEIOU]';   -- Amit, Anjali
SELECT first_name FROM employees WHERE LEFT(first_name,1) IN ('A','E','I','O','U');
```

### Q46. Count names by first letter where more than one person shares it

```sql
SELECT LEFT(first_name, 1) AS initial, COUNT(*)
FROM employees GROUP BY initial HAVING COUNT(*) > 1 ORDER BY initial;
-- A 2 (Amit, Anjali), P 2 (Priya, Pooja), R 2 (Rahul, Rohit)
```

### Q47. Longest name

```sql
SELECT first_name, LENGTH(first_name) AS len FROM employees ORDER BY len DESC, first_name LIMIT 1;
-- Anjali, 6
```

### Q48. Find records where a column is NULL / not NULL

```sql
SELECT first_name FROM employees WHERE email IS NULL;      -- Pooja
```

### Q49. Copy a table's structure (with or without data)

```sql
CREATE TABLE emp_new LIKE employees;                       -- structure + indexes, no data
CREATE TABLE emp_new2 AS SELECT * FROM employees;          -- data, but no PK/indexes
CREATE TABLE emp_new3 AS SELECT * FROM employees WHERE 1=0;-- only columns
```

### Q50. Print employee hierarchy / numbers 1–N (recursive CTE) — see section 13.

### Q51. Compare two tables (very common for QA — e.g. source vs target after migration/ETL)

```sql
-- rows in source missing from target
SELECT s.* FROM source_tbl s
LEFT JOIN target_tbl t ON s.id = t.id
WHERE t.id IS NULL;

-- rows present in both but with different values
SELECT s.id, s.amount AS src_amount, t.amount AS tgt_amount
FROM source_tbl s JOIN target_tbl t ON s.id = t.id
WHERE NOT (s.amount <=> t.amount);          -- <=> is the NULL-safe equal operator

-- quick reconciliation
SELECT (SELECT COUNT(*) FROM source_tbl) AS src_count,
       (SELECT COUNT(*) FROM target_tbl) AS tgt_count,
       (SELECT SUM(amount) FROM source_tbl) AS src_sum,
       (SELECT SUM(amount) FROM target_tbl) AS tgt_sum;
```

With MySQL 8.0.31+: `SELECT * FROM source_tbl EXCEPT SELECT * FROM target_tbl;`

### Q52. Get the latest row per group (e.g. latest order status per customer)

```sql
SELECT o.* FROM orders o
WHERE o.order_date = (SELECT MAX(o2.order_date) FROM orders o2 WHERE o2.customer_id = o.customer_id);
```

Or `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) = 1`.

### Q53. First person in each department by salary (FIRST_VALUE)

```sql
SELECT first_name, salary,
       FIRST_VALUE(first_name) OVER (PARTITION BY dept_id ORDER BY salary DESC) AS top_earner
FROM employees WHERE dept_id IN (2, 4);
```

| first_name | salary | top_earner |
|------------|--------|------------|
| Sneha | 90000 | Sneha |
| Anjali | 75000 | Sneha |
| Vikram | 70000 | Sneha |
| Rohit | 95000 | Rohit |
| Neha | 85000 | Rohit |

### Q54. Predict the output (tricky)

| Query | Answer | Why |
|-------|--------|-----|
| `SELECT COUNT(*) FROM departments WHERE dept_id NOT IN (SELECT dept_id FROM employees);` | 0 | NULL in the subquery (section 11) |
| `SELECT NULL = NULL;` | NULL | NULL is never equal to anything |
| `SELECT 5 + NULL;` | NULL | arithmetic with NULL |
| `SELECT COUNT(email) FROM employees;` | 9 | NULLs not counted |
| `SELECT AVG(col)` over values 10, 20, NULL | 15 | NULL ignored (not 10) |
| `SELECT * FROM employees WHERE salary = NULL;` | no rows | use IS NULL |
| `SELECT COUNT(*) FROM departments CROSS JOIN products;` | 25 | 5 × 5 |
| `SELECT 'abc' = 'ABC';` | 1 | default collation is case-insensitive |
| `SELECT 10 / 0;` | NULL | MySQL returns NULL (with a warning; error in strict mode for INSERT/UPDATE) |
| `SELECT ROUND(2.5), ROUND(3.5);` | 3, 4 | exact values round half away from zero |

<div class="pb"></div>
