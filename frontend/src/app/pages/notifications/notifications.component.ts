import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../models/notification';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription = new Subscription();
  private langChangeSubscription: Subscription = new Subscription();

  // Category mapping: key -> translations in all languages
  private categoryMap: { [key: string]: { en: string; ru: string; kk: string } } = {
    'salary': { en: 'Salary', ru: 'Зарплата', kk: 'Жалақы' },
    'gift': { en: 'Gift', ru: 'Подарок', kk: 'Сыйлық' },
    'food': { en: 'Food', ru: 'Еда', kk: 'Тағам' },
    'transport': { en: 'Transport', ru: 'Транспорт', kk: 'Көлік' },
    'entertainment': { en: 'Entertainment', ru: 'Развлечения', kk: 'Ойын-сауық' },
    'other': { en: 'Other', ru: 'Другое', kk: 'Басқа' }
  };

  constructor(
    private notificationService: NotificationService,
    private translate: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.getNotifications().subscribe(notifications => {
      // Sort by date, newest first
      this.notifications = notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    
    // Re-translate notifications when language changes
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      // Trigger re-render by updating the notifications array
      // The getTranslatedMessage will automatically use the new language
      this.notifications = [...this.notifications];
    });
  }
  
  getTranslatedMessage(notification: Notification): string {
    try {
      // New format: translate using parameters
      if (notification.params) {
        if (notification.type === 'transaction') {
          // Check if we have all required params
          if (notification.params.type && notification.params.amount && notification.params.category) {
            // Translate transaction type if it's a key ('income' or 'expense')
            let translatedType = notification.params.type;
            if (notification.params.type === 'income' || notification.params.type === 'expense') {
              translatedType = this.translate.instant(`transaction.${notification.params.type}`);
            }
            
            // Translate category to current language
            const translatedCategory = this.translateCategory(
              notification.params.category, 
              notification.params.type as 'income' | 'expense'
            );
            const amount = notification.params.amount;
            
            return this.translate.instant('notifications.transactionAdded', {
              type: translatedType,
              amount: amount,
              category: translatedCategory
            });
          }
        } else if (notification.type === 'goal_deadline') {
          if (notification.params.title) {
            return this.translate.instant('notifications.goalDeadline', {
              title: notification.params.title
            });
          }
        }
      }
      
      // Fallback: use stored message (for backward compatibility with old notifications)
      if (notification.message && notification.message.trim() !== '') {
        // For old notifications without params, try to parse and translate
        if (notification.type === 'goal_deadline') {
          // Try to extract title from old format: "Today is the deadline for "Ps5". Did you reach your goal?"
          const match = notification.message.match(/for "([^"]+)"/);
          if (match && match[1]) {
            return this.translate.instant('notifications.goalDeadline', {
              title: match[1]
            });
          }
        }
        // Return stored message as fallback
        return notification.message;
      }
      
      // If we get here, something is wrong - return a default message
      if (notification.type === 'transaction') {
        return this.translate.instant('notifications.transactionAdded', {
          type: this.translate.instant('transaction.income'),
          amount: '0.00',
          category: ''
        });
      } else if (notification.type === 'goal_deadline') {
        return this.translate.instant('notifications.goalDeadline', {
          title: ''
        });
      }
      
      return '';
    } catch (error) {
      console.error('Error translating notification message:', error, notification);
      // Return stored message as last resort
      return notification.message || '';
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.langChangeSubscription.unsubscribe();
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  clearAll(): void {
    this.translate.get('notifications.clearAll').subscribe(clearText => {
      if (confirm(`${clearText}?`)) {
        this.notificationService.clearAll();
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToGoals(): void {
    this.router.navigate(['/goals']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return this.translate.instant('notifications.today') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return this.translate.instant('notifications.yesterday') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  get hasUnreadNotifications(): boolean {
    return this.notifications.some(n => !n.read);
  }

  get hasNotifications(): boolean {
    return this.notifications.length > 0;
  }

  // Translate category name to current language
  private translateCategory(categoryName: string, transactionType: 'income' | 'expense'): string {
    if (!categoryName) return categoryName;
    
    // Find the category key by checking all language translations
    let categoryKey: string | null = null;
    for (const [key, translations] of Object.entries(this.categoryMap)) {
      // Check if the stored category name matches any translation
      if (Object.values(translations).includes(categoryName)) {
        categoryKey = key;
        break;
      }
    }
    
    // If we found the key, return the translated version for current language
    if (categoryKey) {
      const currentLang = this.translate.currentLang || 'en';
      const translation = this.categoryMap[categoryKey][currentLang as 'en' | 'ru' | 'kk'];
      if (translation) {
        return translation;
      }
    }
    
    // Fallback: return original category name if we can't translate it
    return categoryName;
  }
}

