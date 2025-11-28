using System;
using System.Collections.Generic;
using Volo.Abp.Application.Dtos;

namespace VCareer.Dto.Cart
{
    public class CartDto : EntityDto<Guid>
    {
        public Guid UserId { get; set; }
        public Guid SubscriptionServiceId { get; set; }
        public string SubscriptionServiceTitle { get; set; }
        public decimal SubscriptionServicePrice { get; set; }
        public int Quantity { get; set; }
        public DateTime CreationTime { get; set; }
    }

    public class CartListDto
    {
        public List<CartDto> Items { get; set; } = new List<CartDto>();
        public int TotalCount { get; set; }
    }

    public class AddToCartDto
    {
        public Guid SubscriptionServiceId { get; set; }
        public int Quantity { get; set; } = 1; // Default 1
    }

    public class UpdateCartQuantityDto
    {
        public Guid CartId { get; set; }
        public int Quantity { get; set; }
    }

    public class RemoveFromCartDto
    {
        public Guid CartId { get; set; }
    }
}

