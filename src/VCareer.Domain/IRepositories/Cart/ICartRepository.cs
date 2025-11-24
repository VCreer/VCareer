using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using VCareer.Models.Cart;
using Volo.Abp.Domain.Repositories;
using CartEntity = VCareer.Models.Cart.Cart;

namespace VCareer.IRepositories.Cart
{
    public interface ICartRepository : IRepository<CartEntity, Guid>
    {
        Task<List<CartEntity>> GetCartByUserIdAsync(Guid userId);
        Task<CartEntity> GetCartItemAsync(Guid userId, Guid subscriptionServiceId);
        Task DeleteAsync(CartEntity entity);
        Task DeleteAllByUserIdAsync(Guid userId);
    }
}

