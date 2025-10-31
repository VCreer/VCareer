using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Files.FileValidator;
using VCareer.IServices.IFileServices;
using Volo.Abp.DependencyInjection;

namespace VCareer.Services.FileServices
{
    public class FileSecurityServices : IFileSecurityServices, ITransientDependency
    {
        private readonly FilePoliciesServices _policies;
        private readonly FileMagicValidator _fileMagicValidator;
        public FileSecurityServices(FilePoliciesServices policies)
        {
            _policies = policies;
            _fileMagicValidator = new FileMagicValidator(policies);
        }


        //đợi sau có profile service thì lấy trường quota trong profile
        public Task<bool> CheckUserQuotaAsync(IdentityUser user, long newFileSize)
        {
            throw new NotImplementedException();
        }

        public string GenerateSafeStorageName(string userId, string fileName)
        {
            var extension = Path.GetExtension(fileName)?.ToLowerInvariant();
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmssfff"); // hợp lệ cho file name , vì utc.now có kí tự ko hợp lệ 
            var uniqueId = Guid.NewGuid().ToString("N"); // tránh trùng
            return $"{userId}_{timestamp}_{uniqueId}{extension}";
        }

        //dùng thư viện nclam nhưng đợi làm sau
        public Task<bool> ScanVirusAsync(Stream fileStream)
        {
            throw new NotImplementedException();
        }

        public bool ValidateExtension(string fileName, object containerType)
        {
            var extension = Path.GetExtension(fileName)?.ToLowerInvariant();
            return _policies.IsAllowedExtension(containerType, extension);
        }

        public Task<bool> ValidateMimeAndMagicAsync(Stream fileStream, object containerType)
        {
            return _fileMagicValidator.ValidateMagicFileAsync(fileStream, containerType);
        }

        public bool ValidateSize(long size, object containerType)
        {
            var maxBytes = _policies.GetMaxFileSizeBytes(containerType);
            return size <= maxBytes;
        }
    }

}
