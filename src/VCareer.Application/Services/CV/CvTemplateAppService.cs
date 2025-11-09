using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VCareer.CV;
using VCareer.Models.CV;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using System.Collections.Generic;

namespace VCareer.Services.CV
{
    /// <summary>
    /// Application Service cho CV Template Management
    /// </summary>
    public class CvTemplateAppService : ApplicationService, ICvTemplateAppService
    {
        private readonly IRepository<CvTemplate, Guid> _templateRepository;

        public CvTemplateAppService(
            IRepository<CvTemplate, Guid> templateRepository)
        {
            _templateRepository = templateRepository;
        }

        public async Task<CvTemplateDto> CreateAsync(CreateCvTemplateDto input)
        {
            var template = ObjectMapper.Map<CreateCvTemplateDto, CvTemplate>(input);
            
            await _templateRepository.InsertAsync(template);

            return ObjectMapper.Map<CvTemplate, CvTemplateDto>(template);
        }

        public async Task<CvTemplateDto> UpdateAsync(Guid id, UpdateCvTemplateDto input)
        {
            var template = await _templateRepository.GetAsync(id);

            if (input.Name != null) template.Name = input.Name;
            if (input.Description != null) template.Description = input.Description;
            if (input.PreviewImageUrl != null) template.PreviewImageUrl = input.PreviewImageUrl;
            if (input.LayoutDefinition != null) template.LayoutDefinition = input.LayoutDefinition;
            if (input.Styles != null) template.Styles = input.Styles;
            if (input.SupportedFields != null) template.SupportedFields = input.SupportedFields;
            if (input.Category != null) template.Category = input.Category;
            if (input.SortOrder.HasValue) template.SortOrder = input.SortOrder.Value;
            if (input.IsActive.HasValue) template.IsActive = input.IsActive.Value;
            if (input.IsDefault.HasValue) template.IsDefault = input.IsDefault.Value;
            if (input.IsFree.HasValue) template.IsFree = input.IsFree.Value;
            if (input.Version != null) template.Version = input.Version;

            await _templateRepository.UpdateAsync(template);

            return ObjectMapper.Map<CvTemplate, CvTemplateDto>(template);
        }

        public async Task DeleteAsync(Guid id)
        {
            await _templateRepository.DeleteAsync(id);
        }

        public async Task<CvTemplateDto> GetAsync(Guid id)
        {
            var template = await _templateRepository.GetAsync(id);
            return ObjectMapper.Map<CvTemplate, CvTemplateDto>(template);
        }

        public async Task<PagedResultDto<CvTemplateDto>> GetListAsync(GetCvTemplateListDto input)
        {
            var queryable = await _templateRepository.GetQueryableAsync();

            // Apply filters
            if (!string.IsNullOrEmpty(input.Category))
            {
                queryable = queryable.Where(x => x.Category == input.Category);
            }

            if (input.IsActive.HasValue)
            {
                queryable = queryable.Where(x => x.IsActive == input.IsActive.Value);
            }

            if (input.IsFree.HasValue)
            {
                queryable = queryable.Where(x => x.IsFree == input.IsFree.Value);
            }

            if (!string.IsNullOrEmpty(input.SearchKeyword))
            {
                queryable = queryable.Where(x => 
                    x.Name.Contains(input.SearchKeyword) || 
                    (x.Description != null && x.Description.Contains(input.SearchKeyword)));
            }

            // Apply sorting
            if (!string.IsNullOrEmpty(input.Sorting))
            {
                queryable = queryable.OrderBy(x => x.SortOrder);
            }
            else
            {
                queryable = queryable.OrderBy(x => x.SortOrder).ThenBy(x => x.Name);
            }

            var totalCount = queryable.Count();
            
            // Apply pagination
            queryable = queryable.Skip(input.SkipCount).Take(input.MaxResultCount);

            var templates = queryable.ToList();
            
            return new PagedResultDto<CvTemplateDto>
            {
                TotalCount = totalCount,
                Items = ObjectMapper.Map<System.Collections.Generic.List<CvTemplate>, System.Collections.Generic.List<CvTemplateDto>>(templates)
            };
        }

