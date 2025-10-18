using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.BlobStoring;

namespace VCareer.Files.BlobContainers
{
    [BlobContainerName("cv-files")]
    public class CvFileContainer { }


    [BlobContainerName("images")]
    public class ImageContainer { }
}
