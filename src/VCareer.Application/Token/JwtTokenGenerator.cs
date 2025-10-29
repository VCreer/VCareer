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
using VCareer.IRepositories.TokenRepository;
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

        public JwtTokenGenerator(IAbpClaimsPrincipalFactory claimsPrincipalFactory, IOptions<JwtOptions> jwtOptions, IRefreshtokenRepository refreshtokenRepository, IdentityUserManager userManager,IdentityRoleManager roleManager)
        {
            _claimsPrincipalFactory = claimsPrincipalFactory;
            _jwtOptions = jwtOptions.Value;
            _refreshtokenRepository = refreshtokenRepository;
            _userManager = userManager;
            _roleManager = roleManager;
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
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
            identity.AddClaim(new Claim(ClaimTypes.Email, user.Email.ToString()));
            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Count > 0) {
                foreach (var role in roles) {

                    identity.AddClaim(new Claim(ClaimTypes.Role,role)); 
                }
            }

            var basePrincipal = new ClaimsPrincipal(identity);
            //gắn claims tĩnh và động vào principal
            var principal = await _claimsPrincipalFactory.CreateAsync(basePrincipal);      // tạo principal với các claims tĩnh (ID, Email, Role,…)
         //   principal = await _claimsPrincipalFactory.CreateDynamicAsync(principal); // bổ sung claims động


            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtOptions.Issuer,
                audience: _jwtOptions.Audience,
                claims: principal.Claims,
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

            var tokens = await _refreshtokenRepository.GetListAsync(token => token.UserId == user.Id && token.IsRevoked == false);
            if (tokens.Any()) return;
            
                foreach (var token in tokens)
                {
                    token.IsRevoked = true;
                }
            await _refreshtokenRepository.UpdateManyAsync(tokens);
        }

          }
}
