-- Simple test to verify SQL Editor is working
-- Run this first to make sure basic table creation works

CREATE TABLE test_table (
  id SERIAL PRIMARY KEY,
  test_message TEXT
);

INSERT INTO test_table (test_message) VALUES ('SQL Editor is working!');

SELECT * FROM test_table;
