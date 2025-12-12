import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { Goal } from '../../models/goal';
import { Transaction } from '../../models/transaction.model';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LanguageSwitcherComponent, NotificationBellComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  currentUser: User | null = null;
  users: User[] = [];
  selectedUser: User | null = null;
  editingUser: User | null = null;
  allGoals: Goal[] = [];
  allTransactions: Transaction[] = [];
  
  activeTab: 'users' | 'goals' | 'transactions' = 'users';
  
  showCreateUserModal = false;
  newUser = {
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  };

  editUserData = {
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  };
  
  error = '';
  success = '';
  loading = false;
  showPassword = false;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
  }

  loadCurrentUser(): void {
    // Get current user info to check role
    this.authService.getToken();
    // For now, we'll check role from the user data when loading users
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        // Set current user if not set
        if (!this.currentUser) {
          // We'll get this from the first load or from auth
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        if (err.status === 403) {
          this.router.navigate(['/dashboard']);
        }
        this.loading = false;
      }
    });
  }

  loadAllGoals(): void {
    this.loading = true;
    this.adminService.getAllGoals().subscribe({
      next: (goals) => {
        this.allGoals = goals;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading goals:', err);
        this.loading = false;
      }
    });
  }

  loadAllTransactions(): void {
    this.loading = true;
    this.adminService.getAllTransactions().subscribe({
      next: (transactions) => {
        this.allTransactions = transactions;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.loading = false;
      }
    });
  }

  selectUser(user: User): void {
    this.loading = true;
    this.editingUser = null; // Reset edit mode when selecting a new user
    this.adminService.getUserDetail(user.id).subscribe({
      next: (userDetail) => {
        this.selectedUser = userDetail;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading user details:', err);
        this.loading = false;
      }
    });
  }

  startEditUser(): void {
    if (!this.selectedUser) return;
    this.editingUser = { ...this.selectedUser };
    this.editUserData = {
      name: this.selectedUser.name,
      email: this.selectedUser.email,
      password: '',
      role: (this.selectedUser.role || 'user') as 'admin' | 'user'
    };
    this.showPassword = false;
    this.error = '';
    this.success = '';
  }

  cancelEditUser(): void {
    this.editingUser = null;
    this.editUserData = {
      name: '',
      email: '',
      password: '',
      role: 'user'
    };
    this.showPassword = false;
    this.error = '';
    this.success = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  updateUser(): void {
    if (!this.editingUser || !this.selectedUser) return;

    this.error = '';
    this.success = '';

    // Validate password if provided
    if (this.editUserData.password && this.editUserData.password.length < 6) {
      this.translate.get('errors.passwordTooShort').subscribe(msg => {
        this.error = msg;
      });
      return;
    }

    this.loading = true;

    const updateData: any = {
      name: this.editUserData.name,
      email: this.editUserData.email,
      role: this.editUserData.role
    };

    // Only include password if it's provided
    if (this.editUserData.password) {
      updateData.password = this.editUserData.password;
    }

    this.adminService.updateUser(this.selectedUser.id, updateData).subscribe({
      next: (updatedUser) => {
        // Update the user in the list
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        // Reload user details to get updated data
        this.selectUser(updatedUser);
        this.editingUser = null;
        this.loading = false;
        this.translate.get('admin.userUpdated').subscribe(msg => {
          this.success = msg;
        });
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.loading = false;
        if (err.error && err.error.email) {
          this.translate.get('errors.emailExists').subscribe(msg => {
            this.error = msg;
          });
        } else {
          this.translate.get('errors.updateFailed').subscribe(msg => {
            this.error = msg;
          });
        }
      }
    });
  }

  deleteUser(userId: number): void {
    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== userId);
        if (this.selectedUser?.id === userId) {
          this.selectedUser = null;
        }
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.translate.get('errors.deleteFailed').subscribe(msg => {
          alert(msg);
        });
      }
    });
  }

  openCreateUserModal(): void {
    this.showCreateUserModal = true;
    this.newUser = {
      name: '',
      email: '',
      password: '',
      role: 'user'
    };
    this.error = '';
  }

  closeCreateUserModal(): void {
    this.showCreateUserModal = false;
    this.error = '';
  }

  createUser(): void {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.adminService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.users.push(user);
        this.closeCreateUserModal();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error creating user:', err);
        if (err.error && err.error.email) {
          this.error = 'Email already exists';
        } else {
          this.error = 'Failed to create user';
        }
        this.loading = false;
      }
    });
  }

  switchTab(tab: 'users' | 'goals' | 'transactions'): void {
    this.activeTab = tab;
    this.selectedUser = null;
    
    if (tab === 'goals') {
      this.loadAllGoals();
    } else if (tab === 'transactions') {
      this.loadAllTransactions();
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToGoals(): void {
    this.router.navigate(['/goals']);
  }

  getUserEmail(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user?.email || 'Unknown';
  }
}

