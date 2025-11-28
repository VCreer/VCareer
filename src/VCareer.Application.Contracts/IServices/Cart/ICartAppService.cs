using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Dto.Cart;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.Cart
{
    public interface ICartAppService : IApplicationService
    {
        Task<CartListDto> GetMyCartAsync();
        Task<CartDto> AddToCartAsync(AddToCartDto input);
        Task<CartDto> UpdateQuantityAsync(UpdateCartQuantityDto input);
        Task RemoveFromCartAsync(RemoveFromCartDto input);
        Task ClearCartAsync();
    }
}

