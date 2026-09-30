ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

UPDATE accounts SET sort_order = 0 WHERE sort_order IS NULL;

CREATE INDEX idx_accounts_user_sort ON accounts(user_id, sort_order);
