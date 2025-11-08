using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using Volo.Abp.Security.Claims;

namespace VCareer.HttpApi.Host.Middleware
{
    /// <summary>
    /// Middleware để đảm bảo ICurrentPrincipalAccessor được update từ HttpContext.User
    /// Điều này đảm bảo ICurrentUser có thể đọc được claims từ JWT token
    /// </summary>
    public class JwtClaimsPrincipalMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ICurrentPrincipalAccessor _currentPrincipalAccessor;

        public JwtClaimsPrincipalMiddleware(RequestDelegate next, ICurrentPrincipalAccessor currentPrincipalAccessor)
        {
            _next = next;
            _currentPrincipalAccessor = currentPrincipalAccessor;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // QUAN TRỌNG: Update ICurrentPrincipalAccessor từ HttpContext.User
            // Điều này đảm bảo ICurrentUser có thể đọc được claims ngay cả khi OnTokenValidated chưa chạy
            if (context.User != null && context.User.Identity?.IsAuthenticated == true)
            {
                // Chỉ update nếu principal chưa được set hoặc khác với HttpContext.User
                var currentPrincipal = _currentPrincipalAccessor.Principal;
                if (currentPrincipal == null || currentPrincipal != context.User)
                {
                    _currentPrincipalAccessor.Current = context.User;
                }
            }

            await _next(context);
        }
    }
}








