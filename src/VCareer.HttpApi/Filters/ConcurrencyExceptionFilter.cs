using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Volo.Abp.Data;
using Volo.Abp;

namespace VCareer.Filters
{
    public class ConcurrencyExceptionFilter : IExceptionFilter, IAsyncExceptionFilter
    {
        public void OnException(ExceptionContext context)
        {
            HandleException(context);
        }

        public Task OnExceptionAsync(ExceptionContext context)
        {
            HandleException(context);
            return Task.CompletedTask;
        }

        private void HandleException(ExceptionContext context)
        {
            if (context.Exception is AbpDbConcurrencyException)
            {
                // Kiểm tra xem có phải là verify email không (dựa vào route)
                var actionPath = context.HttpContext.Request.Path.Value?.ToLower() ?? "";
                var routeData = context.RouteData;
                var actionName = routeData.Values["action"]?.ToString()?.ToLower() ?? "";
                
                if (actionPath.Contains("verify-email") || actionPath.Contains("verifyemail") || 
                    actionName.Contains("verifyemail") || actionName.Contains("verify-email"))
                {
                    // Đối với verify email, coi như thành công và trả về success
                    // Vì có thể email đã được verify bởi request khác
                    context.Result = new ObjectResult(new
                    {
                        success = true,
                        message = "Email đã được xác thực thành công."
                    })
                    {
                        StatusCode = 200
                    };
                    context.ExceptionHandled = true;
                    return;
                }

                // Đối với các trường hợp khác, trả về thông báo thân thiện hơn
                context.Result = new ObjectResult(new
                {
                    error = new
                    {
                        message = "Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng làm mới trang và thử lại.",
                        details = "Thông tin bạn đang chỉnh sửa đã được cập nhật bởi một thao tác khác. Vui lòng làm mới trang để xem dữ liệu mới nhất."
                    }
                })
                {
                    StatusCode = 409 // Conflict
                };
                context.ExceptionHandled = true;
            }
        }
    }
}

