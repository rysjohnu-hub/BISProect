export interface Notification {
  id: string;
  type: 'transaction' | 'goal_deadline';
  message: string; // Kept for backward compatibility, but will be regenerated on display
  createdAt: string;
  read: boolean;
  goalId?: number;
  transactionId?: number;
  // Parameters for translation
  params?: {
    type?: string;
    amount?: string;
    category?: string;
    title?: string;
  };
}

