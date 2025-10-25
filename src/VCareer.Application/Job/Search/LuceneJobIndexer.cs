//using Lucene.Net.Analysis;
//using Lucene.Net.Analysis.Standard;
//using Lucene.Net.Documents;
//using Lucene.Net.Index;
//using Lucene.Net.QueryParsers.Classic;
//using Lucene.Net.Search;
//using Lucene.Net.Store;
//using Lucene.Net.Util;

//using System;
//using System.Collections.Generic;
//using System.IO;
//using System.Linq;
//using System.Text;
//using System.Text.RegularExpressions;
//using System.Threading.Tasks;
//using VCareer.Dto.Job;
//using VCareer.Model;
//using VCareer.Models.Job;
//using VCareer.Repositories;
//using VCareer.Repositories.Job;
//using Volo.Abp.DependencyInjection;

//namespace VCareer.Job.Search
//{
//    public class LuceneJobIndexer : ILuceneJobIndexer, ISingletonDependency
//    {
//        //version của lucene
//        private const LuceneVersion AppLuceneVersion = LuceneVersion.LUCENE_48;

//        //đưobfg dẫn lưu index trên đĩa
//        private readonly string _indexPath;

//        //công cụ để phân tích Textx thành token
//        private readonly Analyzer _analyzer;

//        //một đối tưởng giúp mở index
//        private FSDirectory _directory;

//        //ịnect repo
//        private readonly IJobCategoryRepository _jobCategoryRepository; // Load category path
//        private readonly ILocationRepository _locationRepository;      // Load province/district names
//        private readonly IDistrictRepository _districtRepository;      // Load province/district names


//        // contructor , mở thư mục chứa index để đọc và ghi
//        public LuceneJobIndexer(IJobCategoryRepository jobCategoryRepository, ILocationRepository locationRepository, IDistrictRepository districtRepository)
//        {
//            _jobCategoryRepository = jobCategoryRepository;
//            _locationRepository = locationRepository;
//            _districtRepository = districtRepository;
//            _indexPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "App_Data", "LuceneIndex");
//            if (!System.IO.Directory.Exists(_indexPath)) System.IO.Directory.CreateDirectory(_indexPath);
//            _analyzer = new StandardAnalyzer(AppLuceneVersion); // Phân tích text thành tokens
//            _directory = FSDirectory.Open(_indexPath);
//        }


//        // tạo indeWriter để ghi dữ liệu vào index
//        private IndexWriter GetWriter()
//        {
//            var config = new IndexWriterConfig(AppLuceneVersion, _analyzer) { OpenMode = OpenMode.CREATE_OR_APPEND };
//            return new IndexWriter(_directory, config);
//        }



//        // tạo indexSeacher để tìm kiếm trong index
//        private IndexSearcher GetSearcher()
//        {
//            var reader = DirectoryReader.Open(_directory);
//            return new IndexSearcher(reader);
//        }



//        // ghi 1 job active vào index
//        public async Task IndexJobAsync(Job_Posting job)
//        {
//            if (job == null || !job.IsActive()) return;
//            await Task.Run(async () =>
//            {
//                // tạo writer để ghi dữ liệu vào index
//                using var writer = GetWriter();

//                // tạo document từ job này
//                var doc = await CreateLuceneDocumentAsync(job);

//                //thêm nó vào document
//                writer.UpdateDocument(new Term("Id", job.Id.ToString()), doc); // Update nếu tồn tại

//                //lưu thay đổi trong index
//                writer.Commit();
//            });
//        }



//        //ghi nheieuf job vòa index
//        public async Task IndexMultipleJobsAsync(List<Job_Posting> jobs)
//        {
//            jobs = jobs.Where(j => j.IsActive()).ToList();
//            if (!jobs.Any()) return;
//            await Task.Run(async () =>
//            {
//                using var writer = GetWriter();
//                foreach (var job in jobs)
//                {
//                    var doc = await CreateLuceneDocumentAsync(job);
//                    writer.UpdateDocument(new Term("Id", job.Id.ToString()), doc);
//                }
//                writer.Commit();
//            });
//        }