        public async Task<PagedResultDto<CvTemplateDto>> GetActiveTemplatesAsync(GetCvTemplateListDto input)
        {
            // Override IsActive filter để chỉ lấy active templates
            input.IsActive = true;
            return await GetListAsync(input);
        }

        /// <summary>
        /// Preview template với empty/sample data
        /// Render template với data mẫu hoặc empty để candidate thấy được structure/form
        /// </summary>
        public async Task<RenderCvDto> PreviewTemplateAsync(Guid templateId)
        {
            var template = await _templateRepository.GetAsync(templateId);
            
            if (!template.IsActive)
            {
                throw new UserFriendlyException("Template này không còn hoạt động.");
            }

            var htmlContent = template.LayoutDefinition;

            // Tạo sample data để preview
            var sampleData = new CvDataDto
            {
                PersonalInfo = new PersonalInfoDto
                {
                    FullName = "[Nhập họ tên]",
                    Email = "[Nhập email]",
                    PhoneNumber = "[Nhập số điện thoại]",
                    Address = "[Nhập địa chỉ]",
                    DateOfBirth = DateTime.Now.AddYears(-25),
                    ProfileImageUrl = "",
                    LinkedIn = "",
                    GitHub = "",
                    Website = ""
                },
                CareerObjective = "[Nhập mục tiêu nghề nghiệp]",
                WorkExperiences = new List<WorkExperienceDto>
                {
                    new WorkExperienceDto
                    {
                        CompanyName = "[Tên công ty]",
                        Position = "[Vị trí]",
                        StartDate = DateTime.Now.AddYears(-2),
                        EndDate = DateTime.Now,
                        IsCurrentJob = true,
                        Description = "[Mô tả công việc]",
                        Achievements = new List<string> { "[Thành tích 1]", "[Thành tích 2]" }
                    }
                },
                Educations = new List<EducationDto>
                {
                    new EducationDto
                    {
                        InstitutionName = "[Tên trường]",
                        Degree = "[Bằng cấp]",
                        Major = "[Chuyên ngành]",
                        StartDate = DateTime.Now.AddYears(-4),
                        EndDate = DateTime.Now.AddYears(-1),
                        IsCurrent = false,
                        Gpa = "[GPA]",
                        Description = "[Mô tả]"
                    }
                },
                Skills = new List<SkillDto>
                {
                    new SkillDto { SkillName = "[Kỹ năng]", Level = "[Trình độ]", Category = "Technical" }
                },
                Projects = new List<ProjectDto>(),
                Certificates = new List<CertificateDto>(),
                Languages = new List<LanguageDto>
                {
                    new LanguageDto { LanguageName = "[Ngôn ngữ]", ProficiencyLevel = "[Trình độ]" }
                },
                AdditionalInfo = ""
            };

            // Render với sample data
            htmlContent = RenderTemplateWithData(htmlContent, sampleData, template.Styles);

            return new RenderCvDto
            {
                CvId = Guid.Empty, // Chưa có CV, chỉ preview
                HtmlContent = htmlContent
            };
        }

