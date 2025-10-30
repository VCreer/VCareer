using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VCareer.Dto.TeamManagementDto;
using VCareer.IServices.ITeamManagement;
using VCareer.Models.Users;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;

namespace VCareer.Services.TeamManagement
{
    /// <summary>
    /// Implementation của Team Management Service
    /// </summary>
    public class TeamManagementAppService : ApplicationService, ITeamManagementAppService
    {
        private readonly IRepository<RecruiterProfile, Guid> _recruiterProfileRepository;
        private readonly IRepository<EmployeeProfile, Guid> _employeeProfileRepository;
        private readonly IdentityUserManager _userManager;
        private readonly ICurrentUser _currentUser;

        public TeamManagementAppService(
            IRepository<RecruiterProfile, Guid> recruiterProfileRepository,
            IRepository<EmployeeProfile, Guid> employeeProfileRepository,
            IdentityUserManager userManager,
            ICurrentUser currentUser)
        {
            _recruiterProfileRepository = recruiterProfileRepository;
            _employeeProfileRepository = employeeProfileRepository;
            _userManager = userManager;
            _currentUser = currentUser;
        }

        /// <summary>
        /// Lấy thông tin user hiện tại (DEBUG)
        /// </summary>
        public async Task<StaffListItemDto> GetCurrentUserInfoAsync()
        {
            try
            {
                var currentRecruiter = await GetCurrentRecruiterProfileAsync();
                
                return new StaffListItemDto
                {
                    UserId = currentRecruiter.UserId,
                    RecruiterProfileId = currentRecruiter.Id,
                    FullName = $"{currentRecruiter.User?.Name} {currentRecruiter.User?.Surname}".Trim(),
                    Email = currentRecruiter.User?.Email ?? "",
                    IsLead = currentRecruiter.IsLead,
                    Status = currentRecruiter.Status,
                    CompanyId = currentRecruiter.CompanyId,
                    CompanyName = currentRecruiter.Company?.CompanyName ?? ""
                };
            }
            catch (Exception ex)
            {
                throw new UserFriendlyException($"Lỗi: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách tất cả staff trong company
        /// </summary>
        public async Task<List<StaffListItemDto>> GetAllStaffAsync()
        {
            // Get current user profile và verify là Leader
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Chỉ Leader Recruiter mới có quyền xem danh sách staff.");
            }

            // Get all staff trong company
            var queryable = await _recruiterProfileRepository.WithDetailsAsync(r => r.User, r => r.Company);
            var staffList = queryable
                .Where(r => r.CompanyId == currentRecruiter.CompanyId)
                .ToList();

            // Map to DTO
            var result = staffList.Select(s => new StaffListItemDto
            {
                UserId = s.UserId,
                RecruiterProfileId = s.Id,
                FullName = $"{s.User?.Name} {s.User?.Surname}".Trim(),
                Email = s.User?.Email ?? "",
                IsLead = s.IsLead,
                Status = s.Status,
                CompanyId = s.CompanyId,
                CompanyName = s.Company?.CompanyName ?? ""
            }).ToList();

            return result;
        }

        /// <summary>
        /// Deactivate HR Staff
        /// </summary>
        public async Task<StaffStatusChangeDto> DeactivateStaffAsync(DeactivateStaffDto input)
        {
            // Validate input
            if (input.StaffId == Guid.Empty)
            {
                throw new UserFriendlyException("Staff ID không hợp lệ.");
            }

            // Get current user profile và verify là Leader
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Chỉ Leader Recruiter mới có quyền deactivate staff.");
            }

            // Get staff profile - tìm theo RecruiterProfileId (StaffId là RecruiterProfileId)
            var queryable = await _recruiterProfileRepository.WithDetailsAsync(r => r.User);
            var staffRecruiter = queryable.FirstOrDefault(r => r.Id == input.StaffId);

            if (staffRecruiter == null)
            {
                throw new UserFriendlyException("Không tìm thấy staff.");
            }

            // Verify cùng company
            if (staffRecruiter.CompanyId != currentRecruiter.CompanyId)
            {
                throw new UserFriendlyException("Bạn chỉ có thể deactivate staff trong cùng công ty.");
            }

            // Không thể deactivate Leader khác
            if (staffRecruiter.IsLead && staffRecruiter.UserId != currentRecruiter.UserId)
            {
                throw new UserFriendlyException("Không thể deactivate Leader khác.");
            }

            // Không thể deactivate chính mình
            if (staffRecruiter.UserId == currentRecruiter.UserId)
            {
                throw new UserFriendlyException("Không thể deactivate chính mình.");
            }

            // Check nếu đã inactive rồi
            if (!staffRecruiter.Status)
            {
                throw new UserFriendlyException("Staff này đã được deactivate trước đó.");
            }

            // Store previous status
            var previousStatus = staffRecruiter.Status;

            // Update status
            staffRecruiter.Status = false;
            await _recruiterProfileRepository.UpdateAsync(staffRecruiter);

            // Build response
            var currentUserName = $"{currentRecruiter.User?.Name} {currentRecruiter.User?.Surname}";
            var staffFullName = $"{staffRecruiter.User?.Name} {staffRecruiter.User?.Surname}";

            return new StaffStatusChangeDto
            {
                StaffId = staffRecruiter.UserId,
                FullName = staffFullName,
                Email = staffRecruiter.User?.Email,
                PreviousStatus = previousStatus,
                NewStatus = staffRecruiter.Status,
                Action = "Deactivate",
                Reason = input.Reason,
                ChangeTimestamp = DateTime.Now,
                PerformedBy = currentUserName,
                Message = $"Staff {staffFullName} đã được deactivate thành công."
            };
        }

        /// <summary>
        /// Activate HR Staff
        /// </summary>
        public async Task<StaffStatusChangeDto> ActivateStaffAsync(ActivateStaffDto input)
        {
            // Validate input
            if (input.StaffId == Guid.Empty)
            {
                throw new UserFriendlyException("Staff ID không hợp lệ.");
            }

            // Get current user profile và verify là Leader
            var currentRecruiter = await GetCurrentRecruiterProfileAsync();
            if (!currentRecruiter.IsLead)
            {
                throw new UserFriendlyException("Chỉ Leader Recruiter mới có quyền activate staff.");
            }

            // Get staff profile - tìm theo RecruiterProfileId (StaffId là RecruiterProfileId)
            var queryable2 = await _recruiterProfileRepository.WithDetailsAsync(r => r.User);
            var staffRecruiter = queryable2.FirstOrDefault(r => r.Id == input.StaffId);

            if (staffRecruiter == null)
            {
                throw new UserFriendlyException("Không tìm thấy staff.");
            }

            // Verify cùng company
            if (staffRecruiter.CompanyId != currentRecruiter.CompanyId)
            {
                throw new UserFriendlyException("Bạn chỉ có thể activate staff trong cùng công ty.");
            }

            // Check nếu đã active rồi
            if (staffRecruiter.Status)
            {
                throw new UserFriendlyException("Staff này đã ở trạng thái active.");
            }

            // Store previous status
            var previousStatus = staffRecruiter.Status;

            // Update status
            staffRecruiter.Status = true;
            await _recruiterProfileRepository.UpdateAsync(staffRecruiter);

            // Build response
            var currentUserName = $"{currentRecruiter.User?.Name} {currentRecruiter.User?.Surname}";
            var staffFullName = $"{staffRecruiter.User?.Name} {staffRecruiter.User?.Surname}";

            return new StaffStatusChangeDto
            {
                StaffId = staffRecruiter.UserId,
                FullName = staffFullName,
                Email = staffRecruiter.User?.Email,
                PreviousStatus = previousStatus,
                NewStatus = staffRecruiter.Status,
                Action = "Activate",
                Reason = input.Reason,
                ChangeTimestamp = DateTime.Now,
                PerformedBy = currentUserName,
                Message = $"Staff {staffFullName} đã được activate thành công."
            };
        }

        #region Private Helper Methods

        /// <summary>
        /// Lấy RecruiterProfile của user hiện tại
        /// </summary>
        private async Task<RecruiterProfile> GetCurrentRecruiterProfileAsync()
        {
            if (!_currentUser.IsAuthenticated)
            {
                throw new UserFriendlyException("Bạn cần đăng nhập để thực hiện thao tác này.");
            }

            var currentUserId = _currentUser.Id.Value;
            var queryable = await _recruiterProfileRepository.WithDetailsAsync(r => r.User, r => r.Company);
            var recruiter = queryable.FirstOrDefault(r => r.UserId == currentUserId);

            if (recruiter == null)
            {
                throw new UserFriendlyException("Bạn không phải là Recruiter.");
            }

            return recruiter;
        }

        #endregion
    }
}
