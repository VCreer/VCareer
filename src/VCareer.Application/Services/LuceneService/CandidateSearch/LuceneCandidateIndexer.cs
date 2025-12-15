using Lucene.Net.Analysis;
using Lucene.Net.Analysis.Standard;
using Lucene.Net.Documents;
using Lucene.Net.Index;
using Lucene.Net.QueryParsers.Classic;
using Lucene.Net.Search;
using Lucene.Net.Store;
using Lucene.Net.Util;
using Lucene.Net.Analysis.Core;
using Lucene.Net.Analysis.Util;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using VCareer.Dto.Profile;
using VCareer.Models.Users;
using VCareer.Models.CV;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;
using VCareer.EntityFrameworkCore;

namespace VCareer.Services.LuceneService.CandidateSearch
{
    /// <summary>
    /// Lucene Candidate Indexer - Xử lý full-text search cho candidate profile và CV
    /// Sử dụng Lucene.NET 4.8 để index và search candidates
    /// </summary>
    public class LuceneCandidateIndexer : ILuceneCandidateIndexer, ISingletonDependency
    {
        private const LuceneVersion AppLuceneVersion = LuceneVersion.LUCENE_48;
        private readonly string _indexPath;
        private readonly Analyzer _analyzer;
        private FSDirectory _directory;
        private readonly IRepository<CandidateCv, Guid> _candidateCvRepository;
        private readonly IDbContextProvider<VCareerDbContext> _dbContextProvider;

        public LuceneCandidateIndexer(
            IRepository<CandidateCv, Guid> candidateCvRepository,
            IDbContextProvider<VCareerDbContext> dbContextProvider)
        {
            _candidateCvRepository = candidateCvRepository;
            _dbContextProvider = dbContextProvider;
            
            // Setup index path (riêng biệt với Job index)
            _indexPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "LuceneCandidateIndex");
            if (!System.IO.Directory.Exists(_indexPath))
                System.IO.Directory.CreateDirectory(_indexPath);
            
            var emptyStopWords = new CharArraySet(AppLuceneVersion, 0, ignoreCase: false);
            _analyzer = new StandardAnalyzer(AppLuceneVersion, emptyStopWords);
            _directory = FSDirectory.Open(_indexPath);
        }

        /// <summary>
        /// Index 1 candidate vào Lucene
        /// </summary>
        public async Task UpsertCandidateAsync(CandidateProfile candidate)
        {
            if (candidate == null || !candidate.Status || !candidate.ProfileVisibility)
            {
                // Nếu candidate không active, xóa khỏi index
                if (candidate != null)
                    await DeleteCandidateFromIndexAsync(candidate.UserId);
                return;
            }

            await Task.Run(() =>
            {
                using var writer = GetWriter();
                var doc = CreateLuceneDocumentAsync(candidate).GetAwaiter().GetResult();
                writer.UpdateDocument(new Term("UserId", candidate.UserId.ToString()), doc);
                writer.Commit();
            });
        }

        /// <summary>
        /// Index nhiều candidates vào Lucene (batch operation)
        /// </summary>
        public async Task IndexMultipleCandidatesAsync(List<CandidateProfile> candidates)
        {
            // Filter: Chỉ index active candidates
            candidates = candidates.Where(c => c.Status && c.ProfileVisibility).ToList();
            if (!candidates.Any())
                return;

            await Task.Run(async () =>
            {
                using var writer = GetWriter();

                foreach (var candidate in candidates)
                {
                    var doc = await CreateLuceneDocumentAsync(candidate);
                    writer.UpdateDocument(new Term("UserId", candidate.UserId.ToString()), doc);
                }

                writer.Commit();
            });
        }

        /// <summary>
        /// Xóa candidate khỏi index
        /// </summary>
        public async Task DeleteCandidateFromIndexAsync(Guid candidateId)
        {
            await Task.Run(() =>
            {
                using var writer = GetWriter();
                writer.DeleteDocuments(new Term("UserId", candidateId.ToString()));
                writer.Commit();
            });
        }

