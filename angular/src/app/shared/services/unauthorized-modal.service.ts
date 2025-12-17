import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnauthorizedModalService {
  private showSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string>('Bạn không có quyền truy cập trang này.');

  show$ = this.showSubject.asObservable();
  message$ = this.messageSubject.asObservable();

  show(message?: string) {
    if (message) {
      this.messageSubject.next(message);
    }
    this.showSubject.next(true);
  }

  hide() {
    this.showSubject.next(false);
  }
}

