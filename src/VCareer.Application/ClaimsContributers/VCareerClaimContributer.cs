using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Security.Claims;

namespace VCareer.Security
{
    public class VCareerClaimContributer : IAbpClaimsPrincipalContributor, ITransientDependency
    {
        private readonly IIdentityUserRepository _identityUserRepository;
        public VCareerClaimContributer(IIdentityUserRepository identityUserRepository)
        {
            _identityUserRepository = identityUserRepository;
        }
        public async Task ContributeAsync(AbpClaimsPrincipalContributorContext context)
        {
            var principle = context.ClaimsPrincipal;
            var identity = principle.Identities.FirstOrDefault(i => i.IsAuthenticated == true);
            if (identity == null) return;

            // Tìm UserId từ nhiều nguồn có thể
            var userIdClaim = identity.FindFirst(AbpClaimTypes.UserId)
                ?? identity.FindFirst(ClaimTypes.NameIdentifier)
                ?? identity.FindFirst("sub");
            
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId)) return;

            // Đảm bảo có AbpClaimTypes.UserId claim (quan trọng cho GetId())
            if (!identity.HasClaim(c => c.Type == AbpClaimTypes.UserId))
            {
                identity.AddClaim(new Claim(AbpClaimTypes.UserId, userId.ToString()));
            }

            var user = await _identityUserRepository.FindAsync(userId);
            if (user != null)
            {
                // QUAN TRỌNG: Populate các claims cần thiết cho ICurrentUser nếu chưa có trong token
                // Đảm bảo các ABP claim types được set đúng để CurrentUser có thể đọc được
                
                // Email claim
                if (!identity.HasClaim(c => c.Type == AbpClaimTypes.Email) && !string.IsNullOrEmpty(user.Email))
                {
                    identity.AddClaim(new Claim(AbpClaimTypes.Email, user.Email));
                }
                
                // UserName claim (nếu chưa có)
                if (!identity.HasClaim(c => c.Type == AbpClaimTypes.UserName) && !string.IsNullOrEmpty(user.UserName))
                {
                    identity.AddClaim(new Claim(AbpClaimTypes.UserName, user.UserName));
                }
                
                // Name claim (nếu chưa có)
                if (!identity.HasClaim(c => c.Type == AbpClaimTypes.Name) && !string.IsNullOrEmpty(user.Name))
                {
                    identity.AddClaim(new Claim(AbpClaimTypes.Name, user.Name));
                }
                
                // Surname claim (nếu chưa có)
                if (!identity.HasClaim(c => c.Type == AbpClaimTypes.SurName) && !string.IsNullOrEmpty(user.Surname))
                {
                    identity.AddClaim(new Claim(AbpClaimTypes.SurName, user.Surname));
                }
                
                // PhoneNumber claim (nếu chưa có)
                if (!identity.HasClaim(c => c.Type == AbpClaimTypes.PhoneNumber) && !string.IsNullOrEmpty(user.PhoneNumber))
                {
                    identity.AddClaim(new Claim(AbpClaimTypes.PhoneNumber, user.PhoneNumber));
                }
                
                // EmailVerified claim
                if (!identity.HasClaim(c => c.Type == AbpClaimTypes.EmailVerified))
                {
                    identity.AddClaim(new Claim(AbpClaimTypes.EmailVerified, user.EmailConfirmed.ToString().ToLower()));
                }
                
                // PhoneNumberVerified claim
                if (!identity.HasClaim(c => c.Type == AbpClaimTypes.PhoneNumberVerified))
                {
                    identity.AddClaim(new Claim(AbpClaimTypes.PhoneNumberVerified, user.PhoneNumberConfirmed.ToString().ToLower()));
                }
                
                // Roles - đảm bảo có AbpClaimTypes.Role cho mỗi role
                // (Roles đã được thêm trong token generation, nhưng đảm bảo có cả AbpClaimTypes.Role)
                
                await SubcriptionPlanClaimsAsync(identity, user);
            }
        }
        private async Task SubcriptionPlanClaimsAsync(ClaimsIdentity identity, IdentityUser user)
        {
            if (identity.HasClaim(c => c.Type == "SubcriptionPlan")) return;
            //logic ...

        }
        //  Số lượt đăng còn lại, cập nhật liên tục.
        private async Task CreditsRemaining(AbpClaimsPrincipalContributorContext context, IdentityUser user)
        {
        }
        //Cho phép nâng tin hay không, dựa trên gói dịch vụ.
        private async Task CanBoostJob(AbpClaimsPrincipalContributorContext context, IdentityUser user)
        {
        }
        //Danh sách IP hợp lệ (nếu bạn muốn tránh query DB cho mỗi request).
        private async Task IpWhitelist(AbpClaimsPrincipalContributorContext context, IdentityUser user)
        {
        }
        //Danh sách feature đang bật cho user (ví dụ TalentPool, JobBoost).
        private async Task EnabledFeatures(AbpClaimsPrincipalContributorContext context, IdentityUser user)
        {
        }




    }
}
