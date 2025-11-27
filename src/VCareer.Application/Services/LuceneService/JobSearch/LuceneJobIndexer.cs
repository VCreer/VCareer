
using Lucene.Net.Analysis;
using Lucene.Net.Analysis.Standard;
using Lucene.Net.Documents;
using Lucene.Net.Index;
using Lucene.Net.QueryParsers.Classic;
using Lucene.Net.Search;
using Lucene.Net.Store;
using Lucene.Net.Util;
using Lucene.Net.Analysis.Core;  // ✨ Thêm để dùng LowerCaseFilter

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Text;
using VCareer.Models.Job;
using Volo.Abp.DependencyInjection;
using Lucene.Net.Analysis.Util;
using VCareer.Constants;
using VCareer.IRepositories.Job;
using VCareer.Constants.JobConstant;
using VCareer.Dto.JobDto;
using VCareer.IRepositories.Category;

namespace VCareer.Services.LuceneService.JobSearch
{
    /// Lucene Job Indexer - Xử lý full-text search cho job posting
    /// Sử dụng Lucene.NET 4.8 để index và search job
    public class LuceneJobIndexer : ILuceneJobIndexer, ISingletonDependency
    {
        private const LuceneVersion AppLuceneVersion = LuceneVersion.LUCENE_48;  // Lucene version sử dụng
        private readonly string _indexPath; // Đường dẫn lưu index trên đĩa (App_Data/LuceneIndex)
        private readonly Analyzer _analyzer;// Analyzer để phân tích text thành tokens
        private FSDirectory _directory;  // Directory chứa Lucene index
        private readonly IJobPostRepository _jobPostingRepository;   // Load job để index
        private readonly IJobCategoryRepository _jobCategoryRepository; // Load category path

        public LuceneJobIndexer(
        IJobPostRepository jobPostingRepository,
        IJobCategoryRepository jobCategoryRepository
      )
        {
            _jobPostingRepository = jobPostingRepository;
            _jobCategoryRepository = jobCategoryRepository;
            // Setup index path
            _indexPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "LuceneIndex");
            if (!System.IO.Directory.Exists(_indexPath))
                System.IO.Directory.CreateDirectory(_indexPath);
            var emptyStopWords = new CharArraySet(AppLuceneVersion, 0, ignoreCase: false);
            _analyzer = new StandardAnalyzer(AppLuceneVersion, emptyStopWords);
            _directory = FSDirectory.Open(_indexPath);
        }

