import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Category } from '../../models/category';
import { Transaction } from '../../models/transaction.model';
import { AmountPipe } from '../../pipes/amount.pipe';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-list',
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, AmountPipe, TranslateModule]
})
export class TransactionListComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  displayedTransactions: Transaction[] = [];
  private subscription: Subscription = new Subscription();


  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;

  filterType: 'income' | 'expense' | '' = '';
  filterCategory: Category | '' = '';
  filterDateFrom: string = '';
  filterDateTo: string = '';
  

  totalIncome: number = 0;
  totalExpense: number = 0;

  overallIncome: number = 0;
  overallExpense: number = 0;

  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];
  editingTransaction: Transaction | null = null;
  
  // Category mapping: key -> translations in all languages
  private categoryMap: { [key: string]: { en: string; ru: string; kk: string } } = {
    'salary': { en: 'Salary', ru: 'Зарплата', kk: 'Жалақы' },
    'gift': { en: 'Gift', ru: 'Подарок', kk: 'Сыйлық' },
    'food': { en: 'Food', ru: 'Еда', kk: 'Тағам' },
    'transport': { en: 'Transport', ru: 'Транспорт', kk: 'Көлік' },
    'entertainment': { en: 'Entertainment', ru: 'Развлечения', kk: 'Ойын-сауық' },
    'other': { en: 'Other', ru: 'Другое', kk: 'Басқа' }
  };

  constructor(private ts: TransactionService, private translate: TranslateService) {
    this.loadCategories();
    this.translate.onLangChange.subscribe(() => {
      this.loadCategories();
      // Refresh the display when language changes to show translated categories
      this.applyFilters();
    });
  }

  private loadCategories() {
    this.translate.get('transaction.categories.income').subscribe((cats: any) => {
      this.incomeCategories = [cats.salary, cats.gift, cats.other];
    });
    this.translate.get('transaction.categories.expense').subscribe((cats: any) => {
      this.expenseCategories = [cats.food, cats.transport, cats.entertainment, cats.other];
    });
  }

  // Translate category name to current language
  translateCategory(categoryName: string, transactionType: 'income' | 'expense'): string {
    if (!categoryName) return categoryName;
    
    // Find the category key by checking all language translations
    let categoryKey: string | null = null;
    for (const [key, translations] of Object.entries(this.categoryMap)) {
      // Check if the stored category name matches any translation
      if (Object.values(translations).includes(categoryName)) {
        categoryKey = key;
        break;
      }
    }
    
    // If we found the key, return the translated version for current language
    if (categoryKey) {
      const currentLang = this.translate.currentLang || 'en';
      const translation = this.categoryMap[categoryKey][currentLang as 'en' | 'ru' | 'kk'];
      if (translation) {
        return translation;
      }
    }
    
    // If not found, try to get it from current language categories
    const currentCategories = transactionType === 'income' ? this.incomeCategories : this.expenseCategories;
    // If the category is already in the current language, return it as is
    if (currentCategories.includes(categoryName)) {
      return categoryName;
    }
    
    // Fallback: return original category name
    return categoryName;
  }

  ngOnInit(): void {
    this.loadTransactions();
    // Subscribe to transaction updates
    this.subscription.add(
      this.ts.transactions$.subscribe({
        next: (data: Transaction[]) => {
          console.log('Received transactions:', data);
          this.transactions = data;
          this.calculateOverallTotals();
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error fetching transactions:', error);
        }
      })
    );
  }

  private loadTransactions(): void {
    this.ts.getTransactions().subscribe();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  get availableCategories(): Category[] {
    return this.filterType === 'income' ? this.incomeCategories :
           this.filterType === 'expense' ? this.expenseCategories : [];
  }

  private parseAmount(amount: number | string): number {
    if (typeof amount === 'string') {
      return parseFloat(amount) || 0;
    }
    return amount || 0;
  }

  private calculateOverallTotals() {
    this.overallIncome = this.transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + this.parseAmount(t.amount), 0);

    this.overallExpense = this.transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + this.parseAmount(t.amount), 0);
  }

  applyFilters() {
    console.log('Applying filters:', {
      type: this.filterType,
      category: this.filterCategory,
      dateFrom: this.filterDateFrom,
      dateTo: this.filterDateTo
    });
    
    this.filteredTransactions = this.transactions.filter(t => {
      const matchesType = !this.filterType || t.transaction_type === this.filterType;
      
      // For category matching, we need to check if the stored category matches the selected translated category
      // or if the translated version of the stored category matches the selected category
      let matchesCategory = true;
      if (this.filterCategory) {
        const translatedCategory = this.translateCategory(t.category, t.transaction_type);
        // Check both the original category and the translated category
        matchesCategory = t.category === this.filterCategory || translatedCategory === this.filterCategory;
      }
      
      const matchesDateFrom = !this.filterDateFrom || new Date(t.date) >= new Date(this.filterDateFrom);
      const matchesDateTo = !this.filterDateTo || new Date(t.date) <= new Date(this.filterDateTo);
      return matchesType && matchesCategory && matchesDateFrom && matchesDateTo;
    });
  
    console.log('Filtered transactions:', this.filteredTransactions);
    

    this.totalIncome = this.filteredTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + this.parseAmount(t.amount), 0);
  
    this.totalExpense = this.filteredTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + this.parseAmount(t.amount), 0);


    this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize);
    this.currentPage = 1; 
    this.updateDisplayedTransactions();
  }

  clearFilters() {
    this.filterType = '';
    this.filterCategory = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.applyFilters();
  }

 
  updateDisplayedTransactions() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayedTransactions = this.filteredTransactions.slice(start, end);
    console.log('Updated displayed transactions:', {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      displayedTransactions: this.displayedTransactions
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedTransactions();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedTransactions();
    }
  }

  get pages(): number[] {
    if (this.totalPages <= 7) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    let pages: number[] = [];
    const currentPage = this.currentPage;
    const totalPages = this.totalPages;


    pages.push(1);

    if (currentPage > 3) {
      pages.push(-1);
    }


    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push(-1); 
    }


    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedTransactions();
    }
  }

  startEdit(transaction: Transaction): void {
    this.editingTransaction = { ...transaction };
    // Ensure categories are loaded
    this.loadCategories();
  }

  cancelEdit(): void {
    this.editingTransaction = null;
  }

  saveEdit(): void {
    if (this.editingTransaction && this.editingTransaction.id) {
      const amountValue = this.parseAmount(this.editingTransaction.amount);
      if (!this.editingTransaction.date || amountValue <= 0) {
        this.translate.get('common.amount').subscribe(amountLabel => {
          this.translate.get('common.date').subscribe(dateLabel => {
            alert(`❗ Please fill in ${dateLabel} and ${amountLabel} correctly`);
          });
        });
        return;
      }

      this.ts.updateTransaction(this.editingTransaction.id, this.editingTransaction).subscribe({
        next: () => {
          this.editingTransaction = null;
          this.loadTransactions();
        },
        error: (error) => {
          console.error('Error updating transaction:', error);
          this.translate.get('errors.updateFailed').subscribe(msg => {
            alert(msg);
          }, () => {
            alert('Failed to update transaction. Please try again.');
          });
        }
      });
    }
  }

  deleteTransaction(id: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.ts.deleteTransaction(id).subscribe({
      next: () => {
        this.loadTransactions();
      },
      error: (error) => {
        console.error('Error deleting transaction:', error);
        this.translate.get('errors.deleteFailed').subscribe(msg => {
          alert(msg);
        }, () => {
          alert('Failed to delete transaction. Please try again.');
        });
      }
    });
  }

  onTypeChangeEdit(): void {
    if (this.editingTransaction) {
      // Set default category when type changes
      const categories = this.editingTransaction.transaction_type === 'income' 
        ? this.incomeCategories 
        : this.expenseCategories;
      if (categories.length > 0) {
        // Check if current category is valid for new type, if not set to first
        if (!categories.includes(this.editingTransaction.category)) {
          this.editingTransaction.category = categories[0];
        }
      }
    }
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onAmountFocusEdit(): void {
    if (this.editingTransaction && this.editingTransaction.amount === 0) {
      this.editingTransaction.amount = null as any;
    }
  }

  onAmountBlurEdit(): void {
    if (this.editingTransaction && !this.editingTransaction.amount) {
      this.editingTransaction.amount = 0;
    }
  }

  get editCategories(): Category[] {
    if (!this.editingTransaction) return [];
    return this.editingTransaction.transaction_type === 'income' 
      ? this.incomeCategories 
      : this.expenseCategories;
  }
}