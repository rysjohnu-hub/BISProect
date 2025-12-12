import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './services/language.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>` 
})
export class AppComponent implements OnInit {
  constructor(
    private languageService: LanguageService,
    private translate: TranslateService
  ) {
    // Ensure default language is set
    this.translate.setDefaultLang('en');
  }

  ngOnInit() {
    // Language service initializes on construction
  }
}
