export interface LoginResponse { token: string; role: string; name: string; permissions: string[]; }
export interface RegisterResponse { activated: boolean; message: string; }
