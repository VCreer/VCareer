using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Constants.Authentication
{
    public static class AuthenticationConstants
    {
    }
    //cái này phải giống dưới db 
    public static class RoleName
    {
        public const String LEADRECRUITER = "lead_recruiter";
        public const String HRSTAFF = "hr_staff";
        public const String CANDIDATE = "candidate";
        public const string SYSTEMEMPLOYEE = "system_employee";
        public const string FINANCEEMPLOYEE = "finance_employee";
        public const string CUSTOMERSUPPORT = "customer_support";
        public const string ACCOUNTEMPLOYEE = "account_employee";
    }


}
