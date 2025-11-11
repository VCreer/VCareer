using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Constants
{
    public static class FileStatus
    {
        public const int Deleted = -1; // bị xóa mềm  
        public const int Private = 0; // file đã xác thực nhưng private
        public const int Public = 1;  //File đã xác thực và public
    }
}
