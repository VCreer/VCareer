using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.IdentityModel.Tokens.Jwt;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Security.Claims;
using Volo.Abp.Users;

namespace VCareer.Helpers
{
    public class TokenClaimsHelper : ITransientDependency
    {
        private readonly ICurrentPrincipalAccessor _currentPrincipalAccessor;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<TokenClaimsHelper> _logger;

        public TokenClaimsHelper(
            ICurrentPrincipalAccessor currentPrincipalAccessor,
            IHttpContextAccessor httpContextAccessor,
            ILogger<TokenClaimsHelper> logger)
        {
            _currentPrincipalAccessor = currentPrincipalAccessor;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <summary>
        /// Lấy UserId từ token (nullable, không throw exception)
        /// </summary>
        public Guid? GetUserIdFromToken()
        {
            try
            {
                ClaimsPrincipal? principal = null;
                ClaimsIdentity? identity = null;

                // Ưu tiên sử dụng ICurrentPrincipalAccessor
                principal = _currentPrincipalAccessor.Principal;
                if (principal != null)
                {
                    identity = principal.Identity as ClaimsIdentity;
                    if (identity != null && identity.IsAuthenticated)
                    {
                        _logger.LogInformation("Using ICurrentPrincipalAccessor. Claims count: {Count}", identity.Claims.Count());
                        var userId = ExtractUserIdFromClaims(identity);
                        if (userId.HasValue)
                        {
                            return userId;
                        }
                    }
                }

                // Fallback: Sử dụng IHttpContextAccessor
                if (_httpContextAccessor.HttpContext != null)
                {
                    principal = _httpContextAccessor.HttpContext.User;
                    identity = principal?.Identity as ClaimsIdentity;
                    if (identity != null && identity.IsAuthenticated)
                    {
                        _logger.LogInformation("Using HttpContext. Claims count: {Count}", identity.Claims.Count());
                        var userId = ExtractUserIdFromClaims(identity);
                        if (userId.HasValue)
                        {
                            return userId;
                        }
                    }
                }

                _logger.LogError("No claims found from both ICurrentPrincipalAccessor and HttpContext");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting UserId from token");
                return null;
            }
        }

        /// <summary>
        /// Lấy UserId từ token (throw exception nếu không tìm thấy)
        /// </summary>
        public Guid GetUserIdFromTokenOrThrow()
        {
            var userId = GetUserIdFromToken();
            if (!userId.HasValue)
            {
                _logger.LogError("Không thể lấy UserId từ token. Vui lòng đăng nhập lại.");
                throw new UnauthorizedAccessException("Không thể lấy UserId từ token. Vui lòng đăng nhập lại.");
            }
            return userId.Value;
        }

        /// <summary>
        /// Extract UserId từ claims, tìm theo nhiều claim types
        /// </summary>
        private Guid? ExtractUserIdFromClaims(ClaimsIdentity identity)
        {
            // Tìm theo thứ tự ưu tiên:
            // 1. AbpClaimTypes.UserId
            // 2. ClaimTypes.NameIdentifier  
            // 3. "sub"
            // 4. JwtRegisteredClaimNames.Sub

            string[] claimTypes = new[]
            {
                AbpClaimTypes.UserId,
                ClaimTypes.NameIdentifier,
                "sub",
                JwtRegisteredClaimNames.Sub
            };

            foreach (var claimType in claimTypes)
            {
                var claim = identity.FindFirst(claimType);
                if (claim != null && !string.IsNullOrWhiteSpace(claim.Value))
                {
                    // Log để debug
                    _logger.LogDebug("Found UserId from claim type: {ClaimType}, value: {Value}", claimType, claim.Value);

                    // Try parse as Guid
                    if (Guid.TryParse(claim.Value, out Guid userId))
                    {
                        return userId;
                    }

                    // Nếu không parse được, log warning
                    _logger.LogWarning("Cannot parse UserId from claim type {ClaimType}, value: {Value}", claimType, claim.Value);
                }
            }

            _logger.LogWarning("No valid UserId claim found in identity");
            return null;
        }
    }
}
