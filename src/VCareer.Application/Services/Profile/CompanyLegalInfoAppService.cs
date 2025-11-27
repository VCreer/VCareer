using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VCareer.Dto.Profile;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IRepositories.Job;
using VCareer.IRepositories.Profile;
using VCareer.IServices.IProfileServices;
using VCareer.Models.Companies;
using VCareer.Permission;
using VCareer.Permissions;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Volo.Abp.Validation;

namespace VCareer.Services.Profile
{
    //  [Authorize(VCareerPermission.Profile.Default)]
    public class CompanyLegalInfoAppService : VCareerAppService, ICompanyLegalInfoAppService
    {
        private readonly ICompanyRepository _companyRepository;
        private readonly ICurrentUser _currentUser;
        private readonly IJobPostRepository _jobPostRepository;
        private readonly IRecruiterRepository _recruiterRepository;

        public CompanyLegalInfoAppService(
            ICompanyRepository companyRepository,
            ICurrentUser currentUser,
            IJobPostRepository jobPostRepository,
            IRecruiterRepository recruiterRepository)
        {
            _companyRepository = companyRepository;
            _currentUser = currentUser;
            _jobPostRepository = jobPostRepository;
            _recruiterRepository = recruiterRepository;
        }


        [Authorize(VCareerPermission.Profile.SubmitLegalInformation)]
        public async Task<CompanyLegalInfoDto> SubmitCompanyLegalInfoAsync(SubmitCompanyLegalInfoDto input)
        {
            // Check if tax code already exists
            var existingTaxCode = await _companyRepository.FirstOrDefaultAsync(
                x => x.TaxCode == input.TaxCode);

            if (existingTaxCode != null)
            {
                throw new UserFriendlyException("Tax code already exists.");
            }

            // Check if business license number already exists
            var existingLicense = await _companyRepository.FirstOrDefaultAsync(
                x => x.BusinessLicenseNumber == input.BusinessLicenseNumber);

            if (existingLicense != null)
            {
                throw new UserFriendlyException("Business license number already exists.");
            }

            var company = new Company
            {
                CompanyName = input.CompanyName,
                CompanyCode = input.CompanyCode ?? Guid.NewGuid().ToString("N")[..8].ToUpper(),
                VerificationStatus = false,
                Description = input.Description,
                HeadquartersAddress = input.HeadquartersAddress,
                ContactEmail = input.ContactEmail,
                ContactPhone = input.ContactPhone,
                Status = true,
                CompanySize = input.CompanySize,
                IndustryId = input.IndustryId,
                FoundedYear = input.FoundedYear,

                // Legal Information fields
                TaxCode = input.TaxCode,
                BusinessLicenseNumber = input.BusinessLicenseNumber,
                BusinessLicenseIssueDate = input.BusinessLicenseIssueDate,
                BusinessLicenseIssuePlace = input.BusinessLicenseIssuePlace,
                LegalRepresentative = input.LegalRepresentative,
                BusinessLicenseFile = input.BusinessLicenseFile,
                TaxCertificateFile = input.TaxCertificateFile,
                RepresentativeIdCardFile = input.RepresentativeIdCardFile,
                OtherSupportFile = input.OtherSupportFile,
                LegalVerificationStatus = "pending"
            };

            await _companyRepository.InsertAsync(company);

            return ObjectMapper.Map<Company, CompanyLegalInfoDto>(company);
        }




