using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{

    public interface ISavedJobRepository : IRepository<SavedJob>
    {
        
        Task<List<SavedJob>> GetSavedJobsWithDetailsAsync(Guid candidateId, int skipCount = 0, int maxResultCount = 20);

     
        Task<int> CountSavedJobsAsync(Guid candidateId);
    }
}

