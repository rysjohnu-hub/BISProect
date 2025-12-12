import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionListComponent } from '../../components/transaction-list/transaction-list.component';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { User } from '../../models/user';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, TransactionFormComponent, TransactionListComponent, TranslateModule, LanguageSwitcherComponent, NotificationBellComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isAdmin = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.auth.getCurrentUser().subscribe({
      next: (user: User) => {
        this.currentUser = user;
        this.isAdmin = user.role === 'admin';
      },
      error: (err) => {
        console.error('Error loading user:', err);
      }
    });
  }

  onToGoals() {
    this.router.navigate(['/goals']);
  }

  onToAdmin() {
    this.router.navigate(['/admin']);
  }

  onToProfile() {
    this.router.navigate(['/profile']);
  }

  onLogout() {
    this.auth.logout();             
    this.router.navigate(['/login']); 
  }
}
