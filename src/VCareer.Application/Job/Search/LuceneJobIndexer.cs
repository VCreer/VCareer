
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
using VCareer.Dto.Job;
using VCareer.Model;
using VCareer.Models.Job;
using VCareer.Repositories;
using VCareer.Repositories.Job;
using Volo.Abp.DependencyInjection;
using Lucene.Net.Analysis.Util;

namespace VCareer.Job.Search
{
    /// <summary>
    /// Lucene Job Indexer - Xử lý full-text search cho job posting
    /// Sử dụng Lucene.NET 4.8 để index và search job
    /// </summary>
    public class LuceneJobIndexer : ILuceneJobIndexer, ISingletonDependency
    {
        #region Constants & Fields

        // Lucene version sử dụng
        private const LuceneVersion AppLuceneVersion = LuceneVersion.LUCENE_48;

        // Đường dẫn lưu index trên đĩa (App_Data/LuceneIndex)
        private readonly string _indexPath;

        // Analyzer để phân tích text thành tokens
        private readonly Analyzer _analyzer;

        // Directory chứa Lucene index
        private FSDirectory _directory;

        // Dependencies
        private readonly IJobPostingRepository _jobPostingRepository;   // Load job để index
        private readonly IJobCategoryRepository _jobCategoryRepository; // Load category path
        private readonly ILocationRepository _locationRepository;       // Load province/district names

        #endregion

        #region Constructor

        /// <summary>
        /// Constructor - Khởi tạo Lucene indexer
        /// </summary>
        public LuceneJobIndexer(
            IJobPostingRepository jobPostingRepository,
            IJobCategoryRepository jobCategoryRepository,
            ILocationRepository locationRepository)
        {
            _jobPostingRepository = jobPostingRepository;
            _jobCategoryRepository = jobCategoryRepository;
            _locationRepository = locationRepository;

            // Setup index path
            _indexPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "LuceneIndex");
            if (!System.IO.Directory.Exists(_indexPath))
                System.IO.Directory.CreateDirectory(_indexPath);

            // Initialize analyzer và directory
            // ✨ Dùng StandardAnalyzer KHÔNG có stop words (để index "it", "a", "an"...)
            // Lucene.NET 4.8: Dùng CharArraySet.Empty (property) thay vì EMPTY_SET (constant)
            var emptyStopWords = new CharArraySet(AppLuceneVersion, 0, ignoreCase: false);
            _analyzer = new StandardAnalyzer(AppLuceneVersion, emptyStopWords);
            _directory = FSDirectory.Open(_indexPath);
        }

        #endregion

        #region Private Helper Methods

        /// <summary>
        /// Tạo IndexWriter để ghi dữ liệu vào Lucene index
        /// </summary>
        private IndexWriter GetWriter()
        {
            var config = new IndexWriterConfig(AppLuceneVersion, _analyzer)
            {
                OpenMode = OpenMode.CREATE_OR_APPEND  // Tạo mới nếu chưa có, append nếu đã có
            };
            return new IndexWriter(_directory, config);
        }

        /// <summary>
        /// Tạo IndexSearcher để search trong Lucene index
        /// </summary>
        private IndexSearcher GetSearcher()
        {
            var reader = DirectoryReader.Open(_directory);
            return new IndexSearcher(reader);
        }

        /// <summary>
        /// Remove HTML tags từ string
        /// Dùng để index plain text thay vì HTML
        /// </summary>
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

        /// <summary>
        /// Escape special characters trong Lucene query
        /// Tránh ParseException khi user nhập ký tự đặc biệt
        /// </summary>
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

        #region Index Management (Tạo, Cập nhật, Xóa Index)

        /// <summary>
        /// Index 1 job vào Lucene
        /// Gọi khi: Create job, Update job, Admin approve job
        /// </summary>
        public async Task IndexJobAsync(Job_Posting job)
        {
            // Chỉ index job đang active (Open + chưa hết hạn)
            if (job == null || !job.IsActive())
                return;

            await Task.Run(async () =>
            {
                using var writer = GetWriter();

                // Convert job entity → Lucene document
                var doc = await CreateLuceneDocumentAsync(job);

                // UpdateDocument: Thêm mới hoặc update nếu đã tồn tại (dựa vào Id)
                writer.UpdateDocument(new Term("Id", job.Id.ToString()), doc);

                // Commit changes
                writer.Commit();
            });
        }

