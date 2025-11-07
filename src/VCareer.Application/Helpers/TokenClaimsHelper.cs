using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Security.Claims;
using Volo.Abp.Users;

namespace VCareer.Helpers
{
    /// <summary>
    /// Helper để lấy UserId từ JWT Token Claims
    /// </summary>
    public class TokenClaimsHelper : ITransientDependency
    {
        private readonly ICurrentPrincipalAccessor _principalAccessor;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<TokenClaimsHelper> _logger;

        public TokenClaimsHelper(
            ICurrentPrincipalAccessor principalAccessor,
            IHttpContextAccessor httpContextAccessor,
            ILogger<TokenClaimsHelper> logger)
        {
            _principalAccessor = principalAccessor;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <summary>
        /// Lấy UserId từ token claims
        /// Ưu tiên: AbpClaimTypes.UserId > "sub" > ClaimTypes.NameIdentifier
        /// </summary>
        /// <returns>UserId hoặc null nếu không tìm thấy</returns>
        public Guid? GetUserIdFromToken()
        {
            // Thử lấy từ ICurrentPrincipalAccessor trước
            var principal = _principalAccessor.Principal;
            System.Collections.Generic.IEnumerable<Claim> claims = null;

            if (principal != null)
            {
                claims = principal.Claims;
                _logger.LogInformation("Using ICurrentPrincipalAccessor. Claims count: {Count}", claims?.Count() ?? 0);
            }
            else
            {
                _logger.LogWarning("ICurrentPrincipalAccessor.Principal is null, trying HttpContext");
            }

            // Fallback: Thử lấy từ HttpContext
            if (claims == null || !claims.Any())
            {
                var httpContext = _httpContextAccessor?.HttpContext;
                if (httpContext != null && httpContext.User != null)
                {
                    claims = httpContext.User.Claims;
                    _logger.LogInformation("Using HttpContext.User. Claims count: {Count}", claims?.Count() ?? 0);
                }
                else
                {
                    _logger.LogWarning("HttpContext.User is also null");
                }
            }

            if (claims == null || !claims.Any())
            {
                _logger.LogError("No claims found from both ICurrentPrincipalAccessor and HttpContext");
                return null;
            }

            // Debug: Log tất cả claim types với level Information để dễ debug
            var allClaimTypes = claims.Select(c => $"{c.Type}={c.Value}").ToList();
            _logger.LogInformation("All available claims: {Claims}", string.Join("; ", allClaimTypes));

            // Ưu tiên tìm theo thứ tự: AbpClaimTypes.UserId > "sub" > ClaimTypes.NameIdentifier
            var userIdClaim = claims.FirstOrDefault(c => c.Type == AbpClaimTypes.UserId)
                ?? claims.FirstOrDefault(c => c.Type == "sub")
                ?? claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)
                ?? claims.FirstOrDefault(c => c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");

            if (userIdClaim == null)
            {
                _logger.LogWarning("UserId claim not found. Looking for: AbpClaimTypes.UserId, 'sub', ClaimTypes.NameIdentifier");
                return null;
            }

            if (string.IsNullOrEmpty(userIdClaim.Value))
            {
                _logger.LogWarning("UserId claim value is empty. Claim type: {ClaimType}", userIdClaim.Type);
                return null;
            }

            // Guid.TryParse hỗ trợ cả uppercase và lowercase
            var userIdValue = userIdClaim.Value.Trim();
            _logger.LogInformation("Found userId claim: Type={Type}, Value={Value}", userIdClaim.Type, userIdValue);

            if (Guid.TryParse(userIdValue, out Guid userId))
            {
                _logger.LogInformation("Successfully parsed userId: {UserId}", userId);
                return userId;
            }

            _logger.LogError("Failed to parse userId from value: {Value}", userIdValue);
            return null;
        }

        /// <summary>
        /// Lấy UserId từ token claims và throw exception nếu không tìm thấy
        /// </summary>
        /// <returns>UserId</returns>
        /// <exception cref="UnauthorizedAccessException">Nếu không tìm thấy UserId</exception>
        public Guid GetUserIdFromTokenOrThrow()
        {
            var userId = GetUserIdFromToken();
            if (userId == null || userId == Guid.Empty)
            {
                throw new UnauthorizedAccessException("Không thể lấy UserId từ token. Vui lòng đăng nhập lại.");
            }

            return userId.Value;
        }
    }
}

