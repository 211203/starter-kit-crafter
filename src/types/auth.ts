export type UserRole = 'client_admin' | 'sales_rep';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  client_id?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}