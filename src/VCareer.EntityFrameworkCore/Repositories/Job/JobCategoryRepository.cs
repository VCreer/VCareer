using Microsoft.EntityFrameworkCore;
using Polly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Model;
using VCareer.Models.Job;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace VCareer.Repositories.Job
{
    public class JobCategoryRepository : EfCoreRepository<VCareerDbContext, Job_Category, Guid>, IJobCategoryRepository
    {
        public JobCategoryRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider) { }


        // lấy toàn bộ  cây category
        public async Task<List<Job_Category>> GetFullCategoryTreeAsync()
        {
            var dbContext = await GetDbContextAsync();


            var allCategories = await dbContext.JobCategories
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();


            var rootCategories = allCategories.Where(c => c.ParentId == null).ToList();

            foreach (var root in rootCategories)
            {
                // Populate level 2
                root.Children = allCategories
                    .Where(c => c.ParentId == root.Id)
                    .ToList();

                foreach (var level2 in root.Children)
                {
                    // Populate level 3 (leaf)
                    level2.Children = allCategories
                        .Where(c => c.ParentId == level2.Id)
                        .ToList();
                }
            }

            return rootCategories;
        }



        // trả về 1 chuỗi path của 1 category node cuoois , dictionary ở đây 
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





        // lấy string path của 1 category , cahwcs chắn nó sẽ là category cấp 3
        public async Task<string> GetStringPath(Guid categoryId)
        {
            string s = "";

            var dbContext = await GetDbContextAsync();


            var category = await dbContext.JobCategories.Include(x => x.Parent).ThenInclude(x => x.Parent)
                .FirstOrDefaultAsync(c => c.Id == categoryId && c.IsActive);

            if (category != null)
            {
                var c2 = category.Parent;

                var c3 = c2.Parent;
                string path = c3.Name + " > " + c2.Name + " > " + category.Name;
                return path;
            }
            return s;
        }




        // trả về danh sách các category khi mà tìm kiếm
        public async Task<List<Job_Category>> SearchCategoriesByPathAsync(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return await GetFullCategoryTreeAsync();

            var dbContext = await GetDbContextAsync();
            var normalizedKeyword = keyword.Trim().ToLower();

            //lấy full lcategory
            var allCategories = await dbContext.JobCategories
                .Where(c => c.IsActive)
                .ToListAsync();

            // cho tatasc cả vào 1 cái dic
            var categoriesDict = allCategories.ToDictionary(c => c.Id);

            // tìm nocde cuối
            var leafCategories = allCategories.Where(c =>
                !allCategories.Any(child => child.ParentId == c.Id)
            ).ToList();

            // ✅ STEP 4: Filter leafs có path chứa keyword
            var matchedLeafs = new List<Job_Category>();

            foreach (var leaf in leafCategories)
            {
                // Build full path
                var pathNames = BuildCategoryPathNames(leaf, categoriesDict);
                var fullPath = string.Join(" ", pathNames).ToLower(); // "công nghệ thông tin lập trình backend developer"

                // Check nếu path hoặc name chứa keyword
                if (fullPath.Contains(normalizedKeyword) ||
                    leaf.Name.ToLower().Contains(normalizedKeyword))
                {
                    matchedLeafs.Add(leaf);
                }
            }

            return matchedLeafs.OrderBy(c => c.Name).ToList();
        }




        // lấy tất cả id category cnode cuối từ 1 caegory id
        public async Task<List<Guid>> GetAllChildrenCategoryIdsAsync(Guid categoryId)
        {
            var dbContext = await GetDbContextAsync();

            // Check exists
            var categoryExists = await dbContext.JobCategories
                .AnyAsync(c => c.Id == categoryId && c.IsActive);

            if (!categoryExists)
                return new List<Guid>();

            // Load all categories (1 query)
            var allCategories = await dbContext.JobCategories
                .Where(c => c.IsActive)
                .ToListAsync();

            var categoriesDict = allCategories.ToDictionary(c => c.Id);
            var leafIds = new List<Guid>();

            CollectLeafIdsRecursive(categoryId, categoriesDict, leafIds);

            return leafIds;
        }



        //
        private void CollectLeafIdsRecursive(
            Guid categoryId,
            Dictionary<Guid, Job_Category> categoriesDict,
            List<Guid> leafIds)
        {
            if (!categoriesDict.ContainsKey(categoryId))
                return;

            var children = categoriesDict.Values
                .Where(c => c.ParentId == categoryId)
                .ToList();

            if (!children.Any())
            {
                leafIds.Add(categoryId);
                return;
            }

            foreach (var child in children)
            {
                CollectLeafIdsRecursive(child.Id, categoriesDict, leafIds);
            }
        }


    }


}

