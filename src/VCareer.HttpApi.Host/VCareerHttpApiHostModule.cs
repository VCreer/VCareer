using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using OpenIddict.Server.AspNetCore;
using OpenIddict.Validation.AspNetCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Files.BlobContainers;
using VCareer.HealthChecks;
using VCareer.IServices.IAuth;
using VCareer.Jwt;
using VCareer.MultiTenancy;
using VCareer.Security;
using Volo.Abp;
using Volo.Abp.Account;
using Volo.Abp.Account.Web;
using Volo.Abp.AspNetCore.MultiTenancy;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc.AntiForgery;
using Volo.Abp.AspNetCore.Mvc.UI.Bundling;
using Volo.Abp.AspNetCore.Mvc.UI.Theme.LeptonXLite;
using Volo.Abp.AspNetCore.Mvc.UI.Theme.LeptonXLite.Bundling;
using Volo.Abp.AspNetCore.Mvc.UI.Theme.Shared;
using Volo.Abp.AspNetCore.Serilog;
using Volo.Abp.Autofac;
using Volo.Abp.BlobStoring;
using Volo.Abp.BlobStoring.FileSystem;
using Volo.Abp.Identity;
using Volo.Abp.Localization;
using Volo.Abp.Modularity;
using Volo.Abp.OpenIddict;
using Volo.Abp.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Volo.Abp.Studio;
using Volo.Abp.Studio.Client.AspNetCore;
using Volo.Abp.Swashbuckle;
using Volo.Abp.UI.Navigation.Urls;
using Volo.Abp.Users;
using Volo.Abp.VirtualFileSystem;
using System.IdentityModel.Tokens.Jwt;

namespace VCareer;

[DependsOn(
    typeof(VCareerHttpApiModule),
    typeof(AbpStudioClientAspNetCoreModule),
    typeof(AbpAspNetCoreMvcUiLeptonXLiteThemeModule),
    typeof(AbpAutofacModule),
    typeof(AbpAspNetCoreMultiTenancyModule),
      typeof(VCareerApplicationModule),
    typeof(VCareerEntityFrameworkCoreModule),
    typeof(AbpAccountWebOpenIddictModule),
    typeof(AbpSwashbuckleModule),
    typeof(AbpAspNetCoreSerilogModule),
    typeof(AbpBlobStoringFileSystemModule)
    )]
public class VCareerHttpApiHostModule : AbpModule
{
    public override void PreConfigureServices(ServiceConfigurationContext context)
    {
        var hostingEnvironment = context.Services.GetHostingEnvironment();
        var configuration = context.Services.GetConfiguration();

        PreConfigure<OpenIddictBuilder>(builder =>
        {
            builder.AddValidation(options =>
            {
                options.AddAudiences("VCareer");
                options.UseLocalServer();
                options.UseAspNetCore();
            });
        });

        if (!hostingEnvironment.IsDevelopment())
        {
            PreConfigure<AbpOpenIddictAspNetCoreOptions>(options =>
            {
                options.AddDevelopmentEncryptionAndSigningCertificate = false;
            });

            PreConfigure<OpenIddictServerBuilder>(serverBuilder =>
            {
                serverBuilder.AddProductionEncryptionAndSigningCertificate("openiddict.pfx", configuration["AuthServer:CertificatePassPhrase"]!);
                serverBuilder.SetIssuer(new Uri(configuration["AuthServer:Authority"]!));
            });
        }
    }

    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        var configuration = context.Services.GetConfiguration();
        var hostingEnvironment = context.Services.GetHostingEnvironment();


        if (!configuration.GetValue<bool>("App:DisablePII"))
        {
            Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true;
            Microsoft.IdentityModel.Logging.IdentityModelEventSource.LogCompleteSecurityArtifact = true;
        }

