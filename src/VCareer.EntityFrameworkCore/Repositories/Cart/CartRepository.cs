using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VCareer.EntityFrameworkCore;
using VCareer.IRepositories.Cart;
using VCareer.Models.Cart;
using Volo.Abp.Domain.Repositories.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;
using CartEntity = VCareer.Models.Cart.Cart;

namespace VCareer.Repositories.Cart
{
    public class CartRepository : EfCoreRepository<VCareerDbContext, CartEntity, Guid>, ICartRepository
    {
        public CartRepository(IDbContextProvider<VCareerDbContext> dbContextProvider) : base(dbContextProvider)
        {
        }

        public async Task<List<CartEntity>> GetCartByUserIdAsync(Guid userId)
        {
            var dbContext = await GetDbContextAsync();
            return await dbContext.Set<CartEntity>()
                .Where(c => c.UserId == userId)
                .Include(c => c.SubscriptionService)
                .ToListAsync();
        }

        public async Task<CartEntity> GetCartItemAsync(Guid userId, Guid subscriptionServiceId)
        {
            var dbContext = await GetDbContextAsync();
            return await dbContext.Set<CartEntity>()
                .Where(c => c.UserId == userId && c.SubscriptionServiceId == subscriptionServiceId)
                .FirstOrDefaultAsync();
        }

        public async Task DeleteAsync(CartEntity entity)
        {
            var dbContext = await GetDbContextAsync();
            dbContext.Set<CartEntity>().Remove(entity);
            await dbContext.SaveChangesAsync();
        }

        public async Task DeleteAllByUserIdAsync(Guid userId)
        {
            var dbContext = await GetDbContextAsync();
            var cartItems = await GetCartByUserIdAsync(userId);
            foreach (var item in cartItems)
            {
                dbContext.Set<CartEntity>().Remove(item);
            }
            await dbContext.SaveChangesAsync();
        }
    }
}

