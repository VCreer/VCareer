import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CvMockService } from '../mock-api/services/cv-mock.service';

export interface Cv {
  id: string;
  title: string;
  version: string;
  updatedAt: string;
  isDefault: boolean;
  preview: string;
}

@Injectable({
  providedIn: 'root'
})
export class CvService {
  constructor(private cvMockService: CvMockService) {}

  getCvs(): Observable<Cv[]> {
    return this.cvMockService.getCvs();
  }

  getCvById(id: string): Observable<Cv | undefined> {
    return this.cvMockService.getCvById(id);
  }

  createCv(cv: Omit<Cv, 'id'>): Observable<Cv> {
    return this.cvMockService.createCv(cv);
  }

  updateCv(id: string, cv: Partial<Cv>): Observable<Cv | null> {
    return this.cvMockService.updateCv(id, cv);
  }

  deleteCv(id: string): Observable<boolean> {
    return this.cvMockService.deleteCv(id);
  }

  setDefaultCv(id: string): Observable<boolean> {
    return this.cvMockService.setDefaultCv(id);
  }

  duplicateCv(id: string): Observable<Cv | null> {
    return this.cvMockService.duplicateCv(id);
  }

  // Additional methods
  getCvStats(): Observable<{total: number, default: number, recent: number}> {
    return this.cvMockService.getCvStats();
  }

  searchCvs(query: string): Observable<Cv[]> {
    return this.cvMockService.searchCvs(query);
  }
}
