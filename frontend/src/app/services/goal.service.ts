import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Goal } from '../models/goal';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})

export class GoalService {
  private apiUrl = `${environment.apiUrl}/goals`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getGoals(): Observable<Goal[]> {
    const token = this.authService.getToken(); 
    if (!token) {
      console.error('Token is missing');
    }
    return this.http.get<Goal[]>(this.apiUrl, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
    });
  }

  createGoal(goal: Goal): Observable<Goal> {
    return this.http.post<Goal>(`${this.apiUrl}/`, goal, {
      headers: this.createHeaders(),
    });
  }

  updateGoal(goal: Goal): Observable<Goal> {
    return this.http.put<Goal>(`${this.apiUrl}/${goal.id}/`, goal, {
      headers: this.createHeaders(),
    });
  }

  updateCurrentAmount(goalId: number, amount: number): Observable<Goal> {
    const url = `${this.apiUrl}${goalId}/update_amount/`;
    return this.http.post<Goal>(url, { amount }, {
      headers: this.createHeaders(),
    });
  }

  deleteGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`, {
      headers: this.createHeaders(),
    });
  }

  private createHeaders(): HttpHeaders {
    const token = this.authService.getToken(); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }
}