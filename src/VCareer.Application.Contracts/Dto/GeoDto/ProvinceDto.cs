using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace VCareer.Dto.GeoDto
{
    public class ProvinceDto
    {
        [JsonPropertyName("code")]
        public int? Code { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("districts")]
        public ICollection<DistrictDto> Districts { get; set; } = new List<DistrictDto>();
    }

    public class DistrictDto
    {
        [JsonPropertyName("code")]
        public int? Code { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

         public ICollection<WardDto> Wards { get; set; } = new List<WardDto>();
    }

    public class WardDto
    {
        [JsonPropertyName("code")]
        public int? Code { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("division_type")]
        public string? DivisionType { get; set; }

       }
}