        /// <summary>
        /// Xóa toàn bộ index
        /// </summary>
        public async Task ClearIndexAsync()
        {
            await Task.Run(() =>
            {
                var config = new IndexWriterConfig(AppLuceneVersion, _analyzer)
                {
                    OpenMode = OpenMode.CREATE
                };

                using var writer = new IndexWriter(_directory, config);
                writer.DeleteAll();
                writer.Commit();
            });
        }

        /// <summary>
        /// Lấy số lượng documents đã được index trong Lucene
        /// </summary>
        public Task<int> GetIndexedCountAsync()
        {
            try
            {
                using var reader = DirectoryReader.Open(_directory);
                return Task.FromResult(reader.NumDocs);
            }
            catch (Exception)
            {
                // If index doesn't exist or has error, return 0
                return Task.FromResult(0);
            }
        }

        /// <summary>
        /// Tìm kiếm candidates theo keyword và filters
        /// </summary>
        public Task<List<Guid>> SearchCandidateIdsAsync(SearchCandidateInputDto input)
        {
            try
            {
                using var reader = DirectoryReader.Open(_directory);
                var searcher = new IndexSearcher(reader);

                // Check if index is empty
                if (reader.NumDocs == 0)
                {
                    // Index is empty, return empty list to trigger fallback
                    return Task.FromResult(new List<Guid>());
                }

                var query = BuildSearchQuery(input);
                
                // Debug: Log query info
                System.Diagnostics.Debug.WriteLine($"[Lucene] Search query: {query}");
                System.Diagnostics.Debug.WriteLine($"[Lucene] Index has {reader.NumDocs} documents");
                
                // If query is null or MatchAllDocsQuery without keyword, return empty to use fallback
                if (query is MatchAllDocsQuery && !string.IsNullOrWhiteSpace(input.Keyword))
                {
                    System.Diagnostics.Debug.WriteLine("[Lucene] Query is MatchAllDocsQuery but keyword exists - returning empty");
                    return Task.FromResult(new List<Guid>());
                }
                
                var sortQuery = BuildSortQuery(input);

                int maxResults = (input.SkipCount + (input.MaxResultCount > 0 ? input.MaxResultCount : 10)) * 3;
                if (maxResults < 100) maxResults = 100;

                var topDocs = searcher.Search(query, maxResults, sortQuery);
                
                System.Diagnostics.Debug.WriteLine($"[Lucene] Search returned {topDocs.TotalHits} total hits");

                var candidateIds = new List<Guid>();

                foreach (var scoreDoc in topDocs.ScoreDocs)
                {
                    var doc = searcher.Doc(scoreDoc.Doc);
                    if (Guid.TryParse(doc.Get("UserId"), out var userId))
                        candidateIds.Add(userId);
                }

                System.Diagnostics.Debug.WriteLine($"[Lucene] Parsed {candidateIds.Count} candidate IDs from search results");

                var pagingIds = candidateIds
                    .Skip(input.SkipCount)
                    .Take((input.MaxResultCount <= 0) ? 10 : input.MaxResultCount)
                    .ToList();

                return Task.FromResult(pagingIds);
            }
            catch (Exception ex)
            {
                // If index doesn't exist or has error, return empty to trigger fallback
                System.Diagnostics.Debug.WriteLine($"[Lucene] Error during search: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"[Lucene] Stack trace: {ex.StackTrace}");
                return Task.FromResult(new List<Guid>());
            }
        }

        #region Build Query Methods

        private Sort BuildSortQuery(SearchCandidateInputDto input)
        {
            var sorting = !string.IsNullOrWhiteSpace(input.Sorting)
                ? input.Sorting
                : GetDefaultSorting(input.DisplayPriority);

            var sortFields = new List<SortField>();

            if (sorting.Contains("LastModificationTime"))
            {
                sortFields.Add(new SortField("LastModificationTime", SortFieldType.INT64, sorting.Contains("DESC")));
            }
            else if (sorting.Contains("Experience"))
            {
                sortFields.Add(new SortField("Experience", SortFieldType.INT32, sorting.Contains("DESC")));
            }

            // Default: Sort by LastModificationTime DESC
            if (sortFields.Count == 0)
            {
                sortFields.Add(new SortField("LastModificationTime", SortFieldType.INT64, true));
            }

            return new Sort(sortFields.ToArray());
        }

        private Query BuildSearchQuery(SearchCandidateInputDto input)
        {
            var boolQuery = new BooleanQuery();

            // Must have: Status = true, ProfileVisibility = true
            // Note: These fields are stored as StringField with "1" or "0"
            boolQuery.Add(new TermQuery(new Term("Status", "1")), Occur.MUST);
            boolQuery.Add(new TermQuery(new Term("ProfileVisibility", "1")), Occur.MUST);

            // KEYWORD Search (Full-text)
            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                var keywordQuery = BuildKeywordQuery(input.Keyword, input);
                if (keywordQuery != null)
                {
                    boolQuery.Add(keywordQuery, Occur.MUST);
                    System.Diagnostics.Debug.WriteLine($"[Lucene] Added keyword query to boolean query");
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine($"[Lucene] Keyword query is null, skipping keyword search");
                }
            }
            
            System.Diagnostics.Debug.WriteLine($"[Lucene] Boolean query has {boolQuery.Clauses.Count} clauses");

            // Filters
            AddJobTitleFilter(boolQuery, input.JobTitle);
            AddSkillsFilter(boolQuery, input.Skills);
            AddExperienceRangeFilter(boolQuery, input.MinExperience, input.MaxExperience);
            AddSalaryRangeFilter(boolQuery, input.MinSalary, input.MaxSalary);
            AddWorkLocationFilter(boolQuery, input.WorkLocation);

            // Scope filters (nếu có scope được chọn)
            var hasAnyScopeSelected = input.SearchInJobTitle || input.SearchInActivity ||
                                      input.SearchInEducation || input.SearchInExperience || input.SearchInSkills;
            
            if (hasAnyScopeSelected)
            {
                if (input.SearchInJobTitle)
                    boolQuery.Add(new TermQuery(new Term("HasJobTitle", "1")), Occur.MUST);
                if (input.SearchInSkills)
                    boolQuery.Add(new TermQuery(new Term("HasSkills", "1")), Occur.MUST);
                if (input.SearchInExperience)
                    boolQuery.Add(new TermQuery(new Term("HasExperience", "1")), Occur.MUST);
                if (input.SearchInActivity)
                    boolQuery.Add(new BooleanQuery
                    {
                        { new TermQuery(new Term("HasLocation", "1")), Occur.SHOULD },
                        { new TermQuery(new Term("HasWorkLocation", "1")), Occur.SHOULD }
                    }, Occur.MUST);
            }

            // If no clauses (shouldn't happen with Status/ProfileVisibility), return MatchAllDocsQuery
            if (boolQuery.Clauses.Count == 0)
            {
                System.Diagnostics.Debug.WriteLine("[Lucene] Boolean query has no clauses, returning MatchAllDocsQuery");
                return new MatchAllDocsQuery();
            }
            
            System.Diagnostics.Debug.WriteLine($"[Lucene] Final boolean query: {boolQuery}");
            return boolQuery;
        }

