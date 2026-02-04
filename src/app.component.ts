
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { GeminiService } from './services/gemini.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from './services/translation.service';
import { TranslatePipe } from './pipes/translate.pipe';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  // Fix: Removed redundant providers already provided in root.
})
export class AppComponent {
  private readonly geminiService = inject(GeminiService);
  private readonly translationService = inject(TranslationService);

  storyIdea = signal<string>('A younger sister feels overshadowed by her successful older brother. At a family dinner celebrating his promotion, she reveals a secret that could ruin his career, forcing the family to choose sides.');
  
  selectedTone = signal<string>('dramatic');
  readonly tones = [
    { key: 'dramatic' },
    { key: 'suspenseful' },
    { key: 'heartwarming' },
    { key: 'melancholic' },
    { key: 'inspirational' }
  ];

  selectedModel = signal<string>('gemini-2.5-flash');
  // Fix: Removed deprecated and non-recommended models.
  readonly models = [
    'gemini-2.5-flash',
  ];

  selectedLang = signal<string>('en');
  readonly availableLangs = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'no', name: 'Norsk' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'da', name: 'Dansk' },
    { code: 'ja', name: '日本語' },
    { code: 'vi', name: 'Tiếng Việt' }
  ];

  generatedScript = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  copyButtonText = signal<string>('Copy Script');

  constructor() {
    effect(() => {
      const lang = this.selectedLang();
      this.translationService.loadTranslations(lang).then(() => {
        this.updateDynamicTexts();
      });
    });
  }

  private updateDynamicTexts(): void {
    this.copyButtonText.set(this.translationService.translate('copyButtonText'));
  }

  async generateScript(): Promise<void> {
    if (!this.storyIdea() || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.generatedScript.set('');
    this.error.set(null);
    this.updateDynamicTexts();

    try {
      const selectedToneLabel = this.translationService.translate(`tones.${this.selectedTone()}`);
      const script = await this.geminiService.generateScript(
        this.storyIdea(),
        selectedToneLabel,
        this.selectedModel()
      );
      this.generatedScript.set(script);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred. Please check the console.';
      this.error.set(`Failed to generate script: ${errorMessage}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  copyToClipboard(): void {
    if (!this.generatedScript()) return;
    navigator.clipboard.writeText(this.generatedScript()).then(() => {
      this.copyButtonText.set(this.translationService.translate('copyButtonCopied'));
      setTimeout(() => this.updateDynamicTexts(), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      this.copyButtonText.set(this.translationService.translate('copyButtonFailed'));
      setTimeout(() => this.updateDynamicTexts(), 2000);
    });
  }

  downloadScript(): void {
    if (!this.generatedScript()) return;

    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear().toString().slice(-2);
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const timestamp = `${day}-${month}-${year}-${hours}-${minutes}`;
    const filename = `ai-story-script-${timestamp}.txt`;

    const blob = new Blob([this.generatedScript()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Required for Firefox
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
