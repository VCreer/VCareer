using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using VCareer.Dto.JwtDto;
using VCareer.IRepositories.ITokenRepository;
using VCareer.IServices.IAuth;
using VCareer.Models.Token;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.Security.Claims;
using Volo.Abp.Uow;

namespace VCareer.Jwt
{
    // do trên service trên Vcaree.Application nó yêu cầu tokengenerator nhưng 
    //cái ý lại phụ thuộc vào package dưới host và ko nên reference trực tiếp
    //2 cái module này , nên là trên application chỉ cấp interface, mình định nghĩa interface 
    //trong contract rồi dưới host mình tạo DI để khi runtime trên service chạy trên application.
    // đăng kí  di trong module host trong hàm ConfigureServices()
    public class JwtTokenGenerator : ITokenGenerator, ITransientDependency
    {
        private readonly IAbpClaimsPrincipalFactory _claimsPrincipalFactory;
        private readonly JwtOptions _jwtOptions;
        private readonly IRefreshtokenRepository _refreshtokenRepository;
        private readonly IdentityUserManager _userManager;
        private readonly IdentityRoleManager _roleManager;
        private readonly AbpUserClaimsPrincipalFactory _abpUserClaimsPrincipalFactory;

        public JwtTokenGenerator(IAbpClaimsPrincipalFactory claimsPrincipalFactory, IOptions<JwtOptions> jwtOptions, IRefreshtokenRepository refreshtokenRepository, IdentityUserManager userManager,IdentityRoleManager roleManager,AbpUserClaimsPrincipalFactory abpUserClaimsPrincipalFactory)
        {
            _claimsPrincipalFactory = claimsPrincipalFactory;
            _jwtOptions = jwtOptions.Value;
            _refreshtokenRepository = refreshtokenRepository;
            _userManager = userManager;
            _roleManager = roleManager;
            _abpUserClaimsPrincipalFactory = abpUserClaimsPrincipalFactory;

        }

        public async Task<TokenResponseDto> CreateTokenAsync(IdentityUser user)
        {
            var accessToken = await CreateAccessTokenAsync(user);
            var refreshToken = CreateRefreshTokenAsync(user);

            await _refreshtokenRepository.InsertAsync(refreshToken);

            return new TokenResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token
            };

        }

        private async Task<string> CreateAccessTokenAsync(IdentityUser user)
        {
            var identity = new ClaimsIdentity("Bearer");
            
            // Thêm các claims cơ bản
            identity.AddClaim(new Claim(AbpClaimTypes.UserId, user.Id.ToString()));
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
            // KHÔNG thêm "sub" claim ở đây - sẽ được xử lý sau khi factory tạo principal để tránh duplicate
            identity.AddClaim(new Claim(AbpClaimTypes.UserName, user.UserName ?? user.Email ?? ""));
            identity.AddClaim(new Claim(ClaimTypes.Email, user.Email ?? ""));
            identity.AddClaim(new Claim(AbpClaimTypes.Email, user.Email ?? ""));
            
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Count > 0) {
                foreach (var role in roles) {
                    identity.AddClaim(new Claim(ClaimTypes.Role, role));
                    identity.AddClaim(new Claim(AbpClaimTypes.Role, role));
                }
            }

            var basePrincipal = new ClaimsPrincipal(identity);
            //gắn claims tĩnh và động vào principal
            var principal = await _claimsPrincipalFactory.CreateAsync(basePrincipal);      // tạo principal với các claims tĩnh (ID, Email, Role,…)
         //   principal = await _claimsPrincipalFactory.CreateDynamicAsync(principal); // bổ sung claims động

            // QUAN TRỌNG: Đảm bảo chỉ có 1 "sub" claim duy nhất với giá trị là UserId (string)
            // JWT standard yêu cầu "sub" phải là string, không phải array
            // Nếu có duplicate "sub" claims, JWT sẽ serialize thành array và gây lỗi
            var claimsList = principal.Claims.ToList();
            var subClaims = claimsList.Where(c => c.Type == "sub" || c.Type == JwtRegisteredClaimNames.Sub).ToList();
            
            if (subClaims.Count > 0)
            {
                // Xóa tất cả "sub" claims (có thể có duplicate)
                claimsList.RemoveAll(c => c.Type == "sub" || c.Type == JwtRegisteredClaimNames.Sub);
                
                // Thêm lại 1 "sub" claim duy nhất với giá trị là UserId (string)
                // Sử dụng JwtRegisteredClaimNames.Sub để đảm bảo đúng chuẩn JWT
                claimsList.Add(new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()));
            }
            else
            {
                // Nếu không có "sub" claim, thêm vào
                claimsList.Add(new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtOptions.Issuer,
                audience: _jwtOptions.Audience,
                claims: claimsList, // Sử dụng claimsList đã được làm sạch (chỉ có 1 "sub" claim)
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(_jwtOptions.ExpireMinutes)),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private RefreshToken CreateRefreshTokenAsync(IdentityUser user)
        {
            return new RefreshToken
            {
                UserId = user.Id,
                Token = Guid.NewGuid().ToString(),
                IsRevoked = false,
                ExpireAt = DateTime.UtcNow.AddHours(double.Parse(_jwtOptions.RefreshTokenExpireHours)),
            };
        }

        public async Task<TokenResponseDto?> RefreshAsync(string refreshToken)
        {
            var token = await _refreshtokenRepository.FindByTokenAsync(refreshToken);
            if (token == null || token.IsRevoked || token.ExpireAt < DateTime.UtcNow) return null;

            var user = await _userManager.FindByIdAsync(token.UserId.ToString());
            if (user == null) return null;

            var newAcessToken = await CreateAccessTokenAsync(user);
            var newRefreshToken = CreateRefreshTokenAsync(user);

            token.IsRevoked = true;
            await _refreshtokenRepository.UpdateAsync(token);
            await _refreshtokenRepository.InsertAsync(newRefreshToken);

            return new TokenResponseDto
            {
                AccessToken = newAcessToken,
                RefreshToken = newRefreshToken.Token
            };
        }

        [UnitOfWork]
        public async Task CancleAsync(IdentityUser user)
        {
            // Lấy tất cả refresh tokens chưa bị revoke của user
            var tokens = await _refreshtokenRepository.GetListAsync(token => token.UserId == user.Id && token.IsRevoked == false);
            
            // Nếu không có tokens nào, return luôn
            if (!tokens.Any()) return;
            
            // Revoke tất cả refresh tokens của user (logout tất cả devices)
            foreach (var token in tokens)
            {
                token.IsRevoked = true;
            }
            
            // Update tất cả tokens đã bị revoke
            await _refreshtokenRepository.UpdateManyAsync(tokens);
        }

          }
}
