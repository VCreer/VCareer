using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.CV;
using VCareer.Models.CV;
using VCareer.Models.Users;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace VCareer.Services.CV
{
    /// <summary>
    /// Custom JsonConverter để handle Gender field có thể là string "true"/"false" hoặc boolean
    /// </summary>
    public class GenderJsonConverter : JsonConverter<bool?>
    {
        public override bool? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;

            if (reader.TokenType == JsonTokenType.String)
            {
                var stringValue = reader.GetString();
                if (string.IsNullOrEmpty(stringValue))
                    return null;

                // Handle string "true"/"false"
                if (bool.TryParse(stringValue, out var boolValue))
                    return boolValue;

                // Handle "1"/"0" hoặc "yes"/"no"
                if (stringValue.Equals("1", StringComparison.OrdinalIgnoreCase) || 
                    stringValue.Equals("yes", StringComparison.OrdinalIgnoreCase))
                    return true;

                if (stringValue.Equals("0", StringComparison.OrdinalIgnoreCase) || 
                    stringValue.Equals("no", StringComparison.OrdinalIgnoreCase))
                    return false;

                return null;
            }

            if (reader.TokenType == JsonTokenType.True)
                return true;

            if (reader.TokenType == JsonTokenType.False)
                return false;

            throw new JsonException($"Unexpected token type: {reader.TokenType}");
        }

        public override void Write(Utf8JsonWriter writer, bool? value, JsonSerializerOptions options)
        {
            if (value == null)
                writer.WriteNullValue();
            else
                writer.WriteBooleanValue(value.Value);
        }
    }

    /// <summary>
    /// Application Service cho Candidate CV Management
    /// </summary>
    public class CandidateCvAppService : VCareerAppService, ICandidateCvAppService
    {
        private readonly IRepository<CandidateCv, Guid> _candidateCvRepository;
        private readonly IRepository<CvTemplate, Guid> _templateRepository;
        private readonly IRepository<CandidateProfile, Guid> _candidateProfileRepository;
        private readonly ICurrentUser _currentUser;
        private readonly ILogger<CandidateCvAppService> _logger;

        public CandidateCvAppService(
            IRepository<CandidateCv, Guid> candidateCvRepository,
            IRepository<CvTemplate, Guid> templateRepository,
            IRepository<CandidateProfile, Guid> candidateProfileRepository,
            ICurrentUser currentUser,
            ILogger<CandidateCvAppService> logger
            )
        {
            _candidateCvRepository = candidateCvRepository;
            _templateRepository = templateRepository;
            _candidateProfileRepository = candidateProfileRepository;
            _currentUser = currentUser;
            _logger = logger;
        }

        public async Task<CandidateCvDto> CreateAsync(CreateCandidateCvDto input)
        {
            var userId = _currentUser.GetId();

            // Kiểm tra user có phải candidate không
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
            {
                throw new UserFriendlyException("Chỉ có candidate mới có thể tạo CV.");
            }

            // Kiểm tra template có tồn tại và active không
            var template = await _templateRepository.GetAsync(input.TemplateId);
            if (!template.IsActive)
            {
                throw new UserFriendlyException("Template này không còn hoạt động.");
            }

            // Nếu set làm default, bỏ default của các CV khác
            if (input.IsDefault)
            {
                var existingDefault = await _candidateCvRepository.FirstOrDefaultAsync(
                    x => x.CandidateId == userId && x.IsDefault);
                if (existingDefault != null)
                {
                    existingDefault.IsDefault = false;
                    await _candidateCvRepository.UpdateAsync(existingDefault);
                }
            }

            var cv = new CandidateCv
            {
                CandidateId = userId,
                TemplateId = input.TemplateId,
                CvName = input.CvName,
                DataJson = input.DataJson,
                BlocksJson = input.BlocksJson, // Lưu blocks structure nếu có
                IsPublished = input.IsPublished,
                IsDefault = input.IsDefault,
                IsPublic = input.IsPublic,
                Notes = input.Notes,
                ViewCount = 0
            };

            if (input.IsPublished)
            {
                cv.PublishedAt = DateTime.UtcNow;
            }

            await _candidateCvRepository.InsertAsync(cv);

            return ObjectMapper.Map<CandidateCv, CandidateCvDto>(cv);
        }

        public async Task<CandidateCvDto> UpdateAsync(Guid id, UpdateCandidateCvDto input)
        {
            var userId = _currentUser.GetId();

            var cv = await _candidateCvRepository.GetAsync(id);

            // Kiểm tra quyền: chỉ có thể update CV của chính mình
            if (cv.CandidateId != userId)
            {
                throw new UserFriendlyException("Bạn không có quyền cập nhật CV này.");
            }

            // Update template nếu có
            if (input.TemplateId.HasValue)
            {
                var template = await _templateRepository.GetAsync(input.TemplateId.Value);
                if (!template.IsActive)
                {
                    throw new UserFriendlyException("Template này không còn hoạt động.");
                }
                cv.TemplateId = input.TemplateId.Value;
            }

            if (input.CvName != null) cv.CvName = input.CvName;
            if (input.DataJson != null) cv.DataJson = input.DataJson;
            if (input.BlocksJson != null) cv.BlocksJson = input.BlocksJson; // Update blocks structure nếu có
            if (input.Notes != null) cv.Notes = input.Notes;

            // Handle IsPublished
            if (input.IsPublished.HasValue)
            {
                cv.IsPublished = input.IsPublished.Value;
                if (input.IsPublished.Value && cv.PublishedAt == null)
                {
                    cv.PublishedAt = DateTime.UtcNow;
                }
            }

            // Handle IsPublic
            if (input.IsPublic.HasValue)
            {
                cv.IsPublic = input.IsPublic.Value;
            }

            // Handle IsDefault
            if (input.IsDefault.HasValue && input.IsDefault.Value)
            {
                // Bỏ default của các CV khác
                var existingDefault = await _candidateCvRepository.FirstOrDefaultAsync(
                    x => x.CandidateId == userId && x.IsDefault && x.Id != id);
                if (existingDefault != null)
                {
                    existingDefault.IsDefault = false;
                    await _candidateCvRepository.UpdateAsync(existingDefault);
                }
                cv.IsDefault = true;
            }
            else if (input.IsDefault.HasValue && !input.IsDefault.Value)
            {
                cv.IsDefault = false;
            }

            await _candidateCvRepository.UpdateAsync(cv);

            return ObjectMapper.Map<CandidateCv, CandidateCvDto>(cv);
        }

        public async Task DeleteAsync(Guid id)
        {
            var userId = _currentUser.GetId();

            var cv = await _candidateCvRepository.GetAsync(id);

            // Kiểm tra quyền: chỉ có thể xóa CV của chính mình
            if (cv.CandidateId != userId)
            {
                throw new UserFriendlyException("Bạn không có quyền xóa CV này.");
            }

            await _candidateCvRepository.DeleteAsync(id);
        }

        public async Task<CandidateCvDto> GetAsync(Guid id)
        {
            var cv = await _candidateCvRepository.GetAsync(id);
            var dto = ObjectMapper.Map<CandidateCv, CandidateCvDto>(cv);

            // Load template info nếu cần
            var template = await _templateRepository.GetAsync(cv.TemplateId);
            dto.Template = ObjectMapper.Map<CvTemplate, CvTemplateDto>(template);

            return dto;
        }

        public async Task<PagedResultDto<CandidateCvDto>> GetListAsync(GetCandidateCvListDto input)
        {
            var userId = _currentUser.GetId();

            var queryable = await _candidateCvRepository.GetQueryableAsync();

            // Chỉ lấy CV của user hiện tại
            queryable = queryable.Where(x => x.CandidateId == userId);

            // Apply filters
            if (input.TemplateId.HasValue)
            {
                queryable = queryable.Where(x => x.TemplateId == input.TemplateId.Value);
            }

            if (input.IsPublished.HasValue)
            {
                queryable = queryable.Where(x => x.IsPublished == input.IsPublished.Value);
            }

            if (input.IsDefault.HasValue)
            {
                queryable = queryable.Where(x => x.IsDefault == input.IsDefault.Value);
            }

            if (input.IsPublic.HasValue)
            {
                queryable = queryable.Where(x => x.IsPublic == input.IsPublic.Value);
            }

            if (!string.IsNullOrEmpty(input.SearchKeyword))
            {
                queryable = queryable.Where(x => x.CvName.Contains(input.SearchKeyword));
            }

            // Apply sorting
            if (!string.IsNullOrEmpty(input.Sorting))
            {
                // Custom sorting logic nếu cần
            }
            else
            {
                queryable = queryable.OrderByDescending(x => x.CreationTime);
            }

            var totalCount = queryable.Count();
            
            // Apply pagination
            queryable = queryable.Skip(input.SkipCount).Take(input.MaxResultCount);

            var cvs = queryable.ToList();
            
            var dtos = ObjectMapper.Map<System.Collections.Generic.List<CandidateCv>, System.Collections.Generic.List<CandidateCvDto>>(cvs);
            
            return new PagedResultDto<CandidateCvDto>
            {
                TotalCount = totalCount,
                Items = dtos
            };
        }

        public async Task<RenderCvDto> RenderCvAsync(Guid cvId)
        {
            var cv = await _candidateCvRepository.GetAsync(cvId);
            var template = await _templateRepository.GetAsync(cv.TemplateId);

            // Parse JSON data - có thể là CvDataDto hoặc dictionary
            var htmlContent = template.LayoutDefinition;
            
            // Debug: Log để kiểm tra
            _logger.LogInformation("=== RENDER CV DEBUG ===");
            _logger.LogInformation("CV ID: {CvId}", cvId);
            _logger.LogInformation("Template ID: {TemplateId}", cv.TemplateId);
            _logger.LogInformation("DataJson is null: {IsNull}", cv.DataJson == null);
            _logger.LogInformation("DataJson is empty: {IsEmpty}", string.IsNullOrEmpty(cv.DataJson));
            _logger.LogInformation("DataJson length: {Length}", cv.DataJson?.Length ?? 0);
            var dataJsonLength = cv.DataJson?.Length ?? 0;
            var dataJsonPreview = cv.DataJson != null && dataJsonLength > 0 
                ? cv.DataJson.Substring(0, Math.Min(500, dataJsonLength)) 
                : "NULL or EMPTY";
            _logger.LogInformation("DataJson preview: {Preview}", dataJsonPreview);
            _logger.LogInformation("Has loop pattern: {HasLoop}", htmlContent.Contains("{{#foreach workExperiences}}", StringComparison.OrdinalIgnoreCase));

            // Kiểm tra DataJson có null hoặc empty không
            if (string.IsNullOrEmpty(cv.DataJson))
            {
                _logger.LogWarning("WARNING: DataJson is null or empty! Returning template without data replacement.");
                // Trả về template gốc nếu không có data
                cv.HtmlContent = htmlContent;
                await _candidateCvRepository.UpdateAsync(cv);
                
                return new RenderCvDto
                {
                    CvId = cvId,
                    HtmlContent = htmlContent
                };
            }

            CvDataDto? cvData = null;
            try
            {
                // Try parse as CvDataDto first
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true, // Case insensitive để parse dễ hơn
                    Converters = { new GenderJsonConverter() } // Custom converter cho Gender field
                };
                
                cvData = System.Text.Json.JsonSerializer.Deserialize<CvDataDto>(cv.DataJson, options);
                
                if (cvData == null)
                {
                    _logger.LogError("ERROR: cvData is null after deserialization");
                    throw new UserFriendlyException("Không thể parse DataJson. Vui lòng kiểm tra lại format.");
                }
                
                // Debug log
                _logger.LogInformation("PersonalInfo is null: {IsNull}", cvData.PersonalInfo == null);
                if (cvData.PersonalInfo != null)
                {
                    _logger.LogInformation("FullName: {FullName}", cvData.PersonalInfo.FullName ?? "(null)");
                    _logger.LogInformation("Email: {Email}", cvData.PersonalInfo.Email ?? "(null)");
                    _logger.LogInformation("PhoneNumber: {PhoneNumber}", cvData.PersonalInfo.PhoneNumber ?? "(null)");
                    _logger.LogInformation("Address: {Address}", cvData.PersonalInfo.Address ?? "(null)");
                }
                else
                {
                    _logger.LogWarning("WARNING: PersonalInfo is null!");
                }
                _logger.LogInformation("WorkExperiences count: {Count}", cvData.WorkExperiences?.Count ?? 0);
                _logger.LogInformation("Educations count: {Count}", cvData.Educations?.Count ?? 0);
                _logger.LogInformation("CareerObjective: {CareerObjective}", cvData.CareerObjective ?? "(null)");
            }
            catch (Exception ex)
            {
                // Log exception để debug
                _logger.LogError(ex, "ERROR parsing DataJson: {Message}", ex.Message);
                
                // Fallback: Parse as simple dictionary
                try
                {
                    var dataJson = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, object>>(cv.DataJson);
                    if (dataJson != null)
                    {
                        _logger.LogWarning("Falling back to dictionary parsing");
                        foreach (var kvp in dataJson)
                        {
                            var placeholder = "{{" + kvp.Key + "}}";
                            var value = kvp.Value?.ToString() ?? "";
                            htmlContent = htmlContent.Replace(placeholder, EscapeHtml(value));
                        }
                    }
                    
                    // Inject CSS và return (không thể parse đúng nên chỉ replace basic placeholders)
                    if (!string.IsNullOrEmpty(template.Styles))
                    {
                        if (htmlContent.Contains("<head>"))
                        {
                            htmlContent = htmlContent.Replace("<head>", $"<head><style>{template.Styles}</style>");
                        }
                        else if (htmlContent.Contains("</head>"))
                        {
                            htmlContent = htmlContent.Replace("</head>", $"<style>{template.Styles}</style></head>");
                        }
                        else
                        {
                            var styleTag = $"<style>{template.Styles}</style>";
                            htmlContent = styleTag + htmlContent;
                        }
                    }

                    // Lưu snapshot HTML xuống entity để phục vụ cho hybrid model (DataJson + HtmlContent)
                    cv.HtmlContent = htmlContent;
                    await _candidateCvRepository.UpdateAsync(cv);

                    return new RenderCvDto
                    {
                        CvId = cvId,
                        HtmlContent = htmlContent
                    };
                }
                catch (Exception innerEx)
                {
                    // If parsing fails, throw exception
                    var dataJsonErrorPreview = cv.DataJson != null && cv.DataJson.Length > 0 
                        ? cv.DataJson.Substring(0, Math.Min(200, cv.DataJson.Length)) 
                        : "";
                    throw new UserFriendlyException($"Lỗi khi render CV: {innerEx.Message}. DataJson: {dataJsonErrorPreview}...");
                }
            }
            
            // Nếu parse thành công, tiếp tục replace placeholders
            if (cvData != null)
            {
                _logger.LogInformation("=== STARTING PLACEHOLDER REPLACEMENT ===");
                
                // Kiểm tra xem template có phải là HTML document đầy đủ không
                bool isFullHtmlDocument = htmlContent.Contains("<html", StringComparison.OrdinalIgnoreCase) && 
                                         htmlContent.Contains("<body", StringComparison.OrdinalIgnoreCase);
                
                // Kiểm tra xem template có placeholders không
                bool hasAnyPlaceholders = htmlContent.Contains("{{", StringComparison.OrdinalIgnoreCase);
                
                _logger.LogInformation("isFullHtmlDocument: {IsFull}", isFullHtmlDocument);
                _logger.LogInformation("hasAnyPlaceholders: {HasPlaceholders}", hasAnyPlaceholders);
                
                // Nếu template không có placeholders hoặc không phải HTML document đầy đủ, tạo một structure mới
                if (!hasAnyPlaceholders || !isFullHtmlDocument)
                {
                    _logger.LogWarning("Template không có placeholders hoặc không phải HTML document đầy đủ. Tạo structure mới.");
                    htmlContent = GenerateFullCvHtml(cvData, template.Styles);
                    // Đã tạo HTML đầy đủ, không cần tiếp tục replace placeholders
                    cv.HtmlContent = htmlContent;
                    await _candidateCvRepository.UpdateAsync(cv);
                    
                    return new RenderCvDto
                    {
                        CvId = cvId,
                        HtmlContent = htmlContent
                    };
                }
                else
                {
                    // Template có placeholders → replace như bình thường
                    _logger.LogInformation("Template có placeholders và là full HTML document. Bắt đầu replace placeholders...");
                    
                    // Lưu trạng thái ban đầu của template để kiểm tra xem có placeholders không (trước khi replace)
                    var originalTemplate = htmlContent;
                    bool templateHasWorkExpPlaceholder = originalTemplate.Contains("{{#foreach workExperiences}}", StringComparison.OrdinalIgnoreCase) ||
                                                         originalTemplate.Contains("{{workExperiences}}", StringComparison.OrdinalIgnoreCase);
                    bool templateHasEduPlaceholder = originalTemplate.Contains("{{#foreach educations}}", StringComparison.OrdinalIgnoreCase) ||
                                                     originalTemplate.Contains("{{educations}}", StringComparison.OrdinalIgnoreCase);
                    bool templateHasSkillsPlaceholder = originalTemplate.Contains("{{#foreach skills}}", StringComparison.OrdinalIgnoreCase) ||
                                                        originalTemplate.Contains("{{skills}}", StringComparison.OrdinalIgnoreCase);
                    bool templateHasCertificatesPlaceholder = originalTemplate.Contains("{{#foreach certificates}}", StringComparison.OrdinalIgnoreCase) ||
                                                             originalTemplate.Contains("{{certificates}}", StringComparison.OrdinalIgnoreCase);
                    bool templateHasLanguagesPlaceholder = originalTemplate.Contains("{{#foreach languages}}", StringComparison.OrdinalIgnoreCase) ||
                                                          originalTemplate.Contains("{{languages}}", StringComparison.OrdinalIgnoreCase);
                    bool templateHasProjectsPlaceholder = originalTemplate.Contains("{{#foreach projects}}", StringComparison.OrdinalIgnoreCase) ||
                                                         originalTemplate.Contains("{{projects}}", StringComparison.OrdinalIgnoreCase);
                    
                    // Kiểm tra PersonalInfo
                    if (cvData.PersonalInfo == null)
                    {
                        _logger.LogWarning("WARNING: PersonalInfo is null! Creating empty PersonalInfo object.");
                        cvData.PersonalInfo = new PersonalInfoDto();
                    }
                    
                    // Replace personal info placeholders (luôn replace, kể cả khi null)
                    // Sử dụng case-insensitive replace để đảm bảo match với mọi format
                    var personalInfo = cvData.PersonalInfo;
                    var fullNameValue = EscapeHtml(personalInfo?.FullName ?? "");
                    var emailValue = EscapeHtml(personalInfo?.Email ?? "");
                    var phoneValue = EscapeHtml(personalInfo?.PhoneNumber ?? "");
                    var addressValue = EscapeHtml(personalInfo?.Address ?? "");
                    var websiteValue = EscapeHtml(personalInfo?.Website ?? "");
                    var linkedInValue = EscapeHtml(personalInfo?.LinkedIn ?? "");
                    var gitHubValue = EscapeHtml(personalInfo?.GitHub ?? "");
                    var profileImageValue = personalInfo?.ProfileImageUrl ?? "";
                    
                    _logger.LogInformation("Replacing placeholders - FullName: '{FullName}', Email: '{Email}', Phone: '{Phone}', Address: '{Address}'", 
                        fullNameValue, emailValue, phoneValue, addressValue);
                    _logger.LogInformation("Before replace - HTML contains {{personalInfo.fullName}}: {Contains}", 
                        htmlContent.Contains("{{personalInfo.fullName}}", StringComparison.OrdinalIgnoreCase));
                    
                    // Replace với TẤT CẢ các format có thể có (case-insensitive)
                    // Format 1: {{personalInfo.fieldName}}
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalInfo.fullName}}", fullNameValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalInfo.email}}", emailValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalInfo.phoneNumber}}", phoneValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalInfo.address}}", addressValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalInfo.website}}", websiteValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalInfo.linkedIn}}", linkedInValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalInfo.gitHub}}", gitHubValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalInfo.profileImageUrl}}", profileImageValue);
                    
                    // Format 2: {{personalinfo.fieldname}} (lowercase)
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalinfo.fullname}}", fullNameValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalinfo.email}}", emailValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalinfo.phonenumber}}", phoneValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalinfo.address}}", addressValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalinfo.website}}", websiteValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalinfo.linkedin}}", linkedInValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalinfo.github}}", gitHubValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{personalinfo.profileimageurl}}", profileImageValue);
                    
                    // Format 3: {{PERSONALINFO.FIELDNAME}} (UPPERCASE)
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{PERSONALINFO.FULLNAME}}", fullNameValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{PERSONALINFO.EMAIL}}", emailValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{PERSONALINFO.PHONENUMBER}}", phoneValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{PERSONALINFO.ADDRESS}}", addressValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{PERSONALINFO.WEBSITE}}", websiteValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{PERSONALINFO.LINKEDIN}}", linkedInValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{PERSONALINFO.GITHUB}}", gitHubValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{PERSONALINFO.PROFILEIMAGEURL}}", profileImageValue);
                    
                    _logger.LogInformation("After personalInfo replace - HTML contains {{personalInfo.fullName}}: {Contains}", 
                        htmlContent.Contains("{{personalInfo.fullName}}", StringComparison.OrdinalIgnoreCase));
                    _logger.LogInformation("After personalInfo replace - HTML contains {{personalInfo.phoneNumber}}: {Contains}", 
                        htmlContent.Contains("{{personalInfo.phoneNumber}}", StringComparison.OrdinalIgnoreCase));
                    
                    // Debug: Kiểm tra xem có placeholder nào còn lại không
                    if (htmlContent.Contains("{{personalInfo.", StringComparison.OrdinalIgnoreCase) ||
                        htmlContent.Contains("{{personalinfo.", StringComparison.OrdinalIgnoreCase) ||
                        htmlContent.Contains("{{PERSONALINFO.", StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogWarning("WARNING: Some personalInfo placeholders were not replaced!");
                        // Log một số placeholder còn lại để debug
                        var remainingMatches = System.Text.RegularExpressions.Regex.Matches(htmlContent, @"\{\{[^}]+\}\}", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                        if (remainingMatches.Count > 0)
                        {
                            var samplePlaceholders = remainingMatches.Cast<System.Text.RegularExpressions.Match>()
                                .Take(5)
                                .Select(m => m.Value)
                                .ToList();
                            _logger.LogWarning("Sample remaining placeholders: {Placeholders}", string.Join(", ", samplePlaceholders));
                        }
                    }
                    
                    // Date formatting
                    var dateOfBirthValue = "";
                    if (cvData.PersonalInfo?.DateOfBirth.HasValue == true)
                    {
                        dateOfBirthValue = cvData.PersonalInfo.DateOfBirth.Value.ToString("dd/MM/yyyy");
                    }
                    htmlContent = ReplacePlaceholderAllFormats(htmlContent, "dateOfBirth", dateOfBirthValue);

                    // Gender placeholder
                    var genderValue = "";
                    if (cvData.PersonalInfo?.Gender.HasValue == true)
                    {
                        genderValue = cvData.PersonalInfo.Gender.Value ? "Nam" : "Nữ";
                    }
                    htmlContent = ReplacePlaceholderAllFormats(htmlContent, "gender", genderValue);

                    // Replace career objective với mọi format
                    var careerObjValue = EscapeHtml(cvData.CareerObjective ?? "");
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{careerObjective}}", careerObjValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{careerobjective}}", careerObjValue);
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{CAREEROBJECTIVE}}", careerObjValue);

                    // === WORK EXPERIENCES ===
                    // Kiểm tra xem có loop pattern không
                    bool hasLoopPattern = htmlContent.Contains("{{#foreach workExperiences}}", StringComparison.OrdinalIgnoreCase);
                    
                    if (hasLoopPattern)
                    {
                        // Template có loop pattern → dùng loop rendering
                        htmlContent = RenderWorkExperiencesWithTemplate(htmlContent, cvData.WorkExperiences);
                    }
                    else if (htmlContent.Contains("{{workExperiences}}"))
                    {
                        // Template có placeholder đơn giản → replace bằng generated HTML
                        if (cvData.WorkExperiences != null && cvData.WorkExperiences.Any())
                        {
                            var workExpHtml = RenderWorkExperiences(cvData.WorkExperiences);
                            htmlContent = htmlContent.Replace("{{workExperiences}}", workExpHtml);
                        }
                        else
                        {
                            htmlContent = htmlContent.Replace("{{workExperiences}}", "");
                        }
                    }
                    else
                    {
                        // Không có placeholder nào → replace placeholders đơn lẻ nếu có
                        htmlContent = RenderWorkExperiencesWithTemplate(htmlContent, cvData.WorkExperiences);
                    }

                    // === EDUCATIONS ===
                    // Kiểm tra xem có loop pattern không
                    bool hasEduLoopPattern = htmlContent.Contains("{{#foreach educations}}", StringComparison.OrdinalIgnoreCase);
                    
                    if (hasEduLoopPattern)
                    {
                        // Template có loop pattern → dùng loop rendering
                        htmlContent = RenderEducationsWithTemplate(htmlContent, cvData.Educations);
                    }
                    else if (htmlContent.Contains("{{educations}}"))
                    {
                        // Template có placeholder đơn giản → replace bằng generated HTML
                        if (cvData.Educations != null && cvData.Educations.Any())
                        {
                            var educationHtml = RenderEducations(cvData.Educations);
                            htmlContent = htmlContent.Replace("{{educations}}", educationHtml);
                        }
                        else
                        {
                            htmlContent = htmlContent.Replace("{{educations}}", "");
                        }
                    }
                    else
                    {
                        // Không có placeholder nào → replace placeholders đơn lẻ nếu có
                        htmlContent = RenderEducationsWithTemplate(htmlContent, cvData.Educations);
                    }

                    // === SKILLS ===
                    if (htmlContent.Contains("{{skills}}"))
                    {
                        if (cvData.Skills != null && cvData.Skills.Any())
                        {
                            var skillsHtml = RenderSkills(cvData.Skills);
                            htmlContent = htmlContent.Replace("{{skills}}", skillsHtml);
                        }
                        else
                        {
                            htmlContent = htmlContent.Replace("{{skills}}", "");
                        }
                    }
                    else
                    {
                        htmlContent = RenderSkillsWithTemplate(htmlContent, cvData.Skills);
                    }

                    // === PROJECTS ===
                    if (htmlContent.Contains("{{projects}}"))
                    {
                        if (cvData.Projects != null && cvData.Projects.Any())
                        {
                            var projectsHtml = RenderProjects(cvData.Projects);
                            htmlContent = htmlContent.Replace("{{projects}}", projectsHtml);
                        }
                        else
                        {
                            htmlContent = htmlContent.Replace("{{projects}}", "");
                        }
                    }
                    else
                    {
                        htmlContent = RenderProjectsWithTemplate(htmlContent, cvData.Projects);
                    }

                    // === CERTIFICATES ===
                    if (htmlContent.Contains("{{certificates}}"))
                    {
                        if (cvData.Certificates != null && cvData.Certificates.Any())
                        {
                            var certificatesHtml = RenderCertificates(cvData.Certificates);
                            htmlContent = htmlContent.Replace("{{certificates}}", certificatesHtml);
                        }
                        else
                        {
                            htmlContent = htmlContent.Replace("{{certificates}}", "");
                        }
                    }
                    else
                    {
                        htmlContent = RenderCertificatesWithTemplate(htmlContent, cvData.Certificates);
                    }

                    // === LANGUAGES ===
                    if (htmlContent.Contains("{{languages}}"))
                    {
                        if (cvData.Languages != null && cvData.Languages.Any())
                        {
                            var languagesHtml = RenderLanguages(cvData.Languages);
                            htmlContent = htmlContent.Replace("{{languages}}", languagesHtml);
                        }
                        else
                        {
                            htmlContent = htmlContent.Replace("{{languages}}", "");
                        }
                    }
                    else
                    {
                        htmlContent = RenderLanguagesWithTemplate(htmlContent, cvData.Languages);
                    }

                    // Additional info
                    htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, "{{additionalInfo}}", EscapeHtml(cvData.AdditionalInfo ?? ""));
                    
                    // Nếu template KHÔNG có placeholders cho các section (kiểm tra từ originalTemplate), inject HTML vào cuối body
                    // Điều này đảm bảo rằng dữ liệu vẫn được hiển thị ngay cả khi template không có placeholders
                    // NHƯNG chỉ inject nếu template THỰC SỰ không có placeholders (kiểm tra từ originalTemplate, không phải htmlContent đã replace)
                    if (cvData.WorkExperiences != null && cvData.WorkExperiences.Any() && !templateHasWorkExpPlaceholder)
                    {
                        // Template không có placeholder cho work experiences → inject vào cuối body
                        var workExpHtml = RenderWorkExperiences(cvData.WorkExperiences);
                        if (htmlContent.Contains("</body>"))
                        {
                            htmlContent = htmlContent.Replace("</body>", $"<div class='work-experiences-section'>{workExpHtml}</div></body>");
                        }
                        else
                        {
                            htmlContent += $"<div class='work-experiences-section'>{workExpHtml}</div>";
                        }
                    }
                    
                    if (cvData.Educations != null && cvData.Educations.Any() && !templateHasEduPlaceholder)
                    {
                        var educationHtml = RenderEducations(cvData.Educations);
                        if (htmlContent.Contains("</body>"))
                        {
                            htmlContent = htmlContent.Replace("</body>", $"<div class='educations-section'>{educationHtml}</div></body>");
                        }
                        else
                        {
                            htmlContent += $"<div class='educations-section'>{educationHtml}</div>";
                        }
                    }
                    
                    if (cvData.Skills != null && cvData.Skills.Any() && !templateHasSkillsPlaceholder)
                    {
                        var skillsHtml = RenderSkills(cvData.Skills);
                        if (htmlContent.Contains("</body>"))
                        {
                            htmlContent = htmlContent.Replace("</body>", $"<div class='skills-section'>{skillsHtml}</div></body>");
                        }
                        else
                        {
                            htmlContent += $"<div class='skills-section'>{skillsHtml}</div>";
                        }
                    }
                    
                    if (cvData.Projects != null && cvData.Projects.Any() && !templateHasProjectsPlaceholder)
                    {
                        var projectsHtml = RenderProjects(cvData.Projects);
                        if (htmlContent.Contains("</body>"))
                        {
                            htmlContent = htmlContent.Replace("</body>", $"<div class='projects-section'>{projectsHtml}</div></body>");
                        }
                        else
                        {
                            htmlContent += $"<div class='projects-section'>{projectsHtml}</div>";
                        }
                    }
                    
                    if (cvData.Certificates != null && cvData.Certificates.Any() && !templateHasCertificatesPlaceholder)
                    {
                        var certificatesHtml = RenderCertificates(cvData.Certificates);
                        if (htmlContent.Contains("</body>"))
                        {
                            htmlContent = htmlContent.Replace("</body>", $"<div class='certificates-section'>{certificatesHtml}</div></body>");
                        }
                        else
                        {
                            htmlContent += $"<div class='certificates-section'>{certificatesHtml}</div>";
                        }
                    }
                    
                    if (cvData.Languages != null && cvData.Languages.Any() && !templateHasLanguagesPlaceholder)
                    {
                        var languagesHtml = RenderLanguages(cvData.Languages);
                        if (htmlContent.Contains("</body>"))
                        {
                            htmlContent = htmlContent.Replace("</body>", $"<div class='languages-section'>{languagesHtml}</div></body>");
                        }
                        else
                        {
                            htmlContent += $"<div class='languages-section'>{languagesHtml}</div>";
                        }
                    }
                    
                    _logger.LogInformation("=== PLACEHOLDERS REPLACED SUCCESSFULLY ===");
                    
                    // Debug: Kiểm tra xem còn placeholder nào không
                    var remainingPlaceholders = new System.Collections.Generic.List<string>();
                    if (htmlContent.Contains("{{personalInfo.", StringComparison.OrdinalIgnoreCase))
                        remainingPlaceholders.Add("personalInfo.*");
                    if (htmlContent.Contains("{{careerObjective}}", StringComparison.OrdinalIgnoreCase))
                        remainingPlaceholders.Add("careerObjective");
                    if (htmlContent.Contains("{{#foreach", StringComparison.OrdinalIgnoreCase))
                        remainingPlaceholders.Add("foreach loops");
                    
                    if (remainingPlaceholders.Any())
                    {
                        _logger.LogWarning("WARNING: Remaining placeholders: {Placeholders}", string.Join(", ", remainingPlaceholders));
                    }
                    else
                    {
                        _logger.LogInformation("All placeholders replaced successfully!");
                    }
                    
                    // Inject CSS styles vào <head> hoặc đầu HTML
                    if (!string.IsNullOrEmpty(template.Styles))
                    {
                        // Nếu có <head> tag, inject vào đó
                        if (htmlContent.Contains("<head>"))
                        {
                            htmlContent = htmlContent.Replace("<head>", $"<head><style>{template.Styles}</style>");
                        }
                        else if (htmlContent.Contains("</head>"))
                        {
                            htmlContent = htmlContent.Replace("</head>", $"<style>{template.Styles}</style></head>");
                        }
                        else
                        {
                            // Nếu không có <head>, inject vào đầu HTML
                            var styleTag = $"<style>{template.Styles}</style>";
                            htmlContent = styleTag + htmlContent;
                        }
                    }

                    // Debug: Log HTML content preview sau khi replace
                    var htmlPreview = htmlContent.Length > 500 ? htmlContent.Substring(0, 500) : htmlContent;
                    _logger.LogInformation("Final HTML preview (first 500 chars): {Preview}", htmlPreview);
                    
                    // Cập nhật snapshot HTML trên entity để lần sau có thể tái sử dụng
                    cv.HtmlContent = htmlContent;
                    await _candidateCvRepository.UpdateAsync(cv);

                    return new RenderCvDto
                    {
                        CvId = cvId,
                        HtmlContent = htmlContent
                    };
                }
            }
            else
            {
                // cvData == null sau khi parse → tạo HTML mặc định
                htmlContent = GenerateFullCvHtml(new CvDataDto(), template.Styles);
                cv.HtmlContent = htmlContent;
                await _candidateCvRepository.UpdateAsync(cv);
                
                return new RenderCvDto
                {
                    CvId = cvId,
                    HtmlContent = htmlContent
                };
            }
        }

        /// <summary>
        /// Escape HTML để tránh XSS
        /// </summary>
        private string EscapeHtml(string input)
        {
            if (string.IsNullOrEmpty(input)) return "";
            return System.Net.WebUtility.HtmlEncode(input);
        }

        /// <summary>
        /// Replace placeholder với case-insensitive matching - replace TẤT CẢ occurrences
        /// Sử dụng cách đơn giản và chắc chắn: tìm và replace từng occurrence
        /// </summary>
        private string ReplacePlaceholderCaseInsensitive(string htmlContent, string placeholder, string value)
        {
            if (string.IsNullOrEmpty(htmlContent) || string.IsNullOrEmpty(placeholder)) return htmlContent;
            
            // Escape special regex characters trong placeholder để tránh regex injection
            var escapedPlaceholder = System.Text.RegularExpressions.Regex.Escape(placeholder);
            
            // Replace với case-insensitive regex để replace TẤT CẢ occurrences
            // Không escape value vì nó đã được EscapeHtml rồi và chúng ta muốn raw HTML/text
            var result = System.Text.RegularExpressions.Regex.Replace(
                htmlContent,
                escapedPlaceholder,
                value, // Value đã được EscapeHtml rồi, không cần escape thêm
                System.Text.RegularExpressions.RegexOptions.IgnoreCase
            );
            
            return result;
        }
        
        /// <summary>
        /// Replace placeholder với mọi format có thể (personalInfo, personalinfo, PERSONALINFO)
        /// </summary>
        private string ReplacePlaceholderAllFormats(string htmlContent, string fieldName, string value)
        {
            if (string.IsNullOrEmpty(htmlContent) || string.IsNullOrEmpty(fieldName)) return htmlContent;
            
            // Replace với tất cả các format có thể
            var formats = new[]
            {
                $"{{{{personalInfo.{fieldName}}}}}",      // camelCase
                $"{{{{personalinfo.{fieldName.ToLower()}}}}}",  // lowercase
                $"{{{{PERSONALINFO.{fieldName.ToUpper()}}}}}",  // UPPERCASE
                $"{{{{PersonalInfo.{fieldName}}}}}",     // PascalCase
            };
            
            foreach (var format in formats)
            {
                htmlContent = ReplacePlaceholderCaseInsensitive(htmlContent, format, value);
            }
            
            return htmlContent;
        }

        /// <summary>
        /// Tạo HTML document đầy đủ từ cvData khi template không có placeholders
        /// </summary>
        private string GenerateFullCvHtml(CvDataDto cvData, string? templateStyles)
        {
            var html = new System.Text.StringBuilder();
            
            html.AppendLine("<!DOCTYPE html>");
            html.AppendLine("<html lang='vi'>");
            html.AppendLine("<head>");
            html.AppendLine("<meta charset='UTF-8'>");
            html.AppendLine("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
            html.AppendLine("<title>CV</title>");
            
            // Inject template styles nếu có
            if (!string.IsNullOrEmpty(templateStyles))
            {
                html.AppendLine($"<style>{templateStyles}</style>");
            }
            
            // Default styles
            html.AppendLine(@"<style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; background: white; }
                .cv-header { margin-bottom: 30px; }
                .cv-header h1 { font-size: 32px; font-weight: bold; margin: 0 0 10px 0; color: #1f2937; }
                .cv-header .contact-info { font-size: 14px; color: #666; line-height: 1.8; }
                .cv-section { margin-bottom: 30px; }
                .cv-section-title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #1f2937; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #0F83BA; }
                .cv-section-content { margin-top: 15px; }
                .work-experience-item, .education-item, .project-item, .certificate-item { margin-bottom: 20px; }
                .work-experience-item h3, .education-item h3, .project-item h3 { font-size: 16px; font-weight: bold; margin: 0 0 5px 0; color: #1f2937; }
                .date-range { font-size: 14px; color: #666; margin: 5px 0; }
                .skills ul { list-style: none; padding: 0; }
                .skills li { padding: 5px 0; }
            </style>");
            
            html.AppendLine("</head>");
            html.AppendLine("<body>");
            
            // Personal Info Section
            var personalInfo = cvData.PersonalInfo;
            html.AppendLine("<div class='cv-header'>");
            html.AppendLine($"<h1>{EscapeHtml(personalInfo?.FullName ?? "")}</h1>");
            html.AppendLine("<div class='contact-info'>");
            
            if (!string.IsNullOrEmpty(personalInfo?.Email))
                html.AppendLine($"<div>Email: {EscapeHtml(personalInfo.Email)}</div>");
            if (!string.IsNullOrEmpty(personalInfo?.PhoneNumber))
                html.AppendLine($"<div>Phone: {EscapeHtml(personalInfo.PhoneNumber)}</div>");
            if (!string.IsNullOrEmpty(personalInfo?.Address))
                html.AppendLine($"<div>Address: {EscapeHtml(personalInfo.Address)}</div>");
            if (personalInfo?.DateOfBirth.HasValue == true)
                html.AppendLine($"<div>Date of Birth: {personalInfo.DateOfBirth.Value:dd/MM/yyyy}</div>");
            if (personalInfo?.Gender.HasValue == true)
                html.AppendLine($"<div>Gender: {(personalInfo.Gender.Value ? "Nam" : "Nữ")}</div>");
            if (!string.IsNullOrEmpty(personalInfo?.LinkedIn))
                html.AppendLine($"<div>LinkedIn: <a href='{personalInfo.LinkedIn}' target='_blank'>{personalInfo.LinkedIn}</a></div>");
            if (!string.IsNullOrEmpty(personalInfo?.GitHub))
                html.AppendLine($"<div>GitHub: <a href='{personalInfo.GitHub}' target='_blank'>{personalInfo.GitHub}</a></div>");
            if (!string.IsNullOrEmpty(personalInfo?.Website))
                html.AppendLine($"<div>Website: <a href='{personalInfo.Website}' target='_blank'>{personalInfo.Website}</a></div>");
            
            html.AppendLine("</div>");
            html.AppendLine("</div>");
            
            // Career Objective
            if (!string.IsNullOrEmpty(cvData.CareerObjective))
            {
                html.AppendLine("<div class='cv-section'>");
                html.AppendLine("<div class='cv-section-title'>MỤC TIÊU NGHỀ NGHIỆP</div>");
                html.AppendLine("<div class='cv-section-content'>");
                html.AppendLine($"<p>{EscapeHtml(cvData.CareerObjective)}</p>");
                html.AppendLine("</div>");
                html.AppendLine("</div>");
            }
            
            // Work Experiences
            if (cvData.WorkExperiences != null && cvData.WorkExperiences.Any())
            {
                html.AppendLine("<div class='cv-section'>");
                html.AppendLine("<div class='cv-section-title'>KINH NGHIỆM LÀM VIỆC</div>");
                html.AppendLine("<div class='cv-section-content'>");
                html.AppendLine(RenderWorkExperiences(cvData.WorkExperiences));
                html.AppendLine("</div>");
                html.AppendLine("</div>");
            }
            
            // Educations
            if (cvData.Educations != null && cvData.Educations.Any())
            {
                html.AppendLine("<div class='cv-section'>");
                html.AppendLine("<div class='cv-section-title'>HỌC VẤN</div>");
                html.AppendLine("<div class='cv-section-content'>");
                html.AppendLine(RenderEducations(cvData.Educations));
                html.AppendLine("</div>");
                html.AppendLine("</div>");
            }
            
            // Skills
            if (cvData.Skills != null && cvData.Skills.Any())
            {
                html.AppendLine("<div class='cv-section'>");
                html.AppendLine("<div class='cv-section-title'>KỸ NĂNG</div>");
                html.AppendLine("<div class='cv-section-content'>");
                html.AppendLine(RenderSkills(cvData.Skills));
                html.AppendLine("</div>");
                html.AppendLine("</div>");
            }
            
            // Projects
            if (cvData.Projects != null && cvData.Projects.Any())
            {
                html.AppendLine("<div class='cv-section'>");
                html.AppendLine("<div class='cv-section-title'>DỰ ÁN</div>");
                html.AppendLine("<div class='cv-section-content'>");
                html.AppendLine(RenderProjects(cvData.Projects));
                html.AppendLine("</div>");
                html.AppendLine("</div>");
            }
            
            // Certificates
            if (cvData.Certificates != null && cvData.Certificates.Any())
            {
                html.AppendLine("<div class='cv-section'>");
                html.AppendLine("<div class='cv-section-title'>CHỨNG CHỈ</div>");
                html.AppendLine("<div class='cv-section-content'>");
                html.AppendLine(RenderCertificates(cvData.Certificates));
                html.AppendLine("</div>");
                html.AppendLine("</div>");
            }
            
            // Languages
            if (cvData.Languages != null && cvData.Languages.Any())
            {
                html.AppendLine("<div class='cv-section'>");
                html.AppendLine("<div class='cv-section-title'>NGOẠI NGỮ</div>");
                html.AppendLine("<div class='cv-section-content'>");
                html.AppendLine(RenderLanguages(cvData.Languages));
                html.AppendLine("</div>");
                html.AppendLine("</div>");
            }
            
            html.AppendLine("</body>");
            html.AppendLine("</html>");
            
            return html.ToString();
        }

        private string RenderWorkExperiences(List<WorkExperienceDto> workExperiences)
        {
            var html = "<div class='work-experiences'>";
            foreach (var exp in workExperiences)
            {
                html += "<div class='work-experience-item'>";
                html += $"<h3>{exp.CompanyName ?? ""} - {exp.Position ?? ""}</h3>";
                
                if (exp.StartDate.HasValue && exp.EndDate.HasValue)
                {
                    html += $"<p class='date-range'>{exp.StartDate.Value:MM/yyyy} - {(exp.IsCurrentJob == true ? "Hiện tại" : exp.EndDate.Value.ToString("MM/yyyy"))}</p>";
                }
                
                if (!string.IsNullOrEmpty(exp.Description))
                {
                    html += $"<p>{exp.Description}</p>";
                }
                
                if (exp.Achievements != null && exp.Achievements.Any())
                {
                    html += "<ul>";
                    foreach (var achievement in exp.Achievements)
                    {
                        html += $"<li>{achievement}</li>";
                    }
                    html += "</ul>";
                }
                
                html += "</div>";
            }
            html += "</div>";
            return html;
        }

        private string RenderEducations(List<EducationDto> educations)
        {
            var html = "<div class='educations'>";
            foreach (var edu in educations)
            {
                html += "<div class='education-item'>";
                html += $"<h3>{edu.InstitutionName ?? ""}</h3>";
                html += $"<p>{edu.Degree ?? ""} - {edu.Major ?? ""}</p>";
                
                if (edu.StartDate.HasValue && edu.EndDate.HasValue)
                {
                    html += $"<p class='date-range'>{edu.StartDate.Value:MM/yyyy} - {(edu.IsCurrent == true ? "Hiện tại" : edu.EndDate.Value.ToString("MM/yyyy"))}</p>";
                }
                
                if (!string.IsNullOrEmpty(edu.Gpa))
                {
                    html += $"<p>GPA: {edu.Gpa}</p>";
                }
                
                if (!string.IsNullOrEmpty(edu.Description))
                {
                    html += $"<p>{edu.Description}</p>";
                }
                
                html += "</div>";
            }
            html += "</div>";
            return html;
        }

        private string RenderSkills(List<SkillDto> skills)
        {
            var html = "<div class='skills'>";
            html += "<ul>";
            foreach (var skill in skills)
            {
                html += $"<li>{skill.SkillName ?? ""} - {skill.Level ?? ""}</li>";
            }
            html += "</ul>";
            html += "</div>";
            return html;
        }

        private string RenderProjects(List<ProjectDto> projects)
        {
            var html = "<div class='projects'>";
            foreach (var project in projects)
            {
                html += "<div class='project-item'>";
                html += $"<h3>{project.ProjectName ?? ""}</h3>";
                
                if (project.StartDate.HasValue && project.EndDate.HasValue)
                {
                    html += $"<p class='date-range'>{project.StartDate.Value:MM/yyyy} - {project.EndDate.Value.ToString("MM/yyyy")}</p>";
                }
                
                if (!string.IsNullOrEmpty(project.Description))
                {
                    html += $"<p>{project.Description}</p>";
                }
                
                if (!string.IsNullOrEmpty(project.Technologies))
                {
                    html += $"<p><strong>Technologies:</strong> {project.Technologies}</p>";
                }
                
                if (!string.IsNullOrEmpty(project.ProjectUrl))
                {
                    html += $"<p><a href='{project.ProjectUrl}' target='_blank'>{project.ProjectUrl}</a></p>";
                }
                
                html += "</div>";
            }
            html += "</div>";
            return html;
        }

        private string RenderCertificates(List<CertificateDto> certificates)
        {
            var html = "<div class='certificates'>";
            foreach (var cert in certificates)
            {
                html += "<div class='certificate-item'>";
                html += $"<h3>{cert.CertificateName ?? ""}</h3>";
                html += $"<p>{cert.IssuingOrganization ?? ""}</p>";
                
                if (cert.IssueDate.HasValue)
                {
                    html += $"<p class='date'>{cert.IssueDate.Value:MM/yyyy}</p>";
                }
                
                if (!string.IsNullOrEmpty(cert.CredentialId))
                {
                    html += $"<p>Credential ID: {cert.CredentialId}</p>";
                }
                
                html += "</div>";
            }
            html += "</div>";
            return html;
        }

        private string RenderLanguages(List<LanguageDto> languages)
        {
            var html = "<div class='languages'>";
            html += "<ul>";
            foreach (var lang in languages)
            {
                html += $"<li>{lang.LanguageName ?? ""} - {lang.ProficiencyLevel ?? ""}</li>";
            }
            html += "</ul>";
            html += "</div>";
            return html;
        }

        // === Template-based rendering methods (nếu template tự định nghĩa structure) ===

        private string RenderWorkExperiencesWithTemplate(string htmlContent, List<WorkExperienceDto>? workExperiences)
        {
            // Tìm pattern {{#foreach workExperiences}}...{{/foreach}}
            var startPattern = "{{#foreach workExperiences}}";
            var endPattern = "{{/foreach}}";
            
            // Tìm pattern (case-insensitive)
            var startIndex = htmlContent.IndexOf(startPattern, StringComparison.OrdinalIgnoreCase);
            if (startIndex == -1)
            {
                // Thử tìm với pattern khác (có thể có whitespace)
                startIndex = htmlContent.IndexOf("{{#foreach workExperiences", StringComparison.OrdinalIgnoreCase);
            }
            
            if (startIndex == -1)
            {
                // Nếu không có loop pattern, vẫn replace các placeholders đơn lẻ
                if (workExperiences != null && workExperiences.Any())
                {
                    foreach (var exp in workExperiences)
                    {
                        htmlContent = htmlContent.Replace("{{workExperience.companyName}}", EscapeHtml(exp.CompanyName ?? ""));
                        htmlContent = htmlContent.Replace("{{workExperience.position}}", EscapeHtml(exp.Position ?? ""));
                        htmlContent = htmlContent.Replace("{{workExperience.description}}", EscapeHtml(exp.Description ?? ""));
                        
                        if (exp.StartDate.HasValue)
                            htmlContent = htmlContent.Replace("{{workExperience.startDate}}", exp.StartDate.Value.ToString("MM/yyyy"));
                        if (exp.EndDate.HasValue)
                            htmlContent = htmlContent.Replace("{{workExperience.endDate}}", exp.EndDate.Value.ToString("MM/yyyy"));
                        
                        htmlContent = htmlContent.Replace("{{workExperience.dateRange}}", 
                            exp.StartDate.HasValue && exp.EndDate.HasValue 
                                ? $"{exp.StartDate.Value:MM/yyyy} - {(exp.IsCurrentJob == true ? "Hiện tại" : exp.EndDate.Value.ToString("MM/yyyy"))}"
                                : "");
                    }
                }
                else
                {
                    // Replace với empty nếu không có data
                    htmlContent = htmlContent.Replace("{{workExperience.companyName}}", "");
                    htmlContent = htmlContent.Replace("{{workExperience.position}}", "");
                    htmlContent = htmlContent.Replace("{{workExperience.description}}", "");
                    htmlContent = htmlContent.Replace("{{workExperience.startDate}}", "");
                    htmlContent = htmlContent.Replace("{{workExperience.endDate}}", "");
                    htmlContent = htmlContent.Replace("{{workExperience.dateRange}}", "");
                }
                return htmlContent;
            }

            // Tìm vị trí kết thúc của start pattern
            var actualStartIndex = startIndex + startPattern.Length;
            
            // Tìm end pattern từ vị trí sau start pattern
            // Đếm số lượng {{#foreach}} để tìm {{/foreach}} tương ứng (xử lý nested loops)
            var searchStart = actualStartIndex;
            var endIndex = -1;
            var foreachCount = 1;
            
            while (searchStart < htmlContent.Length && foreachCount > 0)
            {
                var nextForeach = htmlContent.IndexOf("{{#foreach", searchStart, StringComparison.OrdinalIgnoreCase);
                var nextEndForeach = htmlContent.IndexOf(endPattern, searchStart, StringComparison.OrdinalIgnoreCase);
                
                if (nextEndForeach == -1)
                {
                    // Không tìm thấy end pattern
                    break;
                }
                
                if (nextForeach != -1 && nextForeach < nextEndForeach)
                {
                    // Có nested foreach → tăng count
                    foreachCount++;
                    searchStart = nextForeach + 1;
                }
                else
                {
                    // Tìm thấy end foreach
                    foreachCount--;
                    if (foreachCount == 0)
                    {
                        endIndex = nextEndForeach;
                        break;
                    }
                    searchStart = nextEndForeach + endPattern.Length;
                }
            }
            
            if (endIndex == -1 || endIndex <= actualStartIndex) 
            {
                // Nếu không tìm thấy end pattern, replace placeholders đơn lẻ
                if (workExperiences != null && workExperiences.Any())
                {
                    foreach (var exp in workExperiences)
                    {
                        htmlContent = htmlContent.Replace("{{workExperience.companyName}}", EscapeHtml(exp.CompanyName ?? ""));
                        htmlContent = htmlContent.Replace("{{workExperience.position}}", EscapeHtml(exp.Position ?? ""));
                        htmlContent = htmlContent.Replace("{{workExperience.description}}", EscapeHtml(exp.Description ?? ""));
                        htmlContent = htmlContent.Replace("{{workExperience.dateRange}}", 
                            exp.StartDate.HasValue && exp.EndDate.HasValue 
                                ? $"{exp.StartDate.Value:MM/yyyy} - {(exp.IsCurrentJob == true ? "Hiện tại" : exp.EndDate.Value.ToString("MM/yyyy"))}"
                                : "");
                    }
                }
                return htmlContent;
            }

            // Lấy template block (phần giữa start và end pattern)
            var templateBlock = htmlContent.Substring(actualStartIndex, endIndex - actualStartIndex);
            var result = new System.Text.StringBuilder();

            if (workExperiences != null && workExperiences.Any())
            {
                foreach (var exp in workExperiences)
                {
                    var itemHtml = templateBlock;
                    // Dùng case-insensitive replace để handle mọi format
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{workExperience.companyName}}", EscapeHtml(exp.CompanyName ?? ""));
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{workExperience.position}}", EscapeHtml(exp.Position ?? ""));
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{workExperience.description}}", EscapeHtml(exp.Description ?? ""));
                    
                    var startDateStr = exp.StartDate.HasValue ? exp.StartDate.Value.ToString("MM/yyyy") : "";
                    var endDateStr = exp.EndDate.HasValue ? exp.EndDate.Value.ToString("MM/yyyy") : "";
                    
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{workExperience.startDate}}", startDateStr);
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{workExperience.endDate}}", endDateStr);
                    
                    var dateRangeStr = exp.StartDate.HasValue && exp.EndDate.HasValue 
                        ? $"{exp.StartDate.Value:MM/yyyy} - {(exp.IsCurrentJob == true ? "Hiện tại" : exp.EndDate.Value.ToString("MM/yyyy"))}"
                        : "";
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{workExperience.dateRange}}", dateRangeStr);

                    // Render achievements
                    var achievementsHtml = "";
                    if (exp.Achievements != null && exp.Achievements.Any())
                    {
                        achievementsHtml = $"<ul>{string.Join("", exp.Achievements.Select(a => $"<li>{EscapeHtml(a)}</li>"))}</ul>";
                    }
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{workExperience.achievements}}", achievementsHtml);

                    result.Append(itemHtml);
                }
            }

            // Replace toàn bộ block (từ start pattern đến end pattern) bằng rendered content
            var fullEndIndex = endIndex + endPattern.Length;
            var fullBlock = htmlContent.Substring(startIndex, fullEndIndex - startIndex);
            return htmlContent.Replace(fullBlock, result.ToString());
        }

        private string RenderEducationsWithTemplate(string htmlContent, List<EducationDto>? educations)
        {
            var startPattern = "{{#foreach educations}}";
            var endPattern = "{{/foreach}}";
            
            // Tìm pattern (case-insensitive)
            var startIndex = htmlContent.IndexOf(startPattern, StringComparison.OrdinalIgnoreCase);
            if (startIndex == -1)
            {
                // Thử tìm với pattern khác (có thể có whitespace)
                startIndex = htmlContent.IndexOf("{{#foreach educations", StringComparison.OrdinalIgnoreCase);
            }
            
            if (startIndex == -1)
            {
                // Nếu không có loop pattern, vẫn replace các placeholders đơn lẻ
                if (educations != null && educations.Any())
                {
                    foreach (var edu in educations)
                    {
                        htmlContent = htmlContent.Replace("{{education.institutionName}}", EscapeHtml(edu.InstitutionName ?? ""));
                        htmlContent = htmlContent.Replace("{{education.degree}}", EscapeHtml(edu.Degree ?? ""));
                        htmlContent = htmlContent.Replace("{{education.major}}", EscapeHtml(edu.Major ?? ""));
                        htmlContent = htmlContent.Replace("{{education.gpa}}", EscapeHtml(edu.Gpa ?? ""));
                        htmlContent = htmlContent.Replace("{{education.description}}", EscapeHtml(edu.Description ?? ""));
                        
                        if (edu.StartDate.HasValue)
                            htmlContent = htmlContent.Replace("{{education.startDate}}", edu.StartDate.Value.ToString("MM/yyyy"));
                        if (edu.EndDate.HasValue)
                            htmlContent = htmlContent.Replace("{{education.endDate}}", edu.EndDate.Value.ToString("MM/yyyy"));
                        
                        htmlContent = htmlContent.Replace("{{education.dateRange}}",
                            edu.StartDate.HasValue && edu.EndDate.HasValue
                                ? $"{edu.StartDate.Value:yyyy} - {(edu.IsCurrent == true ? "Hiện tại" : edu.EndDate.Value.ToString("yyyy"))}"
                                : "");
                    }
                }
                else
                {
                    // Replace với empty nếu không có data
                    htmlContent = htmlContent.Replace("{{education.institutionName}}", "");
                    htmlContent = htmlContent.Replace("{{education.degree}}", "");
                    htmlContent = htmlContent.Replace("{{education.major}}", "");
                    htmlContent = htmlContent.Replace("{{education.gpa}}", "");
                    htmlContent = htmlContent.Replace("{{education.description}}", "");
                    htmlContent = htmlContent.Replace("{{education.startDate}}", "");
                    htmlContent = htmlContent.Replace("{{education.endDate}}", "");
                    htmlContent = htmlContent.Replace("{{education.dateRange}}", "");
                }
                return htmlContent;
            }

            // Tìm vị trí kết thúc của start pattern
            var actualStartIndex = startIndex + startPattern.Length;
            
            // Tìm end pattern từ vị trí sau start pattern (xử lý nested loops)
            var searchStart = actualStartIndex;
            var endIndex = -1;
            var foreachCount = 1;
            
            while (searchStart < htmlContent.Length && foreachCount > 0)
            {
                var nextForeach = htmlContent.IndexOf("{{#foreach", searchStart, StringComparison.OrdinalIgnoreCase);
                var nextEndForeach = htmlContent.IndexOf(endPattern, searchStart, StringComparison.OrdinalIgnoreCase);
                
                if (nextEndForeach == -1)
                {
                    break;
                }
                
                if (nextForeach != -1 && nextForeach < nextEndForeach)
                {
                    foreachCount++;
                    searchStart = nextForeach + 1;
                }
                else
                {
                    foreachCount--;
                    if (foreachCount == 0)
                    {
                        endIndex = nextEndForeach;
                        break;
                    }
                    searchStart = nextEndForeach + endPattern.Length;
                }
            }
            
            if (endIndex == -1 || endIndex <= actualStartIndex) 
            {
                // Nếu không tìm thấy end pattern, replace placeholders đơn lẻ
                if (educations != null && educations.Any())
                {
                    foreach (var edu in educations)
                    {
                        htmlContent = htmlContent.Replace("{{education.institutionName}}", EscapeHtml(edu.InstitutionName ?? ""));
                        htmlContent = htmlContent.Replace("{{education.degree}}", EscapeHtml(edu.Degree ?? ""));
                        htmlContent = htmlContent.Replace("{{education.major}}", EscapeHtml(edu.Major ?? ""));
                        htmlContent = htmlContent.Replace("{{education.dateRange}}",
                            edu.StartDate.HasValue && edu.EndDate.HasValue
                                ? $"{edu.StartDate.Value:yyyy} - {(edu.IsCurrent == true ? "Hiện tại" : edu.EndDate.Value.ToString("yyyy"))}"
                                : "");
                    }
                }
                return htmlContent;
            }

            // Lấy template block (phần giữa start và end pattern)
            var templateBlock = htmlContent.Substring(actualStartIndex, endIndex - actualStartIndex);
            var result = new System.Text.StringBuilder();

            if (educations != null && educations.Any())
            {
                foreach (var edu in educations)
                {
                    var itemHtml = templateBlock;
                    // Dùng case-insensitive replace để handle mọi format
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{education.institutionName}}", EscapeHtml(edu.InstitutionName ?? ""));
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{education.degree}}", EscapeHtml(edu.Degree ?? ""));
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{education.major}}", EscapeHtml(edu.Major ?? ""));
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{education.gpa}}", EscapeHtml(edu.Gpa ?? ""));
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{education.description}}", EscapeHtml(edu.Description ?? ""));
                    
                    var startDateStr = edu.StartDate.HasValue ? edu.StartDate.Value.ToString("MM/yyyy") : "";
                    var endDateStr = edu.EndDate.HasValue ? edu.EndDate.Value.ToString("MM/yyyy") : "";
                    var dateRangeStr = edu.StartDate.HasValue && edu.EndDate.HasValue
                        ? $"{edu.StartDate.Value:yyyy} - {(edu.IsCurrent == true ? "Hiện tại" : edu.EndDate.Value.ToString("yyyy"))}"
                        : "";
                    
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{education.startDate}}", startDateStr);
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{education.endDate}}", endDateStr);
                    itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{education.dateRange}}", dateRangeStr);

                    result.Append(itemHtml);
                }
            }

            // Replace toàn bộ block (từ start pattern đến end pattern) bằng rendered content
            var fullEndIndex = endIndex + endPattern.Length;
            var fullBlock = htmlContent.Substring(startIndex, fullEndIndex - startIndex);
            return htmlContent.Replace(fullBlock, result.ToString());
        }

        private string RenderSkillsWithTemplate(string htmlContent, List<SkillDto>? skills)
        {
            var startPattern = "{{#foreach skills}}";
            var endPattern = "{{/foreach}}";
            
            // Tìm pattern (case-insensitive)
            var startIndex = htmlContent.IndexOf(startPattern, StringComparison.OrdinalIgnoreCase);
            if (startIndex == -1 || skills == null || !skills.Any())
                return htmlContent;

            // Tìm end pattern từ vị trí sau start pattern
            var actualStartIndex = startIndex + startPattern.Length;
            var endIndex = htmlContent.IndexOf(endPattern, actualStartIndex, StringComparison.OrdinalIgnoreCase);
            if (endIndex == -1) return htmlContent;

            var templateBlock = htmlContent.Substring(actualStartIndex, endIndex - actualStartIndex);
            var result = new System.Text.StringBuilder();

            foreach (var skill in skills)
            {
                var itemHtml = templateBlock;
                // Dùng case-insensitive replace để handle mọi format
                itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{skill.skillName}}", EscapeHtml(skill.SkillName ?? ""));
                itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{skill.level}}", EscapeHtml(skill.Level ?? ""));
                itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{skill.category}}", EscapeHtml(skill.Category ?? ""));
                result.Append(itemHtml);
            }

            var fullBlock = htmlContent.Substring(startIndex, endIndex + endPattern.Length - startIndex);
            return htmlContent.Replace(fullBlock, result.ToString());
        }

        private string RenderProjectsWithTemplate(string htmlContent, List<ProjectDto>? projects)
        {
            var startPattern = "{{#foreach projects}}";
            var endPattern = "{{/foreach}}";
            
            var startIndex = htmlContent.IndexOf(startPattern);
            if (startIndex == -1 || projects == null || !projects.Any())
                return htmlContent;

            var endIndex = htmlContent.IndexOf(endPattern, startIndex);
            if (endIndex == -1) return htmlContent;

            var templateBlock = htmlContent.Substring(startIndex + startPattern.Length, endIndex - startIndex - startPattern.Length);
            var result = new System.Text.StringBuilder();

            foreach (var project in projects)
            {
                var itemHtml = templateBlock;
                itemHtml = itemHtml.Replace("{{project.projectName}}", EscapeHtml(project.ProjectName ?? ""));
                itemHtml = itemHtml.Replace("{{project.description}}", EscapeHtml(project.Description ?? ""));
                itemHtml = itemHtml.Replace("{{project.technologies}}", EscapeHtml(project.Technologies ?? ""));
                itemHtml = itemHtml.Replace("{{project.projectUrl}}", project.ProjectUrl ?? "");
                
                if (project.StartDate.HasValue)
                    itemHtml = itemHtml.Replace("{{project.startDate}}", project.StartDate.Value.ToString("MM/yyyy"));
                if (project.EndDate.HasValue)
                    itemHtml = itemHtml.Replace("{{project.endDate}}", project.EndDate.Value.ToString("MM/yyyy"));

                result.Append(itemHtml);
            }

            var fullBlock = htmlContent.Substring(startIndex, endIndex + endPattern.Length - startIndex);
            return htmlContent.Replace(fullBlock, result.ToString());
        }

        private string RenderCertificatesWithTemplate(string htmlContent, List<CertificateDto>? certificates)
        {
            var startPattern = "{{#foreach certificates}}";
            var endPattern = "{{/foreach}}";
            
            // Tìm pattern (case-insensitive)
            var startIndex = htmlContent.IndexOf(startPattern, StringComparison.OrdinalIgnoreCase);
            if (startIndex == -1 || certificates == null || !certificates.Any())
                return htmlContent;

            // Tìm end pattern từ vị trí sau start pattern
            var actualStartIndex = startIndex + startPattern.Length;
            var endIndex = htmlContent.IndexOf(endPattern, actualStartIndex, StringComparison.OrdinalIgnoreCase);
            if (endIndex == -1) return htmlContent;

            var templateBlock = htmlContent.Substring(actualStartIndex, endIndex - actualStartIndex);
            var result = new System.Text.StringBuilder();

            foreach (var cert in certificates)
            {
                var itemHtml = templateBlock;
                // Dùng case-insensitive replace để handle mọi format
                itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{certificate.certificateName}}", EscapeHtml(cert.CertificateName ?? ""));
                itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{certificate.issuingOrganization}}", EscapeHtml(cert.IssuingOrganization ?? ""));
                itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{certificate.credentialId}}", EscapeHtml(cert.CredentialId ?? ""));
                
                var issueDateStr = cert.IssueDate.HasValue ? cert.IssueDate.Value.ToString("MM/yyyy") : "";
                itemHtml = ReplacePlaceholderCaseInsensitive(itemHtml, "{{certificate.issueDate}}", issueDateStr);

                result.Append(itemHtml);
            }

            var fullBlock = htmlContent.Substring(startIndex, endIndex + endPattern.Length - startIndex);
            return htmlContent.Replace(fullBlock, result.ToString());
        }

        private string RenderLanguagesWithTemplate(string htmlContent, List<LanguageDto>? languages)
        {
            var startPattern = "{{#foreach languages}}";
            var endPattern = "{{/foreach}}";
            
            var startIndex = htmlContent.IndexOf(startPattern);
            if (startIndex == -1 || languages == null || !languages.Any())
                return htmlContent;

            var endIndex = htmlContent.IndexOf(endPattern, startIndex);
            if (endIndex == -1) return htmlContent;

            var templateBlock = htmlContent.Substring(startIndex + startPattern.Length, endIndex - startIndex - startPattern.Length);
            var result = new System.Text.StringBuilder();

            foreach (var lang in languages)
            {
                var itemHtml = templateBlock;
                itemHtml = itemHtml.Replace("{{language.languageName}}", EscapeHtml(lang.LanguageName ?? ""));
                itemHtml = itemHtml.Replace("{{language.proficiencyLevel}}", EscapeHtml(lang.ProficiencyLevel ?? ""));
                result.Append(itemHtml);
            }

            var fullBlock = htmlContent.Substring(startIndex, endIndex + endPattern.Length - startIndex);
            return htmlContent.Replace(fullBlock, result.ToString());
        }

        public async Task SetDefaultAsync(Guid cvId)
        {
            var userId = _currentUser.GetId();

            var cv = await _candidateCvRepository.GetAsync(cvId);

            if (cv.CandidateId != userId)
            {
                throw new UserFriendlyException("Bạn không có quyền thực hiện thao tác này.");
            }

            // Bỏ default của các CV khác
            var existingDefault = await _candidateCvRepository.FirstOrDefaultAsync(
                x => x.CandidateId == userId && x.IsDefault && x.Id != cvId);
            if (existingDefault != null)
            {
                existingDefault.IsDefault = false;
                await _candidateCvRepository.UpdateAsync(existingDefault);
            }

            cv.IsDefault = true;
            await _candidateCvRepository.UpdateAsync(cv);
        }

        public async Task PublishAsync(Guid cvId, bool isPublished)
        {
            var userId = _currentUser.GetId();

            var cv = await _candidateCvRepository.GetAsync(cvId);

            if (cv.CandidateId != userId)
            {
                throw new UserFriendlyException("Bạn không có quyền thực hiện thao tác này.");
            }

            cv.IsPublished = isPublished;
            if (isPublished && cv.PublishedAt == null)
            {
                cv.PublishedAt = DateTime.UtcNow;
            }

            await _candidateCvRepository.UpdateAsync(cv);
        }

        public async Task IncrementViewCountAsync(Guid cvId)
        {
            var cv = await _candidateCvRepository.GetAsync(cvId);
            cv.ViewCount++;
            await _candidateCvRepository.UpdateAsync(cv);
        }

        public async Task<CandidateCvDto> GetDefaultCvAsync()
        {
            var userId = _currentUser.GetId();

            var cv = await _candidateCvRepository.FirstOrDefaultAsync(
                x => x.CandidateId == userId && x.IsDefault);

            if (cv == null)
            {
                throw new UserFriendlyException("Không tìm thấy CV mặc định.");
            }

            return ObjectMapper.Map<CandidateCv, CandidateCvDto>(cv);
        }
    }
}

