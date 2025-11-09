using System;
using System.Threading.Tasks;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace VCareer.CV
{
    /// <summary>
    /// Application Service interface cho CV Template Management
    /// </summary>
    public interface ICvTemplateAppService : IApplicationService
    {
        /// <summary>
        /// Tạo mới CV Template (chỉ dành cho Admin)
        /// </summary>
        Task<CvTemplateDto> CreateAsync(CreateCvTemplateDto input);

        /// <summary>
        /// Cập nhật CV Template (chỉ dành cho Admin)
        /// </summary>
        Task<CvTemplateDto> UpdateAsync(Guid id, UpdateCvTemplateDto input);

        /// <summary>
        /// Xóa CV Template (chỉ dành cho Admin)
        /// </summary>
        Task DeleteAsync(Guid id);

        /// <summary>
        /// Lấy CV Template theo ID
        /// </summary>
        Task<CvTemplateDto> GetAsync(Guid id);

        /// <summary>
        /// Lấy danh sách CV Templates (có filter và pagination)
        /// </summary>
        Task<PagedResultDto<CvTemplateDto>> GetListAsync(GetCvTemplateListDto input);

        /// <summary>
        /// Lấy danh sách CV Templates đang active (cho candidate chọn)
        /// </summary>
        Task<PagedResultDto<CvTemplateDto>> GetActiveTemplatesAsync(GetCvTemplateListDto input);

        /// <summary>
        /// Preview template với empty/sample data (để candidate xem form trước khi tạo CV)
        /// </summary>
        Task<RenderCvDto> PreviewTemplateAsync(Guid templateId);
    }
}