        /// <summary>
        /// Index nhiều jobs vào Lucene (batch operation)
        /// Gọi khi: Re-index toàn bộ database, Import data
        /// </summary>
        public async Task IndexMultipleJobsAsync(List<Job_Posting> jobs)
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

        /// <summary>
        /// Xóa 1 job khỏi Lucene index
        /// Gọi khi: Delete job, Job hết hạn, Admin reject job
        /// </summary>
        public async Task DeleteJobFromIndexAsync(Guid jobId)
        {
            await Task.Run(() =>
            {
                using var writer = GetWriter();
                writer.DeleteDocuments(new Term("Id", jobId.ToString()));
                writer.Commit();
            });
        }

        /// <summary>
        /// Xóa toàn bộ Lucene index
        /// Gọi khi: Re-index từ đầu
        /// </summary>
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

        #endregion

        #region Create Lucene Document

        /// <summary>
        /// Convert Job_Posting entity → Lucene Document
        /// Document chứa các fields được index để search
        /// </summary>
        private async Task<Document> CreateLuceneDocumentAsync(Job_Posting job)
        {
            var doc = new Document();

            // ========================================
            // ID Field (Store để retrieve sau khi search)
            // ========================================
            doc.Add(new StringField("Id", job.Id.ToString(), Field.Store.YES));

            // ========================================
            // TEXT FIELDS (Full-text search với boost)
            // ========================================
            // Title - Boost 3.0 (quan trọng nhất)
            doc.Add(new TextField("Title", job.Title ?? "", Field.Store.NO) { Boost = 3.0f });

            // Description - Boost 1.5
            doc.Add(new TextField("Description", StripHtmlTags(job.Description ?? ""), Field.Store.NO) { Boost = 1.5f });

            // Requirements - Boost 1.2
            doc.Add(new TextField("Requirements", StripHtmlTags(job.Requirements ?? ""), Field.Store.NO) { Boost = 1.2f });

            // Benefits
            doc.Add(new TextField("Benefits", StripHtmlTags(job.Benefits ?? ""), Field.Store.NO));

            // WorkLocation
            doc.Add(new TextField("WorkLocation", job.WorkLocation ?? "", Field.Store.NO));

            // ExperienceText để search keyword (VD: "không yêu cầu kinh nghiệm", "2 năm")
            doc.Add(new TextField("ExperienceText", job.ExperienceText ?? "", Field.Store.NO));

            // ========================================
            // CATEGORY (Load category path để search theo parent categories)
            // ========================================
            doc.Add(new StringField("CategoryId", job.JobCategoryId.ToString(), Field.Store.NO));

            //// Category path: "Công nghệ thông tin > Phát triển phần mềm > Backend Developer"
            //var categoryPath = await _jobCategoryRepository.GetCategoryPathAsync(job.JobCategoryId);
            //doc.Add(new TextField("CategoryPath", categoryPath ?? "", Field.Store.NO) { Boost = 2.0f });

            // ========================================
            // LOCATION (Load province/district names để search)
            // ========================================
            //doc.Add(new Int32Field("ProvinceId", job.ProvinceId, Field.Store.NO));
            //doc.Add(new Int32Field("DistrictId", job.DistrictId, Field.Store.NO));

            doc.Add(new StringField("ProvinceId", job.ProvinceId.ToString(), Field.Store.NO));
            doc.Add(new StringField("DistrictId", job.DistrictId.ToString(), Field.Store.NO));

            // Load province và district names
            //var province = await _locationRepository.GetProvinceByIdAsync(job.ProvinceId);
            //var district = await _locationRepository.GetDistrictByIdAsync(job.DistrictId);

            //if (province != null)
            //    doc.Add(new TextField("ProvinceName", province.Name ?? "", Field.Store.NO));

            //if (district != null)
            //    doc.Add(new TextField("DistrictName", district.Name ?? "", Field.Store.NO));

            // ========================================
            // SALARY (Index min/max để filter + text để display)
            // ========================================
            doc.Add(new StringField("SalaryDeal", job.SalaryDeal.ToString(), Field.Store.NO));
            doc.Add(new DoubleField("SalaryMin", (double)(job.SalaryMin ?? 0), Field.Store.NO));
            doc.Add(new DoubleField("SalaryMax", (double)(job.SalaryMax ?? decimal.MaxValue), Field.Store.NO));

            // SalaryText để hiển thị (không index vì không search text này)
            //doc.Add(new StoredField("SalaryText", job.SalaryText ?? ""));

            // ========================================
            // EXPERIENCE (Enum + Text để search keyword)
            // ========================================
            doc.Add(new StringField("Experience", ((int)job.Experience).ToString(), Field.Store.NO));



            // ========================================
            // OTHER FIELDS
            // ========================================
            doc.Add(new StringField("EmploymentType", ((int)job.EmploymentType).ToString(), Field.Store.NO));
            doc.Add(new StringField("PositionType", ((int)job.PositionType).ToString(), Field.Store.NO));
            doc.Add(new StringField("IsUrgent", job.IsUrgent.ToString(), Field.Store.NO));
            doc.Add(new StringField("Status", ((int)job.Status).ToString(), Field.Store.NO));



          

            // Dates (store as ticks để sort)
            doc.Add(new Int64Field("PostedAt", job.PostedAt.Ticks, Field.Store.NO));
            doc.Add(new Int64Field("LastModifiedAt", (job.LastModificationTime ?? job.CreationTime).Ticks, Field.Store.NO));

            if (job.ExpiresAt.HasValue)
                doc.Add(new Int64Field("ExpiresAt", job.ExpiresAt.Value.Ticks, Field.Store.NO));

            return doc;
        }

