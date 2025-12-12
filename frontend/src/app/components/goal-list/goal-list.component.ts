import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Goal } from '../../models/goal';
import { GoalService } from '../../services/goal.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-goal-list',
  imports: [FormsModule, CommonModule, TranslateModule],
  templateUrl: './goal-list.component.html',
  styleUrl: './goal-list.component.css'
})

export class GoalListComponent implements OnInit {
  goals: Goal[] = [];
  displayedGoals: Goal[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  pages: number[] = [];
  editingGoal: Goal | null = null;
  updatingAmountGoal: Goal | null = null;
  newAmount: number = 0;

  constructor(
    private goalService: GoalService, 
    private translate: TranslateService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadGoals();
  }

  loadGoals(): void {
    this.goalService.getGoals().subscribe({
      next: (goals) => {
        this.goals = goals;
        this.updatePagination();
        this.checkGoalDeadlines(goals);
      },
      error: (error) => {
        console.error('Error loading goals:', error);
      }
    });
  }

  checkGoalDeadlines(goals?: Goal[]): void {
    const goalsToCheck = goals || this.goals;
    const today = this.getTodayDateString();
    
    goalsToCheck.forEach(goal => {
      if (goal.deadline && goal.id) {
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
    });
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

  updatePagination(): void {
    this.totalPages = Math.ceil(this.goals.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.updateDisplayedGoals();
    this.updatePageNumbers();
  }

  updateDisplayedGoals(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedGoals = this.goals.slice(startIndex, endIndex);
  }

  updatePageNumbers(): void {
    this.pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }

    if (startPage > 1) {
      this.pages.unshift(-1);
      this.pages.unshift(1);
    }
    if (endPage < this.totalPages) {
      this.pages.push(-1);
      this.pages.push(this.totalPages);
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedGoals();
      this.updatePageNumbers();
    }
  }

  startEdit(goal: Goal): void {
    this.editingGoal = { ...goal };
  }

  saveEdit(): void {
    if (this.editingGoal) {
      this.goalService.updateGoal(this.editingGoal).subscribe({
        next: (updatedGoal) => {
          const index = this.goals.findIndex(g => g.id === updatedGoal.id);
          if (index !== -1) {
            this.goals[index] = updatedGoal;
            this.updatePagination();
          }
          // Check deadline after updating goal
          this.checkGoalDeadlines([updatedGoal]);
          this.editingGoal = null;
        },
        error: (error) => {
          console.error('Error updating goal:', error);
          this.translate.get('errors.registrationFailed').subscribe(msg => {
            alert(msg);
          });
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingGoal = null;
  }

  startUpdatingAmount(goal: Goal): void {
    this.updatingAmountGoal = goal;
    this.newAmount = goal.current_amount || 0;
  }

  cancelUpdatingAmount(): void {
    this.updatingAmountGoal = null;
    this.newAmount = 0;
  }

  updateAmount(): void {
    if (this.updatingAmountGoal && this.newAmount >= 0) {
      this.goalService.updateCurrentAmount(this.updatingAmountGoal.id!, this.newAmount).subscribe({
        next: (updatedGoal) => {
          const index = this.goals.findIndex(g => g.id === updatedGoal.id);
          if (index !== -1) {
            this.goals[index] = updatedGoal;
            this.updatePagination();
          }
          this.updatingAmountGoal = null;
          this.newAmount = 0;
        },
        error: (error) => {
          console.error('Error updating amount:', error);
          this.translate.get('errors.registrationFailed').subscribe(msg => {
            alert(msg);
          });
        }
      });
    }
  }

  deleteGoal(goalId: number): void {
    this.goalService.deleteGoal(goalId).subscribe({
      next: () => {
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.updatePagination();
      },
      error: (error) => {
        console.error('Error deleting goal:', error);
        this.translate.get('errors.registrationFailed').subscribe(msg => {
          alert(msg);
        });
      }
    });
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get paginatedGoals(): Goal[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.goals.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
