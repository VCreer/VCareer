import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UploadedCv {
  name: string;
  uploadDate: string;
  isStarred: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UploadedCvService {
  private uploadedCvsSubject = new BehaviorSubject<UploadedCv[]>([]);
  public uploadedCvs$ = this.uploadedCvsSubject.asObservable();

  constructor() {}

  getUploadedCvs(): UploadedCv[] {
    return this.uploadedCvsSubject.value;
  }

  addUploadedCv(cv: UploadedCv): void {
    const currentCvs = this.uploadedCvsSubject.value;
    this.uploadedCvsSubject.next([...currentCvs, cv]);
  }

  removeUploadedCv(cvName: string): void {
    const currentCvs = this.uploadedCvsSubject.value;
    this.uploadedCvsSubject.next(currentCvs.filter(cv => cv.name !== cvName));
  }

  updateUploadedCv(cvName: string, updatedCv: Partial<UploadedCv>): void {
    const currentCvs = this.uploadedCvsSubject.value;
    const updatedCvs = currentCvs.map(cv => 
      cv.name === cvName ? { ...cv, ...updatedCv } : cv
    );
    this.uploadedCvsSubject.next(updatedCvs);
  }
}
