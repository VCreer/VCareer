using EmptyFiles;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.DependencyInjection;

namespace VCareer.Job.Category
{
    public class CategoryTestDataBuilder : ITransientDependency
    {
        // ✅ STATIC GUIDs - KHÔNG thay đổi
        public static class TestCategoryIds
        {
            public static Guid IT = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa1");
            public static Guid Business = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa2");
            public static Guid Programming = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa3");
            public static Guid ITSupport = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa4");
            public static Guid Sales = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa5");
            public static Guid BackendDev = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa6");
            public static Guid FrontendDev = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa7");
            public static Guid MobileDev = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa8");
            public static Guid HelpDesk = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afa9");
            public static Guid SalesExec = Guid.Parse("3fa85f64-5717-4562-b3fc-2c963f66afaa");
        }

        // ✅ BUILD KHÔNG ID TRƯỚC (giữ nguyên code của bạn)
        public List<Job_Category> Build()
        {
            var categories = new List<Job_Category>();

            // Level 1: Root
            categories.Add(new Job_Category
            {
                Name = "Công nghệ thông tin",
                Slug = "cong-nghe-thong-tin",
                ParentId = null,
                IsActive = true,
                
            });

            categories.Add(new Job_Category
            {
                Name = "Kinh doanh",
                Slug = "kinh-doanh",
                ParentId = null,
                IsActive = true,
               
            });

            // Level 2: Children
            categories.Add(new Job_Category
            {
                Name = "Lập trình",
                Slug = "lap-trinh",
                ParentId = null,
                IsActive = true, // ← ASSIGN SAU
                
            });

            categories.Add(new Job_Category
            {
                Name = "IT Support",
                Slug = "it-support",
                ParentId = null,
                IsActive = true,
               
            });

            categories.Add(new Job_Category
            {
                Name = "Sales",
                Slug = "sales",
                ParentId = null,
                IsActive = true,
               
            });

            // Level 3: Leaf
            categories.Add(new Job_Category
            {
                Name = "Backend Developer",
                Slug = "backend-developer",
                ParentId = null,
                IsActive = true,
               
            });

            categories.Add(new Job_Category
            {
                Name = "Frontend Developer",
                Slug = "frontend-developer",
                ParentId = null,
                IsActive = true,
                //CreatedAt = DateTime.UtcNow,
                //UpdatedAt = DateTime.UtcNow
            });

            categories.Add(new Job_Category
            {
                Name = "Mobile Developer",
                Slug = "mobile-developer",
                ParentId = null,
                IsActive = true,
                //CreatedAt = DateTime.UtcNow,
                //UpdatedAt = DateTime.UtcNow
            });

            categories.Add(new Job_Category
            {
                Name = "Help Desk",
                Slug = "help-desk",
                ParentId = null,
                IsActive = true,
                //CreatedAt = DateTime.UtcNow,
                //UpdatedAt = DateTime.UtcNow
            });

            categories.Add(new Job_Category
            {
                Name = "Sales Executive",
                Slug = "sales-executive",
                ParentId = null,
                IsActive = true,
                //CreatedAt = DateTime.UtcNow,
                //UpdatedAt = DateTime.UtcNow
            });

            return categories;
        }


        public List<Job_Category> BuildWithIds()
        {
            var categories = Build(); // Build không ID


            var idProperty = typeof(Job_Category).GetProperty("Id",
                BindingFlags.Public | BindingFlags.Instance);

            if (idProperty == null)
                throw new InvalidOperationException("Id property not found on Job_Category");


            idProperty.SetValue(categories[0], TestCategoryIds.IT);
            idProperty.SetValue(categories[1], TestCategoryIds.Business);
            idProperty.SetValue(categories[2], TestCategoryIds.Programming);
            idProperty.SetValue(categories[3], TestCategoryIds.ITSupport);
            idProperty.SetValue(categories[4], TestCategoryIds.Sales);
            idProperty.SetValue(categories[5], TestCategoryIds.BackendDev);
            idProperty.SetValue(categories[6], TestCategoryIds.FrontendDev);
            idProperty.SetValue(categories[7], TestCategoryIds.MobileDev);
            idProperty.SetValue(categories[8], TestCategoryIds.HelpDesk);
            idProperty.SetValue(categories[9], TestCategoryIds.SalesExec);


            categories[2].ParentId = TestCategoryIds.IT;        // Programming -> IT
            categories[3].ParentId = TestCategoryIds.IT;        // ITSupport -> IT
            categories[4].ParentId = TestCategoryIds.Business;  // Sales -> Business
            categories[5].ParentId = TestCategoryIds.Programming; // Backend -> Programming
            categories[6].ParentId = TestCategoryIds.Programming; // Frontend -> Programming
            categories[7].ParentId = TestCategoryIds.Programming; // Mobile -> Programming
            categories[8].ParentId = TestCategoryIds.ITSupport;   // HelpDesk -> ITSupport
            categories[9].ParentId = TestCategoryIds.Sales;       // SalesExec -> Sales

            return categories;
        }
    }
}
