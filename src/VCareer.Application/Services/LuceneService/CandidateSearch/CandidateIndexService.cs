using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VCareer.Models.Users;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Uow;

namespace VCareer.Services.LuceneService.CandidateSearch
{
    /// <summary>
    /// Service để quản lý Lucene index cho candidates
    /// </summary>
    public class CandidateIndexService : ApplicationService
    {
        private readonly IRepository<CandidateProfile, Guid> _candidateProfileRepository;
        private readonly ILuceneCandidateIndexer _luceneIndexer;

        public CandidateIndexService(
            IRepository<CandidateProfile, Guid> candidateProfileRepository,
            ILuceneCandidateIndexer luceneIndexer)
        {
            _candidateProfileRepository = candidateProfileRepository;
            _luceneIndexer = luceneIndexer;
        }

        /// <summary>
        /// Re-index tất cả candidates hiện có
        /// </summary>
        [UnitOfWork]
        public async Task ReIndexAllCandidatesAsync()
        {
            Logger.LogInformation("Bắt đầu re-index tất cả candidates...");

            try
            {
                // Lấy tất cả candidates active (include User để Lucene có thể index đầy đủ)
                var queryable = await _candidateProfileRepository.GetQueryableAsync();
                var allCandidates = await AsyncExecuter.ToListAsync(
                    queryable.Where(c => c.Status && c.ProfileVisibility)
                );

                Logger.LogInformation($"Tìm thấy {allCandidates.Count} candidates để index");

                if (allCandidates.Any())
                {
                    // Clear index cũ
                    await _luceneIndexer.ClearIndexAsync();
                    Logger.LogInformation("Đã xóa index cũ");

                    // Index tất cả candidates
                    await _luceneIndexer.IndexMultipleCandidatesAsync(allCandidates);
                    Logger.LogInformation($"Đã index {allCandidates.Count} candidates thành công");
                }
                else
                {
                    Logger.LogWarning("Không có candidates nào để index");
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Lỗi khi re-index candidates");
                throw;
            }
        }

        /// <summary>
        /// Index một candidate cụ thể
        /// </summary>
        public async Task IndexCandidateAsync(Guid userId)
        {
            try
            {
                var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
                if (candidate != null)
                {
                    await _luceneIndexer.UpsertCandidateAsync(candidate);
                    Logger.LogInformation($"Đã index candidate: {userId}");
                }
                else
                {
                    Logger.LogWarning($"Không tìm thấy candidate với UserId: {userId}");
                }
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"Lỗi khi index candidate {userId}");
                throw;
            }
        }

        /// <summary>
        /// Xóa candidate khỏi index
        /// </summary>
        public async Task RemoveCandidateFromIndexAsync(Guid userId)
        {
            try
            {
                await _luceneIndexer.DeleteCandidateFromIndexAsync(userId);
                Logger.LogInformation($"Đã xóa candidate khỏi index: {userId}");
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, $"Lỗi khi xóa candidate {userId} khỏi index");
                throw;
            }
        }

        /// <summary>
        /// Lấy số lượng candidates đã được index
        /// </summary>
        public async Task<int> GetIndexedCountAsync()
        {
            try
            {
                // Lucene không có method trực tiếp để đếm, nên ta sẽ thử search với MatchAllDocsQuery
                // Tạm thời return 0, có thể implement sau nếu cần
                return 0;
            }
            catch
            {
                return 0;
            }
        }
    }
}

