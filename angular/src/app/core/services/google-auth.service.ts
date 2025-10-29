import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private userSubject = new BehaviorSubject<GoogleUser | null>(null);
  public user$: Observable<GoogleUser | null> = this.userSubject.asObservable();

  constructor() {}

  initialize(): void {
    // Initialize will be called by components
    console.log('GoogleAuthService initialized');
  }

  async signInWithGoogle(): Promise<GoogleUser> {
    // Return a mock user for demonstration
    // TODO: Implement real Google OAuth when needed
    return {
      id: 'mock-google-user',
      email: 'user@gmail.com',
      name: 'Google User',
      photoUrl: undefined
    };
  }

  async signOut(): Promise<void> {
    this.userSubject.next(null);
  }

  getCurrentUser(): GoogleUser | null {
    return this.userSubject.value;
  }
}

