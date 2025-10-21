using AutoMapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Job.JobPosting.ISerices;
using VCareer.Models.Job;
using VCareer.Repositories;
using Volo.Abp.Application.Services;

namespace VCareer.Job.JobPosting.Services
{
    public class JobCategoryAppService : ApplicationService, IJobCategoryAppService
    {
        private readonly IJobCategoryRepository _categoryRepository;
        public JobCategoryAppService(IJobCategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }


        //trả vè list các dto cho FE
        public async Task<List<CategoryTreeDto>> GetCategoryTreeAsync()
        {
            // load tree từ repo
            var rootCategories = await _categoryRepository.GetFullCategoryTreeAsync();

            // nếu không tồn tại trả về list rỗng
            if (!rootCategories.Any())
            {
                return new List<CategoryTreeDto>();
            }

            // tạo list các dto
            var treeDtos = new List<CategoryTreeDto>();

            foreach (var root in rootCategories)
            {
                var rootDto = await BuildCategoryTreeDtoAsync(root, root.Name);
                treeDtos.Add(rootDto);
            }
            // trả về list đó
            return treeDtos;
        }


        // search
        public async Task<List<CategoryTreeDto>> SearchCategoriesAsync(string keyword)
        {
            // check validate input
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return new List<CategoryTreeDto>();
            }

            // gọi repo : rtar về danh sách các node cuối
            var matchedLeafCategories = await _categoryRepository.SearchCategoriesByPathAsync(keyword);

            // không khớp trả về list trống
            if (!matchedLeafCategories.Any())
            {
                return new List<CategoryTreeDto>();
            }

            //nếu khớp 

            // tạo 1 list các dto 
            var searchResults = new List<CategoryTreeDto>();

            foreach (var leafCategory in matchedLeafCategories)
            {
                // Get path từ root đến leaf

                var fullPath = await _categoryRepository.GetStringPath(leafCategory.Id);

                var dto = new CategoryTreeDto
                {
                    CategoryId = leafCategory.Id,
                    CategoryName = leafCategory.Name,
                    FullPath = fullPath,
                    Children = new List<CategoryTreeDto>() // Leaf không có children
                };

                searchResults.Add(dto);
            }

            return searchResults.OrderBy(r => r.FullPath).ToList();
        }



        // hàm này sẽ tạo ra 1 tree dto  từ 1 category , build ath từ trên xuống 
        private async Task<CategoryTreeDto> BuildCategoryTreeDtoAsync(
            Job_Category entity,
            string currentPath)
        {
            // tạo 1 cái dto
            var dto = new CategoryTreeDto
            {
                CategoryId = entity.Id,
                CategoryName = entity.Name,
                FullPath = currentPath,
                Children = new List<CategoryTreeDto>()
            };

            // ✅ Nếu có children → recursive build
            if (entity.Children != null && entity.Children.Any())
            {
                foreach (var child in entity.Children)
                {
                    // Build path cho child: "Parent > Child"
                    var childPath = $"{currentPath} > {child.Name}";

                    // Recursive call
                    var childDto = await BuildCategoryTreeDtoAsync(child, childPath);

                    dto.Children.Add(childDto);
                }
            }


            return dto;
        }
    }


}
