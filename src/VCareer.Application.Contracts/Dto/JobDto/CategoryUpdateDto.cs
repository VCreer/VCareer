using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.JobDto
{
    public class CategoryUpdateCreateDto
    {
        public string Name { get; set; }
        public string Slug { get; set; }
        public string Description { get; set; }
        public Guid? ParentId { get; set; } /// ID danh mục cha (null nếu là root)
        public int SortOrder { get; set; } = 0;/// Thứ tự hiển thị
        public bool IsActive { get; set; } = true; /// Trạng thái hoạt động
      
    }
}
