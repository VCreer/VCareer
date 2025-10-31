using System;

namespace VCareer.Constants.FileConstant
{
    /// <summary>
    /// Constants for CV file upload
    /// </summary>
    public static class CvUploadConstants
    {
        /// <summary>
        /// Maximum file size for CV upload (5MB)
        /// </summary>
        public const long MaxFileSize = 10 * 1024 * 1024; // 5MB in bytes

        /// <summary>
        /// Allowed file extensions for CV upload
        /// </summary>
        public static readonly string[] AllowedExtensions = { ".pdf", ".doc", ".docx" };

        /// <summary>
        /// Allowed MIME types for CV upload
        /// </summary>
        public static readonly string[] AllowedMimeTypes = 
        {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };

        /// <summary>
        /// Default CV name prefix for uploaded files
        /// </summary>
        public const string DefaultCvNamePrefix = "CV_Upload_";

        /// <summary>
        /// Validate file size
        /// </summary>
        public static bool IsValidFileSize(long fileSize)
        {
            return fileSize > 0 && fileSize <= MaxFileSize;
        }

        /// <summary>
        /// Validate file extension
        /// </summary>
        public static bool IsValidFileExtension(string fileName)
        {
            if (string.IsNullOrEmpty(fileName))
                return false;

            var extension = System.IO.Path.GetExtension(fileName).ToLowerInvariant();
            return Array.Exists(AllowedExtensions, ext => ext.Equals(extension, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Validate MIME type
        /// </summary>
        public static bool IsValidMimeType(string mimeType)
        {
            if (string.IsNullOrEmpty(mimeType))
                return false;

            return Array.Exists(AllowedMimeTypes, type => type.Equals(mimeType, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Generate unique file name
        /// </summary>
        public static string GenerateFileName(string originalFileName)
        {
            var extension = System.IO.Path.GetExtension(originalFileName);
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
            var random = new Random().Next(1000, 9999);
            return $"{DefaultCvNamePrefix}{timestamp}_{random}{extension}";
        }
    }
}

