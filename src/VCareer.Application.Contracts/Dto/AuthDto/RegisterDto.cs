using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static VCareer.Constants.Authentication.AuthenticationConstants;

namespace VCareer.Dto.AuthDto
{
    public class CandidateRegisterDto
    {

        [Required]
        [StringLength(100, MinimumLength = 5, ErrorMessage = "User name must be greater than 5 characters and less than 100 characters")]
        public string Name { get; set; }
        [Required]
        [StringLength(100)]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
    }

    public class RecruiterRegisterDto
    {
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        [StringLength(100, MinimumLength = 5, ErrorMessage = "User name must be greater than 5 characters and less than 100 characters")]
        public string Name { get; set; }
        [Required]
        [StringLength(12, MinimumLength = 10, ErrorMessage = "Phone number must be greater than 10 digits and less than 12 digits")]
        public string PhoneNumber { get; set; }
        [Required]
        public int ProvinceCode { get; set; }
        [Required]
        public int DistrictCode { get; set; }
        [Required]
        public string CompanyName { get; set; }
        [Required]
        public string TaxCode { get; set; }

    }

}