        /// <summary>
        /// Render template với data (reuse logic từ CandidateCvAppService)
        /// </summary>
        private string RenderTemplateWithData(string htmlContent, CvDataDto cvData, string? styles)
        {
            // Replace personal info placeholders
            if (cvData.PersonalInfo != null)
            {
                htmlContent = htmlContent.Replace("{{personalInfo.fullName}}", EscapeHtml(cvData.PersonalInfo.FullName ?? ""));
                htmlContent = htmlContent.Replace("{{personalInfo.email}}", EscapeHtml(cvData.PersonalInfo.Email ?? ""));
                htmlContent = htmlContent.Replace("{{personalInfo.phoneNumber}}", EscapeHtml(cvData.PersonalInfo.PhoneNumber ?? ""));
                htmlContent = htmlContent.Replace("{{personalInfo.address}}", EscapeHtml(cvData.PersonalInfo.Address ?? ""));
                htmlContent = htmlContent.Replace("{{personalInfo.profileImageUrl}}", cvData.PersonalInfo.ProfileImageUrl ?? "");
                htmlContent = htmlContent.Replace("{{personalInfo.linkedIn}}", cvData.PersonalInfo.LinkedIn ?? "");
                htmlContent = htmlContent.Replace("{{personalInfo.gitHub}}", cvData.PersonalInfo.GitHub ?? "");
                htmlContent = htmlContent.Replace("{{personalInfo.website}}", cvData.PersonalInfo.Website ?? "");
                
                if (cvData.PersonalInfo.DateOfBirth.HasValue)
                {
                    htmlContent = htmlContent.Replace("{{personalInfo.dateOfBirth}}", 
                        cvData.PersonalInfo.DateOfBirth.Value.ToString("dd/MM/yyyy"));
                }
                else
                {
                    htmlContent = htmlContent.Replace("{{personalInfo.dateOfBirth}}", "");
                }
            }

            htmlContent = htmlContent.Replace("{{careerObjective}}", EscapeHtml(cvData.CareerObjective ?? ""));

            // Replace collections - nếu có placeholder đơn giản
            if (htmlContent.Contains("{{workExperiences}}"))
            {
                var workExpHtml = RenderWorkExperiences(cvData.WorkExperiences ?? new List<WorkExperienceDto>());
                htmlContent = htmlContent.Replace("{{workExperiences}}", workExpHtml);
            }
            else
            {
                htmlContent = RenderWorkExperiencesWithTemplate(htmlContent, cvData.WorkExperiences);
            }

            if (htmlContent.Contains("{{educations}}"))
            {
                var educationHtml = RenderEducations(cvData.Educations ?? new List<EducationDto>());
                htmlContent = htmlContent.Replace("{{educations}}", educationHtml);
            }
            else
            {
                htmlContent = RenderEducationsWithTemplate(htmlContent, cvData.Educations);
            }

            if (htmlContent.Contains("{{skills}}"))
            {
                var skillsHtml = RenderSkills(cvData.Skills ?? new List<SkillDto>());
                htmlContent = htmlContent.Replace("{{skills}}", skillsHtml);
            }
            else
            {
                htmlContent = RenderSkillsWithTemplate(htmlContent, cvData.Skills);
            }

            if (htmlContent.Contains("{{projects}}"))
            {
                var projectsHtml = RenderProjects(cvData.Projects ?? new List<ProjectDto>());
                htmlContent = htmlContent.Replace("{{projects}}", projectsHtml);
            }
            else
            {
                htmlContent = RenderProjectsWithTemplate(htmlContent, cvData.Projects);
            }

            if (htmlContent.Contains("{{certificates}}"))
            {
                var certificatesHtml = RenderCertificates(cvData.Certificates ?? new List<CertificateDto>());
                htmlContent = htmlContent.Replace("{{certificates}}", certificatesHtml);
            }
            else
            {
                htmlContent = RenderCertificatesWithTemplate(htmlContent, cvData.Certificates);
            }

            if (htmlContent.Contains("{{languages}}"))
            {
                var languagesHtml = RenderLanguages(cvData.Languages ?? new List<LanguageDto>());
                htmlContent = htmlContent.Replace("{{languages}}", languagesHtml);
            }
            else
            {
                htmlContent = RenderLanguagesWithTemplate(htmlContent, cvData.Languages);
            }

            htmlContent = htmlContent.Replace("{{additionalInfo}}", EscapeHtml(cvData.AdditionalInfo ?? ""));

            // Inject CSS
            if (!string.IsNullOrEmpty(styles))
            {
                if (htmlContent.Contains("<head>"))
                {
                    htmlContent = htmlContent.Replace("<head>", $"<head><style>{styles}</style>");
                }
                else if (htmlContent.Contains("</head>"))
                {
                    htmlContent = htmlContent.Replace("</head>", $"<style>{styles}</style></head>");
                }
                else
                {
                    htmlContent = $"<style>{styles}</style>" + htmlContent;
                }
            }

            return htmlContent;
        }

        private string EscapeHtml(string input)
        {
            if (string.IsNullOrEmpty(input)) return "";
            return System.Net.WebUtility.HtmlEncode(input);
        }

