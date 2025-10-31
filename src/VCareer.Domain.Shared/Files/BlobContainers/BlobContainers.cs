using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Volo.Abp.BlobStoring;

namespace VCareer.Files.BlobContainers
{
    [BlobContainerName("Candidate")]
    public  class CandidateContainer { }

    [BlobContainerName("Recruiter")]
    public class RecruiterContainer { }

    [BlobContainerName("Employee")]
    public class EmployeeContainer { }

    [BlobContainerName("System")]
    public class SystemContainer { }

}
