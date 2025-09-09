-- Add notes column to sales_representatives table
ALTER TABLE public.sales_representatives 
ADD COLUMN notes TEXT;

-- Add index for better performance when searching notes
CREATE INDEX idx_sales_representatives_notes ON public.sales_representatives USING GIN(to_tsvector('english', notes));