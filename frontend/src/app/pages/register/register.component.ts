import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, LanguageSwitcherComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';

  constructor(private auth: AuthService, private router: Router, private translate: TranslateService) {}

  onRegister() {
    // Validate passwords match
    if (this.password !== this.confirmPassword) {
      this.translate.get('errors.passwordsDontMatch').subscribe(msg => {
        this.error = msg;
      });
      return;
    }

    // Validate password length
    if (this.password.length < 6) {
      this.translate.get('errors.passwordTooShort').subscribe(msg => {
        this.error = msg;
      });
      return;
    }

    this.error = '';

    this.auth.register(this.name, this.email, this.password).subscribe({
      next: (res: any) => {
        // After successful registration, automatically log in
        this.auth.login(this.email, this.password).subscribe({
          next: (loginRes: any) => {
            this.auth.setToken(loginRes.access, loginRes.refresh);
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            // Registration successful but auto-login failed, redirect to login
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        if (err.error && err.error.email) {
          this.translate.get('errors.emailExists').subscribe(msg => {
            this.error = msg;
          });
        } else if (err.error && typeof err.error === 'object') {
          this.error = Object.values(err.error).flat().join(', ');
        } else {
          this.translate.get('errors.registrationFailed').subscribe(msg => {
            this.error = msg;
          });
        }
        console.error(err);
      }
    });
  }
}

