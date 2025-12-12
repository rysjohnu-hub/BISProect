import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Category } from '../../models/category';
import { Transaction } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
})
export class TransactionFormComponent {
  @Output() transactionAdded = new EventEmitter<void>();

  transaction: Transaction = {
    transaction_type: 'income',
    category: '',
    amount: 0,
    date: this.getTodayDate(),
    description: ''
  };

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onAmountFocus() {
    if (this.transaction.amount === 0) {
      this.transaction.amount = null as any;
    }
  }
  
  onAmountBlur() {
    if (!this.transaction.amount) {
      this.transaction.amount = 0;
    }
  }

  categories: Category[] = [];
  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];

  constructor(
    private ts: TransactionService, 
    private translate: TranslateService,
    private notificationService: NotificationService
  ) {
    this.loadCategories();
    this.translate.onLangChange.subscribe(() => {
      this.loadCategories();
      this.updateCategories();
      // Update category to first available category when language changes
      if (this.categories.length > 0) {
        this.transaction.category = this.categories[0] as Category;
      }
    });
  }

  private loadCategories() {
    this.translate.get('transaction.categories.income').subscribe((cats: any) => {
      this.incomeCategories = [cats.salary, cats.gift, cats.other];
      this.updateCategories();
      // Set default category after loading
      if (this.categories.length > 0 && !this.categories.includes(this.transaction.category)) {
        this.transaction.category = this.categories[0];
      }
    });
    this.translate.get('transaction.categories.expense').subscribe((cats: any) => {
      this.expenseCategories = [cats.food, cats.transport, cats.entertainment, cats.other];
      this.updateCategories();
    });
  }

  onTypeChange(): void {
    this.updateCategories();
    if (this.categories.length > 0) {
      this.transaction.category = this.categories[0];
    }
  }

  private updateCategories(): void {
    if (this.transaction.transaction_type === 'income') {
      this.categories = this.incomeCategories;
    } else {
      this.categories = this.expenseCategories;
    }
  }

  private parseAmount(amount: number | string): number {
    if (typeof amount === 'string') {
      return parseFloat(amount) || 0;
    }
    return amount || 0;
  }

  addTransaction() {
    const amountValue = this.parseAmount(this.transaction.amount);
    if (!this.transaction.date || amountValue <= 0) {
      this.translate.get('common.amount').subscribe(amountLabel => {
        this.translate.get('common.date').subscribe(dateLabel => {
          alert(`❗ Please fill in ${dateLabel} and ${amountLabel} correctly`);
        });
      });
      return;
    }
    
    this.ts.create(this.transaction).subscribe({
      next: (transaction: Transaction) => {
        console.log('Transaction created:', transaction);
        
        // Create notification - pass raw values, translation happens on display
        const transactionType = this.transaction.transaction_type; // 'income' or 'expense'
        const amount = this.parseAmount(this.transaction.amount);
        const category = this.transaction.category; // Already in current language from form
        
        this.notificationService.notifyTransactionAdded(transactionType, amount, category);
        
        this.resetForm();
        this.transactionAdded.emit();
      },
      error: (error) => {
        console.error('Error adding transaction:', error);
        this.translate.get('errors.registrationFailed').subscribe(msg => {
          alert(msg);
        });
      }
    });
  }

  resetForm() {
    this.updateCategories();
    const defaultCategory = this.categories.length > 0 ? this.categories[0] : '';
    this.transaction = {
      transaction_type: 'income',
      category: defaultCategory,
      amount: 0,
      date: this.getTodayDate(),
      description: ''
    };
  }
}