        private Query BuildKeywordQuery(string keyword, SearchCandidateInputDto input)
        {
            try
            {
                var hasAnyScopeSelected = input.SearchInJobTitle || input.SearchInActivity ||
                                          input.SearchInEducation || input.SearchInExperience || input.SearchInSkills;

                var keywordLower = keyword.ToLower().Trim();
                if (string.IsNullOrWhiteSpace(keywordLower))
                {
                    System.Diagnostics.Debug.WriteLine("[Lucene] Keyword is empty after trim, returning null");
                    return null;
                }

                var boolQuery = new BooleanQuery();

                if (hasAnyScopeSelected)
                {
                    // Chỉ search trong các trường được chọn
                    if (input.SearchInJobTitle)
                    {
                        boolQuery.Add(new WildcardQuery(new Term("JobTitle", $"*{keywordLower}*")), Occur.SHOULD);
                    }
                    if (input.SearchInSkills)
                    {
                        boolQuery.Add(new WildcardQuery(new Term("Skills", $"*{keywordLower}*")), Occur.SHOULD);
                    }
                    if (input.SearchInActivity)
                    {
                        boolQuery.Add(new WildcardQuery(new Term("Location", $"*{keywordLower}*")), Occur.SHOULD);
                        boolQuery.Add(new WildcardQuery(new Term("WorkLocation", $"*{keywordLower}*")), Occur.SHOULD);
                    }
                    if (input.SearchInEducation || input.SearchInExperience)
                    {
                        // Search in CV content for education/experience
                        boolQuery.Add(new WildcardQuery(new Term("CvContent", $"*{keywordLower}*")), Occur.SHOULD);
                    }
                }
                else
                {
                    // Search trong tất cả các trường (sử dụng SHOULD để match bất kỳ field nào)
                    boolQuery.Add(new WildcardQuery(new Term("JobTitle", $"*{keywordLower}*")), Occur.SHOULD);
                    boolQuery.Add(new WildcardQuery(new Term("Skills", $"*{keywordLower}*")), Occur.SHOULD);
                    boolQuery.Add(new WildcardQuery(new Term("Location", $"*{keywordLower}*")), Occur.SHOULD);
                    boolQuery.Add(new WildcardQuery(new Term("WorkLocation", $"*{keywordLower}*")), Occur.SHOULD);
                    boolQuery.Add(new WildcardQuery(new Term("CvContent", $"*{keywordLower}*")), Occur.SHOULD);
                }

                if (boolQuery.Clauses.Count == 0)
                {
                    System.Diagnostics.Debug.WriteLine("[Lucene] No search fields selected, returning null query");
                    return null;
                }

                System.Diagnostics.Debug.WriteLine($"[Lucene] Built keyword query with {boolQuery.Clauses.Count} clauses, keyword: '{keywordLower}'");
                return boolQuery;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[Lucene] Exception in BuildKeywordQuery: {ex.Message}, using simple wildcard fallback");
                // Fallback: Simple wildcard query
                try
                {
                    return new WildcardQuery(new Term("JobTitle", $"*{keyword.ToLower().Trim()}*"));
                }
                catch
                {
                    return null;
                }
            }
        }

