# 15. Views

A **view** is a saved SELECT query that behaves like a virtual table. It stores no data of its own (only the query).

```sql
CREATE VIEW v_emp_dept AS
SELECT e.emp_id, e.first_name, e.salary, d.dept_name
FROM employees e LEFT JOIN departments d ON e.dept_id = d.dept_id;

SELECT * FROM v_emp_dept WHERE dept_name = 'QA';
CREATE OR REPLACE VIEW v_emp_dept AS ...;   -- change it
DROP VIEW v_emp_dept;
```

**Why views:** security (expose only some columns — hide salary), simplicity (hide complex joins), and a stable interface when tables change.

**Updatable view:** you can INSERT/UPDATE through a view only when it maps to a single table and has no aggregates, DISTINCT, GROUP BY, HAVING, UNION or subqueries in the SELECT list. `WITH CHECK OPTION` blocks changes that would make the row disappear from the view.

**Materialized view:** stores the result physically and is refreshed periodically. **MySQL does not have materialized views** (Oracle/PostgreSQL do); in MySQL you simulate them with a summary table filled by a scheduled event.

# 16. Indexes and Performance

An **index** is a separate data structure (a **B-Tree** in InnoDB) that lets MySQL find rows without scanning the whole table — like the index at the back of a book.

```sql
CREATE INDEX idx_emp_salary ON employees(salary);
CREATE UNIQUE INDEX idx_emp_email ON employees(email);
CREATE INDEX idx_emp_dept_sal ON employees(dept_id, salary);   -- composite index
SHOW INDEX FROM employees;
DROP INDEX idx_emp_salary ON employees;
```

| Type | Description |
|------|-------------|
| Clustered index | The table data itself is stored in PK order. InnoDB: the **primary key is the clustered index** — only one per table |
| Secondary (non-clustered) index | Separate structure storing the indexed column + the PK; MySQL then looks up the row by PK |
| Unique index | Index + no duplicates |
| Composite index | Index on multiple columns |
| Covering index | Contains every column the query needs, so the table is never touched ("Using index" in EXPLAIN) |
| Full-text index | For word searches with `MATCH ... AGAINST` |

**Leftmost prefix rule (composite index):** an index on `(dept_id, salary)` helps `WHERE dept_id = 2` and `WHERE dept_id = 2 AND salary > 70000`, but **not** `WHERE salary > 70000` alone.

**When indexes are NOT used (common interview question):**

- A function on the column: `WHERE YEAR(hire_date) = 2019` → rewrite as `WHERE hire_date BETWEEN '2019-01-01' AND '2019-12-31'`
- Leading wildcard: `LIKE '%sharma'` (but `LIKE 'sharma%'` can use the index)
- Type conversion: comparing a VARCHAR column with a number, `WHERE phone = 98765`
- `OR` across different columns (sometimes), `!=` / `NOT IN` on large ranges
- Low selectivity: the optimizer prefers a full scan when most rows match (e.g. gender)

**Pros and cons:** indexes make SELECT/WHERE/JOIN/ORDER BY faster, but they use disk space and **slow down INSERT, UPDATE and DELETE** because every index must be updated too. Index columns used in WHERE, JOIN and ORDER BY that have high selectivity; don't index everything.

## 16.1 EXPLAIN — Reading the Query Plan

```sql
EXPLAIN SELECT * FROM employees WHERE email = 'neha@corp.com';
EXPLAIN ANALYZE SELECT ...;   -- MySQL 8.0.18+: actually runs it and shows real timings
```

| Column | What to look for |
|--------|------------------|
| `type` | Best → worst: `system`, `const`, `eq_ref`, `ref`, `range`, `index`, **`ALL` (full table scan — bad on big tables)** |
| `possible_keys` / `key` | Indexes that could be used / the one actually used (NULL = none) |
| `rows` | Estimated rows examined — lower is better |
| `Extra` | `Using index` (good, covering), `Using where`, `Using temporary` / `Using filesort` (extra work, look at it) |

**How do you find and fix a slow query?** Enable the **slow query log** (`slow_query_log = ON`, `long_query_time = 2`), run `EXPLAIN` on the slow query, add or fix indexes, avoid `SELECT *`, avoid functions on indexed columns, replace correlated subqueries with joins, add `LIMIT` / pagination, and keep table statistics up to date with `ANALYZE TABLE`.