        #endregion

        #region Search

        /// <summary>
        /// Search jobs và trả về list GUIDs (đã sorted)
        /// Repository sẽ dùng list GUIDs này để lấy jobs từ database (giữ nguyên thứ tự)
        /// </summary>
        public async Task<List<Guid>> SearchJobIdsAsync(JobSearchInputDto input)
        {
            return await Task.Run(() =>
            {
                using var reader = DirectoryReader.Open(_directory);
                var searcher = new IndexSearcher(reader);

                // Build query từ input
                var query = BuildSearchQuery(input);

                // Build sort order
                var sort = BuildSortOrder(input.SortBy);

                // Calculate max results (buffer để support pagination)
                int maxResults = (input.SkipCount + input.MaxResultCount) * 3;
                if (maxResults < 100) maxResults = 100;

                // Execute search
                var topDocs = searcher.Search(query, maxResults, sort);

                // Extract job IDs
                var jobIds = new List<Guid>();
                foreach (var scoreDoc in topDocs.ScoreDocs)
                {
                    var doc = searcher.Doc(scoreDoc.Doc);
                    if (Guid.TryParse(doc.Get("Id"), out var jobId))
                        jobIds.Add(jobId);
                }

                return jobIds;
            });
        }





        private Query BuildSearchQuery(JobSearchInputDto input)
        {
            var boolQuery = new BooleanQuery();

            // ========================================
            // MUST: Job đang OPEN và chưa hết hạn
            // ========================================
            boolQuery.Add(new TermQuery(new Term("Status", ((int)JobStatus.Open).ToString())), Occur.MUST);
            boolQuery.Add(NumericRangeQuery.NewInt64Range("ExpiresAt", DateTime.UtcNow.Ticks, null, true, true), Occur.MUST);

            // ========================================
            // KEYWORD Search (Full-text)
            // ========================================
            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                var keywordQuery = BuildKeywordQuery(input.Keyword);
                if (keywordQuery != null)
                    boolQuery.Add(keywordQuery, Occur.MUST);
            }

            // ========================================
            // FILTER: Category IDs (FE gửi list leaf nodes)
            // ========================================
            if (input.CategoryIds != null && input.CategoryIds.Any())
            {
                var categoryQuery = new BooleanQuery();
                foreach (var catId in input.CategoryIds)
                {
                    categoryQuery.Add(new TermQuery(new Term("CategoryId", catId.ToString())), Occur.SHOULD);
                }
                boolQuery.Add(categoryQuery, Occur.MUST);
            }

            // ========================================
            // FILTER: Province IDs
            // ========================================
            if (input.ProvinceIds != null && input.ProvinceIds.Any())
            {
                var provinceQuery = new BooleanQuery();
                foreach (var id in input.ProvinceIds)
                {
                    provinceQuery.Add(new TermQuery(new Term("ProvinceId", id.ToString())), Occur.SHOULD);
                   // provinceQuery.Add(Int32Field.NewExactQuery("ProvinceId", id), Occur.SHOULD);
                }
                boolQuery.Add(provinceQuery, Occur.MUST);
            }

