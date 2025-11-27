using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using VCareer.Dto.FileDto;
using VCareer.Dto.Profile;
using VCareer.IRepositories.ICompanyRepository;
using VCareer.IRepositories.Job;
using VCareer.IServices.IFileServices;
using VCareer.IServices.IProfileServices;
using VCareer.Models.Companies;
using VCareer.Models.FileMetadata;
using VCareer.Permission;
using VCareer.Permissions;
using VCareer.Constants.FilePolicy;
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
        private readonly IFileServices _fileServices;
        private readonly IRepository<FileDescriptor, Guid> _fileDescriptorRepository;

        public CompanyLegalInfoAppService(
            ICompanyRepository companyRepository,
            ICurrentUser currentUser,
            IJobPostRepository jobPostRepository,
            IFileServices fileServices,
            IRepository<FileDescriptor, Guid> fileDescriptorRepository)
        {
            _companyRepository = companyRepository;
            _currentUser = currentUser;
            _jobPostRepository = jobPostRepository;
            _fileServices = fileServices;
            _fileDescriptorRepository = fileDescriptorRepository;
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




        /*[Authorize(VCareerPermission.Profile.UpdateLegalInformation)]*/
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



        /*[Authorize(VCareerPermission.Profile.UpdateLegalInformation)]*/
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

        public async Task<CompanyLegalInfoDto> UploadLegalDocumentAsync(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new UserFriendlyException("File không hợp lệ.");
            }

            // Giới hạn dung lượng 5MB
            const long maxSizeBytes = 5 * 1024 * 1024;
            if (file.Length > maxSizeBytes)
            {
                throw new UserFriendlyException("Dung lượng file tối đa là 5MB.");
            }

            // Chỉ cho phép jpeg, jpg, png, pdf
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
            var extension = System.IO.Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                throw new UserFriendlyException("Định dạng file không hợp lệ. Chỉ chấp nhận: jpeg, jpg, png, pdf.");
            }

            var userId = _currentUser.GetId();
            if (userId == Guid.Empty)
            {
                throw new UserFriendlyException("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
            }

            // Upload file vào container CompanyDocuments của Recruiter
            var uploadDto = new UploadFileDto
            {
                File = file,
                ContainerType = RecruiterContainerType.CompanyDocuments.ToString(),
                UserId = userId.ToString()
            };

            var fileDescriptorId = await _fileServices.UploadAsync(uploadDto);
            var fileDescriptor = await _fileDescriptorRepository.GetAsync(fileDescriptorId);

            var company = await _companyRepository.GetAsync(id);
            company.LegalDocumentUrl = fileDescriptor.StoragePath;
            company.LegalVerificationStatus = "pending";

            await _companyRepository.UpdateAsync(company);

            return ObjectMapper.Map<Company, CompanyLegalInfoDto>(company);
        }

        public async Task<FileStreamResultDto> GetLegalDocumentFileAsync(string storagePath)
        {
            if (string.IsNullOrWhiteSpace(storagePath))
            {
                throw new UserFriendlyException("Đường dẫn file không hợp lệ.");
            }

            // storagePath lưu cả đường dẫn thư mục, ví dụ: recruiter/documents/filename.jpg
            var result = await _fileServices.DownloadByStoragePathAsync(storagePath);
            return result;
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
            if (input == null)
            {
                throw new AbpValidationException("Input không hợp lệ.");
            }

            var skipCount = input.SkipCount >= 0 ? input.SkipCount : 0;
            var maxResultCount = input.MaxResultCount > 0 ? input.MaxResultCount : 10;
            var keyword = input.Keyword?.Trim();

            var queryable = await _companyRepository.GetQueryableAsync();

            queryable = queryable
                .WhereIf(!string.IsNullOrWhiteSpace(keyword),
                    c => c.CompanyName != null && c.CompanyName.Contains(keyword))
                .WhereIf(input.Status.HasValue, c => c.Status == input.Status);

            var sorting = !string.IsNullOrWhiteSpace(input.Sorting)
                ? input.Sorting
                : nameof(Company.CompanyName);

            queryable = queryable.OrderBy(sorting);

            var totalCount = await AsyncExecuter.CountAsync(queryable);

            var companies = await AsyncExecuter.ToListAsync(
                queryable
                    .Skip(skipCount)
                    .Take(maxResultCount));

            var dtos = ObjectMapper.Map<List<Company>, List<CompanyLegalInfoDto>>(companies);

            return new PagedResultDto<CompanyLegalInfoDto>(totalCount, dtos);
        }
    }
}