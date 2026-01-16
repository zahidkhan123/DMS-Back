export interface IUser {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  name: string;
  user_type: string;
  created_at?: Date;
  updated_at?: Date;
}