            // ========================================
            // FILTER: District IDs
            // ========================================
            if (input.DistrictIds != null && input.DistrictIds.Any())
            {
                var districtQuery = new BooleanQuery();
                foreach (var id in input.DistrictIds)
                {
                    districtQuery.Add(new TermQuery(new Term("DistrictId", id.ToString())), Occur.SHOULD);
                   // districtQuery.Add(Int32Field.NewExactQuery("DistrictId", id), Occur.SHOULD);
                }
                boolQuery.Add(districtQuery, Occur.MUST);
            }


            // Index
            //doc.Add(new Int32Field("ProvinceId", job.ProvinceId, Field.Store.NO));
            //doc.Add(new Int32Field("DistrictId", job.DistrictId, Field.Store.NO));

            // Search  
            //provinceQuery.Add(Int32Field.NewExactQuery("ProvinceId", id), Occur.SHOULD);
            //districtQuery.Add(Int32Field.NewExactQuery("DistrictId", id), Occur.SHOULD);

            // ========================================
            // FILTER: Salary (theo radio buttons UI)
            // ========================================
            AddSalaryFilter(boolQuery, input.SalaryFilter);

            // ========================================
            // FILTER: Experience (theo radio buttons UI)
            // ========================================
            AddExperienceFilter(boolQuery, input.ExperienceFilter);

            // ========================================
            // FILTER: Position Types (List)
            // ========================================
            if (input.PositionTypes != null && input.PositionTypes.Any())
            {
                var positionQuery = new BooleanQuery();
                foreach (var position in input.PositionTypes)
                {
                    positionQuery.Add(new TermQuery(new Term("PositionType", ((int)position).ToString())), Occur.SHOULD);
                }
                boolQuery.Add(positionQuery, Occur.MUST);
            }

            // ========================================
            // FILTER: Employment Types (List)
            // ========================================
            if (input.EmploymentTypes != null && input.EmploymentTypes.Any())
            {
                var employmentQuery = new BooleanQuery();
                foreach (var employment in input.EmploymentTypes)
                {
                    employmentQuery.Add(new TermQuery(new Term("EmploymentType", ((int)employment).ToString())), Occur.SHOULD);
                }
                boolQuery.Add(employmentQuery, Occur.MUST);
            }

            // ========================================
            // FILTER: Is Urgent
            // ========================================
            if (input.IsUrgent.HasValue)
            {
                boolQuery.Add(new TermQuery(new Term("IsUrgent", input.IsUrgent.Value.ToString())), Occur.MUST);
            }

