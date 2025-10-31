using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Org.BouncyCastle.Asn1.X509.Qualified;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.FilePolicy;
using Volo.Abp;
using Volo.Abp.DependencyInjection;
using static VCareer.Constants.FilePolicy.FilePolicyConfigs;

namespace VCareer.Services.FileServices
{
    public class FilePoliciesServices : ITransientDependency
    {
        private readonly IOptions<FilePolicyConfigs> _config;
        private readonly IConfiguration _configuration;

        public FilePoliciesServices(IOptions<FilePolicyConfigs> config, IConfiguration configuration)
        {
            _config = config;
            _configuration = configuration;
        }
        // cấu trúc container là dựa trên cái file appsettings.json
        // sẽ có các cái to như candidate, recruiter, job, employee, syste
        // và các cái thuộc type bên trong các container trên gọi là containerType - ví dụ như video , resume, avatar,...

        public ContainerConfig GetContainterConfig(object containerType)
        {
            if (containerType is CandidateContainerType candidateContainerType)
                return GetContainer(_config.Value.Candidate.Containers, candidateContainerType.ToString());

            if (containerType is RecruiterContainerType recruiterContainerType)
                return GetContainer(_config.Value.Recruiter.Containers, recruiterContainerType.ToString());

            if (containerType is EmployeeContainerType employeeContainerType)
                return GetContainer(_config.Value.Employee.Containers, employeeContainerType.ToString());

            if (containerType is SystemContainerType systemContainerType)
                return GetSystemContainer(systemContainerType);

            throw new ArgumentException($"Container type {containerType} not found or unsupport");
        }

        public ContainerConfig GetContainer(Dictionary<string, ContainerConfig> containers, string key)
        {
            if (containers.TryGetValue(key, out var container)) return container;

            throw new KeyNotFoundException($"Key {key} not found in configuration to find container ");
        }

        public ContainerConfig GetSystemContainer(SystemContainerType type)
        {
            return type switch
            {
                SystemContainerType.ExportReports => _config.Value.System.ExportReports,
                SystemContainerType.TempUploads => _config.Value.System.TempUploads,
            };
            throw new KeyNotFoundException($"System containers not found container {type}");
        }

        public long GetMaxFileSizeBytes(object containterType)
        {
            var containerConfig = GetContainterConfig(containterType);
            return containerConfig.MaxSizeMB * 1024L * 1024L;

        }
        public float GetMaxFileSizeMb(object containterType)
        {
            var containerConfig = GetContainterConfig(containterType);
            return containerConfig.MaxSizeMB;

        }

        public bool IsAllowedExtension(object containerType, string extension)
        {
            var containerConfig = GetContainterConfig(containerType);
            return Array.Exists(containerConfig.AllowedExtensions,
                ext => ext.Equals(extension, StringComparison.OrdinalIgnoreCase)
                || ext == "*");
        }

        public string GetPath(object containerType)
        {
            var containerConfig = GetContainterConfig(containerType);
            return containerConfig.Path;
        }
        public string[] GetAllowedExtensions(object containerType)
        {
            var containerConfig = GetContainterConfig(containerType);
            return containerConfig.AllowedExtensions;
        }
        //vì container blob name được định nghĩa ko có phần ContainerType, mà cái hàm này mình tìm dựa trên mấy cái enum có tên là container +"ContainerType"
        public string GetContainerName(string containerTypeName)
        {
            var container = containers.FirstOrDefault(c => Enum.IsDefined(c, containerTypeName));
            if (container == null) throw new ArgumentException($"Container type {containerTypeName} not found or unsupport");
            return container.Name.Replace("ContainerType", "");
        }
        public string GetStoragePath(string containerTypeName, string containerName)
        {
            var path = _configuration[$"FileBlobStorageConfig:{containerName}:Containers:{containerTypeName}:Path"];
            if (string.IsNullOrEmpty(path)) throw new ArgumentException($"Container type {containerTypeName} not found or unsupport");
            return path;
        }

        private static readonly Type[] containers = new Type[]
        {
        typeof(CandidateContainerType),
        typeof(RecruiterContainerType),
        typeof(EmployeeContainerType),
        typeof(SystemContainerType)
        };


    }
}
