import { RestService, Rest } from '@abp/ng.core';
import type { PagedResultDto } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { CandidateSearchResultDto, SearchCandidateInputDto, SendConnectionRequestDto } from '../dto/profile/models';
import type { ActionResult, IActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class CandidateSearchService {
  apiName = 'Default';
  

  searchCandidates = (input: SearchCandidateInputDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<PagedResultDto<CandidateSearchResultDto>>>({
      method: 'POST',
      url: '/api/candidate-search/search',
      body: input,
    },
    { apiName: this.apiName,...config });

  getCandidateDetail = (id: string, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<CandidateSearchResultDto>>({
      method: 'GET',
      url: `/api/candidate-search/${id}`,
    },
    { apiName: this.apiName,...config });

  sendConnectionRequest = (id: string, input: SendConnectionRequestDto, config?: Partial<Rest.Config>) =>
    this.restService.request<any, IActionResult>({
      method: 'POST',
      url: `/api/candidate-search/${id}/connection-requests`,
      body: input,
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
