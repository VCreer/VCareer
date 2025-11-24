using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VNPAY;
using VNPAY.Models;
using VNPAY.Models.Enums;

namespace VCareer.Services.Payment
{
    public interface IVnpayService
    {
        string CreatePaymentUrl(Guid orderId, string orderCode, decimal totalAmount, string returnUrl);
        (string PaymentUrl, string PaymentId) CreatePaymentUrlWithId(Guid orderId, string orderCode, decimal totalAmount, string returnUrl);
        bool ValidatePaymentCallback(Dictionary<string, string> vnpayData, string secureHash);
        Dictionary<string, string> ParseCallbackData(string queryString);
    }

    public class VnpayService : IVnpayService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<VnpayService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IVnpayClient _vnpayClient;
        private readonly string _tmnCode;
        private readonly string _hashSecret;
        private readonly string _paymentUrl;
        private readonly string _returnUrl;

        public VnpayService(
            IConfiguration configuration, 
            ILogger<VnpayService> logger, 
            IHttpContextAccessor httpContextAccessor,
            IVnpayClient vnpayClient)
        {
            _configuration = configuration;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _vnpayClient = vnpayClient;
            _tmnCode = _configuration["VNPay:TmnCode"] ?? "";
            _hashSecret = _configuration["VNPay:HashSecret"] ?? "";
            _paymentUrl = _configuration["VNPay:PaymentUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
            _returnUrl = _configuration["VNPay:ReturnUrl"] ?? "http://localhost:4200/recruiter/payment/callback";
        }

        public (string PaymentUrl, string PaymentId) CreatePaymentUrlWithId(Guid orderId, string orderCode, decimal totalAmount, string returnUrl)
        {
            try
            {
                // Get IP address and convert IPv6 to IPv4 if needed
                var originalIp = GetIpAddress();
                var ipAddress = originalIp;
                
                // VNPay may not accept IPv6 (::1), convert to 127.0.0.1 for localhost
                // Also handle IPv6 mapped IPv4 addresses
                if (string.IsNullOrEmpty(ipAddress) || 
                    ipAddress == "::1" || 
                    ipAddress == "::ffff:127.0.0.1" ||
                    ipAddress.StartsWith("::ffff:"))
                {
                    ipAddress = "127.0.0.1";
                }
                
                // Log IP conversion for debugging
                _logger.LogWarning("IP Address conversion: {OriginalIp} -> {ConvertedIp}", originalIp, ipAddress);

                // Create payment URL using IVnpayClient
                // Using the simple overload that takes money, description, and bankCode directly
                var description = $"Thanh toan don hang {orderCode}";
                var paymentUrlInfo = _vnpayClient.CreatePaymentUrl(
                    (double)totalAmount, 
                    description, 
                    BankCode.ANY // Let user choose payment method
                );
                
                _logger.LogInformation("VNPay Payment URL created for order {OrderCode} using VNPAY.NET library", orderCode);
                _logger.LogInformation("Payment ID: {PaymentId}, URL: {Url}", 
                    paymentUrlInfo.PaymentId, paymentUrlInfo.Url);
                
                return (paymentUrlInfo.Url, paymentUrlInfo.PaymentId.ToString());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating VNPay payment URL for order {OrderCode}", orderCode);
                throw;
            }
        }

        public string CreatePaymentUrl(Guid orderId, string orderCode, decimal totalAmount, string returnUrl)
        {
            // Wrapper method for backward compatibility
            var (paymentUrl, _) = CreatePaymentUrlWithId(orderId, orderCode, totalAmount, returnUrl);
            return paymentUrl;
        }

        public bool ValidatePaymentCallback(Dictionary<string, string> vnpayData, string secureHash)
        {
            try
            {
                // Use IVnpayClient to get payment result and validate
                // The library will automatically validate the signature
                if (_httpContextAccessor.HttpContext == null)
                {
                    _logger.LogError("HttpContext is null, cannot validate payment callback");
                    return false;
                }
                
                var paymentResult = _vnpayClient.GetPaymentResult(_httpContextAccessor.HttpContext.Request);
                
                // If we get here without exception, the signature is valid
                _logger.LogInformation("VNPay callback validated successfully. Payment ID: {PaymentId}, Transaction ID: {TransactionId}", 
                    paymentResult.PaymentId, paymentResult.VnpayTransactionId);
                
                return true;
            }
            catch (VNPAY.Models.Exceptions.VnpayException ex)
            {
                _logger.LogWarning(ex, "VNPay callback validation failed: {Message}", ex.Message);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating VNPay callback");
                return false;
            }
        }

        public Dictionary<string, string> ParseCallbackData(string queryString)
        {
            var result = new Dictionary<string, string>();
            if (string.IsNullOrEmpty(queryString))
                return result;

            var pairs = queryString.Split('&');
            foreach (var pair in pairs)
            {
                var keyValue = pair.Split('=');
                if (keyValue.Length == 2)
                {
                    result[keyValue[0]] = Uri.UnescapeDataString(keyValue[1]);
                }
            }

            return result;
        }

        private string HashHMACSHA512(string hashData)
        {
            // VNPay requires HMACSHA512 according to documentation
            // HMACSHA512(key=hashSecret, message=hashData)
            using (var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(_hashSecret)))
            {
                byte[] hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(hashData));
                // VNPay expects uppercase hex string
                return BitConverter.ToString(hashBytes).Replace("-", "").ToUpper();
            }
        }
        
        // Keep old method for backward compatibility (used in validation)
        private string HashSHA512(string data)
        {
            byte[] hashBytes = SHA512.HashData(Encoding.UTF8.GetBytes(data));
            // VNPay expects uppercase hex string
            return BitConverter.ToString(hashBytes).Replace("-", "").ToUpper();
        }

        private string GetIpAddress()
        {
            try
            {
                var httpContext = _httpContextAccessor.HttpContext;
                if (httpContext != null)
                {
                    // Try to get IP from X-Forwarded-For header (for proxy/load balancer)
                    var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(forwardedFor))
                    {
                        var ips = forwardedFor.Split(',');
                        if (ips.Length > 0)
                        {
                            var ip = ips[0].Trim();
                            // Convert IPv6 to IPv4 for VNPay compatibility
                            if (ip == "::1" || ip.StartsWith("::ffff:"))
                            {
                                return "127.0.0.1";
                            }
                            return ip;
                        }
                    }

                    // Try to get IP from X-Real-IP header
                    var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(realIp))
                    {
                        if (realIp == "::1" || realIp.StartsWith("::ffff:"))
                        {
                            return "127.0.0.1";
                        }
                        return realIp;
                    }

                    // Fallback to RemoteIpAddress
                    var remoteIp = httpContext.Connection.RemoteIpAddress;
                    if (remoteIp != null)
                    {
                        var ipString = remoteIp.ToString();
                        // Convert IPv6 to IPv4 for VNPay compatibility
                        if (ipString == "::1" || ipString.StartsWith("::ffff:"))
                        {
                            return "127.0.0.1";
                        }
                        // If it's IPv6 mapped to IPv4 (::ffff:127.0.0.1), extract IPv4
                        if (ipString.StartsWith("::ffff:"))
                        {
                            return ipString.Substring(7); // Remove "::ffff:" prefix
                        }
                        return ipString;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error getting IP address");
            }

            return "127.0.0.1";
        }
    }
}