//        // Xóa job khỏi index
//        public async Task DeleteJobFromIndexAsync(Guid jobId)
//        {
//            await Task.Run(() =>
//            {
//                using var writer = GetWriter();
//                writer.DeleteDocuments(new Term("Id", jobId.ToString()));
//                writer.Commit();
//            });
//        }



//        // Xóa toàn bộ index
//        public async Task ClearIndexAsync()
//        {
//            await Task.Run(() =>
//            {
//                var config = new IndexWriterConfig(AppLuceneVersion, _analyzer) { OpenMode = OpenMode.CREATE };
//                using var writer = new IndexWriter(_directory, config);
//                writer.DeleteAll();
//                writer.Commit();
//            });
//        }



//        // Tìm kiếm và trả về list GUID
//        public async Task<List<Guid>> SearchJobIdsAsync(JobSearchInputDto input)
//        {
//            return await Task.Run(() =>
//            {
//                // mở thư mục
//                using var reader = DirectoryReader.Open(_directory);

//                // tạo seachrer để tìm kiếm
//                var searcher = new IndexSearcher(reader);


//                // Xây dựng query từ input
//                var query = BuildSearchQuery(input);


//                // Sắp xếp
//                var sort = BuildSortOrder(input.SortBy);

//                // Buffer lớn hơn để hỗ trợ paging (tránh miss results)
//                int maxResults = (input.SkipCount + input.MaxResultCount) * 5; // Tăng lên 5x
//                if (maxResults < 200) maxResults = 200; // Minimum 200
//                var topDocs = searcher.Search(query, maxResults, sort); // Thực thi tìm kiếm

//                var jobIds = new List<Guid>();
//                foreach (var scoreDoc in topDocs.ScoreDocs)
//                {
//                    var doc = searcher.Doc(scoreDoc.Doc);
//                    if (Guid.TryParse(doc.Get("Id"), out var jobId))
//                        jobIds.Add(jobId);
//                }
//                return jobIds;
//            });
//        }



//        // Xây dựng query từ input
//        private Query BuildSearchQuery(JobSearchInputDto input)
//        {
//            //tạo 1 truy vấn cho phép kết hợp nhiều điều kiện logic and or not
//            var boolQuery = new BooleanQuery();


//            // phải tim các job có trạng thái là open
//            boolQuery.Add(new TermQuery(new Term("Status", ((int)JobStatus.Open).ToString())), Occur.MUST);


//            // phải tìm các job có ngày lớn hơn hiện tại
//            boolQuery.Add(NumericRangeQuery.NewInt64Range("ExpiresAt", DateTime.UtcNow.Ticks, null, true, true), Occur.MUST); // Chưa hết hạn


//            // Nếu có keywword sẽ tìm trong các trường định nghĩa trong buildKeywordQuery
//            if (!string.IsNullOrWhiteSpace(input.Keyword))
//            {
//                var textQuery = BuildKeywordQuery(input.Keyword);
//                if (textQuery != null) boolQuery.Add(textQuery, Occur.MUST);
//            }


//            // nếu có id của proviucen  thì phảo tim kiếm thoe id của provicne
//            if (input.ProvinceIds != null && input.ProvinceIds.Any())
//            {
//                var provinceQuery = new BooleanQuery();
//                foreach (var id in input.ProvinceIds)
//                {
//                    provinceQuery.Add(new TermQuery(new Term("ProvinceId", id.ToString())), Occur.SHOULD);
//                }
//                boolQuery.Add(provinceQuery, Occur.MUST);
//            }



//            // nếu fe trả về id của district , thì phải tìm kiếm theo id của district
//            if (input.DistrictIds != null && input.DistrictIds.Any())
//            {
//                var districtQuery = new BooleanQuery();
//                foreach (var id in input.DistrictIds)
//                {
//                    districtQuery.Add(new TermQuery(new Term("DistrictId", id.ToString())), Occur.SHOULD);
//                }
//                boolQuery.Add(districtQuery, Occur.MUST);
//            }




//            // nếu có danh sách categpory  phải tìm kiếm thoe categoryID 
//            if (input.CategoryIds != null && input.CategoryIds.Any())
//            {
//                var categoryQuery = new BooleanQuery();
//                foreach (var catId in input.CategoryIds)
//                {
//                    categoryQuery.Add(new TermQuery(new Term("CategoryId", catId.ToString())), Occur.SHOULD);
//                }
//                boolQuery.Add(categoryQuery, Occur.MUST);
//            }



