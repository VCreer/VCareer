using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using VCareer.Dto.Cart;
using VCareer.IServices.Cart;
using Volo.Abp.AspNetCore.Mvc;

namespace VCareer.Controllers
{
    [ApiController]
    [Route("api/app/cart")]
    [Authorize]
    public class CartController : AbpControllerBase
    {
        private readonly ICartAppService _cartAppService;

        public CartController(ICartAppService cartAppService)
        {
            _cartAppService = cartAppService;
        }

        [HttpGet("my-cart")]
        public async Task<CartListDto> GetMyCartAsync()
        {
            return await _cartAppService.GetMyCartAsync();
        }

        [HttpPost("add-to-cart")]
        public async Task<CartDto> AddToCartAsync([FromBody] AddToCartDto input)
        {
            return await _cartAppService.AddToCartAsync(input);
        }

        [HttpPut("update-quantity")]
        public async Task<CartDto> UpdateQuantityAsync([FromBody] UpdateCartQuantityDto input)
        {
            return await _cartAppService.UpdateQuantityAsync(input);
        }

        [HttpPost("remove-from-cart")]
        public async Task RemoveFromCartAsync([FromBody] RemoveFromCartDto input)
        {
            await _cartAppService.RemoveFromCartAsync(input);
        }

        [HttpPost("clear-cart")]
        public async Task ClearCartAsync()
        {
            await _cartAppService.ClearCartAsync();
        }
    }
}