        [Authorize(VCareerPermission.Profile.UpdateLegalInformation)]
        public async Task<CompanyLegalInfoDto> UpdateCompanyLegalInfoAsync(int id, UpdateCompanyLegalInfoDto input)
        {
            var company = await _companyRepository.GetAsync(id);

            if (company.LegalVerificationStatus == "approved")
            {
                throw new UserFriendlyException("Cannot update approved company legal information. Please contact support.");
            }

            // Check if tax code already exists (excluding current record)
            var existingTaxCode = await _companyRepository.FirstOrDefaultAsync(
                x => x.TaxCode == input.TaxCode && x.Id != id);

            if (existingTaxCode != null)
            {
                throw new UserFriendlyException("Tax code already exists.");
            }

            // Check if business license number already exists (excluding current record)
            var existingLicense = await _companyRepository.FirstOrDefaultAsync(
                x => x.BusinessLicenseNumber == input.BusinessLicenseNumber && x.Id != id);

            if (existingLicense != null)
            {
                throw new UserFriendlyException("Business license number already exists.");
            }

            // Update company information
            company.CompanyName = input.CompanyName;
            company.CompanyCode = input.CompanyCode;
            company.Description = input.Description;
            company.HeadquartersAddress = input.HeadquartersAddress;
            company.ContactEmail = input.ContactEmail;
            company.ContactPhone = input.ContactPhone;
            company.CompanySize = input.CompanySize;
            company.IndustryId = input.IndustryId;
            company.FoundedYear = input.FoundedYear;

            // Update legal information
            company.TaxCode = input.TaxCode;
            company.BusinessLicenseNumber = input.BusinessLicenseNumber;
            company.BusinessLicenseIssueDate = input.BusinessLicenseIssueDate;
            company.BusinessLicenseIssuePlace = input.BusinessLicenseIssuePlace;
            company.LegalRepresentative = input.LegalRepresentative;
            company.BusinessLicenseFile = input.BusinessLicenseFile;
            company.TaxCertificateFile = input.TaxCertificateFile;
            company.RepresentativeIdCardFile = input.RepresentativeIdCardFile;
            company.OtherSupportFile = input.OtherSupportFile;
            company.LegalVerificationStatus = "pending"; // Reset status to pending

            await _companyRepository.UpdateAsync(company);

            return ObjectMapper.Map<Company, CompanyLegalInfoDto>(company);
        }





        public async Task<CompanyLegalInfoDto> GetCompanyLegalInfoAsync(int id)
        {
            var company = await _companyRepository.GetAsync(id);
            return ObjectMapper.Map<Company, CompanyLegalInfoDto>(company);
        }




        public async Task<CompanyLegalInfoDto> GetCurrentUserCompanyLegalInfoAsync()
        {
            // In real scenario, you would get company from current user's profile
            // For now, we'll get the first company (this should be improved)
            var companies = await _companyRepository.GetListAsync();
            var company = companies.FirstOrDefault();

            if (company == null)
            {
                throw new UserFriendlyException("No company legal information found for current user.");
            }

            return ObjectMapper.Map<Company, CompanyLegalInfoDto>(company);
        }





        public async Task<List<CompanyLegalInfoDto>> GetCurrentUserCompanyLegalInfoListAsync()
        {
            // In real scenario, you would filter by current user
            // For now, we'll get all companies (this should be improved)
            var companies = await _companyRepository.GetListAsync();
            return ObjectMapper.Map<List<Company>, List<CompanyLegalInfoDto>>(companies);
        }






        [Authorize(VCareerPermission.Profile.DeleteSupportingDocument)]
        public async Task DeleteCompanyLegalInfoAsync(int id)
        {
            var company = await _companyRepository.GetAsync(id);

            if (company.LegalVerificationStatus == "approved")
            {
                throw new UserFriendlyException("Cannot delete approved company legal information. Please contact support.");
            }

            // Clear legal information fields instead of deleting the company
            company.TaxCode = null;
            company.BusinessLicenseNumber = null;
            company.BusinessLicenseIssueDate = null;
            company.BusinessLicenseIssuePlace = null;
            company.LegalRepresentative = null;
            company.BusinessLicenseFile = null;
            company.TaxCertificateFile = null;
            company.RepresentativeIdCardFile = null;
            company.OtherSupportFile = null;
            company.LegalVerificationStatus = null;
            company.LegalReviewedBy = null;
            company.LegalReviewedAt = null;

            await _companyRepository.UpdateAsync(company);
        }



