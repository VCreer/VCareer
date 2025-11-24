using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using OpenIddict.Server.AspNetCore;
using OpenIddict.Validation.AspNetCore;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using VCareer.EntityFrameworkCore;
using VCareer.Files.BlobContainers;
using VCareer.HealthChecks;
using VCareer.HttpApi.Host.Swagger;
using VCareer.IServices.IAuth;
using VCareer.Jwt;
using VCareer.MultiTenancy;
using VCareer.Security;
using Volo.Abp;
using Volo.Abp.Account;
using Volo.Abp.AspNetCore.MultiTenancy;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc.AntiForgery;
using Volo.Abp.AspNetCore.Mvc.UI.Bundling;
using Volo.Abp.AspNetCore.Mvc.UI.Theme.LeptonXLite;
using Volo.Abp.AspNetCore.Mvc.UI.Theme.LeptonXLite.Bundling;
using Volo.Abp.AspNetCore.Mvc.UI.Theme.Shared;
using Volo.Abp.AspNetCore.Security;
using Volo.Abp.AspNetCore.Serilog;
using Volo.Abp.Autofac;
using Volo.Abp.BlobStoring;
using Volo.Abp.BlobStoring.FileSystem;
using Volo.Abp.Caching;
using Volo.Abp.Identity;
using Volo.Abp.Localization;
using Volo.Abp.Modularity;
//using Volo.Abp.OpenIddict;
using Volo.Abp.Security.Claims;
//using Volo.Abp.Studio;
using Volo.Abp.Studio.Client.AspNetCore;
using Volo.Abp.Swashbuckle;
using Volo.Abp.UI.Navigation.Urls;
using Volo.Abp.Users;
using Volo.Abp.VirtualFileSystem;
using VNPAY;


namespace VCareer;

[DependsOn(
    typeof(VCareerHttpApiModule),
   typeof(AbpStudioClientAspNetCoreModule),
    typeof(AbpAspNetCoreMvcUiLeptonXLiteThemeModule),
    typeof(AbpAutofacModule),
    typeof(AbpAspNetCoreMultiTenancyModule),
    typeof(VCareerApplicationModule),
    typeof(VCareerEntityFrameworkCoreModule),
    typeof(AbpSwashbuckleModule),
    typeof(AbpAspNetCoreSerilogModule),
    typeof(AbpBlobStoringFileSystemModule)

    )]
public class VCareerHttpApiHostModule : AbpModule
{
    public override void PreConfigureServices(ServiceConfigurationContext context)
    {
        Configure<AbpAntiForgeryOptions>(options =>
        {
            options.AutoValidate = false;
        });
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
        ConfigureDistributedCache(context, configuration);

        //cái này để ghi đè cái trạng thái set cookie strict => chỉ gửi cookie nếu chung domain
        //trong khi api hiện tịa của dự án và angular là 2 port khác nhau
        ConfigureCookiePolicy(context);
        
        // 🔧 ĐĂNG KÝ VNPAY CLIENT (from VNPAY.NET package)
        // Register in HttpApi.Host module where we have access to IConfiguration
        ConfigureVnpay(context, configuration);

      
    }
    
