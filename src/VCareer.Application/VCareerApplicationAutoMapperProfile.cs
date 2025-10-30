using AutoMapper;
using VCareer.Books;
using VCareer.Profile;
using VCareer.CV;
using VCareer.Application;
using VCareer.Models.Users;
using VCareer.Models.Companies;
/*using VCareer.Models.Applications;*/
using Volo.Abp.Data;
using Volo.Abp.Identity;
using VCareer.Dto;
using VCareer.IServices.Books;
using VCareer.Models;
using VCareer.Application.Contracts.Applications;

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

        // Application mappings
       /* CreateMap<JobApplication, ApplicationDto>();
        CreateMap<ApplicationDocument, ApplicationDocumentDto>();*/

        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}