        [Authorize(VCareerPermission.Profile.UpdateLegalInformation)]
        public async Task<CompanyLegalInfoDto> UpdateFileUrlsAsync(int id, string businessLicenseFile = null,
            string taxCertificateFile = null, string representativeIdCardFile = null, string otherSupportFile = null)
        {
            var company = await _companyRepository.GetAsync(id);

            if (company.LegalVerificationStatus == "approved")
            {
                throw new UserFriendlyException("Cannot update approved company legal information. Please contact support.");
            }

            // Update only the provided file URLs
            if (!string.IsNullOrEmpty(businessLicenseFile))
                company.BusinessLicenseFile = businessLicenseFile;

            if (!string.IsNullOrEmpty(taxCertificateFile))
                company.TaxCertificateFile = taxCertificateFile;

            if (!string.IsNullOrEmpty(representativeIdCardFile))
                company.RepresentativeIdCardFile = representativeIdCardFile;

            if (!string.IsNullOrEmpty(otherSupportFile))
                company.OtherSupportFile = otherSupportFile;

            company.LegalVerificationStatus = "pending"; // Reset status to pending

            await _companyRepository.UpdateAsync(company);

            return ObjectMapper.Map<Company, CompanyLegalInfoDto>(company);
        }




        /// <summary>
        /// Lấy thông tin công ty theo Job ID (để hiển thị trong trang job detail)
        /// </summary>
        public async Task<CompanyInfoForJobDetailDto> GetCompanyByJobIdAsync(Guid jobId)
        {
            // Sử dụng repository để lấy company với đầy đủ thông tin industries
            var job = await _jobPostRepository.GetAsync(jobId);
            var company = await _companyRepository.FindAsync(c=>c.Id==job.CompanyId );

            if (company == null)
            {
                throw new UserFriendlyException("Không tìm thấy công ty cho job này.");
            }

            // Map sang DTO và lấy danh sách industries
            var dto = new CompanyInfoForJobDetailDto
            {
                Id = company.Id,
                CompanyName = company.CompanyName,
                LogoUrl = company.LogoUrl,
                CompanySize = company.CompanySize,
                HeadquartersAddress = company.HeadquartersAddress,
                Industries = company.CompanyIndustries?
                    .Select(ci => ci.Industry?.Name)
                    .Where(name => !string.IsNullOrEmpty(name))
                    .ToList() ?? new List<string>()
            };

            return dto;
        }

        /// <summary>
        /// Tìm kiếm danh sách công ty (public API)
        /// Application Service chỉ gọi repository và map kết quả
        /// </summary>
        public async Task<PagedResultDto<CompanyLegalInfoDto>> SearchCompaniesAsync(CompanySearchInputDto input)
        {
            /*   // PagedAndSortedResultRequestDto có SkipCount và MaxResultCount là int (non-nullable)
               // Nếu chưa được set, sẽ có giá trị mặc định là 0, cần xử lý
               var skipCount = input.SkipCount > 0 ? input.SkipCount : 0;
               var maxResultCount = input.MaxResultCount > 0 ? input.MaxResultCount : 10;

               // Gọi repository để thực hiện query (logic query ở Repository layer)
               var result = await _companyCustomRepository.SearchCompaniesAsync(
                   keyword: input.Keyword,
                   status: input.Status,
                   skipCount: skipCount,
                   maxResultCount: maxResultCount,
                   sorting: input.Sorting
               );

               // Map sang DTO (Application Service chỉ làm việc với mapping)
               var dtos = ObjectMapper.Map<List<Company>, List<CompanyLegalInfoDto>>(result.Companies);

               return new PagedResultDto<CompanyLegalInfoDto>
               {
                   TotalCount = result.TotalCount,
                   Items = dtos
               };*/
            throw new  NotImplementedException();
        }

