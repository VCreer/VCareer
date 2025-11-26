using System.ComponentModel.DataAnnotations;

namespace VCareer.Dto.Profile
{
    public class VerifyPhoneNumberDto
    {
        [Required]
        [StringLength(16)]
        public string PhoneNumber { get; set; }

        [StringLength(10)]
        public string? OtpCode { get; set; }
    }
}


