using AutoMapper;
using VCareer.Books;
using VCareer.Profile;
using Volo.Abp.Data;
using Volo.Abp.Identity;

namespace VCareer;

public class VCareerApplicationAutoMapperProfile : IdentityDomainMappingProfile
{
    public VCareerApplicationAutoMapperProfile()
    {
        CreateMap<Book, BookDto>();
        CreateMap<CreateUpdateBookDto, Book>();

        // Profile mappings
        CreateMap<IdentityUser, ProfileDto>();
        

        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}
