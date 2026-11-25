# PART C — SQL FOR QA ENGINEERS (Database Testing)

Interviewers for a 4-year QA role will ask *"How do you use SQL in your project?"* Have a clear, real answer ready.

# 22. Database Testing with SQL

## 22.1 What Is Database Testing?

Checking that the data the application stores and reads is **correct, complete, consistent and secure**, and that DB objects (tables, constraints, procedures, triggers) behave as designed.

| Type | What you check | Example |
|------|----------------|---------|
| **Data validation (backend verification)** | Action in UI/API is stored correctly | After "Place Order", a row exists in `orders` with the right customer, amount, status = 'PENDING' |
| **Data integrity** | Constraints and relationships hold | No orphan `order_items`; FK, UNIQUE, NOT NULL enforced; totals match |
| **Schema / structural testing** | Tables, columns, types, lengths, indexes, defaults match the design | `DESC users` — email is VARCHAR(100), UNIQUE |
| **CRUD testing** | Create / Read / Update / Delete from the app reflect in the DB | Edit profile → `UPDATE` happened; soft delete sets `is_deleted = 1` |
| **Stored procedure / trigger testing** | Correct output, error handling, audit rows | Call with valid/invalid/boundary params |
| **Transaction testing** | Rollback on failure, no partial data | Payment fails → no order row, stock not reduced |
| **Migration / ETL testing** | Source and target match after data movement | Row counts, sums, sample comparison, NULL/default handling, transformations |
| **Performance** | Queries meet SLAs on realistic volumes | EXPLAIN, slow query log, load test with large data |
| **Security** | Access rights, SQL injection, sensitive data masked/encrypted | Passwords stored hashed, not plain text; PII masked in lower environments |

## 22.2 Sample Answer: "How do you use SQL in your project?"

> *"In my project I use SQL daily for backend validation. After executing a UI or API scenario — for example creating an order — I query the `orders` and `order_items` tables to verify that the correct records are created with the right status, amounts and foreign keys. I write join queries to validate data across tables, and aggregate queries to reconcile report totals shown on the dashboard with the DB. I create test data with INSERT scripts or stored procedures and clean it up after the run. In our automation framework we have a DB utility (using mysql2 in TypeScript / JDBC in Java) so our tests can assert DB state directly. I also did migration testing where I compared row counts, sums and sampled records between source and target tables, and I check negative scenarios like duplicate entries, NULL handling and constraint violations."*

## 22.3 Typical Validation Queries

```sql
-- 1. Verify the record created by the test
SELECT order_id, customer_id, status FROM orders WHERE order_id = 108;

-- 2. Order total shown in the UI = sum of items in the DB
SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = 101;   -- 56600

-- 3. Orphan records (child without parent)
SELECT oi.* FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.order_id WHERE o.order_id IS NULL;

-- 4. Duplicates that should not exist
SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1;

-- 5. Mandatory fields missing
SELECT * FROM employees WHERE email IS NULL OR TRIM(email) = '';

-- 6. Invalid values / formats
SELECT * FROM employees WHERE salary <= 0 OR hire_date > CURDATE();
SELECT * FROM customers WHERE email NOT LIKE '%_@_%._%';

-- 7. Status values outside the allowed list
SELECT DISTINCT status FROM orders;

-- 8. Report reconciliation: dashboard says "Revenue Jan-2024 = 82,600"
SELECT SUM(oi.quantity * oi.unit_price) FROM orders o JOIN order_items oi USING (order_id)
WHERE o.status = 'DELIVERED' AND o.order_date BETWEEN '2024-01-01' AND '2024-01-31';

-- 9. Audit columns are populated
SELECT * FROM orders WHERE created_at IS NULL OR updated_at < created_at;

-- 10. Soft delete works and deleted rows are hidden from the API
SELECT COUNT(*) FROM users WHERE is_deleted = 1 AND id = 42;
```

## 22.4 Test Data Setup and Clean-up

