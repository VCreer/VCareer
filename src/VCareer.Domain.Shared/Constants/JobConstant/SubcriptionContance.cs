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
          //  Cv
        }
        public enum ServiceAction
        {
            //BoostScoreCv,          // Tăng điểm hiển thị
            BoostScoreJob,        // Tăng điểm hiển thị
            TopList,             // Cho lên Top N
            JobBadge,       // Gắn badge
            ThemeCompany
           // IncreaseQuota,       // Tăng số lượng job được đăng
            //ExtendExpiredDate,   // Kéo dài ngày hết hạn job
        }
        //cái này chỉ để check có phải action của job ko thôi- dùng trong hàm 
        public enum JobServiceAction
        {
            BoostScoreJob = 0,        // Tăng điểm hiển thị
            TopList = 1,             // Cho lên Top N
            JobBadge= 2       // Gắn badge
        }
        //hiển thị
        public  enum CompanyServiceAction
        {
            ThemeCompany = 0
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