# 17. Stored Procedures, Functions, Triggers, Events

## 17.1 Stored Procedure

A named block of SQL stored in the database and executed with `CALL`. It can have `IN`, `OUT` and `INOUT` parameters, can run many statements (including transactions) and can return result sets.

```sql
DELIMITER //
CREATE PROCEDURE give_hike(IN p_dept INT, IN p_pct DECIMAL(5,2), OUT p_rows INT)
BEGIN
  UPDATE employees SET salary = salary * (1 + p_pct / 100) WHERE dept_id = p_dept;
  SET p_rows = ROW_COUNT();
END //
DELIMITER ;

CALL give_hike(2, 10, @n);
SELECT @n;            -- 3 rows updated
DROP PROCEDURE give_hike;
```

`DELIMITER //` changes the statement terminator temporarily so the `;` inside the body doesn't end the CREATE statement.

**Variables, IF and loops inside procedures:**

```sql
DECLARE v_total INT DEFAULT 0;
IF v_total > 10 THEN ... ELSEIF ... ELSE ... END IF;
WHILE i <= 10 DO ... SET i = i + 1; END WHILE;
```

QA use: a procedure that creates bulk test data (e.g. 10,000 orders) in a loop, or that resets the test environment.

## 17.2 User-Defined Function

Returns **exactly one value**, can be used inside SELECT.

```sql
DELIMITER //
CREATE FUNCTION annual_ctc(p_salary DECIMAL(10,2)) RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
  RETURN p_salary * 12;
END //
DELIMITER ;

SELECT first_name, annual_ctc(salary) FROM employees;
```

| Stored Procedure | Function |
|------------------|----------|
| Called with `CALL` | Used in SQL statements (`SELECT f(x)`) |
| Returns 0, 1 or many values (OUT params, result sets) | Must return exactly one value |
| Can use transactions, DML freely | Cannot be used for transactions; usually only computes |
| Cannot be used in SELECT/WHERE | Can be used in SELECT/WHERE |

## 17.3 Triggers

A trigger runs automatically **BEFORE** or **AFTER** an **INSERT**, **UPDATE** or **DELETE** on a table (6 combinations). Inside it, `NEW.col` is the new value and `OLD.col` is the old value.

```sql
CREATE TABLE salary_audit (
  emp_id INT, old_salary DECIMAL(10,2), new_salary DECIMAL(10,2),
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DELIMITER //
CREATE TRIGGER trg_salary_audit
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
  IF OLD.salary <> NEW.salary THEN
    INSERT INTO salary_audit (emp_id, old_salary, new_salary)
    VALUES (OLD.emp_id, OLD.salary, NEW.salary);
  END IF;
END //
DELIMITER ;
```

| Event | OLD available | NEW available |
|-------|---------------|---------------|
| INSERT | No | Yes |
| UPDATE | Yes | Yes |
| DELETE | Yes | No |

Uses: audit logs, validations (`BEFORE INSERT` + `SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '...'`), keeping derived values in sync. **QA test:** update a salary through the UI → verify a new row in `salary_audit` with the correct old and new values; update with the same value → verify no row is added. Remember TRUNCATE does not fire DELETE triggers.

## 17.4 Events (Scheduler)

```sql
CREATE EVENT purge_old_logins
ON SCHEDULE EVERY 1 DAY
DO DELETE FROM logins WHERE login_date < CURDATE() - INTERVAL 90 DAY;
```

Requires `event_scheduler = ON`. The DB equivalent of a cron job.

## 17.5 Cursors (brief)

A cursor lets a stored procedure loop through a result set row by row (`DECLARE cur CURSOR FOR SELECT ...; OPEN; FETCH; CLOSE`). They are slow — prefer set-based SQL.

<div class="pb"></div>

# 18. Transactions and ACID

A **transaction** is a group of SQL statements that is executed as **one unit**: either all succeed or none do.

```sql
START TRANSACTION;                  -- or BEGIN
UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;                             -- make it permanent
-- or ROLLBACK;                     -- undo everything since START TRANSACTION
```

```sql
START TRANSACTION;
INSERT INTO departments VALUES (8, 'Admin', 'Goa');
SAVEPOINT sp1;
DELETE FROM departments WHERE dept_id = 8;
ROLLBACK TO sp1;                    -- undo only the delete
COMMIT;                             -- Admin is saved
```

