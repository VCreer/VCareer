using AutoMapper;
using VCareer.Books;
using VCareer.Application;
using VCareer.Application.Contracts.CV;
using VCareer.Models.Users;
using VCareer.Models.Companies;
using VCareer.Models.CV;
using VCareer.Models.FileMetadata;
using VCareer.Models.Applications;
using Volo.Abp.Data;
using Volo.Abp.Identity;
using VCareer.Dto;
using VCareer.Dto.FileDto;
using VCareer.Dto.ActivityLogDto;
using VCareer.IServices.Books;
using VCareer.Models;
using VCareer.Application.Contracts.Applications;
using VCareer.CV;
using VCareer.Dto.Profile;

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

        // CV mappings (legacy)
        /*CreateMap<CurriculumVitae, CVDto>();
        CreateMap<CreateCVOnlineDto, CurriculumVitae>();
        CreateMap<UploadCVDto, CurriculumVitae>();
        CreateMap<UpdateCVDto, CurriculumVitae>();*/

        // CV Template mappings
        CreateMap<CvTemplate, CvTemplateDto>();
        CreateMap<CreateCvTemplateDto, CvTemplate>();
        CreateMap<UpdateCvTemplateDto, CvTemplate>();

        // Candidate CV mappings
        CreateMap<CandidateCv, CandidateCvDto>();
        CreateMap<CreateCandidateCvDto, CandidateCv>();

        // Uploaded CV mappings
        CreateMap<UploadedCv, UploadedCvDto>();
        CreateMap<CreateUploadedCvDto, UploadedCv>();

        // FileDescriptor mappings
        CreateMap<FileDescriptor, FileDescriptorDto>();

        // Application mappings
        CreateMap<JobApplication, ApplicationDto>();

        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}
