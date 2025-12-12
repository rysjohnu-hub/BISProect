export interface Goal {
    id?: number; 
    user?: number; 
    title: string;
    target_amount: number;
    current_amount?: number; 
    deadline?: string | null; 
    created_at?: string; 
    is_completed?: boolean;
}
  