**autocommit:** MySQL is in autocommit mode by default — every statement is committed immediately unless you start a transaction. `SET autocommit = 0;` turns it off for the session. DDL statements (CREATE, ALTER, DROP, TRUNCATE) cause an **implicit commit**.

**ACID**

| Property | Meaning | Bank example |
|----------|---------|--------------|
| **Atomicity** | All or nothing | Debit and credit both happen, or neither |
| **Consistency** | Data moves from one valid state to another; constraints always hold | Total money in the bank stays the same |
| **Isolation** | Concurrent transactions don't see each other's uncommitted work | Two transfers at the same time don't corrupt the balance |
| **Durability** | Once committed, data survives crashes | After "success", a power failure doesn't lose the transfer (redo log) |

## 18.1 Concurrency Problems

| Problem | What happens |
|---------|--------------|
| **Dirty read** | T1 reads data that T2 changed but has **not committed**; T2 rolls back → T1 used data that never existed |
| **Non-repeatable read** | T1 reads a row twice and gets different values because T2 **updated and committed** in between |
| **Phantom read** | T1 runs the same range query twice and gets **new rows** because T2 inserted them |
| **Lost update** | Two transactions read the same value and both write; one overwrites the other |

## 18.2 Isolation Levels

| Isolation level | Dirty read | Non-repeatable read | Phantom read |
|-----------------|------------|---------------------|--------------|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | Prevented | Possible | Possible |
| **REPEATABLE READ (MySQL InnoDB default)** | Prevented | Prevented | Mostly prevented (InnoDB uses MVCC snapshots + next-key/gap locks) |
| SERIALIZABLE | Prevented | Prevented | Prevented (slowest) |

```sql
SELECT @@transaction_isolation;                          -- REPEATABLE-READ
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

## 18.3 Locks and Deadlocks

- **Shared lock (S)** — for reading: `SELECT ... FOR SHARE` (`LOCK IN SHARE MODE` in older versions). Others can also read but not write.
- **Exclusive lock (X)** — for writing: `UPDATE`, `DELETE`, `SELECT ... FOR UPDATE`. Others must wait.
- InnoDB uses **row-level locking**; MyISAM uses table-level locking.
- **Deadlock:** T1 locks row A and waits for row B, while T2 locks row B and waits for row A. InnoDB detects it, rolls back one transaction (error 1213 "Deadlock found when trying to get lock") and the application should retry. Avoid it by always locking rows in the same order and keeping transactions short. `SHOW ENGINE INNODB STATUS` shows the latest deadlock.

**QA scenario — testing concurrency (e.g. the last item in stock):** open two sessions; in both run `START TRANSACTION; SELECT stock FROM products WHERE id = 1 FOR UPDATE;`. The second session waits until the first commits, so you can verify stock never goes negative. In UI/API tests you reproduce this by firing parallel requests and then checking the DB.

# 19. Normalization

**Normalization** organises tables to reduce **redundancy** and avoid **anomalies**:

- **Insert anomaly** — can't add a department until it has an employee (if both are in one table)
- **Update anomaly** — a department's location is stored in 50 rows; updating 49 leaves inconsistent data
- **Delete anomaly** — deleting the last employee also deletes the department's information

**Unnormalized example:**

| emp_id | name | dept_name | dept_location | skills |
|--------|------|-----------|---------------|--------|
| 1 | Amit | Engineering | Pune | Java, SQL |
| 3 | Rahul | Engineering | Pune | Selenium |

| Normal form | Rule | Fix in the example |
|-------------|------|--------------------|
| **1NF** | Atomic values (no lists in a cell), no repeating groups, each row unique | Move `skills` to a separate table `emp_skills(emp_id, skill)` — one skill per row |
| **2NF** | 1NF + **no partial dependency**: every non-key column depends on the **whole** composite key | In `order_items(order_id, product_id, product_name)`, `product_name` depends only on `product_id` → move it to `products` |
| **3NF** | 2NF + **no transitive dependency**: non-key columns depend only on the key, not on other non-key columns | `dept_location` depends on `dept_name`, not on `emp_id` → move to `departments` table |
| **BCNF** | Stricter 3NF: for every dependency X → Y, X must be a super key | Rare in interviews — know the definition |

Short memory line: *"The key (1NF), the whole key (2NF), and nothing but the key (3NF)."*

**Denormalization** — intentionally adding redundancy (e.g. storing `order_total` in `orders`) to make reads faster in reporting/analytics systems. Trade-off: faster reads vs. risk of inconsistent data — which is exactly what QA should test (does `order_total` always equal the sum of the items?).

**Relationships**

| Type | Example | How it is built |
|------|---------|-----------------|
| One-to-one | user ↔ user_profile | FK with a UNIQUE constraint |
| One-to-many | department → employees | FK in the "many" table |
| Many-to-many | orders ↔ products | Junction / bridge table (`order_items`) with two FKs |

**ER diagram** — Entity-Relationship diagram: entities (tables), attributes (columns), relationships with cardinality (1:1, 1:N, M:N).

<div class="pb"></div>

# 20. Users, Privileges and Security

```sql
CREATE USER 'qa_reader'@'%' IDENTIFIED BY 'StrongPass#1';
GRANT SELECT ON qa_company.* TO 'qa_reader'@'%';
GRANT SELECT, INSERT, UPDATE ON qa_company.orders TO 'qa_reader'@'%';
SHOW GRANTS FOR 'qa_reader'@'%';
REVOKE INSERT, UPDATE ON qa_company.orders FROM 'qa_reader'@'%';
DROP USER 'qa_reader'@'%';
```

Principle of least privilege: test automation users usually need only `SELECT` on production-like environments; never use `root` in test frameworks.

## 20.1 SQL Injection (security testing)

SQL injection happens when user input is concatenated directly into a SQL string.

```js
// VULNERABLE
const sql = "SELECT * FROM users WHERE username = '" + user + "' AND password = '" + pass + "'";
// input  user = admin' --     →   ... WHERE username = 'admin' -- ' AND password = ''
// input  user = ' OR '1'='1   →   returns every user
```

**Prevention:** parameterized queries / prepared statements, ORM, input validation, least-privilege DB users, and not showing raw DB errors to users.

```js
// SAFE (mysql2 in Node / TypeScript)
const [rows] = await conn.execute(
  'SELECT * FROM users WHERE username = ? AND password = ?', [user, pass]);
