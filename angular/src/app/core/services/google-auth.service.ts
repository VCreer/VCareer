import { Injectable, inject, Injector } from '@angular/core';
import { GoogleLoginProvider, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private userSubject = new BehaviorSubject<SocialUser | null>(null);
  public user$: Observable<SocialUser | null> = this.userSubject.asObservable();
  private socialAuthService: SocialAuthService | null = null;
  private injector = inject(Injector);

  constructor() {
    // Try to inject SocialAuthService lazily
    try {
      this.socialAuthService = this.injector.get(SocialAuthService, null);
    } catch (e) {
      console.warn('SocialAuthService not available:', e);
    }
  }

  initialize(): void {
    if (!this.socialAuthService) {
      console.warn('SocialAuthService not configured. Please add Google Client ID in app.config.ts');
      return;
    }
    
    // Initialize Google OAuth
    this.socialAuthService.authState.subscribe((user: SocialUser) => {
      this.userSubject.next(user);
    });
  }

  async signInWithGoogle(): Promise<SocialUser> {
    if (!this.socialAuthService) {
      throw new Error('SocialAuthService not configured. Please add Google Client ID in app.config.ts');
    }
    return this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  async signOut(): Promise<void> {
    if (!this.socialAuthService) {
      throw new Error('SocialAuthService not configured');
    }
    return this.socialAuthService.signOut();
  }

  getCurrentUser(): SocialUser | null {
    return this.userSubject.value;
  }
}

