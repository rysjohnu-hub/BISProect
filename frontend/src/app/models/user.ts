export interface User {
    id: number;
    name: string;
    email: string;
    password?: string;
    role?: 'admin' | 'user';
    token?: string;
    goals?: any[];
    transactions?: any[];
}
