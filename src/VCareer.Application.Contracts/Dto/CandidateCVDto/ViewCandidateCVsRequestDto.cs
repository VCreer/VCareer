using System;

namespace VCareer.Dto.CandidateCVDto
{
    /// <summary>
    /// DTO để filter danh sách CV
    /// </summary>
    public class ViewCandidateCVsRequestDto
    {
        /// <summary>
        /// Tìm kiếm theo tên, email, hoặc skills
        /// </summary>
        public string SearchTerm { get; set; }
        
        /// <summary>
        /// Lọc theo loại CV: Online, Upload, hoặc null (tất cả)
        /// </summary>
        public string CVType { get; set; }
        
        /// <summary>
        /// Lọc theo status: Published, Draft, Archived, hoặc null (tất cả)
        /// </summary>
        public string Status { get; set; }
        
        /// <summary>
        /// Số trang (bắt đầu từ 0)
        /// </summary>
        public int PageIndex { get; set; } = 0;
        
        /// <summary>
        /// Số lượng items mỗi trang
        /// </summary>
        public int PageSize { get; set; } = 20;
        
        /// <summary>
        /// Sắp xếp theo: CreationTime, LastModificationTime, FullName
        /// </summary>
        public string SortBy { get; set; } = "CreationTime";
        
        /// <summary>
        /// Sắp xếp tăng dần (true) hay giảm dần (false)
        /// </summary>
        public bool SortAscending { get; set; } = false;
    }
}

