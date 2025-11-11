using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using VCareer.Model;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Job
{
    // cây category 
    public class CategoryTreeDto
    {
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string Slug { get; set; }
        public string Description { get; set; }
        public int JobCount { get; set; }/// Số lượng job trong danh mục này
        public List<CategoryTreeDto> Children { get; set; } = new List<CategoryTreeDto>();
        public string FullPath { get; set; }
        public bool IsLeaf { get; set; }
    }
}
