import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:8000/tracker';
  private accessToken$ = new BehaviorSubject<string | null>(this.getStoredAccessToken());
  private refreshToken$ = new BehaviorSubject<string | null>(this.getStoredRefreshToken());

  constructor(private http: HttpClient) {}

  private getStoredAccessToken(): string | null {
    return localStorage.getItem('access');
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('refresh');
  }

  getToken(): string | null {
    return this.getStoredAccessToken();
  }

  getAccessToken(): string | null {
    return this.getStoredAccessToken();
  }

  setToken(access: string, refresh: string): void {
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
    this.accessToken$.next(access);
    this.refreshToken$.next(refresh);
  }

  clearTokens(): void {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    this.accessToken$.next(null);
    this.refreshToken$.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.getStoredAccessToken();
  }

  login(email: string, password: string): Observable<{ access: string; refresh: string }> {
    return this.http.post<{ access: string; refresh: string }>(`${this.api}/api/token/`, {
      email, password
    }).pipe(
      tap(res => {
        this.setToken(res.access, res.refresh);
      })
    );
  }

  register(name: string, email: string, password: string) {
    return this.http.post(`${this.api}/register`, { name, email, password });
  }

  refreshToken(): Observable<{ access: string }> {
    const refresh = this.getStoredRefreshToken();
    if (!refresh) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ access: string }>(`${this.api}/api/token/refresh/`, {
      refresh: refresh
    }).pipe(
      tap(res => {
        localStorage.setItem('access', res.access);
        this.accessToken$.next(res.access);
      }),
      catchError(error => {
        this.clearTokens();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.clearTokens();
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.api}/user`);
  }

  updateProfile(profileData: { name?: string; email?: string; password?: string }): Observable<any> {
    return this.http.put(`${this.api}/user`, profileData);
  }
}
