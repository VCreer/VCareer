using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using VCareer.BlobStoring;
using VCareer.Constants.FileConstant;
using VCareer.CV;
using VCareer.Models.Users;
using VCareer.Permission;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;

namespace VCareer.Services.CV
{
    /*[Authorize(VCareerPermission.CV.Default)]*/
    public class CVAppService : VCareerAppService, ICVAppService
    {
        private readonly IRepository<CurriculumVitae, Guid> _cvRepository;
        private readonly IRepository<CandidateProfile, Guid> _candidateProfileRepository;
        private readonly ICurrentUser _currentUser;
        private readonly IBlobContainer<CvContainer> _cvBlobContainer;
        private readonly IdentityUserManager _userManager;

        public CVAppService(
            IRepository<CurriculumVitae, Guid> cvRepository,
            IRepository<CandidateProfile, Guid> candidateProfileRepository,
            ICurrentUser currentUser,
            IBlobContainer<CvContainer> cvBlobContainer,
            IdentityUserManager userManager)
        {
            _cvRepository = cvRepository;
            _candidateProfileRepository = candidateProfileRepository;
            _currentUser = currentUser;
            _cvBlobContainer = cvBlobContainer;
            _userManager = userManager;
        }

        /*[Authorize(VCareerPermission.CV.CreateOnline)]*/
        public async Task<CVDto> CreateCVOnlineAsync(CreateCVOnlineDto input)
        {
            var userId = _currentUser.GetId();
            
            // Kiểm tra user có phải candidate không
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
            {
                throw new UserFriendlyException("Chỉ có candidate mới có thể tạo CV.");
            }

            // Tạo CV mới
            var cv = new CurriculumVitae
            {
                CandidateId = candidate.UserId,
                CVName = input.CVName,
                CVType = "Online",
                Status = "Draft",
                IsDefault = false,
                IsPublic = input.IsPublic,
                FullName = input.FullName,
                Email = input.Email,
                PhoneNumber = input.PhoneNumber,
                DateOfBirth = input.DateOfBirth,
                Address = input.Address,
                CareerObjective = input.CareerObjective,
                WorkExperience = input.WorkExperience,
                Education = input.Education,
                Skills = input.Skills,
                Projects = input.Projects,
                Certificates = input.Certificates,
                Languages = input.Languages,
                Interests = input.Interests
            };

            // Nếu đây là CV đầu tiên của candidate, set làm mặc định
            var existingCVs = await _cvRepository.GetListAsync(c => c.CandidateId == candidate.UserId);
            if (!existingCVs.Any())
            {
                cv.IsDefault = true;
            }

            await _cvRepository.InsertAsync(cv);

            return ObjectMapper.Map<CurriculumVitae, CVDto>(cv);
        }

        [Authorize(VCareerPermission.CV.Upload)]
        public async Task<CVDto> UploadCVAsync(UploadCVDto input)
        {
            var userId = _currentUser.GetId();
            
            // Kiểm tra user có phải candidate không
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
            {
                throw new UserFriendlyException("Chỉ có candidate mới có thể upload CV.");
            }

            // Tạo CV upload
            var cv = new CurriculumVitae
            {
                CandidateId = candidate.UserId,
                CVName = input.CVName,
                CVType = "Upload",
                Status = "Published",
                IsDefault = false,
                IsPublic = input.IsPublic,
                OriginalFileName = input.OriginalFileName,
                FileUrl = input.FileUrl,
                FileSize = input.FileSize,
                FileType = input.FileType,
                Description = input.Description
            };

            // Nếu đây là CV đầu tiên của candidate, set làm mặc định
            var existingCVs = await _cvRepository.GetListAsync(c => c.CandidateId == candidate.UserId);
            if (!existingCVs.Any())
            {
                cv.IsDefault = true;
            }

            await _cvRepository.InsertAsync(cv);

            return ObjectMapper.Map<CurriculumVitae, CVDto>(cv);
        }

