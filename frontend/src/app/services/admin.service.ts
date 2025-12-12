import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { Goal } from '../models/goal';
import { Transaction } from '../models/transaction.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8000/tracker';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private createHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  // User management
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admin/users/`, {
      headers: this.createHeaders()
    });
  }

  getUserDetail(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/admin/users/${userId}/`, {
      headers: this.createHeaders()
    });
  }

  createUser(user: { name: string; email: string; password: string; role?: string }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admin/users/`, user, {
      headers: this.createHeaders()
    });
  }

  updateUser(userId: number, userData: { name?: string; email?: string; password?: string; role?: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}/`, userData, {
      headers: this.createHeaders()
    });
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/users/${userId}/`, {
      headers: this.createHeaders()
    });
  }

  // Get all goals (admin only)
  getAllGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.apiUrl}/admin/goals/`, {
      headers: this.createHeaders()
    });
  }

  // Get all transactions (admin only)
  getAllTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/admin/transactions/`, {
      headers: this.createHeaders()
    });
  }
}

