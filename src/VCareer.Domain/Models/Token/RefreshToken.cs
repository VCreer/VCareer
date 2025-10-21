using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.Token
{
    public class RefreshToken : Entity<Guid>
    {
        public Guid UserId { get; set; }
        public string Token { get; set; } = default!;
        public DateTime ExpireAt { get; set; }
        public bool IsRevoked { get; set; }
    }
}
