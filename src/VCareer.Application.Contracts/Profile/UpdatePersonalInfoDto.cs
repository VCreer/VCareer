using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace VCareer.Profile
{
    public class UpdatePersonalInfoDto
    {
        [Required]
        [StringLength(256)]
        public string Name { get; set; }

        [Required]
        [StringLength(256)]
        public string Surname { get; set; }

        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; }

        [Phone]
        [StringLength(16)]
        public string PhoneNumber { get; set; }

        [StringLength(1000)]
        public string Bio { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public bool? Gender { get; set; }

        [StringLength(500)]
        public string Location { get; set; }

        [StringLength(1000)]
        public string Address { get; set; }

        [StringLength(100)]
        public string Nationality { get; set; }

        [StringLength(50)]
        public string MaritalStatus { get; set; }
    }
}