            // Return query (nếu không có clause nào, return match all)
            return boolQuery.Clauses.Count == 0 ? new MatchAllDocsQuery() : boolQuery;
        }

        /// <summary>
        /// Build keyword query - Search trên nhiều fields với boost
        /// </summary>
        private Query BuildKeywordQuery(string keyword)
        {
            try
            {
                var parser = new MultiFieldQueryParser(
                    AppLuceneVersion,
                    new[] {
                        "Title",            // Boost 3.0 (quan trọng nhất)
                        "Description",      // Boost 1.5
                        "Requirements",     // Boost 1.0
                        "Benefits",         // Boost 1.0
                        "WorkLocation",     // Boost 1.0
                       
                        "ExperienceText",  // ví dụ gõ không yêu cầu kinh nghiệm, nó sẽ search đến đây 
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

        /// <summary>
        /// ✨ FILTER LƯƠNG theo Radio Buttons UI
        /// ⚠️ LOGIC MỚI (ĐÚNG):
        /// - Filter "Thỏa thuận" → CHỈ match jobs SalaryDeal = true
        /// - Filter ranges → CHỈ match jobs có SalaryMin/Max cụ thể (SalaryDeal = false)
        /// </summary>
        private void AddSalaryFilter(BooleanQuery boolQuery, SalaryFilterType? salaryFilter)
        {
            if (!salaryFilter.HasValue || salaryFilter == SalaryFilterType.All)
                return;

            var salaryQuery = new BooleanQuery();

            switch (salaryFilter.Value)
            {
                case SalaryFilterType.Deal:
                    // CHỈ lấy jobs "Thỏa thuận" (SalaryDeal = true, SalaryMin/Max = null)
                    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "True")), Occur.MUST);
                    break;

                case SalaryFilterType.Under10:
                    // CHỈ lấy jobs có lương CỤ THỂ < 10 (SalaryDeal = false AND SalaryMin < 10)
                    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "False")), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", null, 10.0, true, false), Occur.MUST);
                    break;

                case SalaryFilterType.Range10To15:
                    // CHỈ lấy jobs có lương CỤ THỂ overlap [10, 15]
                    // SalaryDeal = false AND (SalaryMax >= 10 AND SalaryMin <= 15)
                    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "False")), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMax", 10.0, null, true, true), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", null, 15.0, true, true), Occur.MUST);
                    break;

                case SalaryFilterType.Range15To20:
                    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "False")), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMax", 15.0, null, true, true), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", null, 20.0, true, true), Occur.MUST);
                    break;

                case SalaryFilterType.Range20To30:
                    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "False")), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMax", 20.0, null, true, true), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", null, 30.0, true, true), Occur.MUST);
                    break;

                case SalaryFilterType.Range30To50:
                    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "False")), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMax", 30.0, null, true, true), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", null, 50.0, true, true), Occur.MUST);
                    break;

                case SalaryFilterType.Over50:
                    // CHỈ lấy jobs có lương CỤ THỂ >= 50
                    salaryQuery.Add(new TermQuery(new Term("SalaryDeal", "False")), Occur.MUST);
                    salaryQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", 50.0, null, true, true), Occur.MUST);
                    break;
            }

            if (salaryQuery.Clauses.Count > 0)
                boolQuery.Add(salaryQuery, Occur.MUST);
        }

        /// <summary>
        /// ✨ FILTER KINH NGHIỆM - Đơn giản hóa (exact match với enum)
        /// </summary>
        private void AddExperienceFilter(BooleanQuery boolQuery, ExperienceLevel? experienceFilter)
        {
            if (!experienceFilter.HasValue)
                return;

            // Match exact với enum value
            boolQuery.Add(new TermQuery(new Term("Experience", ((int)experienceFilter.Value).ToString())), Occur.MUST);
        }

        /// <summary>
        /// Build sort order từ sortBy parameter
        /// </summary>
        private Sort BuildSortOrder(string sortBy)
        {
            sortBy = sortBy?.ToLower() ?? "relevance";

            return sortBy switch
            {
                "salary" => new Sort(
                    new SortField("SalaryMax", SortFieldType.DOUBLE, true),      // Lương cao → thấp
                    new SortField("PostedAt", SortFieldType.INT64, true)         // Mới nhất
                ),

                "experience" => new Sort(
                    new SortField("Experience", SortFieldType.INT32, true),       // Kinh nghiệm cao → thấp
                    new SortField("PostedAt", SortFieldType.INT64, true)
                ),

                "urgent" => new Sort(
                    new SortField("IsUrgent", SortFieldType.STRING, true),       // Tuyển gấp lên đầu
                    new SortField("PostedAt", SortFieldType.INT64, true)
                ),

                "updated" => new Sort(
                    new SortField("LastModifiedAt", SortFieldType.INT64, true)   // Mới cập nhật
                ),

                _ => Sort.RELEVANCE                                              // Default: Relevance (Lucene score)
            };
        }

        #endregion

        #region Debug Methods

        /// <summary>
        /// DEBUG: Test xem analyzer phân tách từ như thế nào
        /// Dùng để verify "it" có bị bỏ qua không
        /// </summary>
        public List<string> TestTokenize(string text)
        {
            var tokens = new List<string>();

            try
            {
                var stream = _analyzer.GetTokenStream("test", new StringReader(text));
                var termAttr = stream.GetAttribute<Lucene.Net.Analysis.TokenAttributes.ICharTermAttribute>();

                stream.Reset();
                while (stream.IncrementToken())
                {
                    tokens.Add(termAttr.ToString());
                }
                stream.End();
                stream.Dispose();
            }
            catch (Exception ex)
            {
                tokens.Add($"ERROR: {ex.Message}");
            }

            return tokens;
        }

        #endregion
    }
}