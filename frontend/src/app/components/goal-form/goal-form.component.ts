import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Goal } from '../../models/goal';
import { GoalService } from '../../services/goal.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslateModule],
  templateUrl: './goal-form.component.html',
  styleUrl: './goal-form.component.css'
})
export class GoalFormComponent {
  @Output() goalAdded = new EventEmitter<void>();
  newGoal: Goal = {
    title: '',
    target_amount: 0,
    current_amount: 0,
    deadline: ''
  };

  constructor(
    private goalService: GoalService, 
    private translate: TranslateService,
    private notificationService: NotificationService
  ) {}

  onAmountFocus(): void {
    if (this.newGoal.target_amount === 0) {
      this.newGoal.target_amount = null as any;
    }
  }

  onAmountBlur(): void {
    if (this.newGoal.target_amount === null) {
      this.newGoal.target_amount = 0;
    }
  }

  addGoal(): void {
    this.goalService.createGoal(this.newGoal).subscribe({
      next: (goal) => {
        // Check deadline immediately after creating goal
        this.checkGoalDeadline(goal);
        
        this.newGoal = {
          title: '',
          target_amount: 0,
          current_amount: 0,
          deadline: ''
        };
        this.goalAdded.emit();
      },
      error: (error) => {
        console.error('Error creating goal:', error);
        this.translate.get('errors.registrationFailed').subscribe(msg => {
          alert(msg);
        });
      }
    });
  }

  private checkGoalDeadline(goal: Goal): void {
    if (goal.deadline && goal.id) {
      const today = this.getTodayDateString();
      const deadlineDate = this.getDateString(goal.deadline);
      
      // Check if deadline is today or in the past
      if (deadlineDate <= today) {
        // Check if we already notified for this goal today
        const notificationKey = `goal_deadline_${goal.id}_${today}`;
        const alreadyNotified = localStorage.getItem(notificationKey);
        
        if (!alreadyNotified) {
          this.notificationService.notifyGoalDeadline(goal.title, goal.id);
          localStorage.setItem(notificationKey, 'true');
        }
      }
    }
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDateString(date: string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}