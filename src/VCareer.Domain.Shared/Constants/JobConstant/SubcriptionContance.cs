using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Constants.JobConstant
{
    public class SubcriptionContance
    {
        //gói lớn
        public enum SubcriptorTarget
        {
            Candidate,
            Recruiter
        }
        //dịch vụ con
        public enum ServiceTarget
        {
            JobPost,
            Company,
            Cv
        }
        public enum ServiceAction
        {
            BoostScoreCv,          // Tăng điểm hiển thị
            BoostScoreJob,        // Tăng điểm hiển thị
            TopList,             // Cho lên Top N
            VerifiedBadge,       // Gắn badge
            IncreaseQuota,       // Tăng số lượng job được đăng
            ExtendExpiredDate,   // Kéo dài ngày hết hạn job
        }
        public enum JobServiceAction
        {
            BoostScoreJob = 0,        // Tăng điểm hiển thị
            TopList = 1,             // Cho lên Top N
            VerifiedBadge = 2       // Gắn badge
        }
        public enum SubcriptionStatus
        {
            Inactive = 0,
            Active = 1,
            Expired = 2,
            Cancelled = 3
        }
        public enum ChildServiceStatus
        {
            Inactive = 0,
            Active = 1,
            Expired = 2,
        }
        public enum CurrencyType
        {
            VND = 1,
            USD = 2
        }
    }
}
