using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.Job;
using Volo.Abp.DependencyInjection;

namespace VCareer.Job.Location
{

    public class LocationTestDataBuilder : ITransientDependency
    {

        public static class TestProvinceIds
        {
            public static int HaNoi = 1;
            public static int HoChiMinh = 2;
            public static int DaNang = 3;
            public static int AnGiang = 4;
            public static int DongNai = 5;
        }

        public static class TestDistrictIds
        {
            public static int BaDinh = 11;
            public static int HoanKiem = 12;
            public static int Quan1 = 21;
            public static int Quan3 = 22;
            public static int HaiChau = 31;
            public static int ThanhKhe = 32;
            public static int LongXuyen = 41;
            public static int ChauDoc = 42;
            public static int BienHoa = 51;
            public static int LongKhanh = 52;
        }


        public List<Province> Build()
        {
            return new List<Province>
            {
                new Province { Name = "Hà Nội", Districts = new List<District> { new District { Name = "Ba Đình" }, new District { Name = "Hoàn Kiếm" } } },
                new Province { Name = "TP. Hồ Chí Minh", Districts = new List<District> { new District { Name = "Quận 1" }, new District { Name = "Quận 3" } } },
                new Province { Name = "Đà Nẵng", Districts = new List<District> { new District { Name = "Hải Châu" }, new District { Name = "Thanh Khê" } } },
                new Province { Name = "An Giang", Districts = new List<District> { new District { Name = "Long Xuyên" }, new District { Name = "Châu Đốc" } } },
                new Province { Name = "Đồng Nai", Districts = new List<District> { new District { Name = "Biên Hòa" }, new District { Name = "Long Khánh" } } }
            };
        }

        public List<Province> BuildWithIds()
        {
            var provinces = Build();

            // Province IDs
            var provinceIdProperty = typeof(Province).GetProperty("Id", BindingFlags.Public | BindingFlags.Instance);
            provinceIdProperty.SetValue(provinces[0], TestProvinceIds.HaNoi);
            provinceIdProperty.SetValue(provinces[1], TestProvinceIds.HoChiMinh);
            provinceIdProperty.SetValue(provinces[2], TestProvinceIds.DaNang);
            provinceIdProperty.SetValue(provinces[3], TestProvinceIds.AnGiang);
            provinceIdProperty.SetValue(provinces[4], TestProvinceIds.DongNai);

            // 🔥 DISTRICT IDs - KHÔNG INDEX!
            var districtIdProperty = typeof(District).GetProperty("Id", BindingFlags.Public | BindingFlags.Instance);
            AssignDistrictId(provinces[0].Districts, "Ba Đình", TestDistrictIds.BaDinh);
            AssignDistrictId(provinces[0].Districts, "Hoàn Kiếm", TestDistrictIds.HoanKiem);
            AssignDistrictId(provinces[1].Districts, "Quận 1", TestDistrictIds.Quan1);
            AssignDistrictId(provinces[1].Districts, "Quận 3", TestDistrictIds.Quan3);
            AssignDistrictId(provinces[2].Districts, "Hải Châu", TestDistrictIds.HaiChau);
            AssignDistrictId(provinces[2].Districts, "Thanh Khê", TestDistrictIds.ThanhKhe);
            AssignDistrictId(provinces[3].Districts, "Long Xuyên", TestDistrictIds.LongXuyen);
            AssignDistrictId(provinces[3].Districts, "Châu Đốc", TestDistrictIds.ChauDoc);
            AssignDistrictId(provinces[4].Districts, "Biên Hòa", TestDistrictIds.BienHoa);
            AssignDistrictId(provinces[4].Districts, "Long Khánh", TestDistrictIds.LongKhanh);

            // ProvinceId
            foreach (var district in provinces[0].Districts) district.ProvinceId = TestProvinceIds.HaNoi;
            foreach (var district in provinces[1].Districts) district.ProvinceId = TestProvinceIds.HoChiMinh;
            foreach (var district in provinces[2].Districts) district.ProvinceId = TestProvinceIds.DaNang;
            foreach (var district in provinces[3].Districts) district.ProvinceId = TestProvinceIds.AnGiang;
            foreach (var district in provinces[4].Districts) district.ProvinceId = TestProvinceIds.DongNai;

            return provinces;
        }

        private void AssignDistrictId(ICollection<District> districts, string districtName, int districtId)
        {
            var districtIdProperty = typeof(District).GetProperty("Id", BindingFlags.Public | BindingFlags.Instance);
            var targetDistrict = districts.First(d => d.Name == districtName);
            districtIdProperty.SetValue(targetDistrict, districtId);
        }
    }

}
