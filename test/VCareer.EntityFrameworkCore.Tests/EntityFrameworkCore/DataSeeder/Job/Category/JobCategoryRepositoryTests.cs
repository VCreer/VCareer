using EmptyFiles;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.IRepositories.Job;
using VCareer.Job.Category;
using Xunit;

namespace VCareer.EntityFrameworkCore.DataSeeder.Job.Category
{
    public class JobCategoryRepositoryTests : VCareerEntityFrameworkCoreTestBase
    {
        private readonly IJobCategoryRepository _categoryRepository;

        public JobCategoryRepositoryTests()
        {
            _categoryRepository = GetRequiredService<IJobCategoryRepository>();
        }

        // test với hapy path
        [Fact]
        public async Task UC01_GetFullCategoryTreeAsync_Should_Return_Tree_With_3_Levels()
        {
            // Arrange - Seed data đã có sẵn từ CategoryTestDataSeedContributor
            //data đc seed tự động 

            // Act
            var rootCategories = await _categoryRepository.GetFullCategoryTreeAsync();

            // Assert
            rootCategories.ShouldNotBeNull();
            rootCategories.Count.ShouldBe(2); // IT và Business

            var itCategory = rootCategories.First(c => c.Id == CategoryTestDataBuilder.TestCategoryIds.IT);
            itCategory.Name.ShouldBe("Công nghệ thông tin");
            itCategory.Children.ShouldNotBeNull();
            itCategory.Children.Count.ShouldBe(2); // Programming và IT Support
            itCategory.Children.Count.ShouldBe(2); // Programming và IT Support

            var programming = itCategory.Children.First(c => c.Id == CategoryTestDataBuilder.TestCategoryIds.Programming);
            programming.Children.Count.ShouldBe(3); // Backend, Frontend, Mobile

            var itSupport = itCategory.Children.First(c => c.Id == CategoryTestDataBuilder.TestCategoryIds.ITSupport);
            itSupport.Children.Count.ShouldBe(1); // HelpDesk

        }


        //tets với  lấy string path của 1 category
        [Fact]
        public async Task UC02_GetStringPath()
        {
            // Arrange - Seed data đã có sẵn từ CategoryTestDataSeedContributor
            //data đc seed tự động 

            // Act
            var path = await _categoryRepository.GetStringPath(CategoryTestDataBuilder.TestCategoryIds.BackendDev);

            // Assert
            path.ShouldNotBeNull();
            path.ShouldBe("Công nghệ thông tin > Lập trình > Backend Developer");



        }


    }
}