        private void AddJobTitleFilter(BooleanQuery boolQuery, string? jobTitle)
        {
            if (string.IsNullOrWhiteSpace(jobTitle))
                return;

            boolQuery.Add(new WildcardQuery(new Term("JobTitle", $"*{jobTitle.ToLower()}*")), Occur.MUST);
        }

        private void AddSkillsFilter(BooleanQuery boolQuery, string? skills)
        {
            if (string.IsNullOrWhiteSpace(skills))
                return;

            boolQuery.Add(new WildcardQuery(new Term("Skills", $"*{skills.ToLower()}*")), Occur.MUST);
        }

        private void AddExperienceRangeFilter(BooleanQuery boolQuery, int? minExperience, int? maxExperience)
        {
            if (minExperience.HasValue)
            {
                boolQuery.Add(
                    NumericRangeQuery.NewInt32Range("Experience", minExperience.Value, null, true, true),
                    Occur.MUST
                );
            }
            if (maxExperience.HasValue)
            {
                boolQuery.Add(
                    NumericRangeQuery.NewInt32Range("Experience", null, maxExperience.Value, true, true),
                    Occur.MUST
                );
            }
        }

        private void AddSalaryRangeFilter(BooleanQuery boolQuery, decimal? minSalary, decimal? maxSalary)
        {
            if (minSalary.HasValue)
            {
                boolQuery.Add(
                    NumericRangeQuery.NewDoubleRange("Salary", (double)minSalary.Value, null, true, true),
                    Occur.MUST
                );
            }
            if (maxSalary.HasValue)
            {
                boolQuery.Add(
                    NumericRangeQuery.NewDoubleRange("Salary", null, (double)maxSalary.Value, true, true),
                    Occur.MUST
                );
            }
        }