- Use **unique prefixes** for data created by tests (`'AUTO_' + timestamp`) so it is easy to find and delete: `DELETE FROM customers WHERE name LIKE 'AUTO\_%';`
- Delete in **child → parent** order (order_items → orders → customers) or rely on `ON DELETE CASCADE`.
- Wrap DB changes in a transaction and `ROLLBACK` at the end of a test when the app shares the same connection (common in integration tests).
- Restore a known baseline using `mysqldump` before a full regression run.
- Never run destructive queries on shared/production databases; use read-only users there.

## 22.5 DB Validation in a TypeScript Automation Framework (mysql2)

```ts
// db.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,          // read-only QA user
  password: process.env.DB_PASSWORD,  // from env/secret store, never hard-coded
  database: 'qa_company',
  connectionLimit: 5,
});

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);   // parameterized → no SQL injection
  return rows as T[];
}

export const closeDb = () => pool.end();
```

```ts
// order.spec.ts  (Playwright test example)
import { test, expect } from '@playwright/test';
import { query, closeDb } from './db';

test('placing an order stores it in the DB', async ({ request }) => {
  const res = await request.post('/api/orders', { data: { customerId: 1, items: [{ productId: 2, qty: 2 }] } });
  expect(res.status()).toBe(201);
  const { orderId } = await res.json();

  const orders = await query<{ status: string; customer_id: number }>(
    'SELECT status, customer_id FROM orders WHERE order_id = ?', [orderId]);
  expect(orders).toHaveLength(1);
  expect(orders[0].status).toBe('PENDING');

  const [{ total }] = await query<{ total: string }>(
    'SELECT SUM(quantity * unit_price) AS total FROM order_items WHERE order_id = ?', [orderId]);
  expect(Number(total)).toBe(1600);
});

test.afterAll(async () => closeDb());
```

**Java (JDBC) equivalent** — often asked if the framework is Selenium + Java:

```java
Connection con = DriverManager.getConnection("jdbc:mysql://localhost:3306/qa_company", user, pass);
PreparedStatement ps = con.prepareStatement("SELECT status FROM orders WHERE order_id = ?");
ps.setInt(1, orderId);
ResultSet rs = ps.executeQuery();
if (rs.next()) Assert.assertEquals(rs.getString("status"), "PENDING");
rs.close(); ps.close(); con.close();
```

`executeQuery()` → SELECT (returns a ResultSet); `executeUpdate()` → INSERT/UPDATE/DELETE (returns the affected row count); `execute()` → any statement (returns a boolean).

## 22.6 Scenario-Based Questions

**1. The UI shows the order as placed, but there is no row in the DB. What do you check?**
Was the transaction committed (autocommit off / missing COMMIT)? Are you connected to the right environment/schema? Replication lag on a read replica? Is the API writing to a queue that is processed later (asynchronous)? Check application logs for a rollback or constraint error.

**2. The report total doesn't match the DB.**
Check filters (status, date range, time zone of dates), duplicates caused by joins (one-to-many join inflating SUM), NULL handling (`SUM` ignores NULL, `COUNT(*)` vs `COUNT(col)`), rounding (FLOAT vs DECIMAL), and data cut-off time of the report.

**3. How do you test a data migration of 10 million rows?**
Row counts per table, sums/min/max of numeric columns, count of NULLs per column, distinct counts of keys, checksum/hash comparison (`CHECKSUM TABLE` or `MD5(CONCAT_WS(...))` per row), full comparison of a random sample, transformation rules, data type/length truncation, special characters/encoding (utf8mb4), and performance of the migration job itself.

**4. How do you test a stored procedure?**
Valid inputs (expected rows changed / results), boundary and invalid inputs (NULL, negative, too long), error handling (SIGNAL messages), transaction behaviour on failure, performance with big data, permissions (who can EXECUTE).

**5. A query is slow in production. As QA, what do you report?**
The exact query and parameters, the EXPLAIN plan (full scan? missing index?), data volume, time taken vs. expected SLA, and whether it is slow every time or under load.

<div class="pb"></div>