        /*[Authorize(VCareerPermission.CV.Upload)]*/
        public async Task<CVDto> SimpleUploadCVAsync(IFormFile file)
        {
            // For development when auth is disabled, use a default user ID
            var userId = _currentUser.GetId();
            /*if (userId == null || userId == Guid.Empty)
            {
                var firstUser = await _userManager.Users.FirstOrDefaultAsync();
                if (firstUser == null)
                {
                    throw new UserFriendlyException("No users found in database. Please create a user first.");
                }
                userId = firstUser.Id;
            }*/

            // Kiểm tra user có phải candidate không
            var candidate = await _candidateProfileRepository.FirstOrDefaultAsync(c => c.UserId == userId);
            if (candidate == null)
            {
                throw new UserFriendlyException("Chỉ có candidate mới có thể upload CV.");
            }

            // Validate file
            if (file == null || file.Length == 0)
            {
                throw new UserFriendlyException("Vui lòng chọn file CV để upload.");
            }

            // Validate file size
            if (!CvUploadConstants.IsValidFileSize(file.Length))
            {
                throw new UserFriendlyException($"File quá lớn. Kích thước tối đa cho phép là {CvUploadConstants.MaxFileSize / (1024 * 1024)}MB.");
            }

            // Validate file extension
            if (!CvUploadConstants.IsValidFileExtension(file.FileName))
            {
                throw new UserFriendlyException($"Định dạng file không được hỗ trợ. Chỉ chấp nhận các file: {string.Join(", ", CvUploadConstants.AllowedExtensions)}");
            }

            // Validate MIME type
            if (!CvUploadConstants.IsValidMimeType(file.ContentType))
            {
                throw new UserFriendlyException($"Loại file không được hỗ trợ. Chỉ chấp nhận: {string.Join(", ", CvUploadConstants.AllowedMimeTypes)}");
            }

            try
            {
                // Generate unique file name
                var fileName = CvUploadConstants.GenerateFileName(file.FileName);
                
                // Upload file to blob storage using CV container
                using var stream = file.OpenReadStream();
                await _cvBlobContainer.SaveAsync(fileName, stream);

                // Get file URL for CV container
                var fileUrl = $"/api/files/cv/{fileName}";
                
                // Tạo CV upload
                var cv = new CurriculumVitae
                {
                    CandidateId = candidate.UserId,
                    CVName = Path.GetFileNameWithoutExtension(file.FileName), // Use original file name without extension
                    CVType = "Upload",
                    Status = "Published",
                    IsDefault = false,
                    IsPublic = false, // Default to private
                    OriginalFileName = file.FileName,
                    FileUrl = fileUrl,
                    FileSize = file.Length,
                    FileType = file.ContentType,
                    Description = $"CV được upload từ file: {file.FileName}"
                };

                // Nếu đây là CV đầu tiên của candidate, set làm mặc định
                var existingCVs = await _cvRepository.GetListAsync(c => c.CandidateId == candidate.UserId);
                if (!existingCVs.Any())
                {
                    cv.IsDefault = true;
                }

                await _cvRepository.InsertAsync(cv);

                return ObjectMapper.Map<CurriculumVitae, CVDto>(cv);
            }
            catch (Exception ex)
            {
                throw new UserFriendlyException($"Có lỗi xảy ra khi upload file: {ex.Message}");
            }
        }

        [Authorize(VCareerPermission.CV.Update)]
        public async Task<CVDto> UpdateCVAsync(Guid id, UpdateCVDto input)
        {
            var userId = _currentUser.GetId();
            
            // Kiểm tra CV có thuộc về current user không
            var cv = await _cvRepository.FirstOrDefaultAsync(c => c.Id == id && c.CandidateId == userId);
            if (cv == null)
            {
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn.");
            }

            // Update các field không null
            if (!string.IsNullOrEmpty(input.CVName))
                cv.CVName = input.CVName;
            
            if (!string.IsNullOrEmpty(input.FullName))
                cv.FullName = input.FullName;
            
            if (!string.IsNullOrEmpty(input.Email))
                cv.Email = input.Email;
            
            if (!string.IsNullOrEmpty(input.PhoneNumber))
                cv.PhoneNumber = input.PhoneNumber;
            
            if (input.DateOfBirth.HasValue)
                cv.DateOfBirth = input.DateOfBirth;
            
            if (!string.IsNullOrEmpty(input.Address))
                cv.Address = input.Address;
            
            if (!string.IsNullOrEmpty(input.CareerObjective))
                cv.CareerObjective = input.CareerObjective;
            
            if (!string.IsNullOrEmpty(input.WorkExperience))
                cv.WorkExperience = input.WorkExperience;
            
            if (!string.IsNullOrEmpty(input.Education))
                cv.Education = input.Education;
            
            if (!string.IsNullOrEmpty(input.Skills))
                cv.Skills = input.Skills;
            
            if (!string.IsNullOrEmpty(input.Projects))
                cv.Projects = input.Projects;
            
            if (!string.IsNullOrEmpty(input.Certificates))
                cv.Certificates = input.Certificates;
            
            if (!string.IsNullOrEmpty(input.Languages))
                cv.Languages = input.Languages;
            
            if (!string.IsNullOrEmpty(input.Interests))
                cv.Interests = input.Interests;
            
            if (!string.IsNullOrEmpty(input.Status))
                cv.Status = input.Status;
            
            if (input.IsPublic.HasValue)
                cv.IsPublic = input.IsPublic.Value;

            await _cvRepository.UpdateAsync(cv);

            return ObjectMapper.Map<CurriculumVitae, CVDto>(cv);
        }

        /*[Authorize(VCareerPermission.CV.Get)]*/
        public async Task<CVDto> GetCVAsync(Guid id)
        {
            var userId = _currentUser.GetId();
            
            var cv = await _cvRepository.FirstOrDefaultAsync(c => c.Id == id && c.CandidateId == userId);
            if (cv == null)
            {
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn.");
            }

            return ObjectMapper.Map<CurriculumVitae, CVDto>(cv);
        }

