import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Cv } from '../../api/cv.service';

@Injectable({
  providedIn: 'root'
})
export class CvMockService {
  private cvs: Cv[] = [
    {
      id: '1',
      title: 'CV Frontend Developer',
      version: 'v1.0',
      updatedAt: '2024-01-15',
      isDefault: true,
      preview: 'assets/images/cv-preview-1.png'
    },
    {
      id: '2', 
      title: 'CV Fullstack Developer',
      version: 'v2.1',
      updatedAt: '2024-01-10',
      isDefault: false,
      preview: 'assets/images/cv-preview-2.png'
    },
    {
      id: '3',
      title: 'CV Backend Developer',
      version: 'v1.5',
      updatedAt: '2024-01-08',
      isDefault: false,
      preview: 'assets/images/cv-preview-3.png'
    }
  ];

  getCvs(): Observable<Cv[]> {
    return of([...this.cvs]).pipe(delay(500)); // Simulate API delay
  }

  getCvById(id: string): Observable<Cv | undefined> {
    const cv = this.cvs.find(c => c.id === id);
    return of(cv).pipe(delay(300));
  }

  createCv(cv: Omit<Cv, 'id'>): Observable<Cv> {
    const newCv: Cv = {
      ...cv,
      id: Date.now().toString()
    };
    this.cvs.push(newCv);
    return of(newCv).pipe(delay(800));
  }

  updateCv(id: string, cv: Partial<Cv>): Observable<Cv | null> {
    const index = this.cvs.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cvs[index] = { ...this.cvs[index], ...cv };
      return of(this.cvs[index]).pipe(delay(600));
    }
    return of(null).pipe(delay(300));
  }

  deleteCv(id: string): Observable<boolean> {
    const index = this.cvs.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cvs.splice(index, 1);
      return of(true).pipe(delay(400));
    }
    return of(false).pipe(delay(300));
  }

  setDefaultCv(id: string): Observable<boolean> {
    // Remove default from all CVs
    this.cvs.forEach(cv => cv.isDefault = false);
    
    // Set new default
    const cv = this.cvs.find(c => c.id === id);
    if (cv) {
      cv.isDefault = true;
      return of(true).pipe(delay(500));
    }
    return of(false).pipe(delay(300));
  }

  duplicateCv(id: string): Observable<Cv | null> {
    const originalCv = this.cvs.find(c => c.id === id);
    if (originalCv) {
      const duplicatedCv: Cv = {
        ...originalCv,
        id: Date.now().toString(),
        title: `${originalCv.title} (Copy)`,
        isDefault: false,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      this.cvs.push(duplicatedCv);
      return of(duplicatedCv).pipe(delay(700));
    }
    return of(null).pipe(delay(300));
  }

  // Additional mock methods for testing
  getCvStats(): Observable<{total: number, default: number, recent: number}> {
    const total = this.cvs.length;
    const defaultCount = this.cvs.filter(cv => cv.isDefault).length;
    const recentCount = this.cvs.filter(cv => {
      const cvDate = new Date(cv.updatedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return cvDate > weekAgo;
    }).length;

    return of({ total, default: defaultCount, recent: recentCount }).pipe(delay(200));
  }

  searchCvs(query: string): Observable<Cv[]> {
    const filteredCvs = this.cvs.filter(cv => 
      cv.title.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredCvs).pipe(delay(400));
  }
}
