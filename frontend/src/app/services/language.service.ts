import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private currentLanguage$ = new BehaviorSubject<string>('en');
  public currentLanguage = this.currentLanguage$.asObservable();

  // Get current language value synchronously
  getCurrentLanguageValue(): string {
    return this.currentLanguage$.getValue();
  }

  constructor(private translate: TranslateService) {
    // Get saved language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('language') || 'en';
    
    // Initialize with saved language
    this.currentLanguage$.next(savedLanguage);
    
    // Set the language in TranslateService - this will load translations if needed
    this.translate.use(savedLanguage).subscribe({
      next: () => {
        // Update BehaviorSubject with the actual language that was set
        const actualLang = this.translate.currentLang || savedLanguage;
        this.currentLanguage$.next(actualLang);
      },
      error: () => {
        // If loading fails, fall back to default
        this.translate.use('en');
        this.currentLanguage$.next('en');
      }
    });
    
    // Listen to TranslateService language changes to keep in sync
    this.translate.onLangChange.subscribe(event => {
      this.currentLanguage$.next(event.lang);
    });
  }

  setLanguage(lang: string) {
    this.translate.use(lang).subscribe({
      next: () => {
        localStorage.setItem('language', lang);
        this.currentLanguage$.next(lang);
      },
      error: () => {
        // If loading fails, fall back to default
        this.translate.use('en');
        localStorage.setItem('language', 'en');
        this.currentLanguage$.next('en');
      }
    });
  }

  getCurrentLanguage(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'en';
  }
}

