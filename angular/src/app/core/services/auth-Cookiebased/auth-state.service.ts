import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CurrentUserInfoDto } from 'src/app/proxy/dto/auth-dto';

//thnằg này chỉ là để đại diện cho thằng current user
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private userSubject = new BehaviorSubject<CurrentUserInfoDto| null>(null);
  user$ = this.userSubject.asObservable();

  get user(): CurrentUserInfoDto | null {
    return this.userSubject.value;
  }

  setUser(user: CurrentUserInfoDto | null) {
    this.userSubject.next(user);
  }

  isLoggedIn(): boolean {
    return !!this.user;
  }

  hasRole(role: string): boolean {
    return this.user?.roles?.includes(role) ?? false;
  }
}

/*


*/