//            // nếu có thông tin trường hình thức làm việc
//            if (input.EmploymentType.HasValue)
//            {
//                boolQuery.Add(new TermQuery(new Term("EmploymentType", ((int)input.EmploymentType.Value).ToString())), Occur.MUST);
//            }



//            // nếu có thông tin trương vị trí việc làm
//            if (input.PositionType.HasValue)
//            {
//                boolQuery.Add(new TermQuery(new Term("PositionType", ((int)input.PositionType.Value).ToString())), Occur.MUST);
//            }



//            // filter theo mức lương
//            AddSalaryRangeFilter(boolQuery, input.SalaryMin, input.SalaryMax);


//            // filter theo kinh nghiệm
//            AddExperienceRangeFilter(boolQuery, input.ExperienceYearsMin, input.ExperienceYearsMax);





//            return boolQuery.Clauses.Count == 0 ? new MatchAllDocsQuery() : boolQuery;
//        }



//        // Xây dựng query cho keyword (tìm trên nhiều field)
//        private Query BuildKeywordQuery(string keyword)
//        {
//            try
//            {
//                var parser = new MultiFieldQueryParser(
//                    AppLuceneVersion,
//                    new[] { "Title", "Description", "Requirements", "Benefits", "CategoryPath", "WorkLocation" },
//                    _analyzer
//                );
//                parser.DefaultOperator = Operator.OR; // Match bất kỳ token nào
//                return parser.Parse(EscapeSpecialCharacters(keyword));
//            }
//            catch (ParseException)
//            {
//                return new WildcardQuery(new Term("Title", $"*{keyword.ToLower()}*")); // Fallback wildcard
//            }
//        }



//        // Filter lương
//        private void AddSalaryRangeFilter(BooleanQuery boolQuery, decimal? min, decimal? max)
//        {
//            // nếu nhậ sao thì ko fiter nữa
//            if (min.HasValue && max.HasValue && min.Value > max.Value)
//            {
//                // Bỏ qua nếu min > max, hoặc ném exception tùy bạn
//                return;
//            }


//            // meies cs giá trị lương tối thiểu , thì lọc ra lương max >= min
//            if (min.HasValue)
//                boolQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMax", (double)min.Value, null, true, true), Occur.MUST);

//            // meies cs giá trị lương tối đa , thì lọc ra lương min <= max
//            if (max.HasValue)
//                boolQuery.Add(NumericRangeQuery.NewDoubleRange("SalaryMin", null, (double)max.Value, true, true), Occur.MUST);
//        }



//        // Filter thioe kinh nghiệm
//        private void AddExperienceRangeFilter(BooleanQuery boolQuery, int? min, int? max)
//        {
//            //nếu không nhập

//            if (min.HasValue && max.HasValue && min.Value > max.Value)
//            {
//                // Bỏ qua nếu min > max, hoặc ném exception tùy bạn
//                return;
//            }

//            // nếu không có giá trị thì cho min = 0 ;;
//            int expMin = min ?? 0;

//            // nếu không có giá trị thì cho max = số nguyên max
//            int expMax = max ?? int.MaxValue;


//            boolQuery.Add(NumericRangeQuery.NewInt32Range("ExperienceMax", expMin, null, true, true), Occur.MUST);
//            boolQuery.Add(NumericRangeQuery.NewInt32Range("ExperienceMin", null, expMax, true, true), Occur.MUST);
//        }



//        // Xây dựng sort order
//        private Sort BuildSortOrder(string sortBy)
//        {
//            sortBy = sortBy?.ToLower() ?? "newest";
//            return sortBy switch
//            {
//                "urgent" => new Sort(
//                    new SortField("IsUrgent", SortFieldType.STRING, true),    // Urgent first
//                    new SortField("PostedAt", SortFieldType.INT64, true)      // Then newest
//                ),
//                "salary" => new Sort(
//                    new SortField("SalaryMax", SortFieldType.DOUBLE, true)    // Highest salary first
//                ),
//                _ => new Sort(                                               // Default: newest
//                    new SortField("PostedAt", SortFieldType.INT64, true)      // Newest first
//                )
//            };
//        }






