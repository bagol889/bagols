export enum UserRole { OWNER = 'owner', USER = 'user' }
export interface Profile { id: string; role: UserRole; nomor: string | null; pw: string; key: string | null; created_at?: string; }
