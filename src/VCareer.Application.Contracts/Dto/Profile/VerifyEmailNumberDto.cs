using System.ComponentModel.DataAnnotations;

namespace VCareer.Dto.Profile
{
    public class VerifyEmailNumberDto
    {
        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; }

        [StringLength(10)]
        public string? OtpCode { get; set; }
    }

    public class SendEmailOtpDto
    {
        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; }
    }
}


