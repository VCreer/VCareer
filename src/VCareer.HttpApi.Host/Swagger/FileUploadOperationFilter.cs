using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Collections.Generic;
using System.Linq;

namespace VCareer.HttpApi.Host.Swagger
{
    /// <summary>
    /// Swagger Operation Filter để handle IFormFile trong DTOs
    /// </summary>
    public class FileUploadOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var fileParameters = context.MethodInfo.GetParameters()
                .Where(p => p.ParameterType.GetProperties()
                    .Any(prop => prop.PropertyType == typeof(IFormFile)))
                .ToList();

            if (fileParameters.Any())
            {
                // Tìm các properties là IFormFile trong DTO
                foreach (var param in fileParameters)
                {
                    var formFileProps = param.ParameterType.GetProperties()
                        .Where(p => p.PropertyType == typeof(IFormFile))
                        .ToList();

                    if (formFileProps.Any())
                    {
                        // Remove existing content
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

                        // Add file property
                        foreach (var prop in formFileProps)
                        {
                            operation.RequestBody.Content["multipart/form-data"].Schema.Properties[prop.Name] = new OpenApiSchema
                            {
                                Type = "string",
                                Format = "binary",
                                Description = "File upload"
                            };
                        }

                        // Add other properties from DTO
                        var otherProps = param.ParameterType.GetProperties()
                            .Where(p => p.PropertyType != typeof(IFormFile))
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

                            operation.RequestBody.Content["multipart/form-data"].Schema.Properties[prop.Name] = schema;
                        }
                    }
                }
            }
        }
    }
}

