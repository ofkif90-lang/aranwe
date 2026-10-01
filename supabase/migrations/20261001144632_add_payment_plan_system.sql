/*
# Add Payment Plan System to Properties

1. New Columns on `properties`
- `payment_type` (text): 'cash_only' | 'installments_only' | 'cash_installments' — controls which payment options are shown to buyers. Default 'cash_only'.
- `down_payment_percentage` (numeric): percentage of price required as down payment for installments. Nullable.
- `down_payment_amount` (numeric): fixed down payment amount (alternative to percentage). Nullable.
- `installment_duration_months` (integer): total installment period in months. Nullable.
- `payment_frequency` (text): 'monthly' | 'quarterly' — installment frequency. Default 'monthly'.
- `monthly_installment` (numeric): calculated monthly installment amount. Nullable (admin can set or let system calculate).

2. New Column on `property_leads`
- `installment_years` (integer): preferred installment duration in years (if buyer chose installments). Nullable.

3. Security
- No new tables. Existing RLS policies on `properties` and `property_leads` cover the new columns.
*/

DO $$ BEGIN
  ALTER TABLE properties ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'cash_only';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE properties ADD COLUMN IF NOT EXISTS down_payment_percentage numeric;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE properties ADD COLUMN IF NOT EXISTS down_payment_amount numeric;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE properties ADD COLUMN IF NOT EXISTS installment_duration_months integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE properties ADD COLUMN IF NOT EXISTS payment_frequency text NOT NULL DEFAULT 'monthly';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_installment numeric;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE property_leads ADD COLUMN IF NOT EXISTS installment_years integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Add check constraint for payment_type
DO $$ BEGIN
  ALTER TABLE properties ADD CONSTRAINT properties_payment_type_check
  CHECK (payment_type = ANY (ARRAY['cash_only'::text, 'installments_only'::text, 'cash_installments'::text]));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
