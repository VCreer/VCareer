import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type HeaderType = 'candidate' | 'recruiter';

@Injectable({
  providedIn: 'root'
})
export class HeaderTypeService {
  private headerTypeSubject = new BehaviorSubject<HeaderType>('candidate');
  public headerType$ = this.headerTypeSubject.asObservable();

  constructor() {}

  setHeaderType(type: HeaderType) {
    this.headerTypeSubject.next(type);
  }

  getCurrentHeaderType(): HeaderType {
    return this.headerTypeSubject.value;
  }

  switchToRecruiter() {
    this.setHeaderType('recruiter');
  }

  switchToCandidate() {
    this.setHeaderType('candidate');
  }
}
