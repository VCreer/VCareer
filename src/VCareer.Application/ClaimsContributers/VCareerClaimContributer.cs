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

            var userIdClaim = identity.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId)) return;

            var user = await _identityUserRepository.FindAsync(userId);

            await SubcriptionPlanClaimsAsync(identity, user);
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