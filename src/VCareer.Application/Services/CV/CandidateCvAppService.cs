using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.CV;
using VCareer.Helpers;
using VCareer.Models.CV;
using VCareer.Models.Users;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace VCareer.Services.CV
{
    /// <summary>
    /// Application Service cho Candidate CV Management
    /// </summary>
    public class CandidateCvAppService : VCareerAppService, ICandidateCvAppService
    {
        private readonly IRepository<CandidateCv, Guid> _candidateCvRepository;
        private readonly IRepository<CvTemplate, Guid> _templateRepository;
        private readonly IRepository<CandidateProfile, Guid> _candidateProfileRepository;
        private readonly TokenClaimsHelper _tokenClaimsHelper;

        public CandidateCvAppService(
            IRepository<CandidateCv, Guid> candidateCvRepository,
            IRepository<CvTemplate, Guid> templateRepository,
            IRepository<CandidateProfile, Guid> candidateProfileRepository,
            TokenClaimsHelper tokenClaimsHelper)
        {
            _candidateCvRepository = candidateCvRepository;
            _templateRepository = templateRepository;
            _candidateProfileRepository = candidateProfileRepository;
            _tokenClaimsHelper = tokenClaimsHelper;
        }

        public async Task<CandidateCvDto> CreateAsync(CreateCandidateCvDto input)
        {
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            
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
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            
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
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            
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
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            
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
            System.Diagnostics.Debug.WriteLine($"=== RENDER CV DEBUG ===");
            System.Diagnostics.Debug.WriteLine($"CV ID: {cvId}");
            System.Diagnostics.Debug.WriteLine($"Template ID: {cv.TemplateId}");
            System.Diagnostics.Debug.WriteLine($"DataJson length: {cv.DataJson?.Length ?? 0}");
            System.Diagnostics.Debug.WriteLine($"Has loop pattern: {htmlContent.Contains("{{#foreach workExperiences}}", StringComparison.OrdinalIgnoreCase)}");

            try
            {
                // Try parse as CvDataDto first
                var options = new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true // Case insensitive để parse dễ hơn
                };
                
                var cvData = System.Text.Json.JsonSerializer.Deserialize<CvDataDto>(cv.DataJson, options);
                
                if (cvData == null)
                {
                    throw new UserFriendlyException("Không thể parse DataJson. Vui lòng kiểm tra lại format.");
                }
                
                // Debug log
                System.Diagnostics.Debug.WriteLine($"PersonalInfo is null: {cvData.PersonalInfo == null}");
                if (cvData.PersonalInfo != null)
                {
                    System.Diagnostics.Debug.WriteLine($"FullName: {cvData.PersonalInfo.FullName}");
                    System.Diagnostics.Debug.WriteLine($"Email: {cvData.PersonalInfo.Email}");
                }
                System.Diagnostics.Debug.WriteLine($"WorkExperiences count: {cvData.WorkExperiences?.Count ?? 0}");
                System.Diagnostics.Debug.WriteLine($"Educations count: {cvData.Educations?.Count ?? 0}");
                
                // Replace personal info placeholders (luôn replace, kể cả khi null)
                var personalInfo = cvData.PersonalInfo;
                var fullNameValue = EscapeHtml(personalInfo?.FullName ?? "");
                System.Diagnostics.Debug.WriteLine($"Replacing {{personalInfo.fullName}} with: {fullNameValue}");
                htmlContent = htmlContent.Replace("{{personalInfo.fullName}}", fullNameValue);
                htmlContent = htmlContent.Replace("{{personalInfo.email}}", EscapeHtml(personalInfo?.Email ?? ""));
                htmlContent = htmlContent.Replace("{{personalInfo.phoneNumber}}", EscapeHtml(personalInfo?.PhoneNumber ?? ""));
                htmlContent = htmlContent.Replace("{{personalInfo.address}}", EscapeHtml(personalInfo?.Address ?? ""));
                htmlContent = htmlContent.Replace("{{personalInfo.profileImageUrl}}", personalInfo?.ProfileImageUrl ?? "");
                htmlContent = htmlContent.Replace("{{personalInfo.linkedIn}}", personalInfo?.LinkedIn ?? "");
                htmlContent = htmlContent.Replace("{{personalInfo.gitHub}}", personalInfo?.GitHub ?? "");
                htmlContent = htmlContent.Replace("{{personalInfo.website}}", personalInfo?.Website ?? "");
                
                // Date formatting
                if (cvData.PersonalInfo?.DateOfBirth.HasValue == true)
                {
                    htmlContent = htmlContent.Replace("{{personalInfo.dateOfBirth}}", 
                        cvData.PersonalInfo.DateOfBirth.Value.ToString("dd/MM/yyyy"));
                }
                else
                {
                    htmlContent = htmlContent.Replace("{{personalInfo.dateOfBirth}}", "");
                }

                // Gender placeholder
                htmlContent = htmlContent.Replace("{{personalInfo.gender}}", "");

                // Replace career objective
                htmlContent = htmlContent.Replace("{{careerObjective}}", EscapeHtml(cvData.CareerObjective ?? ""));

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
                htmlContent = htmlContent.Replace("{{additionalInfo}}", EscapeHtml(cvData.AdditionalInfo ?? ""));
            }
            catch (Exception ex)
            {
                // Log exception để debug
                // Fallback: Parse as simple dictionary
                try
                {
                    var dataJson = System.Text.Json.JsonSerializer.Deserialize<System.Collections.Generic.Dictionary<string, object>>(cv.DataJson);
                    if (dataJson != null)
                    {
                        foreach (var kvp in dataJson)
                        {
                            var placeholder = "{{" + kvp.Key + "}}";
                            var value = kvp.Value?.ToString() ?? "";
                            htmlContent = htmlContent.Replace(placeholder, EscapeHtml(value));
                        }
                    }
                }
                catch
                {
                    // If parsing fails, just use empty string
                    // Throw để biết lỗi gì
                    throw new UserFriendlyException($"Lỗi khi render CV: {ex.Message}. DataJson: {cv.DataJson.Substring(0, Math.Min(200, cv.DataJson.Length))}...");
                }
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

            return new RenderCvDto
            {
                CvId = cvId,
                HtmlContent = htmlContent
            };
        }

        /// <summary>
        /// Escape HTML để tránh XSS
        /// </summary>
        private string EscapeHtml(string input)
        {
            if (string.IsNullOrEmpty(input)) return "";
            return System.Net.WebUtility.HtmlEncode(input);
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
                    itemHtml = itemHtml.Replace("{{workExperience.companyName}}", EscapeHtml(exp.CompanyName ?? ""));
                    itemHtml = itemHtml.Replace("{{workExperience.position}}", EscapeHtml(exp.Position ?? ""));
                    itemHtml = itemHtml.Replace("{{workExperience.description}}", EscapeHtml(exp.Description ?? ""));
                    
                    if (exp.StartDate.HasValue)
                        itemHtml = itemHtml.Replace("{{workExperience.startDate}}", exp.StartDate.Value.ToString("MM/yyyy"));
                    else
                        itemHtml = itemHtml.Replace("{{workExperience.startDate}}", "");
                        
                    if (exp.EndDate.HasValue)
                        itemHtml = itemHtml.Replace("{{workExperience.endDate}}", exp.EndDate.Value.ToString("MM/yyyy"));
                    else
                        itemHtml = itemHtml.Replace("{{workExperience.endDate}}", "");
                    
                    itemHtml = itemHtml.Replace("{{workExperience.dateRange}}", 
                        exp.StartDate.HasValue && exp.EndDate.HasValue 
                            ? $"{exp.StartDate.Value:MM/yyyy} - {(exp.IsCurrentJob == true ? "Hiện tại" : exp.EndDate.Value.ToString("MM/yyyy"))}"
                            : "");

                    // Render achievements
                    if (exp.Achievements != null && exp.Achievements.Any())
                    {
                        var achievementsHtml = string.Join("", exp.Achievements.Select(a => $"<li>{EscapeHtml(a)}</li>"));
                        itemHtml = itemHtml.Replace("{{workExperience.achievements}}", $"<ul>{achievementsHtml}</ul>");
                    }
                    else
                    {
                        itemHtml = itemHtml.Replace("{{workExperience.achievements}}", "");
                    }

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
                    itemHtml = itemHtml.Replace("{{education.institutionName}}", EscapeHtml(edu.InstitutionName ?? ""));
                    itemHtml = itemHtml.Replace("{{education.degree}}", EscapeHtml(edu.Degree ?? ""));
                    itemHtml = itemHtml.Replace("{{education.major}}", EscapeHtml(edu.Major ?? ""));
                    itemHtml = itemHtml.Replace("{{education.gpa}}", EscapeHtml(edu.Gpa ?? ""));
                    itemHtml = itemHtml.Replace("{{education.description}}", EscapeHtml(edu.Description ?? ""));
                    
                    if (edu.StartDate.HasValue)
                        itemHtml = itemHtml.Replace("{{education.startDate}}", edu.StartDate.Value.ToString("MM/yyyy"));
                    else
                        itemHtml = itemHtml.Replace("{{education.startDate}}", "");
                        
                    if (edu.EndDate.HasValue)
                        itemHtml = itemHtml.Replace("{{education.endDate}}", edu.EndDate.Value.ToString("MM/yyyy"));
                    else
                        itemHtml = itemHtml.Replace("{{education.endDate}}", "");
                    
                    itemHtml = itemHtml.Replace("{{education.dateRange}}",
                        edu.StartDate.HasValue && edu.EndDate.HasValue
                            ? $"{edu.StartDate.Value:yyyy} - {(edu.IsCurrent == true ? "Hiện tại" : edu.EndDate.Value.ToString("yyyy"))}"
                            : "");

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
            
            var startIndex = htmlContent.IndexOf(startPattern);
            if (startIndex == -1 || skills == null || !skills.Any())
                return htmlContent;

            var endIndex = htmlContent.IndexOf(endPattern, startIndex);
            if (endIndex == -1) return htmlContent;

            var templateBlock = htmlContent.Substring(startIndex + startPattern.Length, endIndex - startIndex - startPattern.Length);
            var result = new System.Text.StringBuilder();

            foreach (var skill in skills)
            {
                var itemHtml = templateBlock;
                itemHtml = itemHtml.Replace("{{skill.skillName}}", EscapeHtml(skill.SkillName ?? ""));
                itemHtml = itemHtml.Replace("{{skill.level}}", EscapeHtml(skill.Level ?? ""));
                itemHtml = itemHtml.Replace("{{skill.category}}", EscapeHtml(skill.Category ?? ""));
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
            
            var startIndex = htmlContent.IndexOf(startPattern);
            if (startIndex == -1 || certificates == null || !certificates.Any())
                return htmlContent;

            var endIndex = htmlContent.IndexOf(endPattern, startIndex);
            if (endIndex == -1) return htmlContent;

            var templateBlock = htmlContent.Substring(startIndex + startPattern.Length, endIndex - startIndex - startPattern.Length);
            var result = new System.Text.StringBuilder();

            foreach (var cert in certificates)
            {
                var itemHtml = templateBlock;
                itemHtml = itemHtml.Replace("{{certificate.certificateName}}", EscapeHtml(cert.CertificateName ?? ""));
                itemHtml = itemHtml.Replace("{{certificate.issuingOrganization}}", EscapeHtml(cert.IssuingOrganization ?? ""));
                itemHtml = itemHtml.Replace("{{certificate.credentialId}}", EscapeHtml(cert.CredentialId ?? ""));
                
                if (cert.IssueDate.HasValue)
                    itemHtml = itemHtml.Replace("{{certificate.issueDate}}", cert.IssueDate.Value.ToString("MM/yyyy"));

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
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            
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
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            
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
            var userId = _tokenClaimsHelper.GetUserIdFromTokenOrThrow();
            
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

