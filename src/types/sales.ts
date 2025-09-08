export interface SalesClient {
  id: string;
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  source: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProcessClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  notes?: string;
}

export interface ProcessClientResponse {
  success: boolean;
  message?: string;
}