        /// <summary>
        /// Lấy danh sách công ty chờ xác thực (chỉ Employee/Admin)
        /// </summary>
        [Authorize]
        public async Task<PagedResultDto<CompanyVerificationViewDto>> GetPendingCompaniesAsync(CompanyVerificationFilterDto input)
        {
            var queryable = await _companyRepository.GetQueryableAsync();
            
            // Lọc các công ty có status = "pending"
            queryable = queryable.Where(c => c.LegalVerificationStatus == "pending");

            // Filter by keyword
            if (!string.IsNullOrWhiteSpace(input.Keyword))
            {
                var keyword = input.Keyword.ToLower();
                queryable = queryable.Where(c => 
                    (c.CompanyName != null && c.CompanyName.ToLower().Contains(keyword)) ||
                    (c.CompanyCode != null && c.CompanyCode.ToLower().Contains(keyword)) ||
                    (c.ContactEmail != null && c.ContactEmail.ToLower().Contains(keyword)) ||
                    (c.TaxCode != null && c.TaxCode.ToLower().Contains(keyword))
                );
            }

            // Filter by date range
            if (input.CreatedFrom.HasValue)
            {
                queryable = queryable.Where(c => c.CreationTime >= input.CreatedFrom.Value);
            }
            if (input.CreatedTo.HasValue)
            {
                queryable = queryable.Where(c => c.CreationTime <= input.CreatedTo.Value);
            }

            // Sorting
            if (!string.IsNullOrWhiteSpace(input.Sorting))
            {
                if (input.Sorting.Contains("CreationTime", StringComparison.OrdinalIgnoreCase))
                {
                    if (input.Sorting.Contains("desc", StringComparison.OrdinalIgnoreCase))
                        queryable = queryable.OrderByDescending(c => c.CreationTime);
                    else
                        queryable = queryable.OrderBy(c => c.CreationTime);
                }
            }
            else
            {
                // Default sort by creation time descending
                queryable = queryable.OrderByDescending(c => c.CreationTime);
            }

            var totalCount = await queryable.CountAsync();

            // Pagination
            var skipCount = input.SkipCount > 0 ? input.SkipCount : 0;
            var maxResultCount = input.MaxResultCount > 0 ? input.MaxResultCount : 10;
            var companies = await queryable
                .Skip(skipCount)
                .Take(maxResultCount)
                .ToListAsync();

            // Load all recruiters for these companies in one query
            var companyIds = companies.Select(c => c.Id).ToList();
            var recruiterQueryable = await _recruiterRepository.WithDetailsAsync(r => r.User);
            var recruiters = recruiterQueryable
                .Where(r => companyIds.Contains(r.CompanyId) && r.IsLead)
                .ToList();

            // Create a dictionary for quick lookup
            var recruiterDict = recruiters
                .GroupBy(r => r.CompanyId)
                .ToDictionary(g => g.Key, g => g.FirstOrDefault());

            // Map to DTOs and get recruiter info
            var dtos = new List<CompanyVerificationViewDto>();
            foreach (var company in companies)
            {
                var dto = ObjectMapper.Map<Company, CompanyVerificationViewDto>(company);
                
                // Get recruiter from dictionary
                if (recruiterDict.TryGetValue(company.Id, out var recruiter) && recruiter != null)
                {
                    dto.RecruiterEmail = recruiter.Email;
                    if (recruiter.User != null)
                    {
                        dto.RecruiterName = $"{recruiter.User.Name} {recruiter.User.Surname}".Trim();
                    }
                    else
                    {
                        dto.RecruiterName = recruiter.Email?.Split('@')[0] ?? "Recruiter";
                    }
                }
                dtos.Add(dto);
            }

            return new PagedResultDto<CompanyVerificationViewDto>
            {
                TotalCount = totalCount,
                Items = dtos
            };
        }

