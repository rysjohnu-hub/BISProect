import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="notification-bell" (click)="goToNotifications()" title="Notifications">
      🔔
      <span *ngIf="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>
  `,
  styles: [`
    .notification-bell {
      position: relative;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: background 0.2s;
    }
    
    .notification-bell:hover {
      background: rgba(0, 0, 0, 0.1);
    }
    
    .badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #f44336;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.getNotifications().subscribe(notifications => {
      this.unreadCount = notifications.filter(n => !n.read).length;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
}

