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
using VCareer.CV;
using VCareer.Dto.Profile;
using VCareer.Dto.Order;
using VCareer.Models.Order;
using VCareer.Models.Subcription;
using VCareer.Models.Job;
using VCareer.Dto.JobDto;
using VCareer.Dto.Job;
using VCareer.Models.JobCategory;
using VCareer.Dto.Category;
using VCareer.Dto.Applications;
using VCareer.Dto.UserDto;
using VCareer.Dto.Subcriptions;

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
        CreateMap<Company, CompanyVerificationViewDto>();
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
        CreateMap<FileDescriptorDto, FileDescriptor>();

        // Application mappings
        CreateMap<JobApplication, ApplicationDto>();

        // Order mappings
        CreateMap<Order, OrderDto>();
        CreateMap<OrderDetail, OrderDetailDto>();

        CreateMap<Job_Post, JobViewDto>();
        CreateMap<Job_Post, JobViewDetail>();
        CreateMap<RecruitmentCampaign, RecruimentCampainViewDto>();
        CreateMap<JobTag, JobTagViewDto>();
        CreateMap<Tag, TagViewDto>();
        CreateMap<IdentityUser, UserViewDto>();
        CreateMap<ChildService, ChildServiceViewDto>();





        // Subscription Service mappings
        CreateMap<Models.Subcription.SubcriptionService, Dto.Subcriptions.SubcriptionsViewDto>();

        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}