        // Reuse rendering methods from CandidateCvAppService
        // (Copy các methods này hoặc tạo shared helper class)
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
                html += "</div>";
            }
            html += "</div>";
            return html;
        }

        private string RenderSkills(List<SkillDto> skills)
        {
            var html = "<div class='skills'><ul>";
            foreach (var skill in skills)
            {
                html += $"<li>{skill.SkillName ?? ""} - {skill.Level ?? ""}</li>";
            }
            html += "</ul></div>";
            return html;
        }

        private string RenderProjects(List<ProjectDto> projects)
        {
            var html = "<div class='projects'>";
            foreach (var project in projects)
            {
                html += $"<div class='project-item'><h3>{project.ProjectName ?? ""}</h3></div>";
            }
            html += "</div>";
            return html;
        }

        private string RenderCertificates(List<CertificateDto> certificates)
        {
            var html = "<div class='certificates'>";
            foreach (var cert in certificates)
            {
                html += $"<div class='certificate-item'><h3>{cert.CertificateName ?? ""}</h3></div>";
            }
            html += "</div>";
            return html;
        }

        private string RenderLanguages(List<LanguageDto> languages)
        {
            var html = "<div class='languages'><ul>";
            foreach (var lang in languages)
            {
                html += $"<li>{lang.LanguageName ?? ""} - {lang.ProficiencyLevel ?? ""}</li>";
            }
            html += "</ul></div>";
            return html;
        }

        // Template-based rendering (simplified version)
        private string RenderWorkExperiencesWithTemplate(string htmlContent, List<WorkExperienceDto>? workExperiences)
        {
            var startPattern = "{{#foreach workExperiences}}";
            var endPattern = "{{/foreach}}";
            var startIndex = htmlContent.IndexOf(startPattern);
            if (startIndex == -1 || workExperiences == null || !workExperiences.Any())
                return htmlContent;

            var endIndex = htmlContent.IndexOf(endPattern, startIndex);
            if (endIndex == -1) return htmlContent;

            var templateBlock = htmlContent.Substring(startIndex + startPattern.Length, endIndex - startIndex - startPattern.Length);
            var result = new System.Text.StringBuilder();

            foreach (var exp in workExperiences)
            {
                var itemHtml = templateBlock;
                itemHtml = itemHtml.Replace("{{workExperience.companyName}}", EscapeHtml(exp.CompanyName ?? ""));
                itemHtml = itemHtml.Replace("{{workExperience.position}}", EscapeHtml(exp.Position ?? ""));
                itemHtml = itemHtml.Replace("{{workExperience.description}}", EscapeHtml(exp.Description ?? ""));
                if (exp.StartDate.HasValue && exp.EndDate.HasValue)
                {
                    itemHtml = itemHtml.Replace("{{workExperience.dateRange}}", 
                        $"{exp.StartDate.Value:MM/yyyy} - {(exp.IsCurrentJob == true ? "Hiện tại" : exp.EndDate.Value.ToString("MM/yyyy"))}");
                }
                result.Append(itemHtml);
            }

            var fullBlock = htmlContent.Substring(startIndex, endIndex + endPattern.Length - startIndex);
            return htmlContent.Replace(fullBlock, result.ToString());
        }

        private string RenderEducationsWithTemplate(string htmlContent, List<EducationDto>? educations)
        {
            var startPattern = "{{#foreach educations}}";
            var endPattern = "{{/foreach}}";
            var startIndex = htmlContent.IndexOf(startPattern);
            if (startIndex == -1 || educations == null || !educations.Any())
                return htmlContent;

            var endIndex = htmlContent.IndexOf(endPattern, startIndex);
            if (endIndex == -1) return htmlContent;

            var templateBlock = htmlContent.Substring(startIndex + startPattern.Length, endIndex - startIndex - startPattern.Length);
            var result = new System.Text.StringBuilder();

            foreach (var edu in educations)
            {
                var itemHtml = templateBlock;
                itemHtml = itemHtml.Replace("{{education.institutionName}}", EscapeHtml(edu.InstitutionName ?? ""));
                itemHtml = itemHtml.Replace("{{education.degree}}", EscapeHtml(edu.Degree ?? ""));
                itemHtml = itemHtml.Replace("{{education.major}}", EscapeHtml(edu.Major ?? ""));
                result.Append(itemHtml);
            }

            var fullBlock = htmlContent.Substring(startIndex, endIndex + endPattern.Length - startIndex);
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
                result.Append(itemHtml);
            }

            var fullBlock = htmlContent.Substring(startIndex, endIndex + endPattern.Length - startIndex);
            return htmlContent.Replace(fullBlock, result.ToString());
        }
    }
}

