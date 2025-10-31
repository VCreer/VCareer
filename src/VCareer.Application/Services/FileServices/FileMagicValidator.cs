using Org.BouncyCastle.Utilities;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using VCareer.Constants.FilePolicy;
using VCareer.Services.FileServices;
using Volo.Abp.DependencyInjection;

namespace VCareer.Files.FileValidator
{
    public class FileMagicValidator
    {
        private readonly FilePoliciesServices _filePolicyService;

        public FileMagicValidator(FilePoliciesServices filePolicyService)
        {
            _filePolicyService = filePolicyService;
        }

// Mimetype với magic signature
        private readonly Dictionary<string, byte[][]> MagicSignatures = new(){ 
     // Ảnh
    { "image/jpeg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
    { "image/png",  new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } } },
   
    // Tài liệu
    // PDF
    { "application/pdf", new[] { new byte[] { 0x25, 0x50, 0x44, 0x46 } } }, // "%PDF"

    // Word cũ (.doc)
    { "application/msword", new[] { new byte[] { 0xD0, 0xCF, 0x11, 0xE0 } } }, // Compound File Binary

    // Word mới (.docx)
    { "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        new[] { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } }, // ZIP header

    // Excel cũ (.xls)
    { "application/vnd.ms-excel", new[] { new byte[] { 0xD0, 0xCF, 0x11, 0xE0 } } },

    // Excel mới (.xlsx)
    { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        new[] { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } },

    // CSV hoặc TXT (văn bản đơn giản)
    { "text/plain", new[]
        {
            new byte[] { 0xEF, 0xBB, 0xBF }, // UTF-8 BOM
            new byte[] { 0xFF, 0xFE },       // UTF-16 LE
            new byte[] { 0xFE, 0xFF }        // UTF-16 BE
        }
    },
    //kiểu dữ liệu tách nhau bởi đấu phẩy
    { "text/csv", new[]
        {
            new byte[] { 0xEF, 0xBB, 0xBF },
            new byte[] { 0xFF, 0xFE },
            new byte[] { 0xFE, 0xFF }
        }
    },

    // Nén
    // ZIP (PK..) 
    { "application/zip",              new[] { new byte[] { 0x50, 0x4B, 0x03, 0x04 } } },
    // RAR ("Rar!"), định dạng nén độc quyền của WinRAR
    { "application/x-rar-compressed", new[] { new byte[] { 0x52, 0x61, 0x72, 0x21 } } },
    //7Z, định dạng nén mạnh của 7-Zip
    { "application/x-7z-compressed",  new[] { new byte[] { 0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C } } },

        };

        private static readonly Dictionary<string, string> ExtentionToMimeType = new()
        {
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".png", "image/png" },
            { ".pdf", "application/pdf" },
            { ".doc", "application/msword" },
            { ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
            { ".xls", "application/vnd.ms-excel" },
            { ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
            { ".txt", "text/plain" },
            { ".csv", "text/csv" },
            { ".zip", "application/zip" },
            { ".rar", "application/x-rar-compressed" },
            { ".7z", "application/x-7z-compressed" },
        };
        //đoạn này đại khái là : đầu vào containertype ~ vídụ là image thì :
        // lấy list các đuôi mở rộng file cho phép
        // từ lits extension trên  lấy ra mime type cho phép
        //list mimetype lấy ra list magic signature cho phép tương ứng - các byte đầu của loại file đặc trưng như .doc, .png
        // so sánh các byte đầu của file upload với các magic signature
        public async Task<bool> ValidateMagicFileAsync(Stream stream, object containerType)
        {

            if (stream == null || !stream.CanRead || containerType == null) throw new ArgumentException("Invalid stream or container type");

            var allowedExtensions = _filePolicyService.GetAllowedExtensions(containerType);
            if (!allowedExtensions.Any()) throw new ArgumentException("No allowed extensions found for the specified container type or not support");

            var allowedMimeTypes = GetMimeTypesFromExtensions(allowedExtensions);
            if (!allowedMimeTypes.Any()) throw new ArgumentException("No allowed mime types found for the this comtainter type or not support");

            var allowedMagicSignatures = GetMagicSignatureFromMimes(allowedMimeTypes);
            if (allowedMagicSignatures.Count==0) throw new ArgumentException("No magic signatures found for the this comtainter type or not support");

            byte[] header = new byte[16];
            int bytesRead = await stream.ReadAsync(header, 0, header.Length);
            stream.Seek(0, SeekOrigin.Begin); // Reset stream position
            if (bytesRead == 0) throw new ArgumentException("Read header file false");

            foreach (byte[] sign in allowedMagicSignatures)
            {
                if (header.Take(sign.Length).SequenceEqual(sign))
                    return true;
            }
            return false;
        }

        private List<byte[]> GetMagicSignatureFromMimes(List<string> listMimeTypes)
        {
            List<byte[]> signatures = new List<byte[]>();
            foreach (var mime in listMimeTypes)
            {
                if (!MagicSignatures.TryGetValue(mime, out byte[][] signs)) continue;
                foreach (byte[] sign in signs) signatures.Add(sign);
            }

            return signatures;
        }

        private List<string> GetMimeTypesFromExtensions(string[] extensions)
        {
            List<string> mimeTypes = new List<string>();
            foreach (var extension in extensions)
            {
                ExtentionToMimeType.TryGetValue(extension.ToLowerInvariant(), out string? mime);
                if (mime != null) mimeTypes.Add(mime);
            }
            return mimeTypes;
        }






    }
}
