using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Job
{
    public class JobCategoryRepository : EfCoreRepository<VCareerDbContext, Job_Category, Guid>, IJobCategoryRepository
    {
        public JobCategoryRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }

        // laod full cây category
        public async Task<List<Job_Category>> GetFullCategoryTreeAsync()
        {
            var dbContext = await GetDbContextAsync();

            // Load tất cả categories một lần
            var allCategories = await dbContext.JobCategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();

            // Lấy root categories
            var rootCategories = allCategories
                .Where(c => c.ParentId == null)
                .ToList();

            // Build tree structure
            foreach (var root in rootCategories)
            {
                PopulateChildren(root, allCategories);
            }

            return rootCategories;
        }

        //hàm helper
        private void PopulateChildren(Job_Category category, List<Job_Category> allCategories)
        {
            category.Children = allCategories
                .Where(c => c.ParentId == category.Id)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .ToList();

            foreach (var child in category.Children)
            {
                PopulateChildren(child, allCategories);
            }
        }


        // Lấy path của 1 category
        public async Task<string> GetStringPath(Guid categoryId)
        {
            var dbContext = await GetDbContextAsync();

            // Load category với tất cả parents
            var allCategories = await dbContext.JobCategories
                .Where(c => c.IsActive)
                .ToListAsync();

            var categoriesDict = allCategories.ToDictionary(c => c.Id);

            if (!categoriesDict.ContainsKey(categoryId))
            {
                return string.Empty;
            }

            var pathNames = BuildCategoryPathNames(categoriesDict[categoryId], categoriesDict);

            return string.Join(" > ", pathNames);
        }


        /// <summary>
        /// Build path names từ root đến category hiện tại
        /// </summary>
        private List<string> BuildCategoryPathNames(
            Job_Category category,
            Dictionary<Guid, Job_Category> categoriesDict)
        {
            var path = new List<string>();
            var current = category;

            while (current != null)
            {
                path.Insert(0, current.Name); // Insert at beginning

                if (current.ParentId.HasValue && categoriesDict.ContainsKey(current.ParentId.Value))
                {
                    current = categoriesDict[current.ParentId.Value];
                }
                else
                {
                    break;
                }
            }

            return path;
        }

        /// <summary>
        /// Tìm kiếm category theo keyword trong path
        /// Trả về danh sách leaf categories có path chứa keyword
        /// </summary>
        public async Task<List<Job_Category>> SearchCategoriesByPathAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return new List<Job_Category>();
            }

            var dbContext = await GetDbContextAsync();
            var normalizedKeyword = keyword.Trim().ToLower();

            // Load tất cả categories
            var allCategories = await dbContext.JobCategories
                .Where(c => c.IsActive)
                .ToListAsync();

            var categoriesDict = allCategories.ToDictionary(c => c.Id);

            // Tìm leaf categories
            var leafCategories = allCategories
                .Where(c => !allCategories.Any(child => child.ParentId == c.Id))
                .ToList();

            // Filter leafs có path chứa keyword
            var matchedLeafs = new List<Job_Category>();

            foreach (var leaf in leafCategories)
            {
                // Build full path
                var pathNames = BuildCategoryPathNames(leaf, categoriesDict);
                var fullPath = string.Join(" ", pathNames).ToLower();

                // Check nếu path chứa keyword
                if (fullPath.Contains(normalizedKeyword))
                {
                    matchedLeafs.Add(leaf);
                }
            }

            return matchedLeafs
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .ToList();
        }

        /// <summary>
        /// Lấy tất cả ID của các category con (leaf) từ một category
        /// </summary>
        public async Task<List<Guid>> GetAllChildrenCategoryIdsAsync(Guid categoryId)
        {
            var dbContext = await GetDbContextAsync();

            // Check exists
            var categoryExists = await dbContext.JobCategories
                .AnyAsync(c => c.Id == categoryId && c.IsActive);

            if (!categoryExists)
            {
                return new List<Guid>();
            }

            // Load all categories
            var allCategories = await dbContext.JobCategories
                .Where(c => c.IsActive)
                .ToListAsync();

            var categoriesDict = allCategories.ToDictionary(c => c.Id);
            var leafIds = new List<Guid>();

            // Collect leaf IDs recursively
            CollectLeafIdsRecursive(categoryId, categoriesDict, leafIds);

            return leafIds;
        }


        /// <summary>
        /// Collect leaf category IDs recursively
        /// </summary>
        private void CollectLeafIdsRecursive(
            Guid categoryId,
            Dictionary<Guid, Job_Category> categoriesDict,
            List<Guid> leafIds)
        {
            if (!categoriesDict.ContainsKey(categoryId))
            {
                return;
            }

            var children = categoriesDict.Values
                .Where(c => c.ParentId == categoryId)
                .ToList();

            // Nếu không có children, đây là leaf node
            if (!children.Any())
            {
                leafIds.Add(categoryId);
                return;
            }

            // Recursive collect từ children
            foreach (var child in children)
            {
                CollectLeafIdsRecursive(child.Id, categoriesDict, leafIds);
            }
        }

        /// <summary>
        /// Cập nhật số lượng job của category
        /// </summary>
        public async Task UpdateJobCountAsync(Guid categoryId, int jobCount)
        {
            var dbContext = await GetDbContextAsync();

            var category = await dbContext.JobCategories
                .FirstOrDefaultAsync(c => c.Id == categoryId);

            if (category != null)
            {
                category.JobCount = jobCount;
                await dbContext.SaveChangesAsync();
            }
        }



        /// <summary>
        /// Lấy category theo ID với children đã load
        /// </summary>
        public async Task<Job_Category> GetWithChildrenAsync(Guid categoryId)
        {
            var dbContext = await GetDbContextAsync();

            var category = await dbContext.JobCategories
                .Where(c => c.Id == categoryId && c.IsActive)
                .FirstOrDefaultAsync();

            if (category == null)
            {
                return null;
            }

            // Load tất cả categories để build children
            var allCategories = await dbContext.JobCategories
                .Where(c => c.IsActive)
                .ToListAsync();

            PopulateChildren(category, allCategories);

            return category;
        }
    }
}