        private void AddWorkLocationFilter(BooleanQuery boolQuery, string? workLocation)
        {
            if (string.IsNullOrWhiteSpace(workLocation))
                return;

            var locationQuery = new BooleanQuery
            {
                { new WildcardQuery(new Term("WorkLocation", $"*{workLocation.ToLower()}*")), Occur.SHOULD },
                { new WildcardQuery(new Term("Location", $"*{workLocation.ToLower()}*")), Occur.SHOULD }
            };
            boolQuery.Add(locationQuery, Occur.MUST);
        }

        private string GetDefaultSorting(string? displayPriority)
        {
            return displayPriority switch
            {
                "newest" => "LastModificationTime DESC",
                "seeking" => "LastModificationTime DESC",
                "experienced" => "Experience DESC",
                "suitable" => "LastModificationTime DESC",
                _ => "LastModificationTime DESC"
            };
        }

        #endregion

        #region Create Document

        /// <summary>
        /// Convert CandidateProfile → Lucene Document
        /// </summary>
        private async Task<Document> CreateLuceneDocumentAsync(CandidateProfile candidate)
        {
            var doc = new Document();
            doc.Add(new StringField("UserId", candidate.UserId.ToString(), Field.Store.YES));

            // Full-text search fields
            doc.Add(new TextField("JobTitle", candidate.JobTitle ?? "", Field.Store.NO) { Boost = 3.0f });
            doc.Add(new TextField("Skills", candidate.Skills ?? "", Field.Store.NO) { Boost = 2.5f });
            doc.Add(new TextField("Location", candidate.Location ?? "", Field.Store.NO) { Boost = 1.5f });
            doc.Add(new TextField("WorkLocation", candidate.WorkLocation ?? "", Field.Store.NO) { Boost = 1.5f });

            // Index CV content nếu có
            var cvContent = await GetCvContentAsync(candidate.UserId);
            if (!string.IsNullOrWhiteSpace(cvContent))
            {
                doc.Add(new TextField("CvContent", cvContent, Field.Store.NO) { Boost = 2.0f });
            }

            // Filter/Sort fields
            doc.Add(new Int32Field("Experience", candidate.Experience ?? 0, Field.Store.NO));
            doc.Add(new DoubleField("Salary", (double)(candidate.Salary ?? 0), Field.Store.NO));
            doc.Add(new Int64Field("LastModificationTime", (candidate.LastModificationTime ?? candidate.CreationTime).Ticks, Field.Store.NO));
            
            // Status fields
            doc.Add(new StringField("Status", candidate.Status ? "1" : "0", Field.Store.NO));
            doc.Add(new StringField("ProfileVisibility", candidate.ProfileVisibility ? "1" : "0", Field.Store.NO));

            // Scope helper fields
            doc.Add(new StringField("HasJobTitle", string.IsNullOrWhiteSpace(candidate.JobTitle) ? "0" : "1", Field.Store.NO));
            doc.Add(new StringField("HasSkills", string.IsNullOrWhiteSpace(candidate.Skills) ? "0" : "1", Field.Store.NO));
            doc.Add(new StringField("HasExperience", candidate.Experience.HasValue ? "1" : "0", Field.Store.NO));
            doc.Add(new StringField("HasLocation", string.IsNullOrWhiteSpace(candidate.Location) ? "0" : "1", Field.Store.NO));
            doc.Add(new StringField("HasWorkLocation", string.IsNullOrWhiteSpace(candidate.WorkLocation) ? "0" : "1", Field.Store.NO));

            return doc;
        }

