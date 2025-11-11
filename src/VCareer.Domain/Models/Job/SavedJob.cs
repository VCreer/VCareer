using System;
using VCareer.Models.Users;
using Volo.Abp.Domain.Entities;

namespace VCareer.Models.Job
{
    
    public class SavedJob :Entity
    {
        public Guid CandidateId { get; set; }

      
        public Guid JobId { get; set; }

       
        public DateTime CreationTime { get; set; }

       
        public virtual CandidateProfile CandidateProfile { get; set; }

       
        public virtual Job_Post JobPosting { get; set; }

        /// <summary>
        /// Override để return composite key
        /// </summary>
        public override object[] GetKeys()
        {
            return new object[] { CandidateId, JobId };
        }
    }
}

