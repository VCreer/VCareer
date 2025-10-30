using AutoMapper;
using VCareer.Books;
using VCareer.Profile;
using VCareer.CV;
using VCareer.Models.Users;
using VCareer.Models.Companies;
using VCareer.Models.ActivityLogs;
using Volo.Abp.Data;
using Volo.Abp.Identity;
using VCareer.Dto;
using VCareer.Dto.ActivityLogDto;
using VCareer.IServices.Books;
using VCareer.Models;

namespace VCareer;

public class VCareerApplicationAutoMapperProfile : IdentityDomainMappingProfile
{
    public VCareerApplicationAutoMapperProfile()
    {
        CreateMap<Book, BookDto>();
        CreateMap<CreateUpdateBookDto, Book>();

        // Profile mappings
        CreateMap<IdentityUser, ProfileDto>();
            
        // Company Legal Info mappings (using Company entity)
        CreateMap<Company, CompanyLegalInfoDto>();
        CreateMap<SubmitCompanyLegalInfoDto, Company>();
        CreateMap<UpdateCompanyLegalInfoDto, Company>();

        // CV mappings
        CreateMap<CurriculumVitae, CVDto>();
        CreateMap<CreateCVOnlineDto, CurriculumVitae>();
        CreateMap<UploadCVDto, CurriculumVitae>();
        CreateMap<UpdateCVDto, CurriculumVitae>();

        // ActivityLog mappings
        CreateMap<ActivityLog, ActivityLogDto>()
            .ForMember(dest => dest.ActivityTypeName, opt => opt.MapFrom(src => src.ActivityType.ToString()));

        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}