       /* [Authorize(VCareerPermission.CV.Get)]*/
        public async Task<PagedResultDto<CVDto>> GetCVListAsync(GetCVListDto input)
        {
            var userId = _currentUser.GetId();
            
            var queryable = await _cvRepository.GetQueryableAsync();
            var query = queryable.Where(c => c.CandidateId == userId);

            // Apply filters
            if (!string.IsNullOrEmpty(input.CVType))
                query = query.Where(c => c.CVType == input.CVType);
            
            if (!string.IsNullOrEmpty(input.Status))
                query = query.Where(c => c.Status == input.Status);
            
            if (input.IsPublic.HasValue)
                query = query.Where(c => c.IsPublic == input.IsPublic.Value);
            
            if (input.IsDefault.HasValue)
                query = query.Where(c => c.IsDefault == input.IsDefault.Value);

            // Apply sorting - tạm thời chỉ sort theo CreationTime desc
            query = query.OrderByDescending(c => c.CreationTime);

            // Get total count
            var totalCount = await AsyncExecuter.CountAsync(query);

            // Apply pagination
            var cvs = await AsyncExecuter.ToListAsync(
                query.Skip(input.SkipCount).Take(input.MaxResultCount)
            );

            return new PagedResultDto<CVDto>(
                totalCount,
                ObjectMapper.Map<List<CurriculumVitae>, List<CVDto>>(cvs)
            );
        }

        [Authorize(VCareerPermission.CV.Get)]
        public async Task<CVDto> GetDefaultCVAsync()
        {
            var userId = _currentUser.GetId();
            
            var cv = await _cvRepository.FirstOrDefaultAsync(c => c.CandidateId == userId && c.IsDefault);
            if (cv == null)
            {
                throw new UserFriendlyException("Bạn chưa có CV mặc định.");
            }

            return ObjectMapper.Map<CurriculumVitae, CVDto>(cv);
        }

        [Authorize(VCareerPermission.CV.SetDefault)]
        public async Task SetDefaultCVAsync(SetDefaultCVDto input)
        {
            var userId = _currentUser.GetId();
            
            // Kiểm tra CV có thuộc về current user không
            var cv = await _cvRepository.FirstOrDefaultAsync(c => c.Id == input.CVId && c.CandidateId == userId);
            if (cv == null)
            {
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn.");
            }

            // Bỏ default của tất cả CV khác
            var otherCVs = await _cvRepository.GetListAsync(c => c.CandidateId == userId && c.IsDefault);
            foreach (var otherCV in otherCVs)
            {
                otherCV.IsDefault = false;
                await _cvRepository.UpdateAsync(otherCV);
            }

            // Set CV này làm mặc định
            cv.IsDefault = true;
            await _cvRepository.UpdateAsync(cv);
        }

        [Authorize(VCareerPermission.CV.SetPublic)]
        public async Task SetPublicCVAsync(SetPublicCVDto input)
        {
            var userId = _currentUser.GetId();
            
            // Kiểm tra CV có thuộc về current user không
            var cv = await _cvRepository.FirstOrDefaultAsync(c => c.Id == input.CVId && c.CandidateId == userId);
            if (cv == null)
            {
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn.");
            }

            cv.IsPublic = input.IsPublic;
            await _cvRepository.UpdateAsync(cv);
        }

        [Authorize(VCareerPermission.CV.Delete)]
        public async Task DeleteCVAsync(Guid id)
        {
            var userId = _currentUser.GetId();
            
            // Kiểm tra CV có thuộc về current user không
            var cv = await _cvRepository.FirstOrDefaultAsync(c => c.Id == id && c.CandidateId == userId);
            if (cv == null)
            {
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn.");
            }

            // Nếu đây là CV mặc định, set CV khác làm mặc định
            if (cv.IsDefault)
            {
                var otherCV = await _cvRepository.FirstOrDefaultAsync(c => c.CandidateId == userId && c.Id != id);
                if (otherCV != null)
                {
                    otherCV.IsDefault = true;
                    await _cvRepository.UpdateAsync(otherCV);
                }
            }

            await _cvRepository.DeleteAsync(cv);
        }

        public async Task<List<CVDto>> GetPublicCVsByCandidateAsync(Guid candidateId)
        {
            var cvs = await _cvRepository.GetListAsync(c => c.CandidateId == candidateId && c.IsPublic);
            return ObjectMapper.Map<List<CurriculumVitae>, List<CVDto>>(cvs);
        }

        public async Task<byte[]> ExportCVToPDFAsync(Guid id)
        {
            var userId = _currentUser.GetId();
            
            // Kiểm tra CV có thuộc về current user không
            var cv = await _cvRepository.FirstOrDefaultAsync(c => c.Id == id && c.CandidateId == userId);
            if (cv == null)
            {
                throw new UserFriendlyException("CV không tồn tại hoặc không thuộc về bạn.");
            }

            // Chỉ export CV Online
            if (cv.CVType != "Online")
            {
                throw new UserFriendlyException("Chỉ có thể export CV Online thành PDF.");
            }

            // Generate PDF
            var pdfService = new CVPDFService();
            var pdfBytes = pdfService.GeneratePDF(cv);

            return pdfBytes;
        }
    }
}
