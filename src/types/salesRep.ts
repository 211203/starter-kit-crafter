export interface SalesRep {
  id: string;
  user_id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSalesRepRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_no?: string;
}