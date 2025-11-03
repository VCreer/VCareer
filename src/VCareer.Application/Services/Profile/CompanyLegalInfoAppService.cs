using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using VCareer.Models.Companies;
using VCareer.Permission;
using VCareer.Permissions;
using VCareer.Profile;
using VCareer.Repositories.Companies;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using Volo.Abp.Validation;

namespace VCareer.Services.Profile
{
    //  [Authorize(VCareerPermission.Profile.Default)]
    public class CompanyLegalInfoAppService : VCareerAppService, ICompanyLegalInfoAppService
    {
        private readonly IRepository<Company, int> _companyRepository;
        private readonly ICompanyRepository _companyCustomRepository;
        private readonly ICurrentUser _currentUser;

        public CompanyLegalInfoAppService(
            IRepository<Company, int> companyRepository,
            ICompanyRepository companyCustomRepository,
            ICurrentUser currentUser)
        {
            _companyRepository = companyRepository;
            _companyCustomRepository = companyCustomRepository;
            _currentUser = currentUser;
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



        // Long dùng hàm này để view listk
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
            var company = await _companyCustomRepository.GetCompanyByJobIdAsync(jobId);

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
    }
}