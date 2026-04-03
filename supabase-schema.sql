-- ============================================================
-- ExpenseTrack - Supabase Schema
-- Run this entire file in your Supabase SQL Editor once.
-- ============================================================

-- Enable Row Level Security on all tables

-- EXPENSES table
CREATE TABLE IF NOT EXISTS expenses (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop        TEXT NOT NULL,
  date        DATE NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Other',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- EXPENSE_PRODUCTS table (each row = one product line in an expense)
CREATE TABLE IF NOT EXISTS expense_products (
  id          BIGSERIAL PRIMARY KEY,
  expense_id  BIGINT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  qty         NUMERIC(10, 4) NOT NULL DEFAULT 1,  -- decimal quantities supported
  unit_price  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_products ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own expenses
CREATE POLICY "Users manage own expenses"
  ON expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can access products belonging to their own expenses
CREATE POLICY "Users manage own expense products"
  ON expense_products FOR ALL
  USING (
    expense_id IN (
      SELECT id FROM expenses WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    expense_id IN (
      SELECT id FROM expenses WHERE user_id = auth.uid()
    )
  );

-- ── Indexes for performance ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date    ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_products_expense ON expense_products(expense_id);
