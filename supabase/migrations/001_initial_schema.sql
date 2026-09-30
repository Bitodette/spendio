-- User profile (otomatis dari Supabase Auth)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  default_currency text default 'IDR',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Rekening (bank, e-wallet, cash)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text check (type in ('bank', 'e-wallet', 'cash')) not null,
  balance decimal default 0,
  icon text,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Kategori dengan hierarchy
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  icon text,
  color text,
  type text check (type in ('income', 'expense')) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tag
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Transaksi
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  type text check (type in ('income', 'expense')) not null,
  amount decimal not null,
  description text,
  date date not null,
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Relasi transaksi <> tag (many-to-many)
create table if not exists transaction_tags (
  transaction_id uuid references transactions(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

-- Budget per kategori
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  amount decimal not null,
  period text check (period in ('monthly', 'yearly')) not null,
  start_date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Transaksi berulang
create table if not exists recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  type text check (type in ('income', 'expense')) not null,
  amount decimal not null,
  description text,
  frequency text check (frequency in ('weekly', 'monthly', 'yearly')) not null,
  next_date date not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Target tabungan
create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  target_amount decimal not null,
  current_amount decimal default 0,
  deadline date,
  icon text,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes untuk performa
create index if not exists idx_accounts_user_id on accounts(user_id);
create index if not exists idx_categories_user_id on categories(user_id);
create index if not exists idx_categories_parent_id on categories(parent_id);
create index if not exists idx_tags_user_id on tags(user_id);
create index if not exists idx_transactions_user_id on transactions(user_id);
create index if not exists idx_transactions_account_id on transactions(account_id);
create index if not exists idx_transactions_category_id on transactions(category_id);
create index if not exists idx_transactions_date on transactions(date);
create index if not exists idx_transactions_type on transactions(type);
create index if not exists idx_budgets_user_id on budgets(user_id);
create index if not exists idx_recurring_user_id on recurring_transactions(user_id);
create index if not exists idx_savings_goals_user_id on savings_goals(user_id);