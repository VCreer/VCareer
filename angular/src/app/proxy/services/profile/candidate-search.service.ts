import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CandidateSearchResultDto, SearchCandidateInputDto, SendConnectionRequestDto } from '../../dto/profile/models';

@Injectable({
  providedIn: 'root',
})
export class CandidateSearchService {
  apiName = 'Default';
  

  getCandidateDetail = (candidateProfileId: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, CandidateSearchResultDto>({
      method: 'GET',
      url: `/api/app/candidate-search/candidate-detail/${candidateProfileId}`,
    },
    { apiName: this.apiName,...config });
  

  searchCandidates = (input: SearchCandidateInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CandidateSearchResultDto>>({
      method: 'POST',
      url: '/api/app/candidate-search/search-candidates',
      body: input,
    },
    { apiName: this.apiName,...config });
  

  sendConnectionRequest = (input: SendConnectionRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, void>({
      method: 'POST',
      url: '/api/app/candidate-search/send-connection-request',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