# PART D — THEORY QUESTIONS: QUICK ANSWERS

**1. What is the difference between SQL and MySQL?** SQL is the language; MySQL is a database management system that uses SQL.

**2. DDL vs DML?** DDL defines structure (CREATE, ALTER, DROP, TRUNCATE) and auto-commits; DML changes data (INSERT, UPDATE, DELETE) and can be rolled back.

**3. DELETE vs TRUNCATE vs DROP?** DELETE removes chosen rows, can roll back, fires triggers; TRUNCATE removes all rows fast, resets AUTO_INCREMENT, cannot roll back; DROP removes the table itself. (Section 3.)

**4. Primary key vs unique key?** One PK per table, no NULLs, clustered index; many unique keys allowed, NULLs allowed.

**5. Can a primary key have multiple columns?** Yes — a composite primary key, e.g. `PRIMARY KEY (order_id, product_id)`.

**6. Can a foreign key be NULL?** Yes, unless declared NOT NULL. A NULL FK means "no relationship" (Pooja has no department).

**7. Can a table have more than one foreign key?** Yes (employees has two: dept_id and manager_id).

**8. What is a self-referencing foreign key?** An FK that points to the same table's PK (`manager_id → emp_id`).

**9. WHERE vs HAVING?** WHERE filters rows before grouping; HAVING filters groups after grouping and can use aggregates.

**10. What is the order of execution of a SELECT?** FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT.

**11. Can you use an alias in WHERE?** No — WHERE runs before SELECT. You can in ORDER BY (and HAVING/GROUP BY in MySQL).

**12. What are joins and their types?** INNER, LEFT, RIGHT, FULL (emulated in MySQL), CROSS, SELF. (Section 10.)

**13. Does MySQL support FULL OUTER JOIN?** No. Use `LEFT JOIN ... UNION ... RIGHT JOIN`.

**14. UNION vs UNION ALL?** UNION removes duplicates (slower); UNION ALL keeps them (faster).

**15. JOIN vs UNION?** JOIN combines columns; UNION combines rows.

**16. What is a subquery? Correlated subquery?** A query inside another. A correlated subquery references the outer query and runs once per outer row.

**17. IN vs EXISTS?** IN compares against a list of values; EXISTS checks for existence and stops at the first match; NOT EXISTS is NULL-safe, NOT IN is not.

**18. What is a view? Can you update it?** A stored SELECT acting as a virtual table. Simple single-table views without aggregates are updatable.

**19. What is an index? Disadvantages?** A B-Tree structure that speeds up lookups; it costs disk space and slows down writes.

**20. Clustered vs non-clustered index?** Clustered = the table's data is physically stored in that order (InnoDB PK, only one). Non-clustered = separate structure pointing to the row via the PK (many allowed).

**21. How do you check whether a query uses an index?** `EXPLAIN` — look at `key` and `type` (ALL = full scan).

**22. What is normalization? Explain 1NF, 2NF, 3NF.** Organising tables to remove redundancy: atomic values; no partial dependency on part of a composite key; no transitive dependency. (Section 19.)

**23. What is denormalization?** Adding controlled redundancy for faster reads.

**24. What is a transaction? What is ACID?** A unit of work that is all-or-nothing. Atomicity, Consistency, Isolation, Durability. (Section 18.)

**25. COMMIT vs ROLLBACK vs SAVEPOINT?** Save the changes; undo the changes; mark a point you can roll back to partially.

**26. Default isolation level in MySQL?** REPEATABLE READ (InnoDB).

**27. Dirty read / non-repeatable read / phantom read?** Reading uncommitted data / getting a changed value on re-read / getting new rows on re-query.

**28. What is a deadlock?** Two transactions each waiting for a lock the other holds; InnoDB kills one (error 1213).

**29. Stored procedure vs function?** Procedure: CALL, OUT params, transactions, can't be used in SELECT. Function: returns one value, usable in SELECT.

**30. What is a trigger?** Code that runs automatically BEFORE/AFTER INSERT/UPDATE/DELETE on a table, using OLD and NEW.

