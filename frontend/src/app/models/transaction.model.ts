import { Category } from "./category";

export interface Transaction {
    id?: number;
    transaction_type: 'income' | 'expense';
    category: Category;
    amount: number | string;
    date: string;
    description: string;
    user?: number; // User ID for admin panel
  }
  