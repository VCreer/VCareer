import { RestService, Rest } from '@abp/ng.core';
import { Injectable } from '@angular/core';
import type { SubcriptionContance_SubcriptorTarget } from '../constants/job-constant/subcription-contance-subcriptor-target.enum';
import type { SubcriptionsViewDto } from '../dto/subcriptions/models';
import type { ActionResult } from '../microsoft/asp-net-core/mvc/models';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  apiName = 'Default';
  

  getActiveSubscriptionServices = (target?: enum, config?: Partial<Rest.Config>) =>
    this.restService.request<any, ActionResult<any<SubcriptionsViewDto>>>({
      method: 'GET',
      url: '/api/subscription-services/active',
      params: { target },
    },
    { apiName: this.apiName,...config });

  constructor(private restService: RestService) {}
}
