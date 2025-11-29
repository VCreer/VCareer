using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;

namespace VCareer.HttpApi.Host.Swagger
{
    /// <summary>
    /// Swagger Operation Filter để handle IFormFile trong DTOs và parameters trực tiếp
    /// </summary>
    public class FileUploadOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var methodParameters = context.MethodInfo.GetParameters();
            
            // Kiểm tra xem có IFormFile parameter trực tiếp không
            var directFileParameters = methodParameters
                .Where(p => p.ParameterType == typeof(IFormFile) || 
                           p.ParameterType == typeof(IFormFile[]))
                .ToList();

            // Kiểm tra xem có DTO chứa IFormFile properties không
            var dtoFileParameters = methodParameters
                .Where(p => !p.ParameterType.IsPrimitive && 
                           p.ParameterType != typeof(string) &&
                           p.ParameterType != typeof(IFormFile) &&
                           p.ParameterType != typeof(IFormFile[]) &&
                           p.ParameterType.GetProperties()
                               .Any(prop => prop.PropertyType == typeof(IFormFile) || 
                                           prop.PropertyType == typeof(IFormFile[])))
                .ToList();

            // Xử lý nếu có IFormFile (trực tiếp hoặc trong DTO)
            if (directFileParameters.Any() || dtoFileParameters.Any())
            {
                // Remove existing parameters có IFormFile (sẽ được thêm vào RequestBody)
                if (operation.Parameters != null)
                {
                    var parametersToRemove = operation.Parameters
                        .Where(p => directFileParameters.Any(fp => fp.Name == p.Name))
                        .ToList();
                    
                    foreach (var param in parametersToRemove)
                    {
                        operation.Parameters.Remove(param);
                    }
                }

                // Tạo hoặc cập nhật RequestBody cho multipart/form-data
                if (operation.RequestBody == null)
                {
                    operation.RequestBody = new OpenApiRequestBody
                    {
                        Content = new Dictionary<string, OpenApiMediaType>
                        {
                            ["multipart/form-data"] = new OpenApiMediaType
                            {
                                Schema = new OpenApiSchema
                                {
                                    Type = "object",
                                    Properties = new Dictionary<string, OpenApiSchema>()
                                }
                            }
                        }
                    };
                }
                else if (!operation.RequestBody.Content.ContainsKey("multipart/form-data"))
                {
                    operation.RequestBody.Content["multipart/form-data"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Type = "object",
                            Properties = new Dictionary<string, OpenApiSchema>()
                        }
                    };
                }

                var formDataSchema = operation.RequestBody.Content["multipart/form-data"].Schema;

                // Thêm IFormFile parameters trực tiếp vào form-data
                foreach (var param in directFileParameters)
                {
                    var paramName = param.Name ?? "file";
                    formDataSchema.Properties[paramName] = new OpenApiSchema
                    {
                        Type = "string",
                        Format = "binary",
                        Description = "File upload"
                    };
                }

                // Xử lý IFormFile trong DTOs
                foreach (var param in dtoFileParameters)
                {
                    var formFileProps = param.ParameterType.GetProperties()
                        .Where(p => p.PropertyType == typeof(IFormFile) || p.PropertyType == typeof(IFormFile[]))
                        .ToList();

                    if (formFileProps.Any())
                    {
                        // Add file properties from DTO
                        foreach (var prop in formFileProps)
                        {
                            formDataSchema.Properties[prop.Name] = new OpenApiSchema
                            {
                                Type = "string",
                                Format = "binary",
                                Description = "File upload"
                            };
                        }

                        // Add other properties from DTO
                        var otherProps = param.ParameterType.GetProperties()
                            .Where(p => p.PropertyType != typeof(IFormFile) && 
                                       p.PropertyType != typeof(IFormFile[]))
                            .ToList();

                        foreach (var prop in otherProps)
                        {
                            var schema = new OpenApiSchema();
                            
                            if (prop.PropertyType == typeof(string))
                            {
                                schema.Type = "string";
                            }
                            else if (prop.PropertyType == typeof(bool) || prop.PropertyType == typeof(bool?))
                            {
                                schema.Type = "boolean";
                            }
                            else if (prop.PropertyType == typeof(int) || prop.PropertyType == typeof(int?))
                            {
                                schema.Type = "integer";
                            }
                            else if (prop.PropertyType == typeof(decimal) || prop.PropertyType == typeof(decimal?))
                            {
                                schema.Type = "number";
                            }
                            else
                            {
                                schema.Type = "string";
                            }

                            formDataSchema.Properties[prop.Name] = schema;
                        }
                    }
                }
            }
        }
    }
}
