import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SocialAuthService, GoogleLoginProvider } from '@abacritt/angularx-social-login';

declare var google: any;

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  idToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private userSubject = new BehaviorSubject<GoogleUser | null>(null);
  public user$: Observable<GoogleUser | null> = this.userSubject.asObservable();
  private socialAuthService = inject(SocialAuthService);
  private googleClientId = '1016101725161-2vljk9oo68oq4oj5q7b4o6ofdj1hn539.apps.googleusercontent.com';

  constructor() {}

  initialize(): void {
    // Initialize will be called by components
    console.log('GoogleAuthService initialized');
  }

  async signInWithGoogle(): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      try {
        console.log('GoogleAuthService: Attempting to sign in with Google...');
        
        // Kiểm tra xem Google API đã load chưa
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
          reject(new Error('Google Identity Services chưa được tải. Vui lòng đợi và thử lại.'));
          return;
        }

        let credentialReceived = false;

        // Initialize Google Identity Services
        google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: (response: any) => {
            if (credentialReceived) return;
            credentialReceived = true;
            
            try {
              console.log('GoogleAuthService: Received credential response');
              
              if (!response.credential) {
                reject(new Error('Không thể lấy credential từ Google. Vui lòng thử lại.'));
                return;
              }

              // Decode JWT để lấy thông tin user
              const payload = this.decodeJwt(response.credential);
              
              const googleUser: GoogleUser = {
                id: payload.sub || payload.user_id || '',
                email: payload.email || '',
                name: payload.name || '',
                photoUrl: payload.picture,
                idToken: response.credential
              };

              console.log('GoogleAuthService: User signed in successfully', {
                id: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                hasIdToken: !!googleUser.idToken
              });

              this.userSubject.next(googleUser);
              resolve(googleUser);
            } catch (error: any) {
              console.error('GoogleAuthService: Error processing credential:', error);
              reject(new Error(`Lỗi xử lý thông tin từ Google: ${error?.message || 'Unknown error'}`));
            }
          }
        });

        // Tạo một div ẩn để render button
        const buttonDiv = document.createElement('div');
        buttonDiv.id = 'google-signin-button-hidden';
        buttonDiv.style.position = 'fixed';
        buttonDiv.style.left = '-9999px';
        buttonDiv.style.top = '-9999px';
        buttonDiv.style.opacity = '0';
        buttonDiv.style.pointerEvents = 'none';
        document.body.appendChild(buttonDiv);

        // Render button vào div ẩn
        google.accounts.id.renderButton(buttonDiv, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          width: 250
        });

        // Đợi button render xong rồi click
        setTimeout(() => {
          const button = buttonDiv.querySelector('div[role="button"]') as HTMLElement;
          if (button) {
            console.log('GoogleAuthService: Clicking Google button programmatically');
            button.click();
            
            // Cleanup div sau khi click (không reject nếu chưa nhận credential)
            // User có thể đóng popup, nhưng callback sẽ được gọi nếu họ đăng nhập thành công
            setTimeout(() => {
              if (document.body.contains(buttonDiv)) {
                document.body.removeChild(buttonDiv);
              }
            }, 1000);
          } else {
            console.error('GoogleAuthService: Button not found');
            if (document.body.contains(buttonDiv)) {
              document.body.removeChild(buttonDiv);
            }
            reject(new Error('Không thể tạo nút đăng nhập Google. Vui lòng thử lại.'));
          }
        }, 500);

      } catch (error: any) {
        console.error('GoogleAuthService: Sign in error:', error);
        reject(new Error(`Lỗi đăng nhập Google: ${error?.message || 'Unknown error'}`));
      }
    });
  }

  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      throw new Error('Không thể giải mã token từ Google');
    }
  }

  private async getUserInfoFromToken(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Không thể lấy thông tin user từ Google');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.socialAuthService) {
        await this.socialAuthService.signOut();
      }
      this.userSubject.next(null);
    } catch (error) {
      console.error('Google sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): GoogleUser | null {
    return this.userSubject.value;
  }
}

