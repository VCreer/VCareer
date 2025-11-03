using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Models.FileMetadata;
using Volo.Abp.Domain.Repositories;

namespace VCareer.IRepositories.IFileRepository
{
    public interface IFileDescriptorRepository:IRepository<FileDescriptor,Guid>
    {

    }
}
