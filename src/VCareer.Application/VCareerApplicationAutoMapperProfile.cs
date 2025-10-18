using AutoMapper;
using VCareer.Dto;
using VCareer.IServices.Books;
using VCareer.Models;

namespace VCareer;

public class VCareerApplicationAutoMapperProfile : Profile
{
    public VCareerApplicationAutoMapperProfile()
    {
        CreateMap<Book, BookDto>();
        CreateMap<CreateUpdateBookDto, Book>();
        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */
    }
}
