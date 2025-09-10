export interface Customer {
  id: string;
  sales_rep_user_id: string;
  sales_rep_id?: string;
  client_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  source: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}