        /// Index 1 job vào Lucene
        /// Gọi khi: Create job, Update job, Admin approve job
        public async Task UpsertJobAsync(Job_Post job)
        {
            if (job == null)
                return;

            await Task.Run(() =>
            {
                using var writer = GetWriter();
                var doc = CreateLuceneDocumentAsync(job).GetAwaiter().GetResult();
                writer.UpdateDocument(new Term("Id", job.Id.ToString()), doc);
                writer.Commit();
            });

        }
        /// Index nhiều jobs vào Lucene (batch operation)
        /// Gọi khi: Re-index toàn bộ database, Import data
        public async Task IndexMultipleJobsAsync(List<Job_Post> jobs)
        {
            // Filter: Chỉ index active jobs
            jobs = jobs.Where(j => j.IsActive()).ToList();
            if (!jobs.Any())
                return;

            await Task.Run(async () =>
            {
                using var writer = GetWriter();

                foreach (var job in jobs)
                {
                    var doc = await CreateLuceneDocumentAsync(job);
                    writer.UpdateDocument(new Term("Id", job.Id.ToString()), doc);
                }

                writer.Commit();
            });
        }
        /// Xóa 1 job khỏi Lucene index
        /// Gọi khi: Delete job, Job hết hạn, Admin reject job
        public async Task DeleteJobFromIndexAsync(Guid jobId)
        {
            await Task.Run(() =>
            {
                using var writer = GetWriter();
                writer.DeleteDocuments(new Term("Id", jobId.ToString()));
                writer.Commit();
            });
        }
        /// Xóa toàn bộ Lucene index
        /// Gọi khi: Re-index từ đầu
        public async Task ClearIndexAsync()
        {
            await Task.Run(() =>
            {
                var config = new IndexWriterConfig(AppLuceneVersion, _analyzer)
                {
                    OpenMode = OpenMode.CREATE  // Tạo index mới (xóa cái cũ)
                };

                using var writer = new IndexWriter(_directory, config);
                writer.DeleteAll();
                writer.Commit();
            });
        }
        public Task<List<Guid>> SearchJobIdsAsync(JobSearchInputDto input)
        {
            using var reader = DirectoryReader.Open(_directory);
            var totalDocs = reader.NumDocs;
            var searcher = new IndexSearcher(reader);

            var query = BuildSearchQuery(input);
            var sortQuery = BuildSortQuery();

            int maxResults = (input.SkipCount + input.MaxResultCount) * 3;
            if (maxResults < 100) maxResults = 100;

            //     var topDocs = searcher.Search(new MatchAllDocsQuery(), 100);
            var topDocs = searcher.Search(query, maxResults, sortQuery);

            var jobIds = new List<Guid>();

            foreach (var scoreDoc in topDocs.ScoreDocs)
            {
                var doc = searcher.Doc(scoreDoc.Doc);
                if (Guid.TryParse(doc.Get("Id"), out var jobId))
                    jobIds.Add(jobId);
            }


            var pagingJobIds = jobIds
                .Skip(input.SkipCount)
                .Take((input.MaxResultCount <= 0) ? 30 : input.MaxResultCount)
                .ToList();

            return Task.FromResult(pagingJobIds);
        }

        private Sort BuildSortQuery()
        {
            return new Sort(
                new SortField("PriorityLevel", SortFieldType.INT32, true),   // true = descending
                new SortField("SortScore", SortFieldType.DOUBLE, true)       // true = descending
            );
        }
        private Query BuildSearchQuery(JobSearchInputDto input)
        {
            var boolQuery = new BooleanQuery();

           boolQuery.Add(NumericRangeQuery.NewInt64Range("ExpiresAt", DateTime.UtcNow.Ticks, null, true, true), Occur.MUST);

            // KEYWORD Search (Full-text)
            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                var keywordQuery = BuildKeywordQuery(input.Keyword);
                if (keywordQuery != null)
                    boolQuery.Add(keywordQuery, Occur.MUST);
            }
            //filter
            AddCategoryFilter(boolQuery, input.CategoryIds);
            AddProvinceFilter(boolQuery, input.ProvinceCodes);
            AddWardFilter(boolQuery, input.WardCodes);
            AddPositionFilter(boolQuery, input.PositionTypes);
            AddEmployeeTypeFilter(boolQuery, input.EmploymentTypes);
            AddExperienceFilter(boolQuery, input.ExperienceFilter);
            AddSalaryDealFilter(boolQuery, input.SalaryDeal);
            AddSalaryRangeFilter(boolQuery, input.MinSalary, input.MaxSalary);

