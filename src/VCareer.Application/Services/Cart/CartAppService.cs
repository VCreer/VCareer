using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.Cart;
using VCareer.IRepositories.Cart;
using VCareer.IRepositories.Subcriptions;
using VCareer.IServices.Cart;
using VCareer.IServices.Subcriptions;
using VCareer.Models.Cart;
using VCareer.Models.Subcription;
using VCareer.Permission;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;
using CartEntity = VCareer.Models.Cart.Cart;

namespace VCareer.Services.Cart
{
    [Authorize]
    [RemoteService(IsEnabled = false)] // Disable auto API generation, using CartController instead
    public class CartAppService : ApplicationService, ICartAppService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IRepository<Models.Subcription.SubcriptionService, Guid> _subscriptionServiceRepository;
        private readonly ICurrentUser _currentUser;
        private readonly ILogger<CartAppService> _logger;
        private readonly IUserSubcriptionService _userSubcriptionService;

        public CartAppService(
            ICartRepository cartRepository,
            IRepository<Models.Subcription.SubcriptionService, Guid> subscriptionServiceRepository,
            ICurrentUser currentUser,
            IUserSubcriptionService userSubcriptionService,
            ILogger<CartAppService> logger)
        {
            _cartRepository = cartRepository;
            _subscriptionServiceRepository = subscriptionServiceRepository;
            _currentUser = currentUser;
            _userSubcriptionService = userSubcriptionService;
            _logger = logger;
        }
        [Authorize(VCareerPermission.Cart.View)]
        public async Task<CartListDto> GetMyCartAsync()
        {
            try
            {
                if (_currentUser.Id == null)
                {
                    throw new UserFriendlyException("User not authenticated");
                }

                var userId = _currentUser.Id.Value;
                var cartItems = await _cartRepository.GetCartByUserIdAsync(userId);

                var cartDtos = cartItems.Select(cart => new CartDto
                {
                    Id = cart.Id,
                    UserId = cart.UserId,
                    SubscriptionServiceId = cart.SubscriptionServiceId,
                    SubscriptionServiceTitle = cart.SubscriptionService?.Title ?? "",
                    SubscriptionServicePrice = cart.SubscriptionService?.OriginalPrice ?? 0,
                    Quantity = cart.Quantity,
                    CreationTime = cart.CreationTime
                }).ToList();

                return new CartListDto
                {
                    Items = cartDtos,
                    TotalCount = cartDtos.Count
                };
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        [Authorize(VCareerPermission.Cart.AddToCart)]
        public async Task<CartDto> AddToCartAsync(AddToCartDto input)
        {
            try
            {
                if (_currentUser.Id == null) throw new UserFriendlyException("User not authenticated");

                var userId = _currentUser.Id.Value;

                var subscriptionService = await _subscriptionServiceRepository.GetAsync(input.SubscriptionServiceId);
                if (subscriptionService == null || subscriptionService.IsActive == false) throw new UserFriendlyException("Subscription service not found");

                // Ensure quantity is at least 1
                var quantity = input.Quantity > 0 ? input.Quantity : 1;

                // Check if item already exists in cart
                var existingCartItem = await _cartRepository.GetCartItemAsync(userId, input.SubscriptionServiceId);
                var existingServiceAndWorking = await _userSubcriptionService.SubcriptionBoughtedAndActive(userId, input.SubscriptionServiceId);

                if (existingServiceAndWorking != null && existingServiceAndWorking.Count > 0)
                {
                    throw new UserFriendlyException("You have already bought this service and it still working");
                }

                if (existingCartItem != null) throw new UserFriendlyException("Item already exists in cart");

                var newCartItem = new CartEntity
                {
                    UserId = userId,
                    SubscriptionServiceId = input.SubscriptionServiceId,
                    Quantity = 1,
                    CreationTime = DateTime.UtcNow
                };

                await _cartRepository.InsertAsync(newCartItem);

                return new CartDto
                {
                    Id = newCartItem.Id,
                    UserId = newCartItem.UserId,
                    SubscriptionServiceId = newCartItem.SubscriptionServiceId,
                    SubscriptionServiceTitle = subscriptionService.Title,
                    SubscriptionServicePrice = subscriptionService.OriginalPrice,
                    Quantity = newCartItem.Quantity,
                    CreationTime = newCartItem.CreationTime
                };
                //}
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        [Authorize(VCareerPermission.Cart.Update)]
        public async Task<CartDto> UpdateQuantityAsync(UpdateCartQuantityDto input)
        {
            if (_currentUser.Id == null)
            {
                throw new UserFriendlyException("User not authenticated");
            }

            var userId = _currentUser.Id.Value;
            var cartItem = await _cartRepository.GetAsync(input.CartId);

            // Verify cart item belongs to current user
            if (cartItem.UserId != userId)
            {
                throw new UserFriendlyException("You don't have permission to update this cart item");
            }

            if (input.Quantity <= 0) await _cartRepository.DeleteAsync(cartItem);

            cartItem.Quantity = input.Quantity;
            await _cartRepository.UpdateAsync(cartItem);

            // Load subscription service for DTO
            var subscriptionService = await _subscriptionServiceRepository.GetAsync(cartItem.SubscriptionServiceId);

            return new CartDto
            {
                Id = cartItem.Id,
                UserId = cartItem.UserId,
                SubscriptionServiceId = cartItem.SubscriptionServiceId,
                SubscriptionServiceTitle = subscriptionService.Title,
                SubscriptionServicePrice = subscriptionService.OriginalPrice,
                Quantity = cartItem.Quantity,
                CreationTime = cartItem.CreationTime
            };
        }
        [Authorize(VCareerPermission.Cart.Delete)]
        public async Task RemoveFromCartAsync(RemoveFromCartDto input)
        {
            if (_currentUser.Id == null)
            {
                throw new UserFriendlyException("User not authenticated");
            }

            var userId = _currentUser.Id.Value;
            var cartItem = await _cartRepository.GetAsync(input.CartId);

            // Verify cart item belongs to current user
            if (cartItem.UserId != userId)
            {
                throw new UserFriendlyException("You don't have permission to remove this cart item");
            }

            // Delete from database
            await _cartRepository.DeleteAsync(cartItem);

        }
        [Authorize(VCareerPermission.Cart.Clear)]
        public async Task ClearCartAsync()
        {
            if (_currentUser.Id == null) throw new UserFriendlyException("User not authenticated");

            var userId = _currentUser.Id.Value;
            await _cartRepository.DeleteAllByUserIdAsync(userId);

        }
    }
}

