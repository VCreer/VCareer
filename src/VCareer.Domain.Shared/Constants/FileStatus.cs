using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Constants
{
    public static class FileStatus
    {

        public const int Deleted = -4; // bị xóa mềm  
        public const int Error = -3;    //bị lỗi khi xử lý file
        public const int Quanrantined = -2; //nhiễm virus
        public const int InActive = -1; 

        public const int Pending = 0; // file h
        public const int Active = 1;  //File hoạt động
    }
}
