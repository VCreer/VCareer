using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace VCareer.Profile
{
    public interface ICompanyLegalInfoAppService : IApplicationService
    {
        /// <summary>
        /// Submits company legal information for the current user
        /// </summary>
        /// <param name="input">Company legal information to submit</param>
        /// <returns>Created company legal information</returns>
        Task<CompanyLegalInfoDto> SubmitCompanyLegalInfoAsync(SubmitCompanyLegalInfoDto input);

        /// <summary>
        /// Updates existing company legal information
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <param name="input">Updated company legal information</param>
        /// <returns>Updated company legal information</returns>
        Task<CompanyLegalInfoDto> UpdateCompanyLegalInfoAsync(int id, UpdateCompanyLegalInfoDto input);

        /// <summary>
        /// Gets company legal information by ID
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <returns>Company legal information</returns>
        Task<CompanyLegalInfoDto> GetCompanyLegalInfoAsync(int id);

        /// <summary>
        /// Gets company legal information for the current user
        /// </summary>
        /// <returns>Company legal information</returns>
        Task<CompanyLegalInfoDto> GetCurrentUserCompanyLegalInfoAsync();

        /// <summary>
        /// Gets all company legal information for the current user
        /// </summary>
        /// <returns>List of company legal information</returns>
        Task<List<CompanyLegalInfoDto>> GetCurrentUserCompanyLegalInfoListAsync();

        /// <summary>
        /// Deletes company legal information
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <returns>Task representing the asynchronous operation</returns>
        Task DeleteCompanyLegalInfoAsync(int id);

        /// <summary>
        /// Updates file URLs for company legal information
        /// </summary>
        /// <param name="id">Company ID</param>
        /// <param name="businessLicenseFile">Business license file URL</param>
        /// <param name="taxCertificateFile">Tax certificate file URL</param>
        /// <param name="representativeIdCardFile">Representative ID card file URL</param>
        /// <param name="otherSupportFile">Other support file URL</param>
        /// <returns>Updated company legal information</returns>
        Task<CompanyLegalInfoDto> UpdateFileUrlsAsync(int id, string businessLicenseFile = null, 
            string taxCertificateFile = null, string representativeIdCardFile = null, string otherSupportFile = null);

        /// <summary>
        /// Lấy thông tin công ty theo Job ID (để hiển thị trong trang job detail)
        /// </summary>
        /// <param name="jobId">Job ID</param>
        /// <returns>Thông tin công ty bao gồm danh sách ngành nghề</returns>
        Task<CompanyInfoForJobDetailDto> GetCompanyByJobIdAsync(Guid jobId);

        /// <summary>
        /// Tìm kiếm danh sách công ty (public API - không cần authorize)
        /// </summary>
        /// <param name="input">Input tìm kiếm (keyword, pagination, sorting)</param>
        /// <returns>Danh sách công ty đã phân trang</returns>
        Task<PagedResultDto<CompanyLegalInfoDto>> SearchCompaniesAsync(CompanySearchInputDto input);
    }
}
