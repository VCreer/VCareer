using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using VCareer.Dto.Cart;
using VCareer.IRepositories.Cart;
using VCareer.IServices.Cart;
using VCareer.Models.Cart;
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

        public CartAppService(
            ICartRepository cartRepository,
            IRepository<Models.Subcription.SubcriptionService, Guid> subscriptionServiceRepository,
            ICurrentUser currentUser,
            ILogger<CartAppService> logger)
        {
            _cartRepository = cartRepository;
            _subscriptionServiceRepository = subscriptionServiceRepository;
            _currentUser = currentUser;
            _logger = logger;
        }

        public async Task<CartListDto> GetMyCartAsync()
        {
            try
            {
                if (_currentUser.Id == null)
                {
                    _logger.LogWarning("GetMyCartAsync: User not authenticated");
                    throw new UserFriendlyException("User not authenticated");
                }

                var userId = _currentUser.Id.Value;
                _logger.LogInformation("GetMyCartAsync: Loading cart for userId: {UserId}", userId);

                var cartItems = await _cartRepository.GetCartByUserIdAsync(userId);
                _logger.LogInformation("GetMyCartAsync: Found {Count} items in cart", cartItems.Count);

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
                _logger.LogError(ex, "Error in GetMyCartAsync");
                throw;
            }
        }

        public async Task<CartDto> AddToCartAsync(AddToCartDto input)
        {
            try
            {
                if (_currentUser.Id == null)
                {
                    throw new UserFriendlyException("User not authenticated");
                }

                var userId = _currentUser.Id.Value;

                // Validate subscription service exists
                var subscriptionService = await _subscriptionServiceRepository.GetAsync(input.SubscriptionServiceId);

                // Ensure quantity is at least 1
                var quantity = input.Quantity > 0 ? input.Quantity : 1;

                // Check if item already exists in cart
                var existingCartItem = await _cartRepository.GetCartItemAsync(userId, input.SubscriptionServiceId);

                if (existingCartItem != null)
                {
                    // Update quantity: +quantity
                    existingCartItem.Quantity += quantity;
                    await _cartRepository.UpdateAsync(existingCartItem);

                    existingCartItem.Id, existingCartItem.Quantity);

                    return new CartDto
                    {
                        Id = existingCartItem.Id,
                        UserId = existingCartItem.UserId,
                        SubscriptionServiceId = existingCartItem.SubscriptionServiceId,
                        SubscriptionServiceTitle = subscriptionService.Title,
                        SubscriptionServicePrice = subscriptionService.OriginalPrice,
                        Quantity = existingCartItem.Quantity,
                        CreationTime = existingCartItem.CreationTime
                    };
                }
                else
                {
                    var newCartItem = new CartEntity
                    {
                        UserId = userId,
                        SubscriptionServiceId = input.SubscriptionServiceId,
                        Quantity = quantity,
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
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AddToCartAsync. SubscriptionServiceId: {ServiceId}", input.SubscriptionServiceId);
                throw;
            }
        }

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

            if (input.Quantity <= 0)
            {
                // Remove item if quantity is 0 or negative
                await _cartRepository.DeleteAsync(cartItem);
                return null;
            }

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

        public async Task ClearCartAsync()
        {
            if (_currentUser.Id == null)
            {
                throw new UserFriendlyException("User not authenticated");
            }

            var userId = _currentUser.Id.Value;

            // Delete all cart items
            await _cartRepository.DeleteAllByUserIdAsync(userId);
        }
    }
}

