using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Repositories.Job
{
    /// <summary>
    /// Repository interface cho SavedJob
    /// </summary>
    public interface ISavedJobRepository : IRepository<SavedJob>
    {
        /// <summary>
        /// Lấy danh sách SavedJob của một candidate với JobPosting đã được Include
        /// </summary>
        /// <param name="candidateId">Candidate ID</param>
        /// <param name="skipCount">Số bản ghi bỏ qua</param>
        /// <param name="maxResultCount">Số bản ghi tối đa</param>
        /// <returns>Danh sách SavedJob với JobPosting, RecruiterProfile, Company, Province đã được load</returns>
        Task<List<SavedJob>> GetSavedJobsWithDetailsAsync(Guid candidateId, int skipCount = 0, int maxResultCount = 20);

        /// <summary>
        /// Đếm số lượng SavedJob của một candidate
        /// </summary>
        /// <param name="candidateId">Candidate ID</param>
        /// <returns>Số lượng SavedJob</returns>
        Task<int> CountSavedJobsAsync(Guid candidateId);
    }
}

