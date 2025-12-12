import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LanguageSwitcherComponent, NotificationBellComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  editMode = false;
  showPassword = false;
  storedPassword: string = ''; // Store password temporarily when user types it
  
  profileData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  error = '';
  success = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.authService.getCurrentUser().subscribe({
      next: (user: User) => {
        this.user = user;
        this.profileData.name = user.name;
        this.profileData.email = user.email;
        this.profileData.password = '';
        this.profileData.confirmPassword = '';
        this.showPassword = false; // Reset password visibility when loading profile
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.loading = false;
        this.translate.get('errors.loadProfileFailed').subscribe(msg => {
          this.error = msg;
        });
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      // Reset form when canceling
      this.loadUserProfile();
      this.error = '';
      this.success = '';
      this.showPassword = false; // Hide password when exiting edit mode
    } else {
      // When entering edit mode, hide password by default
      this.showPassword = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  updateProfile(): void {
    this.error = '';
    this.success = '';

    // Validate password if provided
    if (this.profileData.password) {
      if (this.profileData.password.length < 6) {
        this.translate.get('errors.passwordTooShort').subscribe(msg => {
          this.error = msg;
        });
        return;
      }
      if (this.profileData.password !== this.profileData.confirmPassword) {
        this.translate.get('errors.passwordsDontMatch').subscribe(msg => {
          this.error = msg;
        });
        return;
      }
      // Store password temporarily so it can be shown when eye button is clicked
      this.storedPassword = this.profileData.password;
    }

    this.loading = true;
    
    const updateData: any = {
      name: this.profileData.name,
      email: this.profileData.email
    };

    // Only include password if it's provided
    if (this.profileData.password) {
      updateData.password = this.profileData.password;
    }

    this.authService.updateProfile(updateData).subscribe({
      next: (updatedUser: User) => {
        this.user = updatedUser;
        // Store password temporarily so it can be shown when eye button is clicked
        if (this.profileData.password) {
          this.storedPassword = this.profileData.password;
        }
        this.profileData.password = '';
        this.profileData.confirmPassword = '';
        this.editMode = false;
        this.showPassword = false; // Hide password after update
        this.loading = false;
        this.translate.get('profile.updateSuccess').subscribe(msg => {
          this.success = msg;
        });
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.loading = false;
        if (err.error && err.error.email) {
          this.translate.get('errors.emailExists').subscribe(msg => {
            this.error = msg;
          });
        } else {
          this.translate.get('errors.updateProfileFailed').subscribe(msg => {
            this.error = msg;
          });
        }
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToGoals(): void {
    this.router.navigate(['/goals']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getMaskedPassword(): string {
    if (!this.user) return '';
    // Return masked password (all dots)
    return '••••••••';
  }

  getDisplayPassword(): string {
    if (!this.user) return '';
    // For security, we don't actually store the password
    // So we'll just show masked password
    // In a real app, you'd need to get this from the backend or store it securely
    return this.showPassword ? '••••••••' : '••••••••';
  }
}

