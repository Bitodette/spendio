-- =============================================
-- RLS Policies for myExpense
-- Jalankan ini di Supabase SQL Editor
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- profiles: user can only access own data
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- accounts: user can only access own data
CREATE POLICY "Users can CRUD own accounts" ON accounts
  FOR ALL USING (user_id = auth.uid());

-- categories: user can only access own data
CREATE POLICY "Users can CRUD own categories" ON categories
  FOR ALL USING (user_id = auth.uid());

-- tags: user can only access own data
CREATE POLICY "Users can CRUD own tags" ON tags
  FOR ALL USING (user_id = auth.uid());

-- transactions: user can only access own data
CREATE POLICY "Users can CRUD own transactions" ON transactions
  FOR ALL USING (user_id = auth.uid());

-- transaction_tags: via transaction ownership
CREATE POLICY "Users can CRUD own transaction_tags" ON transaction_tags
  FOR ALL USING (
    transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid())
  );

-- budgets: user can only access own data
CREATE POLICY "Users can CRUD own budgets" ON budgets
  FOR ALL USING (user_id = auth.uid());

-- recurring_transactions: user can only access own data
CREATE POLICY "Users can CRUD own recurring_transactions" ON recurring_transactions
  FOR ALL USING (user_id = auth.uid());

-- savings_goals: user can only access own data
CREATE POLICY "Users can CRUD own savings_goals" ON savings_goals
  FOR ALL USING (user_id = auth.uid());

-- Trigger: auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();