**31. What is a cursor?** A pointer to iterate a result set row by row inside a stored procedure.

**32. CHAR vs VARCHAR?** Fixed length (padded) vs variable length.

**33. DATETIME vs TIMESTAMP?** TIMESTAMP is stored in UTC and converted to the session time zone, range up to 2038; DATETIME stores the value as is.

**34. What is AUTO_INCREMENT? How to reset it?** Auto-generated sequential number. `ALTER TABLE t AUTO_INCREMENT = 1;` or TRUNCATE.

**35. How do you get the last inserted id?** `SELECT LAST_INSERT_ID();`

**36. COUNT(\*) vs COUNT(1) vs COUNT(col)?** First two count all rows (same performance in InnoDB); COUNT(col) skips NULLs.

**37. How do aggregate functions treat NULL?** They ignore NULLs (except COUNT(\*)). AVG of (10, 20, NULL) = 15.

**38. IFNULL vs COALESCE?** IFNULL takes 2 arguments (MySQL); COALESCE takes many and is ANSI standard.

**39. What is the `<=>` operator?** NULL-safe equality: `NULL <=> NULL` is 1.

**40. ROW_NUMBER vs RANK vs DENSE_RANK?** Unique numbers / ties share rank with gaps / ties share rank without gaps. (Section 14.1.)

**41. What is a window function? How is it different from GROUP BY?** Calculates across related rows without collapsing them; GROUP BY returns one row per group.

**42. What is a CTE? What is a recursive CTE?** A named temporary result defined with WITH; recursive CTEs reference themselves (hierarchies, number series).

**43. What is a temporary table?** A session-only table that is dropped automatically when the session ends.

**44. LIMIT with OFFSET — how is pagination done?** `LIMIT page_size OFFSET (page_no − 1) * page_size`. For deep pages, keyset pagination (`WHERE id > last_seen_id LIMIT 20`) is faster.

**45. What is a composite key vs a candidate key?** Composite = key with 2+ columns. Candidate = any minimal column set that could be the PK.

**46. What is referential integrity?** Every FK value must exist in the parent table (enforced by the FOREIGN KEY constraint).

**47. What does ON DELETE CASCADE do?** Deleting a parent row automatically deletes its child rows.

**48. What is SQL injection and how is it prevented?** Malicious input changing the SQL query; prevented with prepared statements/parameterized queries. (Section 20.1.)

**49. InnoDB vs MyISAM?** InnoDB: transactions, row locks, FKs, crash recovery (default). MyISAM: none of those, table locks.

**50. GRANT vs REVOKE?** Give vs take away privileges.

**51. What is a schema?** The logical structure of a database; in MySQL `CREATE SCHEMA` = `CREATE DATABASE`.

**52. What is the difference between `=` and `LIKE`?** `=` is exact match; LIKE does pattern matching with `%` and `_`.

**53. How do you find the number of rows in all tables?** `SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'qa_company';` (table_rows is an estimate for InnoDB; use COUNT(\*) for exact numbers.)

**54. How do you list columns of a table using SQL?** `DESC employees;` or `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees';`

**55. What is information_schema?** A built-in read-only database with metadata about all databases, tables, columns, indexes and constraints — very useful for **schema testing**.

**56. What is a data dictionary / metadata?** Data about data — table names, column types, constraints (information_schema in MySQL).

**57. Can we use ORDER BY in a subquery/view?** Allowed, but the order is not guaranteed in the outer result unless the outer query has its own ORDER BY (except with LIMIT).

**58. What is a natural join and why avoid it?** Joins automatically on all same-named columns — adding a column later can silently change the result.

**59. What is the difference between a primary key and an index?** A primary key is a constraint (unique + not null) and automatically creates an index; an index is only a lookup structure and can allow duplicates.

**60. What is a CHECK constraint? Is it enforced in MySQL?** A rule on column values (`CHECK (salary > 0)`); enforced from MySQL 8.0.16 — earlier versions parsed and ignored it.