        /// <summary>
        /// Duyệt công ty (chỉ Employee/Admin)
        /// </summary>
        [Authorize]
        public async Task ApproveCompanyAsync(int id)
        {
            var company = await _companyRepository.GetAsync(id);
            
            if (company.LegalVerificationStatus != "pending")
            {
                throw new UserFriendlyException("Chỉ có thể duyệt các công ty đang ở trạng thái chờ xác thực.");
            }

            company.LegalVerificationStatus = "approved";
            // Tạm thời lưu null vì database là bigint nhưng CurrentUser.Id là Guid
            // TODO: Tạo migration để đổi LegalReviewedBy từ bigint sang uniqueidentifier
            company.LegalReviewedBy = null; 
            company.LegalReviewedAt = DateTime.UtcNow;
            company.RejectionNotes = null; // Clear rejection notes if any
            company.VerificationStatus = true;

            await _companyRepository.UpdateAsync(company);

            // TODO: Send email to recruiter
        }

        /// <summary>
        /// Từ chối công ty (chỉ Employee/Admin)
        /// </summary>
        [Authorize]
        public async Task RejectCompanyAsync(int id, RejectCompanyDto input)
        {
            var company = await _companyRepository.GetAsync(id);
            
            if (company.LegalVerificationStatus != "pending")
            {
                throw new UserFriendlyException("Chỉ có thể từ chối các công ty đang ở trạng thái chờ xác thực.");
            }

            if (string.IsNullOrWhiteSpace(input.RejectionNotes))
            {
                throw new UserFriendlyException("Vui lòng nhập lý do từ chối.");
            }

            company.LegalVerificationStatus = "rejected";
            // Tạm thời lưu null vì database là bigint nhưng CurrentUser.Id là Guid
            // TODO: Tạo migration để đổi LegalReviewedBy từ bigint sang uniqueidentifier
            company.LegalReviewedBy = null;
            company.LegalReviewedAt = DateTime.UtcNow;
            company.RejectionNotes = input.RejectionNotes;
            company.VerificationStatus = false;

            await _companyRepository.UpdateAsync(company);

            // TODO: Send email to recruiter with rejection notes
        }

