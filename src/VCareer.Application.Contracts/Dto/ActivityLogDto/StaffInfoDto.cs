using System;

namespace VCareer.Dto.ActivityLogDto
{
    public class StaffInfoDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public string FullName { get; set; }
        public bool IsLead { get; set; }
        public bool Status { get; set; }
    }
}







































