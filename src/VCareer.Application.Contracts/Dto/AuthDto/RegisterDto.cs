using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Dto.AuthDto
{
    public class CandidateRegisterDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RecruiterRegisterDto
    {
        [Required]
        [StringLength(100)]
        public string Email { get; set; }
        [Required]
        [StringLength(100)]
        public string Password { get; set; }
        [Required]
        [StringLength(200)]
        public string Name { get; set; }
        [Required]
        [StringLength(12, MinimumLength = 10, ErrorMessage = "Phone number must be greater than 10 digits")]
        public string PhoneNumber { get; set; }
        [Required]
        [StringLength(150)]
        public string City { get; set; }
        [StringLength(150)]
        public string? District { get; set; }
        public bool IsCompany { get; set; }
        public string? CompanyName { get; set; }
        public string? Businesshouseholdname { get; set; }
        








    }

} 