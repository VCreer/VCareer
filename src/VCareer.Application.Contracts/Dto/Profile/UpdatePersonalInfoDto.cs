using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Profile
{
    public class UpdatePersonalInfoDto
    {
        [Required(ErrorMessage = "Name is required")]
        [StringLength(256, ErrorMessage = "Name cannot exceed 256 characters")]
        public string Name { get; set; }

        [Required(ErrorMessage = "Surname is required")]
        [StringLength(256, ErrorMessage = "Surname cannot exceed 256 characters")]
        public string Surname { get; set; }

        // Email: Optional field - validation sẽ được thực hiện trong service layer
        // Bỏ [EmailAddress] attribute vì nó validate cả empty string
        [StringLength(256, ErrorMessage = "Email cannot exceed 256 characters")]
        public string? Email { get; set; }

        // PhoneNumber: Optional field - validation sẽ được thực hiện trong service layer
        // Bỏ [Phone] attribute vì nó validate cả empty string
        [StringLength(16, ErrorMessage = "Phone number cannot exceed 16 characters")]
        public string? PhoneNumber { get; set; }

        // Bio: Optional field - không có trong UI, không cần thiết phải nhập
        [StringLength(1000)]
        public string? Bio { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public bool? Gender { get; set; }

        [StringLength(500)]
        public string? Location { get; set; }

        [StringLength(1000)]
        public string? Address { get; set; }

        // Nationality: Optional field - không có trong UI, không cần thiết phải nhập
        [StringLength(100)]
        public string? Nationality { get; set; }

        // MaritalStatus: Optional field - không có trong UI, không cần thiết phải nhập
        [StringLength(50)]
        public string? MaritalStatus { get; set; }

        // Thông tin nghề nghiệp (chỉ áp dụng cho Candidate)
        [StringLength(200)]
        public string? JobTitle { get; set; } // Vị trí chuyên môn

        [StringLength(2000)]
        public string? Skills { get; set; } // Kỹ năng

        [Range(0, 100, ErrorMessage = "Kinh nghiệm phải từ 0 đến 100 năm")]
        public int? Experience { get; set; } // Kinh nghiệm (số năm)

        [Range(0, 9999999999999999.99, ErrorMessage = "Mức lương không hợp lệ")]
        public decimal? Salary { get; set; } // Mức lương mong muốn (decimal 18,2)

        [StringLength(500)]
        public string? WorkLocation { get; set; } // Địa điểm làm việc
    }
}
