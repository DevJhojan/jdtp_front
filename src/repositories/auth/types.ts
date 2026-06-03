export interface UserRow {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  password_hash: string;
  password_salt: string;
  firebase_uid?: string | null;
}
