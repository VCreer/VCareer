using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace VCareer.Permission
{
    public class VCareerPermission
    {
        public const string GroupName = "VCareer";
        public static class Files
        {
            public const string Default = GroupName + ".Files";
            public const string View   = Default + ".View";
            public const string Upload = Default + ".Upload";
            public const string Download = Default + ".Download";
            public const string Delete = Default + ".Delete";
            public const string Update = Default + ".Update";
        }

        public static class Users
        {
            public const string Default = GroupName + ".Users";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
        }

        public static class Roles
        {
            public const string Default = GroupName + ".Roles";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
        }

        public static class Permissions
        {
            public const string Default = GroupName + ".Permissions";
            public const string View = Default + ".View";
            public const string Create = Default + ".Create";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
        }


    }
}
