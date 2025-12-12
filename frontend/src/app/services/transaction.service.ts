import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Transaction } from '../models/transaction.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://127.0.0.1:8000/tracker/transactions/';
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  transactions$ = this.transactionsSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private router: Router
  ) {
    if (this.authService.getToken()) {
      this.loadTransactions();
    }
  }

  private loadTransactions(): Observable<Transaction[]> {
    const token = this.authService.getToken();
    if (!token) {
      console.error('Token is missing');
      this.router.navigate(['/login']);
      return of([]);
    }

    return this.http.get<Transaction[]>(this.apiUrl, {
      headers: this.createHeaders()
    }).pipe(
      catchError((error) => {
        if (error.status === 401) {
          return this.handleUnauthorized(() => this.loadTransactions());
        }
        return throwError(() => error);
      }),
      tap({
        next: (transactions) => {
          console.log('Loaded transactions:', transactions);
          this.transactionsSubject.next(transactions);
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          if (error.status === 401) {
            this.router.navigate(['/login']);
          }
          this.transactionsSubject.next([]);
        }
      })
    );
  }

  getTransactions(): Observable<Transaction[]> {
    this.loadTransactions().subscribe();
    return this.transactions$;
  }

  create(transaction: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction, {
      headers: this.createHeaders(),
    }).pipe(
      tap((newTransaction) => {
        console.log('Created transaction:', newTransaction);
        this.loadTransactions().subscribe();
      }),
      catchError((error) => {
        if (error.status === 401) {
          return this.handleUnauthorized(() => this.create(transaction));
        }
        return throwError(() => error);
      })
    );
  }

  private createHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      throw new Error('Authentication token is missing');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  private handleUnauthorized(retryCallback: () => Observable<any>): Observable<any> {
    return this.authService.refreshToken().pipe(
      switchMap(() => retryCallback()),
      catchError((error) => {
        console.error('Token refresh failed:', error);
        this.router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  updateTransaction(id: number, transaction: Transaction): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}${id}/`, transaction, {
      headers: this.createHeaders(),
    }).pipe(
      tap(() => {
        this.loadTransactions().subscribe();
      }),
      catchError((error) => {
        if (error.status === 401) {
          return this.handleUnauthorized(() => this.updateTransaction(id, transaction));
        }
        return throwError(() => error);
      })
    );
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}${id}/`, {
      headers: this.createHeaders(),
    }).pipe(
      tap(() => {
        this.loadTransactions().subscribe();
      }),
      catchError((error) => {
        if (error.status === 401) {
          return this.handleUnauthorized(() => this.deleteTransaction(id));
        }
        return throwError(() => error);
      })
    );
  }
}