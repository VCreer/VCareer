using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.IServices.IFileServices
{
    class IFileServices
    {
        public Task<UpLoadFileDto> UploadFile();
    }
}
