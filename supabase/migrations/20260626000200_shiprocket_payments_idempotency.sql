-- Add a unique constraint to transaction_id to prevent duplicate payment postings
CREATE UNIQUE INDEX IF NOT EXISTS payments_transaction_id_unique_idx 
ON public.payments (transaction_id) 
WHERE transaction_id IS NOT NULL;
