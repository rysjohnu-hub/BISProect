import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { GoalsPageComponent } from './pages/goals-page/goals-page.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'goals', component: GoalsPageComponent},
  { path: 'notifications', component: NotificationsComponent},
  { path: 'admin', component: AdminPanelComponent},
  { path: 'profile', component: ProfileComponent},
];