**61. What happens if you insert a string longer than VARCHAR(n)?** Strict mode (default in MySQL 8): error 1406 "Data too long". Non-strict: silently truncated with a warning — a good boundary test case.

**62. What is the max size of VARCHAR?** 65,535 bytes per row in total (characters depend on charset; utf8mb4 uses up to 4 bytes per character).

**63. How do you rename a table / column?** `RENAME TABLE a TO b;` / `ALTER TABLE t RENAME COLUMN x TO y;`

**64. How do you add a NOT NULL column to a table with existing data?** Provide a DEFAULT: `ALTER TABLE t ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE';`

**65. What is a surrogate key?** A system-generated key with no business meaning (AUTO_INCREMENT id, UUID).

**66. What is the difference between a database and a schema in Oracle vs MySQL?** In MySQL they are the same thing; in Oracle a schema belongs to a user inside one database.

**67. How do you take a backup and restore?** `mysqldump` to export, `mysql < file.sql` to import.

**68. What is replication lag and why does it matter for testing?** Delay before data written to the primary appears on replicas; tests reading from a replica immediately after a write may fail intermittently.

**69. OLTP vs OLAP?** OLTP: many small transactions, normalized (e-commerce orders). OLAP: large analytical queries, often denormalized (data warehouse, reports).

**70. What are DCL commands?** GRANT and REVOKE.

<div class="pb"></div>

# PART E — ONE-PAGE CHEAT SHEET

```sql
-- QUERY SKELETON
SELECT [DISTINCT] col, AGG(col) AS alias
FROM t1 [INNER|LEFT|RIGHT|CROSS] JOIN t2 ON t1.k = t2.k
WHERE row_condition
GROUP BY col
HAVING group_condition
ORDER BY col [ASC|DESC]
LIMIT n OFFSET m;

-- Nth HIGHEST SALARY
SELECT DISTINCT salary FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) r FROM employees) t WHERE r = N;
SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees);  -- 2nd
SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET N-1;

-- TOP N PER GROUP
SELECT * FROM (SELECT *, DENSE_RANK() OVER (PARTITION BY grp ORDER BY val DESC) r FROM t) x WHERE r <= N;

-- DUPLICATES
SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1;
DELETE a FROM t a JOIN t b ON a.col = b.col AND a.id > b.id;   -- keep lowest id

-- MISSING / ORPHANS (anti-join)
SELECT a.* FROM a LEFT JOIN b ON a.id = b.a_id WHERE b.a_id IS NULL;
SELECT * FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.a_id = a.id);

-- SELF JOIN (employee vs manager)
SELECT e.name, m.name FROM emp e LEFT JOIN emp m ON e.manager_id = m.id;

-- RUNNING TOTAL / PREVIOUS ROW
SUM(x) OVER (ORDER BY dt)          LAG(x) OVER (ORDER BY dt)          LEAD(x) OVER (...)

-- PIVOT
SUM(CASE WHEN gender = 'M' THEN 1 ELSE 0 END) AS male

-- FULL OUTER JOIN
SELECT ... FROM a LEFT JOIN b ON ... UNION SELECT ... FROM a RIGHT JOIN b ON ...;

-- TRANSACTION
START TRANSACTION; ...; SAVEPOINT s1; ...; ROLLBACK TO s1; COMMIT;
```

| Remember | |
|----------|---|
| NULL | use `IS NULL`; aggregates ignore NULL; `NOT IN` + NULL = no rows |
| WHERE vs HAVING | rows vs groups |
| DELETE / TRUNCATE / DROP | rows (rollback) / all rows fast / whole table |
| RANK family | ROW_NUMBER 1,2,3 · RANK 1,1,3 · DENSE_RANK 1,1,2 |
| Default isolation | REPEATABLE READ |
| Default engine | InnoDB |
| Index killers | function on column, leading `%`, type conversion |
| Normal forms | atomic → whole key → nothing but the key |

**Good luck with your interview!**
