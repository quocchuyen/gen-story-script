import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  // Fix: Explicitly type `http` as HttpClient to resolve type inference issue.
  private readonly http: HttpClient = inject(HttpClient);
  private translations = signal<Record<string, any>>({});

  async loadTranslations(lang: string): Promise<void> {
    try {
      const data = await lastValueFrom(this.http.get<Record<string, any>>(`/assets/i18n/${lang}.json`));
      this.translations.set(data);
    } catch (error) {
      console.error(`Could not load translations for ${lang}`, error);
      // Fallback to English if the desired language fails to load
      if (lang !== 'en') {
        await this.loadTranslations('en');
      }
    }
  }

  translate(key: string): string {
    const keys = key.split('.');
    let result: any = this.translations();

    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        return key; // Return the key itself if not found
      }
    }
    
    // Fix: Ensure that a string is returned. If the resolved value is not a string (e.g., it's a nested object), return the key.
    return typeof result === 'string' ? result : key;
  }
}
