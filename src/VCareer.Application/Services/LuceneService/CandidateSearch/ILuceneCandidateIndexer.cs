using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Profile;
using VCareer.Models.Users;

namespace VCareer.Services.LuceneService.CandidateSearch
{
    /// <summary>
    /// Lucene Candidate Indexer Interface
    /// Xử lý full-text search cho candidate profile và CV
    /// </summary>
    public interface ILuceneCandidateIndexer
    {
        /// <summary>
        /// Index 1 candidate profile vào Lucene
        /// Gọi khi: Create profile, Update profile, Profile visibility thay đổi
        /// </summary>
        Task UpsertCandidateAsync(CandidateProfile candidate);

        /// <summary>
        /// Index nhiều candidates vào Lucene (batch operation)
        /// Gọi khi: Re-index toàn bộ database, Import data
        /// </summary>
        Task IndexMultipleCandidatesAsync(List<CandidateProfile> candidates);

        /// <summary>
        /// Xóa candidate khỏi index
        /// Gọi khi: Delete profile, Profile visibility = false, Status = false
        /// </summary>
        Task DeleteCandidateFromIndexAsync(Guid candidateId);

        /// <summary>
        /// Xóa toàn bộ index
        /// </summary>
        Task ClearIndexAsync();

        /// <summary>
        /// Tìm kiếm candidates theo keyword và filters
        /// Trả về list các UserId của candidates match
        /// </summary>
        Task<List<Guid>> SearchCandidateIdsAsync(SearchCandidateInputDto searchInput);
    }
}

