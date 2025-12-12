import { Component, ViewChild } from '@angular/core';
import { GoalFormComponent } from '../../components/goal-form/goal-form.component';
import { GoalListComponent } from '../../components/goal-list/goal-list.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-goals-page',
  imports: [GoalFormComponent, GoalListComponent, TranslateModule, LanguageSwitcherComponent, NotificationBellComponent],
  templateUrl: './goals-page.component.html',
  styleUrl: './goals-page.component.css'
})
export class GoalsPageComponent {
  @ViewChild(GoalListComponent) goalListComponent!: GoalListComponent;

  constructor(private auth: AuthService, private router: Router) {}

  onToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  onGoalAdded(): void {
    this.goalListComponent.loadGoals();
  }
}