    private void ConfigureVnpay(ServiceConfigurationContext context, IConfiguration configuration)
    {
        // Register IHttpContextAccessor if not already registered
        if (!context.Services.Any(s => s.ServiceType == typeof(IHttpContextAccessor)))
        {
            context.Services.AddHttpContextAccessor();
        }
        
        // Find VnpayClient and get options type from constructor
        var vnpayAssembly = typeof(IVnpayClient).Assembly;
        var vnpayClientType = vnpayAssembly.GetTypes()
            .FirstOrDefault(t => t.Name == "VnpayClient" && typeof(IVnpayClient).IsAssignableFrom(t));
        
        if (vnpayClientType == null)
        {
            throw new InvalidOperationException("Cannot find VnpayClient class in VNPAY.NET assembly");
        }
        
        // Get constructor that takes IOptions and IHttpContextAccessor
        var constructor = vnpayClientType.GetConstructors()
            .FirstOrDefault(c => c.GetParameters().Length == 2 &&
                                 c.GetParameters().Any(p => p.ParameterType.Name.Contains("Options")) &&
                                 c.GetParameters().Any(p => p.ParameterType == typeof(IHttpContextAccessor)));
        
        if (constructor == null)
        {
            throw new InvalidOperationException("Cannot find suitable constructor for VnpayClient");
        }
        
        // Get the IOptions parameter type
        var optionsParam = constructor.GetParameters()
            .FirstOrDefault(p => p.ParameterType.Name.Contains("Options"));
        
        if (optionsParam == null)
        {
            throw new InvalidOperationException("Cannot find IOptions parameter in VnpayClient constructor");
        }
        
        // Get the generic type argument from IOptions<T>
        var optionsGenericType = optionsParam.ParameterType.GetGenericArguments()[0];
        
        // Configure options from configuration BEFORE registering the service
        // Use reflection to call Configure<T>(IServiceCollection, IConfiguration)
        try
        {
            var configureMethod = typeof(OptionsServiceCollectionExtensions)
                .GetMethods(BindingFlags.Public | BindingFlags.Static)
                .Where(m => m.Name == "Configure" && m.IsGenericMethod)
                .Select(m => new { Method = m, Params = m.GetParameters() })
                .FirstOrDefault(m => m.Params.Length == 2 &&
                                     m.Params[0].ParameterType == typeof(IServiceCollection) &&
                                     m.Params[1].ParameterType == typeof(IConfiguration));
            
            if (configureMethod != null)
            {
                var genericMethod = configureMethod.Method.MakeGenericMethod(optionsGenericType);
                genericMethod.Invoke(null, new object[] { context.Services, configuration.GetSection("VNPay") });
            }
            else
            {
                // Fallback: Create options instance and bind manually
                var optionsInstance = Activator.CreateInstance(optionsGenericType);
                var configSection = configuration.GetSection("VNPay");
                configSection.Bind(optionsInstance);
                
                // Map ReturnUrl to CallbackUrl if needed (VnpayConfiguration requires CallbackUrl)
                var returnUrl = configuration["VNPay:ReturnUrl"];
                var callbackUrl = configuration["VNPay:CallbackUrl"] ?? returnUrl;
                
                // Set CallbackUrl property (required by VnpayConfiguration)
                var callbackUrlProp = optionsGenericType.GetProperty("CallbackUrl");
                if (callbackUrlProp != null && callbackUrlProp.CanWrite && !string.IsNullOrEmpty(callbackUrl))
                {
                    callbackUrlProp.SetValue(optionsInstance, callbackUrl);
                }
                
                // Also try to set ReturnUrl property if it exists
                var returnUrlProp = optionsGenericType.GetProperty("ReturnUrl");
                if (returnUrlProp != null && returnUrlProp.CanWrite && !string.IsNullOrEmpty(returnUrl))
                {
                    returnUrlProp.SetValue(optionsInstance, returnUrl);
                }
                
                // Ensure TmnCode is set (might be required)
                var tmnCode = configuration["VNPay:TmnCode"];
                var tmnCodeProp = optionsGenericType.GetProperty("TmnCode");
                if (tmnCodeProp != null && tmnCodeProp.CanWrite && !string.IsNullOrEmpty(tmnCode))
                {
                    tmnCodeProp.SetValue(optionsInstance, tmnCode);
                }
                
                // Ensure HashSecret is set (might be required)
                var hashSecret = configuration["VNPay:HashSecret"];
                var hashSecretProp = optionsGenericType.GetProperty("HashSecret");
                if (hashSecretProp != null && hashSecretProp.CanWrite && !string.IsNullOrEmpty(hashSecret))
                {
                    hashSecretProp.SetValue(optionsInstance, hashSecret);
                }
                
                // Register as IOptions<T> using OptionsWrapper
                var optionsWrapperType = typeof(Microsoft.Extensions.Options.OptionsWrapper<>).MakeGenericType(optionsGenericType);
                var optionsWrapper = Activator.CreateInstance(optionsWrapperType, optionsInstance);
                var optionsInterfaceType = typeof(IOptions<>).MakeGenericType(optionsGenericType);
                context.Services.AddSingleton(optionsInterfaceType, optionsWrapper);
            }
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Error configuring VNPay options: {ex.Message}. " +
                $"Options type: {optionsGenericType.Name}", ex);
        }
        
