-- =========================================================
-- MySQL Interview Book - Sample Database
-- Run:  mysql -u root -p < sample_schema.sql
-- Every example in the book uses these tables.
-- =========================================================
DROP DATABASE IF EXISTS qa_company;
CREATE DATABASE qa_company;
USE qa_company;

CREATE TABLE departments (
  dept_id    INT PRIMARY KEY,
  dept_name  VARCHAR(50) NOT NULL UNIQUE,
  location   VARCHAR(50)
);

CREATE TABLE employees (
  emp_id      INT PRIMARY KEY AUTO_INCREMENT,
  first_name  VARCHAR(50)  NOT NULL,
  last_name   VARCHAR(50)  NOT NULL,
  email       VARCHAR(100) UNIQUE,
  gender      CHAR(1)      CHECK (gender IN ('M','F')),
  salary      DECIMAL(10,2) NOT NULL CHECK (salary > 0),
  hire_date   DATE         NOT NULL,
  dept_id     INT,
  manager_id  INT,
  CONSTRAINT fk_emp_dept FOREIGN KEY (dept_id)    REFERENCES departments(dept_id),
  CONSTRAINT fk_emp_mgr  FOREIGN KEY (manager_id) REFERENCES employees(emp_id)
);

CREATE TABLE customers (
  customer_id INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100),
  city        VARCHAR(50),
  signup_date DATE
);

CREATE TABLE products (
  product_id INT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  category   VARCHAR(50),
  price      DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
  order_id    INT PRIMARY KEY,
  customer_id INT NOT NULL,
  order_date  DATE NOT NULL,
  status      ENUM('PENDING','DELIVERED','CANCELLED') DEFAULT 'PENDING',
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

CREATE TABLE order_items (
  order_id   INT,
  product_id INT,
  quantity   INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id)   REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE logins (
  user_id    INT,
  login_date DATE,
  PRIMARY KEY (user_id, login_date)
);

INSERT INTO departments VALUES
 (1,'Engineering','Pune'),(2,'QA','Bangalore'),(3,'HR','Mumbai'),
 (4,'Sales','Delhi'),(5,'Finance','Pune');

INSERT INTO employees VALUES
 (1 ,'Amit'  ,'Sharma','amit@corp.com'  ,'M',150000,'2015-03-10',1,NULL),
 (2 ,'Priya' ,'Iyer'  ,'priya@corp.com' ,'F',120000,'2016-07-01',1,1),
 (3 ,'Rahul' ,'Verma' ,'rahul@corp.com' ,'M', 90000,'2018-01-15',1,2),
 (4 ,'Sneha' ,'Patil' ,'sneha@corp.com' ,'F', 90000,'2019-05-20',2,1),
 (5 ,'Vikram','Rao'   ,'vikram@corp.com','M', 70000,'2020-02-11',2,4),
 (6 ,'Anjali','Gupta' ,'anjali@corp.com','F', 75000,'2021-08-30',2,4),
 (7 ,'Karan' ,'Mehta' ,'karan@corp.com' ,'M', 60000,'2017-11-05',3,1),
 (8 ,'Neha'  ,'Joshi' ,'neha@corp.com'  ,'F', 85000,'2019-09-09',4,1),
 (9 ,'Rohit' ,'Singh' ,'rohit@corp.com' ,'M', 95000,'2022-04-18',4,8),
 (10,'Pooja' ,'Nair'  ,NULL             ,'F', 50000,'2023-01-02',NULL,4);

INSERT INTO customers VALUES
 (1,'Ravi Kumar' ,'ravi@mail.com' ,'Pune'  ,'2023-12-01'),
 (2,'Meera Shah' ,'meera@mail.com','Mumbai','2023-12-15'),
 (3,'Arjun Das'  ,'arjun@mail.com','Delhi' ,'2024-01-10'),
 (4,'Kavya Reddy','kavya@mail.com','Pune'  ,'2024-02-01'),
 (5,'Ravi Kumar' ,'ravi@mail.com' ,'Pune'  ,'2024-03-01');   -- duplicate customer!

INSERT INTO products VALUES
 (1,'Laptop'  ,'Electronics',55000),(2,'Mouse','Electronics',800),
 (3,'Desk'    ,'Furniture'  ,12000),(4,'Chair','Furniture'  ,7000),
 (5,'Notebook','Stationery' ,100);

INSERT INTO orders VALUES
 (101,1,'2024-01-05','DELIVERED'),(102,2,'2024-01-20','DELIVERED'),
 (103,1,'2024-02-11','CANCELLED'),(104,3,'2024-02-15','DELIVERED'),
 (105,2,'2024-03-01','PENDING'),  (106,1,'2024-03-18','DELIVERED'),
 (107,5,'2024-03-25','DELIVERED');

INSERT INTO order_items VALUES
 (101,1,1,55000),(101,2,2,800),
 (102,3,1,12000),(102,4,2,7000),
 (103,2,1,800),
 (104,1,1,55000),
 (105,4,4,7000),
 (106,2,3,800),(106,3,1,12000),
 (107,1,1,55000);

INSERT INTO logins VALUES
 (1,'2024-01-01'),(1,'2024-01-02'),(1,'2024-01-03'),(1,'2024-01-05'),
 (2,'2024-01-01'),(2,'2024-01-03'),
 (3,'2024-01-10'),(3,'2024-01-11'),(3,'2024-01-12'),(3,'2024-01-13');
