import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Notification } from '../models/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private storageKey = 'notifications';

  constructor(private translate: TranslateService) {
    this.loadNotifications();
    this.checkGoalDeadlines();
  }

  private loadNotifications(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const notifications = JSON.parse(stored);
        this.notifications$.next(notifications);
      } catch (e) {
        console.error('Error loading notifications:', e);
        this.notifications$.next([]);
      }
    }
  }

  private saveNotifications(notifications: Notification[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    this.notifications$.next(notifications);
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  getUnreadCount(): number {
    return this.notifications$.value.filter(n => !n.read).length;
  }

  addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      read: false
    };

    const current = this.notifications$.value;
    this.saveNotifications([newNotification, ...current]);
  }

  markAsRead(id: string): void {
    const current = this.notifications$.value;
    const updated = current.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.saveNotifications(updated);
  }

  markAllAsRead(): void {
    const current = this.notifications$.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this.saveNotifications(updated);
  }

  deleteNotification(id: string): void {
    const current = this.notifications$.value;
    const updated = current.filter(n => n.id !== id);
    this.saveNotifications(updated);
  }

  clearAll(): void {
    this.saveNotifications([]);
  }

  // Add notification when transaction is created
  notifyTransactionAdded(transactionType: string, amount: number, category: string): void {
    // Validate inputs
    if (!transactionType || !category) {
      console.error('Invalid notification data:', { transactionType, amount, category });
      return;
    }
    
    // Format amount to 2 decimal places
    const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : String(amount);
    
    // Store parameters for translation on display
    this.addNotification({
      type: 'transaction',
      message: '', // Will be translated on display
      transactionId: undefined,
      params: {
        type: transactionType, // Should be 'income' or 'expense'
        amount: formattedAmount,
        category: category || ''
      }
    });
  }

  // Check for goal deadlines daily
  checkGoalDeadlines(): void {
    // Check once per day
    const lastCheck = localStorage.getItem('lastGoalCheck');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastCheck !== today) {
      localStorage.setItem('lastGoalCheck', today);
      // This will be called from the goals service when goals are loaded
    }
  }

  // Add notification for goal deadline
  notifyGoalDeadline(goalTitle: string, goalId: number): void {
    // Validate inputs
    if (!goalTitle || !goalId) {
      console.error('Invalid goal deadline notification data:', { goalTitle, goalId });
      return;
    }
    
    // Store parameters for translation on display
    this.addNotification({
      type: 'goal_deadline',
      message: '', // Will be translated on display
      goalId: goalId,
      params: {
        title: goalTitle || ''
      }
    });
  }
}

