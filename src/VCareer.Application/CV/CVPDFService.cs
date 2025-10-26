using System;
using System.IO;
using System.Text.Json;
using VCareer.Models.Users;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace VCareer.CV
{
    /// <summary>
    /// Service để generate PDF từ CV Online
    /// </summary>
    public class CVPDFService
    {
        public byte[] GeneratePDF(CurriculumVitae cv)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header()
                        .AlignCenter()
                        .Text(cv.FullName ?? "CV")
                        .FontSize(24)
                        .Bold()
                        .FontColor(Colors.Blue.Darken3);

                    page.Content()
                        .Column(column =>
                        {
                            // Thông tin cá nhân
                            column.Item().Background(Colors.Grey.Lighten3)
                                .Padding(10)
                                .Column(col =>
                                {
                                    col.Item().Text(cv.Email ?? "").FontSize(10);
                                    col.Item().Text(cv.PhoneNumber ?? "").FontSize(10);
                                    if (cv.DateOfBirth.HasValue)
                                    {
                                        col.Item().Text($"Ngày sinh: {cv.DateOfBirth.Value:dd/MM/yyyy}").FontSize(10);
                                    }
                                    col.Item().Text(cv.Address ?? "").FontSize(10);
                                });
                            
                            // Mục tiêu nghề nghiệp
                            if (!string.IsNullOrEmpty(cv.CareerObjective))
                            {
                                column.Item().PaddingTop(10).Column(col =>
                                {
                                    col.Item().Text("Mục tiêu nghề nghiệp").FontSize(14).Bold().FontColor(Colors.Blue.Darken3);
                                    col.Item().Text(cv.CareerObjective ?? "").FontSize(10);
                                });
                            }

                            // Kinh nghiệm làm việc
                            if (!string.IsNullOrEmpty(cv.WorkExperience))
                            {
                                column.Item().PaddingTop(10).Column(col =>
                                {
                                    col.Item().Text("Kinh nghiệm làm việc").FontSize(14).Bold().FontColor(Colors.Blue.Darken3);
                                    
                                    try
                                    {
                                        var experiences = JsonSerializer.Deserialize<WorkExperience[]>(cv.WorkExperience);
                                        if (experiences != null)
                                        {
                                            foreach (var exp in experiences)
                                            {
                                                col.Item().PaddingBottom(5).Column(expCol =>
                                                {
                                                    expCol.Item().Text($"{exp.Company} - {exp.Position}").FontSize(11).Bold();
                                                    expCol.Item().Text($"{exp.StartDate} - {exp.EndDate ?? "Hiện tại"}").FontSize(9).FontColor(Colors.Grey.Medium);
                                                    expCol.Item().Text(exp.Description ?? "").FontSize(10);
                                                });
                                            }
                                        }
                                    }
                                    catch
                                    {
                                        col.Item().Text(cv.WorkExperience).FontSize(10);
                                    }
                                });
                            }

                            // Học vấn
                            if (!string.IsNullOrEmpty(cv.Education))
                            {
                                column.Item().PaddingTop(10).Column(col =>
                                {
                                    col.Item().Text("Học vấn").FontSize(14).Bold().FontColor(Colors.Blue.Darken3);
                                    
                                    try
                                    {
                                        var educations = JsonSerializer.Deserialize<Education[]>(cv.Education);
                                        if (educations != null)
                                        {
                                            foreach (var edu in educations)
                                            {
                                                col.Item().PaddingBottom(5).Column(eduCol =>
                                                {
                                                    eduCol.Item().Text($"{edu.School} - {edu.Degree}").FontSize(11).Bold();
                                                    eduCol.Item().Text($"{edu.StartDate} - {edu.EndDate ?? "Hiện tại"}").FontSize(9).FontColor(Colors.Grey.Medium);
                                                    eduCol.Item().Text(edu.Description ?? "").FontSize(10);
                                                });
                                            }
                                        }
                                    }
                                    catch
                                    {
                                        col.Item().Text(cv.Education).FontSize(10);
                                    }
                                });
                            }

                            // Kỹ năng
                            if (!string.IsNullOrEmpty(cv.Skills))
                            {
                                column.Item().PaddingTop(10).Column(col =>
                                {
                                    col.Item().Text("Kỹ năng").FontSize(14).Bold().FontColor(Colors.Blue.Darken3);
                                    
                                    try
                                    {
                                        var skills = JsonSerializer.Deserialize<Skill[]>(cv.Skills);
                                        if (skills != null)
                                        {
                                            foreach (var skill in skills)
                                            {
                                                col.Item().Text($"• {skill.Name} - {skill.Level}").FontSize(10);
                                            }
                                        }
                                    }
                                    catch
                                    {
                                        col.Item().Text(cv.Skills).FontSize(10);
                                    }
                                });
                            }

                            // Dự án
                            if (!string.IsNullOrEmpty(cv.Projects))
                            {
                                column.Item().PaddingTop(10).Column(col =>
                                {
                                    col.Item().Text("Dự án").FontSize(14).Bold().FontColor(Colors.Blue.Darken3);
                                    
                                    try
                                    {
                                        var projects = JsonSerializer.Deserialize<Project[]>(cv.Projects);
                                        if (projects != null)
                                        {
                                            foreach (var proj in projects)
                                            {
                                                col.Item().PaddingBottom(5).Column(projCol =>
                                                {
                                                    projCol.Item().Text(proj.Name).FontSize(11).Bold();
                                                    projCol.Item().Text(proj.Description ?? "").FontSize(10);
                                                });
                                            }
                                        }
                                    }
                                    catch
                                    {
                                        col.Item().Text(cv.Projects).FontSize(10);
                                    }
                                });
                            }

                            // Chứng chỉ
                            if (!string.IsNullOrEmpty(cv.Certificates))
                            {
                                column.Item().PaddingTop(10).Column(col =>
                                {
                                    col.Item().Text("Chứng chỉ").FontSize(14).Bold().FontColor(Colors.Blue.Darken3);
                                    
                                    try
                                    {
                                        var certificates = JsonSerializer.Deserialize<Certificate[]>(cv.Certificates);
                                        if (certificates != null)
                                        {
                                            foreach (var cert in certificates)
                                            {
                                                col.Item().Text($"• {cert.Name} - {cert.IssueDate}").FontSize(10);
                                            }
                                        }
                                    }
                                    catch
                                    {
                                        col.Item().Text(cv.Certificates).FontSize(10);
                                    }
                                });
                            }

                            // Ngôn ngữ
                            if (!string.IsNullOrEmpty(cv.Languages))
                            {
                                column.Item().PaddingTop(10).Column(col =>
                                {
                                    col.Item().Text("Ngôn ngữ").FontSize(14).Bold().FontColor(Colors.Blue.Darken3);
                                    
                                    try
                                    {
                                        var languages = JsonSerializer.Deserialize<Language[]>(cv.Languages);
                                        if (languages != null)
                                        {
                                            foreach (var lang in languages)
                                            {
                                                col.Item().Text($"• {lang.Name} - {lang.Level}").FontSize(10);
                                            }
                                        }
                                    }
                                    catch
                                    {
                                        col.Item().Text(cv.Languages).FontSize(10);
                                    }
                                });
                            }

                            // Sở thích
                            if (!string.IsNullOrEmpty(cv.Interests))
                            {
                                column.Item().PaddingTop(10).Column(col =>
                                {
                                    col.Item().Text("Sở thích").FontSize(14).Bold().FontColor(Colors.Blue.Darken3);
                                    col.Item().Text(cv.Interests ?? "").FontSize(10);
                                });
                            }
                        });
                });
            });

            return document.GeneratePdf();
        }
    }

    // Helper classes for JSON deserialization
    public class WorkExperience
    {
        public string Company { get; set; }
        public string Position { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public string Description { get; set; }
    }

    public class Education
    {
        public string School { get; set; }
        public string Degree { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public string Description { get; set; }
    }

    public class Skill
    {
        public string Name { get; set; }
        public string Level { get; set; }
    }

    public class Project
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class Certificate
    {
        public string Name { get; set; }
        public string IssueDate { get; set; }
    }

    public class Language
    {
        public string Name { get; set; }
        public string Level { get; set; }
    }
}
