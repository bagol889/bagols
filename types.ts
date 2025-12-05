
export enum UserRole {
  OWNER = 'owner',
  USER = 'user'
}

export interface Profile {
  id: string;
  role: UserRole; // 'owner' atau 'user'
  nomor: string | null; // Nomor Bot (Login ID untuk user)
  pw: string;           // Password (Login untuk semua)
  key: string | null;   // API Key / License Key
  created_at?: string;
}
