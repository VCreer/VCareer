using System.Collections.Generic;

namespace VCareer.Dto.CandidateCVDto
{
    /// <summary>
    /// Response DTO cho danh sách CVs với pagination
    /// </summary>
    public class ViewCandidateCVsResponseDto
    {
        /// <summary>
        /// Danh sách CVs
        /// </summary>
        public List<CandidateCVListDto> CVs { get; set; }
        
        /// <summary>
        /// Tổng số CVs
        /// </summary>
        public int TotalCount { get; set; }
        
        /// <summary>
        /// Trang hiện tại
        /// </summary>
        public int PageIndex { get; set; }
        
        /// <summary>
        /// Số items mỗi trang
        /// </summary>
        public int PageSize { get; set; }
        
        /// <summary>
        /// Tổng số trang
        /// </summary>
        public int TotalPages { get; set; }
    }
}