            // Return query (nếu không có clause nào, return match all)
            return boolQuery.Clauses.Count == 0 ? new MatchAllDocsQuery() : boolQuery;
        }
        #region logic build search query
        private Query BuildKeywordQuery(string keyword)
        {
            try
            {
                var parser = new MultiFieldQueryParser(
                    AppLuceneVersion,
                    new[] {
                        "Title",
                        "Description",
                        "Requirements",
                        "Benefits",
                        "WorkLocation",
                        "CompanyName",
                        "Tag",

                    },
                    _analyzer
                );
                parser.DefaultOperator = Operator.OR;
                return parser.Parse(EscapeSpecialCharacters(keyword));
            }
            catch (ParseException)
            {
                // Fallback: Wildcard query trên Title
                return new WildcardQuery(new Term("Title", $"*{keyword.ToLower()}*"));
            }
        }
        private void AddExperienceFilter(BooleanQuery boolQuery, ExperienceLevel? experienceFilter)
        {
            if (!experienceFilter.HasValue)
                return;
            boolQuery.Add(new TermQuery(new Term("Experience", ((int)experienceFilter.Value).ToString())), Occur.MUST);
        }
        private void AddProvinceFilter(BooleanQuery boolQuery, List<int> provinceCodes)
        {
            if (provinceCodes != null && provinceCodes.Any())
            {
                var provinceQuery = new BooleanQuery();
                foreach (var id in provinceCodes)
                {
                    provinceQuery.Add(
             NumericRangeQuery.NewInt32Range("ProvinceCode", id, id, true, true), Occur.SHOULD);
                }
                boolQuery.Add(provinceQuery, Occur.MUST);
            }
        }
        private void AddWardFilter(BooleanQuery boolQuery, List<int> wardCodes)
        {
            if (wardCodes != null && wardCodes.Any())
            {
                var wardQuery = new BooleanQuery();
                foreach (var id in wardCodes)
                {
                    wardQuery.Add(NumericRangeQuery.NewInt32Range("WardCode", id, id, true, true), Occur.SHOULD);
                }
                boolQuery.Add(wardQuery, Occur.MUST);
            }
        }
        private void AddCategoryFilter(BooleanQuery boolQuery, List<Guid> categoryIds)
        {
            if (categoryIds != null && categoryIds.Any())
            {
                var categoryQuery = new BooleanQuery();
                foreach (var catId in categoryIds)
                {
                    categoryQuery.Add(new TermQuery(new Term("CategoryId", catId.ToString())), Occur.SHOULD);
                }
                boolQuery.Add(categoryQuery, Occur.MUST);
            }
        }
        private void AddPositionFilter(BooleanQuery boolQuery, List<PositionType> positionTypes)
        {
            if (positionTypes != null && positionTypes.Any())
            {
                var positionQuery = new BooleanQuery();
                foreach (var position in positionTypes)
                {
                    positionQuery.Add(new TermQuery(new Term("PositionType", ((int)position).ToString())), Occur.SHOULD);
                }
                boolQuery.Add(positionQuery, Occur.MUST);
            }
        }
        private void AddEmployeeTypeFilter(BooleanQuery boolQuery, List<EmploymentType> employmentTypes)
        {
            if (employmentTypes != null && employmentTypes.Any())
            {
                var employmentQuery = new BooleanQuery();
                foreach (var employment in employmentTypes)
                {
                    employmentQuery.Add(new TermQuery(new Term("EmploymentType", ((int)employment).ToString())), Occur.SHOULD);
                }
                boolQuery.Add(employmentQuery, Occur.MUST);
            }
        }
        private void AddSalaryDealFilter(BooleanQuery boolQuery, bool? salaryDeal)
        {
            if (!salaryDeal.HasValue)
                return;

            boolQuery.Add(
                new TermQuery(new Term("SalaryDeal", salaryDeal.Value ? "1" : "0")),
                Occur.MUST
            );
        }
        private void AddSalaryRangeFilter(BooleanQuery boolQuery, double? salaryFrom, double? salaryTo)
        {
            if (salaryTo.HasValue)
            {
                var minSalaryQuery = NumericRangeQuery.NewDoubleRange("MinSalary", null, salaryTo.Value, true, true);
                boolQuery.Add(minSalaryQuery, Occur.MUST);
            }
            if (salaryFrom.HasValue)
            {
                var maxSalaryQuery = NumericRangeQuery.NewDoubleRange("MaxSalary", salaryFrom.Value, null, true, true);
                boolQuery.Add(maxSalaryQuery, Occur.MUST);
            }
        }

        #endregion

        #region Private Helper Methods
        /// Convert Job_Posting entity → Lucene Document
        /// Document chứa các fields được index để search
        private async Task<Document> CreateLuceneDocumentAsync(Job_Post job)
        {
            var doc = new Document();
            doc.Add(new StringField("Id", job.Id.ToString(), Field.Store.YES));

            //search full texxt
            doc.Add(new TextField("Title", job.Title ?? "", Field.Store.NO) { Boost = 3.0f });
            doc.Add(new TextField("Description", StripHtmlTags(job.Description ?? ""), Field.Store.NO) { Boost = 1.5f });
            doc.Add(new TextField("Requirements", StripHtmlTags(job.Requirements ?? ""), Field.Store.NO) { Boost = 1.2f });
            doc.Add(new TextField("Benefits", StripHtmlTags(job.Benefits ?? ""), Field.Store.NO));
            doc.Add(new TextField("CompanyName", job.CompanyName ?? "", Field.Store.NO));
            doc.Add(new TextField("WorkLocation", job.WorkLocation ?? "", Field.Store.NO));
            if (job.JobTags != null)
            {
                foreach (var jt in job.JobTags)
                {
                    if (jt.Tag != null && !string.IsNullOrWhiteSpace(jt.Tag.Name))
                        doc.Add(new TextField("Tag", jt.Tag.Name, Field.Store.NO) { Boost = 2.0f });
                }
            }

            // filter /sort/multisearch nhung ko can tao token
            doc.Add(new Int32Field("Experience", (int)job.Experience, Field.Store.NO));
            doc.Add(new StringField("CategoryId", job.JobCategoryId.ToString(), Field.Store.NO));
            doc.Add(new Int32Field("ProvinceCode", job.ProvinceCode, Field.Store.NO));
            if (job.WardCode.HasValue) doc.Add(new Int32Field("WardCode", (int)job.WardCode, Field.Store.NO));
            doc.Add(new StringField("EmploymentType", ((int)job.EmploymentType).ToString(), Field.Store.NO));
            doc.Add(new StringField("PositionType", ((int)job.PositionType).ToString(), Field.Store.NO));
            doc.Add(new Int32Field("SalaryDeal", job.SalaryDeal ? 1 : 0, Field.Store.NO));
            doc.Add(new DoubleField("MaxSalary", (double)(job.SalaryMax ?? 0), Field.Store.NO));
            doc.Add(new DoubleField("MinSalary", (double)(job.SalaryMin ?? 0), Field.Store.NO));
            if (job.ExpiresAt.HasValue) doc.Add(new Int64Field("ExpiresAt", job.ExpiresAt.Value.Ticks, Field.Store.NO));
            if (job.Job_Priority != null)
            {
                doc.Add(new Int32Field("PriorityLevel", (int)job.Job_Priority.PriorityLevel, Field.Store.NO));
                doc.Add(new DoubleField("SortScore", job.Job_Priority.SortScore, Field.Store.NO));
            }

            return doc;
        }
        /// Tạo IndexWriter để ghi dữ liệu vào Lucene index
        private IndexWriter GetWriter()
        {
            var config = new IndexWriterConfig(AppLuceneVersion, _analyzer)
            {
                OpenMode = OpenMode.CREATE_OR_APPEND  // Tạo mới nếu chưa có, append nếu đã có
            };
            return new IndexWriter(_directory, config);
        }
        /// Tạo IndexSearcher để search trong Lucene index
        private IndexSearcher GetSearcher()
        {
            var reader = DirectoryReader.Open(_directory);
            return new IndexSearcher(reader);
        }
        /// Remove HTML tags từ string
        /// Dùng để index plain text thay vì HTML
        private string StripHtmlTags(string html)
        {
            if (string.IsNullOrWhiteSpace(html))
                return string.Empty;

            // Remove HTML tags
            var text = Regex.Replace(html, "<.*?>", " ");
            // Remove multiple spaces
            text = Regex.Replace(text, @"\s+", " ");
            return text.Trim();
        }
        /// Escape special characters trong Lucene query
        /// Tránh ParseException khi user nhập ký tự đặc biệt
        private string EscapeSpecialCharacters(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return text;

            var specialChars = new[] { '+', '-', '&', '|', '!', '(', ')', '{', '}', '[', ']', '^', '"', '~', '*', '?', ':', '\\', '/' };
            foreach (var c in specialChars)
                text = text.Replace(c.ToString(), "\\" + c);

            return text;
        }

        #endregion


    }
}