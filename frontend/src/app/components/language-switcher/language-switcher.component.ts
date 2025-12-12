import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css']
})
export class LanguageSwitcherComponent implements OnInit {
  languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'kk', name: 'Қазақша', flag: '🇰🇿' }
  ];

  currentLanguage: string;

  constructor(
    private languageService: LanguageService,
    private translate: TranslateService
  ) {
    // Initialize immediately from multiple sources to get the most accurate value
    // Priority: LanguageService current value > TranslateService currentLang > localStorage > default
    const serviceLang = this.languageService.getCurrentLanguageValue();
    const translateLang = this.translate.currentLang;
    const savedLang = localStorage.getItem('language');
    this.currentLanguage = serviceLang || translateLang || savedLang || this.translate.defaultLang || 'en';
  }

  ngOnInit() {
    // Get the current language from TranslateService (source of truth)
    this.currentLanguage = this.translate.currentLang || this.translate.defaultLang || 'en';
    
    // Subscribe to language changes from the service - use startWith to get current value immediately
    this.languageService.currentLanguage.subscribe(lang => {
      this.currentLanguage = lang;
    });
    
    // Also listen to TranslateService language changes as a backup
    this.translate.onLangChange.subscribe(event => {
      this.currentLanguage = event.lang;
    });
  }

  changeLanguage(langCode: string) {
    this.languageService.setLanguage(langCode);
  }
}

