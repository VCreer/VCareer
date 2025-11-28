import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CandidateSearchResultDto, SearchCandidateInputDto } from '../../dto/profile/models';

@Injectable({
  providedIn: 'root',
})
export class CandidateSearchService {
  apiName = 'Default';
  

  searchCandidates = (input: SearchCandidateInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, PagedResultDto<CandidateSearchResultDto>>({
      method: 'POST',
      url: '/api/app/candidate-search/search-candidates',
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
