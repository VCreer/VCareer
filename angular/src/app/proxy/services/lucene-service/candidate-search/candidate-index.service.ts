import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CandidateIndexService {
  apiName = 'Default';
  

  getIndexedCount = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, number>({
      method: 'GET',
      url: '/api/app/candidate-index/indexed-count',
    },
    { apiName: this.apiName,...config });
  

  indexCandidate = (userId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: `/api/app/candidate-index/index-candidate/${userId}`,
    },
    { apiName: this.apiName,...config });
  

  reIndexAllCandidates = (config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/candidate-index/re-index-all-candidates',
    },
    { apiName: this.apiName,...config });
  

  removeCandidateFromIndex = (userId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'DELETE',
      url: `/api/app/candidate-index/candidate-from-index/${userId}`,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