```

**QA test inputs** for login/search fields: `'`, `' OR '1'='1`, `admin' --`, `'; DROP TABLE users; --`, `1 OR 1=1`. Expected: no data leak, no SQL error message in the UI, a normal "invalid credentials" response. Tools: Burp Suite, sqlmap (only with permission).

# 21. Other Topics You Should Know

**Temporary tables** — `CREATE TEMPORARY TABLE tmp_orders AS SELECT ...;` visible only to the current session and dropped automatically when it ends.

**Prepared statements in SQL:**

```sql
PREPARE stmt FROM 'SELECT * FROM employees WHERE dept_id = ?';
SET @d = 2;
EXECUTE stmt USING @d;
DEALLOCATE PREPARE stmt;
```

**Backup and restore:**

```bash
mysqldump -u root -p qa_company > qa_company_backup.sql
mysql -u root -p qa_company < qa_company_backup.sql
```

QA use: take a dump of a known-good test database and restore it before each regression run so tests always start from the same data.

**Replication** — a primary (source) server copies changes (binary log) to one or more replicas. Used for read scaling and high availability. Test angle: **replication lag** — data written to the primary may not be visible immediately on a read replica.

**Partitioning** — splits one big table into parts (e.g. by year of `order_date`) stored separately; queries that filter on the partition key read fewer partitions.

**Sharding** — splitting data across multiple servers (e.g. customers A–M on server 1).

**JSON support** — `JSON` column type, `col->'$.city'`, `JSON_EXTRACT()`, `JSON_OBJECT()`. Useful when verifying API payloads stored in the DB.

**Character set** — use `utf8mb4` (full Unicode incl. emoji). Old `utf8` (utf8mb3) cannot store emoji — a classic bug when users type 😀 in a name field.

**Collation** — rules for comparing/sorting text. Default `utf8mb4_0900_ai_ci` is **case-insensitive** (`ci`) and accent-insensitive (`ai`), so `WHERE name = 'amit'` matches 'Amit'. Use `BINARY` or a `_bin`/`_cs` collation for case-sensitive checks (e.g. verifying a password reset token).

<div class="pb"></div>