        /// <summary>
        /// Lấy nội dung CV mặc định để index
        /// </summary>
        private async Task<string> GetCvContentAsync(Guid userId)
        {
            try
            {
                var dbContext = await _dbContextProvider.GetDbContextAsync();
                var defaultCv = await dbContext.Set<CandidateCv>()
                    .Where(cv => cv.CandidateId == userId && cv.IsDefault && !string.IsNullOrEmpty(cv.DataJson))
                    .FirstOrDefaultAsync();

                if (defaultCv == null || string.IsNullOrWhiteSpace(defaultCv.DataJson))
                    return string.Empty;

                // Parse JSON và extract text content
                var cvData = JsonSerializer.Deserialize<JsonElement>(defaultCv.DataJson);
                var textParts = new List<string>();

                // Extract từ các trường trong CV
                if (cvData.TryGetProperty("PersonalInfo", out var personalInfo))
                {
                    if (personalInfo.TryGetProperty("FullName", out var fullName))
                        textParts.Add(fullName.GetString() ?? "");
                    if (personalInfo.TryGetProperty("Address", out var address))
                        textParts.Add(address.GetString() ?? "");
                }

                if (cvData.TryGetProperty("Skills", out var skills) && skills.ValueKind == JsonValueKind.Array)
                {
                    foreach (var skill in skills.EnumerateArray())
                    {
                        if (skill.TryGetProperty("SkillName", out var skillName))
                            textParts.Add(skillName.GetString() ?? "");
                    }
                }

                if (cvData.TryGetProperty("WorkExperiences", out var workExps) && workExps.ValueKind == JsonValueKind.Array)
                {
                    foreach (var exp in workExps.EnumerateArray())
                    {
                        if (exp.TryGetProperty("CompanyName", out var companyName))
                            textParts.Add(companyName.GetString() ?? "");
                        if (exp.TryGetProperty("Position", out var position))
                            textParts.Add(position.GetString() ?? "");
                        if (exp.TryGetProperty("Description", out var desc))
                            textParts.Add(desc.GetString() ?? "");
                    }
                }

                if (cvData.TryGetProperty("Educations", out var educations) && educations.ValueKind == JsonValueKind.Array)
                {
                    foreach (var edu in educations.EnumerateArray())
                    {
                        if (edu.TryGetProperty("InstitutionName", out var institution))
                            textParts.Add(institution.GetString() ?? "");
                        if (edu.TryGetProperty("Major", out var major))
                            textParts.Add(major.GetString() ?? "");
                    }
                }

                if (cvData.TryGetProperty("Projects", out var projects) && projects.ValueKind == JsonValueKind.Array)
                {
                    foreach (var project in projects.EnumerateArray())
                    {
                        if (project.TryGetProperty("ProjectName", out var projectName))
                            textParts.Add(projectName.GetString() ?? "");
                        if (project.TryGetProperty("Description", out var desc))
                            textParts.Add(desc.GetString() ?? "");
                        if (project.TryGetProperty("Technologies", out var tech))
                            textParts.Add(tech.GetString() ?? "");
                    }
                }

                if (cvData.TryGetProperty("CareerObjective", out var careerObj))
                    textParts.Add(careerObj.GetString() ?? "");

                return string.Join(" ", textParts.Where(t => !string.IsNullOrWhiteSpace(t)));
            }
            catch
            {
                return string.Empty;
            }
        }

        #endregion

        #region Helper Methods

        private IndexWriter GetWriter()
        {
            var config = new IndexWriterConfig(AppLuceneVersion, _analyzer)
            {
                OpenMode = OpenMode.CREATE_OR_APPEND
            };
            return new IndexWriter(_directory, config);
        }

        private string EscapeSpecialCharacters(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return input;

            // Escape Lucene special characters: + - && || ! ( ) { } [ ] ^ " ~ * ? : \
            var specialChars = new[] { "+", "-", "&&", "||", "!", "(", ")", "{", "}", "[", "]", "^", "\"", "~", "*", "?", ":", "\\" };
            var result = input;
            foreach (var ch in specialChars)
            {
                result = result.Replace(ch, $"\\{ch}");
            }
            return result;
        }

        private string StripHtmlTags(string html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return string.Empty;

            return Regex.Replace(html, "<.*?>", string.Empty);
        }

        #endregion
    }
}

