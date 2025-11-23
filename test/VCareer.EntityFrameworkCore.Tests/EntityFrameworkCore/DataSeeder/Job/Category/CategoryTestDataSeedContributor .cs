using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Job.Category;
using VCareer.Models.JobCategory;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;

namespace VCareer.EntityFrameworkCore.DataSeeder.Job.Category
{
    public class CategoryTestDataSeedContributor : IDataSeedContributor, ITransientDependency
    {
        private readonly IRepository<Job_Category, Guid> _categoryRepository;
        private readonly CategoryTestDataBuilder _dataBuilder;

        public CategoryTestDataSeedContributor(
            IRepository<Job_Category, Guid> categoryRepository,
            CategoryTestDataBuilder dataBuilder)
        {
            _categoryRepository = categoryRepository;
            _dataBuilder = dataBuilder;
        }

        public async Task SeedAsync(DataSeedContext context)
        {
            if (await _categoryRepository.GetCountAsync() > 0)
                return;

            // ✅ SỬA: DÙNG BuildWithIds() - CÓ ID & ParentId
            var categories = _dataBuilder.BuildWithIds();

            await _categoryRepository.InsertManyAsync(categories);
        }
    }
}
