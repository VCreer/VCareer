namespace VCareer.Jwt
{
    public class JwtOptions
    {
        public string Key { get; set; }
        public string Issuer { get; set; }
        public string Audience { get; set; }
        public string ExpireMinutes { get; set; }
        public string? NotBeforeMinutes { get; set; }
        public string RefreshTokenExpireHours { get; set; }

    }
}
