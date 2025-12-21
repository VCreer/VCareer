using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace VCareer.HttpApi.Host.Swagger
{
    /// <summary>
    /// Parameter Filter để xử lý IFormFile parameters
    /// Loại bỏ chúng khỏi parameters list vì sẽ được thêm vào RequestBody
    /// </summary>
    public class FileUploadParameterFilter : IParameterFilter
    {
        public void Apply(OpenApiParameter parameter, ParameterFilterContext context)
        {
            var parameterInfo = context.ParameterInfo;
            
            // Nếu là IFormFile parameter, đánh dấu để loại bỏ
            // (sẽ được xử lý bởi FileUploadOperationFilter)
            if (parameterInfo != null && 
                (parameterInfo.ParameterType == typeof(IFormFile) || 
                 parameterInfo.ParameterType == typeof(IFormFile[])))
            {
                // Set schema để tránh lỗi, nhưng OperationFilter sẽ xử lý thực sự
                parameter.Schema = new OpenApiSchema
                {
                    Type = "string",
                    Format = "binary"
                };
            }
        }
    }
}