        if (!configuration.GetValue<bool>("AuthServer:RequireHttpsMetadata"))
        {
            Configure<OpenIddictServerAspNetCoreOptions>(options =>
            {
                options.DisableTransportSecurityRequirement = true;
            });

            Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders = ForwardedHeaders.XForwardedProto;
            });
        }

        ConfigureAuthentication(context, configuration);
        ConfigureUrls(configuration);
        ConfigureBundles();
        ConfigureConventionalControllers();
        ConfigureHealthChecks(context);
        ConfigureSwagger(context, configuration);
        ConfigureVirtualFileSystem(context);
        ConfigureCors(context, configuration);
        ConfigureJwtOptions(configuration);
        ConfigureBlobStorings(context); //đăng kí cho lưu trữ file blob
        ConfigureGoogleOptions(configuration);
        //  ConfigureClaims();
    }



    //ánh xạ appsetting.json vào JwtOptions trong contract để cho genẻate token trong application  sử dụng
    private void ConfigureJwtOptions(IConfiguration configuration)
    {
        Configure<JwtOptions>(configuration.GetSection("Authentication:Jwt"));
    }

    private void ConfigureGoogleOptions(IConfiguration configuration)
    {
        Configure<VCareer.OptionConfigs.GoogleOptions>(configuration.GetSection("Authentication:Google"));
    }
    private void ConfigureAuthentication(ServiceConfigurationContext context, IConfiguration configuration)
    {
        // KHÔNG ForwardIdentityAuthenticationForBearer vì nó sẽ force tất cả JWT Bearer authentication 
        // đi qua OpenIddict validation (không validate được custom JWT tokens)
        // context.Services.ForwardIdentityAuthenticationForBearer(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);

        context.Services.Configure<AbpClaimsPrincipalFactoryOptions>(options =>
        {
            options.IsDynamicClaimsEnabled = true;
        });

        //config DI token generator 
        context.Services.AddTransient<ITokenGenerator, JwtTokenGenerator>();

        // Cấu hình Authorization để đảm bảo [Authorize] hoạt động đúng
        context.Services.AddAuthorization(options =>
        {
            // Đảm bảo default policy yêu cầu authenticated user
            if (options.DefaultPolicy == null)
            {
                options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
            }
        });

        // Cấu hình JWT Bearer Authentication cho custom JWT tokens
        // Đặt JWT Bearer làm default authentication scheme để validate custom JWT tokens
        context.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            // Đảm bảo unauthenticated requests được reject
            options.DefaultForbidScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
        {
            // Đảm bảo token được save vào HttpContext để có thể access sau
            options.SaveToken = true;

            // Lấy JwtOptions từ configuration
            var jwtSection = configuration.GetSection("Authentication:Jwt");
            var jwtKey = jwtSection["Key"];
            var jwtIssuer = jwtSection["Issuer"];
            var jwtAudience = jwtSection["Audience"];

            if (!string.IsNullOrEmpty(jwtKey) && !string.IsNullOrEmpty(jwtIssuer) && !string.IsNullOrEmpty(jwtAudience))
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = jwtAudience,
                    ValidateLifetime = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)),
                    ValidateIssuerSigningKey = true,
                    // Map claims cho ABP Framework
                    NameClaimType = ClaimTypes.NameIdentifier,
                    RoleClaimType = ClaimTypes.Role,
                    // KHÔNG set RequireExpirationTime = false - để đảm bảo token có expiration
                    RequireExpirationTime = true,
                    ClockSkew = TimeSpan.Zero // Không cho phép clock skew để tránh vấn đề về thời gian
                };
            }

            //options.Events = new JwtBearerEvents
            //{
            //    OnTokenValidated = async context =>
            //    {
            //        // Đảm bảo claims được map đúng cho ABP Framework
            //        var identity = context.Principal?.Identity as ClaimsIdentity;
            //        if (identity != null)
            //        {
            //            // QUAN TRỌNG: Đảm bảo identity được đánh dấu là authenticated
            //            // Nếu không có, JWT Bearer sẽ không set IsAuthenticated = true
            //            if (!identity.IsAuthenticated)
            //            {
            //                // Tạo lại identity với authentication type "Bearer"
            //                var newIdentity = new ClaimsIdentity(identity.Claims, "Bearer", identity.NameClaimType, identity.RoleClaimType);
            //                context.Principal = new ClaimsPrincipal(newIdentity);
            //                identity = newIdentity;
            //            }

            //            // QUAN TRỌNG: Đảm bảo HttpContext.User được set
            //            if (context.HttpContext != null && context.Principal != null)
            //            {
            //                context.HttpContext.User = context.Principal;
            //            }

            //            System.Console.WriteLine($"[JWT Bearer] Token validated. IsAuthenticated: {identity.IsAuthenticated}, Claims count: {identity.Claims.Count()}");

            //            // Tìm UserId từ các claims có thể có
            //            var userIdClaim = identity.FindFirst(AbpClaimTypes.UserId) 
            //                ?? identity.FindFirst(ClaimTypes.NameIdentifier)
            //                ?? identity.FindFirst("sub")
            //                ?? identity.FindFirst(JwtRegisteredClaimNames.Sub);

            //            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
            //            {
            //                System.Console.WriteLine($"[JWT Bearer] Found UserId: {userId} from claim type: {userIdClaim.Type}");

            //                // Đảm bảo có AbpClaimTypes.UserId claim (QUAN TRỌNG cho GetId())
            //                if (!identity.HasClaim(c => c.Type == AbpClaimTypes.UserId))
            //                {
            //                    identity.AddClaim(new Claim(AbpClaimTypes.UserId, userId.ToString()));
            //                    System.Console.WriteLine($"[JWT Bearer] Added AbpClaimTypes.UserId claim: {userId}");
            //                }
            //            }
            //            else
            //            {
            //                System.Console.WriteLine("[JWT Bearer] UserId claim not found or invalid!");
            //            }
            //        }
            //        else
            //        {
            //            System.Console.WriteLine("[JWT Bearer] Identity is null!");
            //        }

            //        await Task.CompletedTask;
            //    },
            //    OnAuthenticationFailed = context =>
            //    {
            //        // Log lỗi authentication để debug
            //        var exception = context.Exception;
            //        // Log vào console để debug
            //        System.Console.WriteLine($"[JWT Bearer] Authentication failed: {exception?.Message}");
            //        if (exception?.InnerException != null)
            //        {
            //            System.Console.WriteLine($"[JWT Bearer] Inner exception: {exception.InnerException.Message}");
            //        }
            //        // KHÔNG handle response ở đây - để authorization middleware xử lý
            //        // Nếu handle response, sẽ trả về 200 thay vì 401
            //        return Task.CompletedTask;
            //    },
            //    OnMessageReceived = context =>
            //    {
            //        // Debug: Kiểm tra xem token có được gửi trong header không
            //        var token = context.Token;
            //        if (string.IsNullOrEmpty(token))
            //        {
            //            System.Console.WriteLine("[JWT Bearer] No token found in Authorization header");
            //        }
            //        else
            //        {
            //            System.Console.WriteLine($"[JWT Bearer] Token received: {token.Substring(0, Math.Min(20, token.Length))}...");
            //        }
            //        return Task.CompletedTask;
            //    },
            //    OnChallenge = context =>
            //    {
            //        // Set status code 401 cho unauthorized requests
            //        // QUAN TRỌNG: Handle response và set status code + body
            //        context.HandleResponse();
            //        context.Response.StatusCode = 401;
            //        context.Response.Headers.Append("WWW-Authenticate", "Bearer");

            //        // Đảm bảo có response body để tránh empty body
            //        var responseBody = System.Text.Json.JsonSerializer.Serialize(new
            //        {
            //            error = "Unauthorized",
            //            error_description = "Authentication required. Please provide a valid token."
            //        });

            //        context.Response.ContentType = "application/json";
            //        context.Response.WriteAsync(responseBody);

            //        return Task.CompletedTask;
            //    }
            //};
        });
    }

    private void ConfigureUrls(IConfiguration configuration)
    {
        Configure<AppUrlOptions>(options =>
        {
            options.Applications["MVC"].RootUrl = configuration["App:SelfUrl"];
            options.Applications["Angular"].RootUrl = configuration["App:AngularUrl"];
            options.Applications["Angular"].Urls[AccountUrlNames.PasswordReset] = "account/reset-password";
            options.RedirectAllowedUrls.AddRange(configuration["App:RedirectAllowedUrls"]?.Split(',') ?? Array.Empty<string>());
        });
    }

    private void ConfigureBundles()
    {
        Configure<AbpBundlingOptions>(options =>
        {
            options.StyleBundles.Configure(
                LeptonXLiteThemeBundles.Styles.Global,
                bundle =>
                {
                    bundle.AddFiles("/global-styles.css");
                }
            );

            options.ScriptBundles.Configure(
                LeptonXLiteThemeBundles.Scripts.Global,
                bundle =>
                {
                    bundle.AddFiles("/global-scripts.js");
                }
            );
        });
    }

    private void ConfigureBlobStorings(ServiceConfigurationContext context)
    {
        Configure<AbpBlobStoringOptions>(options =>
        {
            options.Containers.Configure<CandidateContainer>(container =>
            {
                container.UseFileSystem(fileSystem =>
                {
                    fileSystem.BasePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/blobs/Candidate");
                });
            });

            options.Containers.Configure<RecruiterContainer>(container =>
            {
                container.UseFileSystem(fileSystem =>
                {
                    fileSystem.BasePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/blobs/Recruiter");
                });
            });

            options.Containers.Configure<EmployeeContainer>(container =>
            {
                container.UseFileSystem(fileSystem =>
                {
                    fileSystem.BasePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/blobs/Employee");
                });
            });

            options.Containers.Configure<SystemContainer>(container =>
            {
                container.UseFileSystem(fileSystem =>
                {

                    fileSystem.BasePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/blobs/System");
                });

            });
        });
    }


    private void ConfigureVirtualFileSystem(ServiceConfigurationContext context)
    {
        var hostingEnvironment = context.Services.GetHostingEnvironment();

        if (hostingEnvironment.IsDevelopment())
        {
            Configure<AbpVirtualFileSystemOptions>(options =>
            {
                options.FileSets.ReplaceEmbeddedByPhysical<VCareerDomainSharedModule>(Path.Combine(hostingEnvironment.ContentRootPath, $"..{Path.DirectorySeparatorChar}VCareer.Domain.Shared"));
                options.FileSets.ReplaceEmbeddedByPhysical<VCareerDomainModule>(Path.Combine(hostingEnvironment.ContentRootPath, $"..{Path.DirectorySeparatorChar}VCareer.Domain"));
                options.FileSets.ReplaceEmbeddedByPhysical<VCareerApplicationContractsModule>(Path.Combine(hostingEnvironment.ContentRootPath, $"..{Path.DirectorySeparatorChar}VCareer.Application.Contracts"));
                options.FileSets.ReplaceEmbeddedByPhysical<VCareerApplicationModule>(Path.Combine(hostingEnvironment.ContentRootPath, $"..{Path.DirectorySeparatorChar}VCareer.Application"));
            });
        }
    }

    private void ConfigureConventionalControllers()
    {
        Configure<AbpAspNetCoreMvcOptions>(options =>
        {
            options.ConventionalControllers.Create(typeof(VCareerApplicationModule).Assembly);
        });

        // Disable antiforgery token validation cho tất cả API controllers
        // ABP Framework sẽ tự động validate antiforgery token cho các non-API controllers
        Configure<AbpAntiForgeryOptions>(options =>
        {
            // Không validate antiforgery token cho các API controllers
            // Các API endpoints đã có JWT Bearer authentication nên không cần antiforgery
            options.AutoValidateFilter = type =>
            {
                // Nếu là API controller (namespace chứa "HttpApi" hoặc FullName chứa "HttpApi.Controllers")
                // thì KHÔNG validate antiforgery (return false)
                // Ngược lại, validate antiforgery (return true)
                if (type.Namespace != null && type.Namespace.Contains("HttpApi"))
                {
                    return false; // Không validate cho API controllers
                }
                if (type.FullName != null && type.FullName.Contains("HttpApi.Controllers"))
                {
                    return false; // Không validate cho API controllers
                }
                return true; // Validate cho các controllers khác
            };
        });
    }

    private static void ConfigureSwagger(ServiceConfigurationContext context, IConfiguration configuration)
    {
        context.Services.AddAbpSwaggerGen(
            options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo { Title = "VCareer API", Version = "v1" });
                options.DocInclusionPredicate((docName, description) => true);
                options.CustomSchemaIds(type => type.FullName);

                // Thêm JWT Bearer Authentication vào Swagger
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.\nExample: \"Bearer 12345abcdef\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                    BearerFormat = "JWT"
                });

                // Áp dụng security scheme cho tất cả endpoints
                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });
    }

    private void ConfigureCors(ServiceConfigurationContext context, IConfiguration configuration)
    {
        context.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(builder =>
            {
                builder
                    .WithOrigins(
                        configuration["App:CorsOrigins"]?
                            .Split(",", StringSplitOptions.RemoveEmptyEntries)
                            .Select(o => o.Trim().RemovePostFix("/"))
                            .ToArray() ?? Array.Empty<string>()
                    )
                    .WithAbpExposedHeaders()
                    .SetIsOriginAllowedToAllowWildcardSubdomains()
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });
    }

    private void ConfigureHealthChecks(ServiceConfigurationContext context)
    {
        context.Services.AddVCareerHealthChecks();
    }

    public override void OnApplicationInitialization(ApplicationInitializationContext context)
    {
        var app = context.GetApplicationBuilder();
        var env = context.GetEnvironment();

        app.UseForwardedHeaders();

        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
        }

        app.UseAbpRequestLocalization();

        if (!env.IsDevelopment())
        {
            app.UseErrorPage();
        }

        app.UseRouting();
        app.MapAbpStaticAssets();
        app.UseAbpStudioLink();
        app.UseAbpSecurityHeaders();
        app.UseCors();
        app.UseAuthentication();
        // Tạm thời comment UseAbpOpenIddictValidation để test JWT Bearer authentication
        // Nếu bạn cần OpenIddict cho các tính năng khác, có thể bật lại sau
        // app.UseAbpOpenIddictValidation();

        if (MultiTenancyConsts.IsEnabled)
        {
            app.UseMultiTenancy();
        }

        app.UseUnitOfWork();
        app.UseDynamicClaims();
        app.UseAuthorization();

        app.UseSwagger();
        app.UseAbpSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "VCareer API");
        });
        app.UseAuditing();
        app.UseAbpSerilogEnrichers();
        app.UseConfiguredEndpoints();
    }


}