        // Register IVnpayClient with factory
        context.Services.AddScoped<IVnpayClient>(sp =>
        {
            try
            {
                // Get IOptions<T> instance
                var optionsGenericServiceType = typeof(IOptions<>).MakeGenericType(optionsGenericType);
                var options = sp.GetRequiredService(optionsGenericServiceType);
                var httpContextAccessor = sp.GetRequiredService<IHttpContextAccessor>();
                
                // Create VnpayClient instance
                var instance = Activator.CreateInstance(vnpayClientType, options, httpContextAccessor);
                return (IVnpayClient)instance;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"Error creating IVnpayClient instance: {ex.Message}. " +
                    $"Options type: {optionsGenericType?.Name}, " +
                    $"VnpayClient type: {vnpayClientType?.Name}",
                    ex);
            }
        });
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

    private void ConfigureFilePolicyConfigs(IConfiguration configuration)
    {
        Configure<VCareer.Constants.FilePolicy.FilePolicyConfigs>(configuration.GetSection("FileBlobStorageConfig"));
    }

    private void ConfigureCookiePolicy(ServiceConfigurationContext context) {
        Configure<CookiePolicyOptions>(opts =>
        {
            opts.MinimumSameSitePolicy = SameSiteMode.None;
            opts.Secure = CookieSecurePolicy.Always;
            opts.HttpOnly = HttpOnlyPolicy.Always;
            opts.CheckConsentNeeded = _ => false; // rất quan trọng
        });

    }

    private void ConfigureAuthentication(ServiceConfigurationContext context, IConfiguration configuration)
{
    context.Services.Configure<AbpClaimsPrincipalFactoryOptions>(options =>
    {
        options.IsDynamicClaimsEnabled = true;
    });

    context.Services.AddTransient<ITokenGenerator, JwtTokenGenerator>();

    context.Services
        .AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(configuration["Authentication:Jwt:Key"])
                ),
                ClockSkew = TimeSpan.Zero
            };

            //  lấy token từ cookie
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    context.Token = context.Request.Cookies["access_token"];
                    return Task.CompletedTask;
                }
            };
                  });
     
              context.Services.AddAuthorization();
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
    }
    private static void ConfigureSwagger(ServiceConfigurationContext context, IConfiguration configuration)
    {
        context.Services.AddAbpSwaggerGen(
            options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo { Title = "VCareer API", Version = "v1" });
                options.DocInclusionPredicate((docName, description) => true);
                options.CustomSchemaIds(type => type.FullName);

                // Configure Swagger để handle file uploads (IFormFile)
                // Map IFormFile to binary string for Swagger
                options.MapType<Microsoft.AspNetCore.Http.IFormFile>(() => new OpenApiSchema
                {
                    Type = "string",
                    Format = "binary"
                });

                // Add OperationFilter để handle IFormFile trong DTOs
                options.OperationFilter<FileUploadOperationFilter>();

                // Thêm JWT Bearer Authentication vào Swagger
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "Nhập 'Bearer {token}' (ví dụ: Bearer abc123...)",
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
                        },
                        Scheme = "oauth2",
                        Name = "Bearer",
                        In = ParameterLocation.Header
                    },
                    new List<string>()
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
    private void ConfigureDistributedCache(ServiceConfigurationContext context, IConfiguration configuration)
    {
        context.Services.AddDistributedMemoryCache();

        Configure<AbpDistributedCacheOptions>(options =>
  {
      options.KeyPrefix = "VCareerCache:";
      options.GlobalCacheEntryOptions = new DistributedCacheEntryOptions
      {
          SlidingExpiration = TimeSpan.FromMinutes(20),
      };
  });

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
        app.UseCookiePolicy();

        // Enable static files serving from wwwroot
        app.UseStaticFiles();

        app.MapAbpStaticAssets();
        app.UseAbpStudioLink();
        app.UseAbpSecurityHeaders();
        app.UseCors();
       
        app.UseAuthentication();

        if (MultiTenancyConsts.IsEnabled)
        {
            app.UseMultiTenancy();
        }

        app.UseUnitOfWork();
        app.UseAuthorization();
        app.UseDynamicClaims();

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