        /// <summary>
        /// Lấy danh sách công ty đã được xác minh (chỉ Employee/Admin)
        /// Dựa vào cột VerificationStatus trong database
        /// </summary>
        [Authorize]
        public async Task<PagedResultDto<CompanyVerificationViewDto>> GetVerifiedCompaniesAsync(CompanyVerificationFilterDto input)
        {
            try
            {
                var queryable = await _companyRepository.GetQueryableAsync();
                
                // Lọc các công ty đã được xác minh (VerificationStatus = true)
                // Chỉ filter theo VerificationStatus, không cần check LegalVerificationStatus
                queryable = queryable.Where(c => c.VerificationStatus == true);

                // Filter by keyword
                if (!string.IsNullOrWhiteSpace(input.Keyword))
                {
                    var keyword = input.Keyword.ToLower();
                    queryable = queryable.Where(c => 
                        (c.CompanyName != null && c.CompanyName.ToLower().Contains(keyword)) ||
                        (c.CompanyCode != null && c.CompanyCode.ToLower().Contains(keyword)) ||
                        (c.ContactEmail != null && c.ContactEmail.ToLower().Contains(keyword)) ||
                        (c.TaxCode != null && c.TaxCode.ToLower().Contains(keyword))
                    );
                }

                // Filter by date range
                if (input.CreatedFrom.HasValue)
                {
                    queryable = queryable.Where(c => c.CreationTime >= input.CreatedFrom.Value);
                }
                if (input.CreatedTo.HasValue)
                {
                    queryable = queryable.Where(c => c.CreationTime <= input.CreatedTo.Value);
                }

                // Sorting
                if (!string.IsNullOrWhiteSpace(input.Sorting))
                {
                    if (input.Sorting.Contains("LegalReviewedAt", StringComparison.OrdinalIgnoreCase))
                    {
                        if (input.Sorting.Contains("desc", StringComparison.OrdinalIgnoreCase))
                            queryable = queryable.OrderByDescending(c => c.LegalReviewedAt);
                        else
                            queryable = queryable.OrderBy(c => c.LegalReviewedAt);
                    }
                    else if (input.Sorting.Contains("CreationTime", StringComparison.OrdinalIgnoreCase))
                    {
                        if (input.Sorting.Contains("desc", StringComparison.OrdinalIgnoreCase))
                            queryable = queryable.OrderByDescending(c => c.CreationTime);
                        else
                            queryable = queryable.OrderBy(c => c.CreationTime);
                    }
                }
                else
                {
                    // Default sort by verification date descending (newest verified first)
                    queryable = queryable.OrderByDescending(c => c.LegalReviewedAt ?? c.CreationTime);
                }

                var totalCount = await queryable.CountAsync();

                // Pagination
                var skipCount = input.SkipCount > 0 ? input.SkipCount : 0;
                var maxResultCount = input.MaxResultCount > 0 ? input.MaxResultCount : 10;
                var companies = await queryable
                    .Skip(skipCount)
                    .Take(maxResultCount)
                    .ToListAsync();

                // Load all recruiters for these companies in one query (only if there are companies)
                var dtos = new List<CompanyVerificationViewDto>();
                if (companies.Any())
                {
                    var companyIds = companies.Select(c => c.Id).ToList();
                    var recruiterQueryable = await _recruiterRepository.WithDetailsAsync(r => r.User);
                    var recruiters = recruiterQueryable
                        .Where(r => companyIds.Contains(r.CompanyId) && r.IsLead)
                        .ToList();

                    // Create a dictionary for quick lookup
                    var recruiterDict = recruiters
                        .GroupBy(r => r.CompanyId)
                        .ToDictionary(g => g.Key, g => g.FirstOrDefault());

                    // Map to DTOs and get recruiter info
                    foreach (var company in companies)
                    {
                        try
                        {
                            var dto = ObjectMapper.Map<Company, CompanyVerificationViewDto>(company);
                            
                            // Get recruiter from dictionary
                            if (recruiterDict.TryGetValue(company.Id, out var recruiter) && recruiter != null)
                            {
                                dto.RecruiterEmail = recruiter.Email;
                                if (recruiter.User != null)
                                {
                                    dto.RecruiterName = $"{recruiter.User.Name ?? ""} {recruiter.User.Surname ?? ""}".Trim();
                                    if (string.IsNullOrWhiteSpace(dto.RecruiterName))
                                    {
                                        dto.RecruiterName = recruiter.Email?.Split('@')[0] ?? "Recruiter";
                                    }
                                }
                                else
                                {
                                    dto.RecruiterName = recruiter.Email?.Split('@')[0] ?? "Recruiter";
                                }
                            }
                            dtos.Add(dto);
                        }
                        catch (Exception ex)
                        {
                            // Log error for this specific company but continue with others
                            Logger.LogWarning(ex, "Error mapping company {CompanyId} to DTO", company.Id);
                            // Add a basic DTO without recruiter info
                            var basicDto = new CompanyVerificationViewDto
                            {
                                Id = company.Id,
                                CompanyName = company.CompanyName,
                                CompanyCode = company.CompanyCode,
                                ContactEmail = company.ContactEmail,
                                ContactPhone = company.ContactPhone,
                                VerificationStatus = company.VerificationStatus,
                                LegalVerificationStatus = company.LegalVerificationStatus,
                                LegalReviewedAt = company.LegalReviewedAt,
                                CreationTime = company.CreationTime
                            };
                            dtos.Add(basicDto);
                        }
                    }
                }

                return new PagedResultDto<CompanyVerificationViewDto>
                {
                    TotalCount = totalCount,
                    Items = dtos
                };
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error in GetVerifiedCompaniesAsync");
                throw new UserFriendlyException($"Lỗi khi lấy danh sách công ty đã xác minh: {ex.Message}");
            }
        }
    }
}