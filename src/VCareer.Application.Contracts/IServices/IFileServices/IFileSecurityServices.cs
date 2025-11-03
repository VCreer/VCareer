using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.Application.Services;

namespace VCareer.IServices.IFileServices
{
    public interface IFileSecurityServices : IApplicationService
    {
        bool ValidateExtension(string fileName, object containerType);
        bool ValidateSize(long size, object containerType);
        Task<bool> ValidateMimeAndMagicAsync(Stream fileStream, object containerType);
        Task<bool> ScanVirusAsync(Stream fileStream);
        string GenerateSafeStorageName(string fileName);
        Task<bool> CheckUserQuotaAsync(IdentityUser user, long newFileSize);
        string GetMimeType(string extension);
    }
}