//        // chueyrn 1 job thnafh 1 document
//        private async Task<Document> CreateLuceneDocumentAsync(Job_Posting job)
//        {
//            var doc = new Document();
//            doc.Add(new StringField("Id", job.Id.ToString(), Field.Store.YES)); // Store ID to retrieve

//            // Text fields với boost
//            var titleField = new TextField("Title", job.Title ?? "", Field.Store.NO) { Boost = 3.0f };
//            doc.Add(titleField);
//            var descField = new TextField("Description", StripHtmlTags(job.Description ?? ""), Field.Store.NO) { Boost = 1.5f };
//            doc.Add(descField);
//            doc.Add(new TextField("Requirements", StripHtmlTags(job.Requirements ?? ""), Field.Store.NO));
//            doc.Add(new TextField("Benefits", StripHtmlTags(job.Benefits ?? ""), Field.Store.NO));

//            //// Tags
//            //var tagsString = string.Join(" ", job.JobPostingTags?.Select(jpt => jpt.Tag?.Name) ?? Enumerable.Empty<string>());
//            //var tagsField = new TextField("Tags", tagsString, Field.Store.NO) { Boost = 2.8f };
//            //doc.Add(tagsField);

//            // Category
//            doc.Add(new StringField("CategoryId", job.JobCategoryId.ToString(), Field.Store.NO));
//            var categoryPath = await _jobCategoryRepository.GetStringPath(job.JobCategoryId); // Load path async
//            doc.Add(new TextField("CategoryPath", categoryPath ?? "", Field.Store.NO) { Boost = 2.0f });

//            // Location (load names từ repo vì no navigation)
//            var province = await _locationRepository.GetByIDAsync(job.ProvinceId);
//            var district = await _districtRepository.GetByDistrictIdAsync(job.DistrictId);
//            doc.Add(new StringField("ProvinceId", job.ProvinceId.ToString(), Field.Store.NO));

//            doc.Add(new StringField("DistrictId", job.DistrictId.ToString(), Field.Store.NO));

//            doc.Add(new TextField("WorkLocation", job.WorkLocation ?? "", Field.Store.NO));

//            // Other fields
//            doc.Add(new StringField("EmploymentType", ((int)job.EmploymentType).ToString(), Field.Store.NO));
//            doc.Add(new StringField("PositionType", ((int)job.PositionType).ToString(), Field.Store.NO));
//            doc.Add(new DoubleField("SalaryMax", (double)(job.SalaryMax ?? decimal.MaxValue), Field.Store.NO));
//            doc.Add(new DoubleField("SalaryMin", (double)(job.SalaryMin ?? 0), Field.Store.NO));
//            doc.Add(new Int32Field("ExperienceMin", job.ExperienceYearsMin ?? 0, Field.Store.NO));
//            doc.Add(new Int32Field("ExperienceMax", job.ExperienceYearsMax ?? int.MaxValue, Field.Store.NO));
//            doc.Add(new StringField("IsUrgent", job.IsUrgent.ToString(), Field.Store.NO));
//            doc.Add(new StringField("Status", ((int)job.Status).ToString(), Field.Store.NO));
//            doc.Add(new Int64Field("PostedAt", job.PostedAt.Ticks, Field.Store.NO));


//            return doc;
//        }



//        // Utility methods
//        private string StripHtmlTags(string html)
//        {
//            if (string.IsNullOrWhiteSpace(html)) return string.Empty;
//            var text = System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", " ");
//            text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ");
//            return text.Trim();
//        }



//        private string EscapeSpecialCharacters(string text)
//        {
//            if (string.IsNullOrWhiteSpace(text)) return text;
//            var specialChars = new[] { '+', '-', '&', '|', '!', '(', ')', '{', '}', '[', ']', '^', '"', '~', '*', '?', ':', '\\', '/' };
//            foreach (var c in specialChars)
//                text = text.Replace(c.ToString(), "\\" + c);
//            return text;
//        }
//    }
//}
