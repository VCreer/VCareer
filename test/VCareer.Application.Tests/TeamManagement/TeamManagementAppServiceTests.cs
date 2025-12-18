//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Linq.Expressions;
//using System.Threading.Tasks;
//using NSubstitute;
//using Shouldly;
//using VCareer.Dto.TeamManagementDto;
//using VCareer.Models.Companies;
//using VCareer.Models.Users;
//using VCareer.Services.TeamManagement;
//using Volo.Abp;
//using Volo.Abp.Domain.Repositories;
//using Volo.Abp.Users;
//using Xunit;

//namespace VCareer.TeamManagement;

//public class TeamManagementAppServiceTests
//{
//    [Fact]
//    public async Task GetAllStaffAsync_returns_only_non_lead_staff_in_same_company()
//    {
//        var leaderUserId = Guid.NewGuid();
//        var leader = CreateRecruiterProfile(Guid.NewGuid(), leaderUserId, 1, isLead: true, status: true, "Lead", "Boss");
//        var staff = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), 1, isLead: false, status: true, "Staff", "Member");
//        var otherCompanyStaff = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), 2, isLead: false, status: true, "Other", "Co");

//        var (service, _) = BuildService(leaderUserId, new List<RecruiterProfile> { leader, staff, otherCompanyStaff });

//        var result = await service.GetAllStaffAsync();

//        result.Count.ShouldBe(1);
//        result[0].RecruiterProfileId.ShouldBe(staff.Id);
//        result[0].CompanyId.ShouldBe(leader.CompanyId);
//        result[0].IsLead.ShouldBeFalse();
//    }

//    [Fact]
//    public async Task GetAllStaffAsync_throws_when_current_user_not_leader()
//    {
//        var userId = Guid.NewGuid();
//        var nonLeader = CreateRecruiterProfile(Guid.NewGuid(), userId, 1, isLead: false, status: true, "User", "Normal");
//        var staff = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), 1, isLead: false, status: true, "Staff", "Member");
//        var (service, _) = BuildService(userId, new List<RecruiterProfile> { nonLeader, staff });

//        var ex = await Should.ThrowAsync<UserFriendlyException>(() => service.GetAllStaffAsync());

//        ex.Message.ShouldContain("Leader Recruiter");
//    }

//    [Fact]
//    public async Task GetAllStaffAsync_returns_empty_when_no_staff_in_company()
//    {
//        var leaderUserId = Guid.NewGuid();
//        var leader = CreateRecruiterProfile(Guid.NewGuid(), leaderUserId, 1, isLead: true, status: true, "Lead", "Boss");
//        var (service, _) = BuildService(leaderUserId, new List<RecruiterProfile> { leader });

//        var result = await service.GetAllStaffAsync();

//        result.ShouldBeEmpty();
//    }

//    [Fact]
//    public async Task DeactivateStaffAsync_updates_status_and_returns_payload()
//    {
//        var leaderUserId = Guid.NewGuid();
//        var leader = CreateRecruiterProfile(Guid.NewGuid(), leaderUserId, 1, isLead: true, status: true, "Lead", "Boss");
//        var staff = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), 1, isLead: false, status: true, "Staff", "Member");
//        var (service, recruiterRepo) = BuildService(leaderUserId, new List<RecruiterProfile> { leader, staff });
//        var input = new DeactivateStaffDto { StaffId = staff.Id, Reason = "cleanup" };

//        var response = await service.DeactivateStaffAsync(input);

//        response.NewStatus.ShouldBeFalse();
//        response.Action.ShouldBe("Deactivate");
//        response.StaffId.ShouldBe(staff.UserId);
//        await recruiterRepo.Received(1).UpdateAsync(
//            Arg.Is<RecruiterProfile>(r => r.Id == staff.Id && r.Status == false),
//            Arg.Any<bool>());
//    }

//    [Fact]
//    public async Task DeactivateStaffAsync_throws_when_current_user_is_not_leader()
//    {
//        var userId = Guid.NewGuid();
//        var nonLeader = CreateRecruiterProfile(Guid.NewGuid(), userId, 1, isLead: false, status: true, "User", "Normal");
//        var staff = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), 1, isLead: false, status: true, "Staff", "Member");
//        var (service, _) = BuildService(userId, new List<RecruiterProfile> { nonLeader, staff });

//        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
//            service.DeactivateStaffAsync(new DeactivateStaffDto { StaffId = staff.Id, Reason = "no" }));

//        ex.Message.ShouldContain("Leader Recruiter");
//    }

//    [Fact]
//    public async Task DeactivateStaffAsync_throws_when_staff_not_same_company()
//    {
//        var leaderUserId = Guid.NewGuid();
//        var leader = CreateRecruiterProfile(Guid.NewGuid(), leaderUserId, 1, isLead: true, status: true, "Lead", "Boss");
//        var staffOtherCompany = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), 2, isLead: false, status: true, "Staff", "Other");
//        var (service, _) = BuildService(leaderUserId, new List<RecruiterProfile> { leader, staffOtherCompany });

//        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
//            service.DeactivateStaffAsync(new DeactivateStaffDto { StaffId = staffOtherCompany.Id, Reason = "no" }));

//        ex.Message.ShouldContain("cùng công ty");
//    }

//    [Fact]
//    public async Task DeactivateStaffAsync_throws_when_deactivate_self()
//    {
//        var leaderUserId = Guid.NewGuid();
//        var leader = CreateRecruiterProfile(Guid.NewGuid(), leaderUserId, 1, isLead: true, status: true, "Lead", "Boss");
//        var (service, _) = BuildService(leaderUserId, new List<RecruiterProfile> { leader });

//        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
//            service.DeactivateStaffAsync(new DeactivateStaffDto { StaffId = leader.Id, Reason = "self" }));

//        ex.Message.ShouldContain("chính mình");
//    }

//    [Fact]
//    public async Task ActivateStaffAsync_updates_status_back_to_active()
//    {
//        var leaderUserId = Guid.NewGuid();
//        var leader = CreateRecruiterProfile(Guid.NewGuid(), leaderUserId, 1, isLead: true, status: true, "Lead", "Boss");
//        var staff = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), 1, isLead: false, status: false, "Staff", "Member");
//        var (service, recruiterRepo) = BuildService(leaderUserId, new List<RecruiterProfile> { leader, staff });
//        var input = new ActivateStaffDto { StaffId = staff.Id, Reason = "restore" };

//        var response = await service.ActivateStaffAsync(input);

//        response.NewStatus.ShouldBeTrue();
//        response.Action.ShouldBe("Activate");
//        response.StaffId.ShouldBe(staff.UserId);
//        await recruiterRepo.Received(1).UpdateAsync(
//            Arg.Is<RecruiterProfile>(r => r.Id == staff.Id && r.Status == true),
//            Arg.Any<bool>());
//    }

//    [Fact]
//    public async Task ActivateStaffAsync_throws_when_not_leader()
//    {
//        var userId = Guid.NewGuid();
//        var nonLeader = CreateRecruiterProfile(Guid.NewGuid(), userId, 1, isLead: false, status: true, "User", "Normal");
//        var staff = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), 1, isLead: false, status: false, "Staff", "Member");
//        var (service, _) = BuildService(userId, new List<RecruiterProfile> { nonLeader, staff });

//        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
//            service.ActivateStaffAsync(new ActivateStaffDto { StaffId = staff.Id, Reason = "no" }));

//        ex.Message.ShouldContain("Leader Recruiter");
//    }

//    [Fact]
//    public async Task ActivateStaffAsync_throws_when_staff_already_active()
//    {
//        var leaderUserId = Guid.NewGuid();
//        var leader = CreateRecruiterProfile(Guid.NewGuid(), leaderUserId, 1, isLead: true, status: true, "Lead", "Boss");
//        var staffActive = CreateRecruiterProfile(Guid.NewGuid(), Guid.NewGuid(), 1, isLead: false, status: true, "Staff", "Member");
//        var (service, _) = BuildService(leaderUserId, new List<RecruiterProfile> { leader, staffActive });

//        var ex = await Should.ThrowAsync<UserFriendlyException>(() =>
//            service.ActivateStaffAsync(new ActivateStaffDto { StaffId = staffActive.Id, Reason = "active" }));

//        ex.Message.ShouldContain("đã ở trạng thái active");
//    }

//    private static RecruiterProfile CreateRecruiterProfile(Guid profileId, Guid userId, int companyId, bool isLead, bool status, string name, string surname)
//    {
//        var user = new IdentityUser(userId, $"{name.ToLower()}@test.com", $"{name.ToLower()}@test.com")
//        {
//            Name = name,
//            Surname = surname
//        };

//        var profile = new RecruiterProfile
//        {
//            UserId = userId,
//            CompanyId = companyId,
//            IsLead = isLead,
//            Status = status,
//            User = user,
//            Company = new Company { CompanyName = $"Company {companyId}" }
//        };

//        // Id setter is protected; use reflection to assign for test data
//        typeof(RecruiterProfile)
//            .GetProperty("Id")?
//            .SetValue(profile, profileId);

//        typeof(Company)
//            .GetProperty("Id")?
//            .SetValue(profile.Company, companyId);

//        return profile;
//    }

//    private static (TeamManagementAppService service, IRepository<RecruiterProfile, Guid> recruiterRepo) BuildService(
//        Guid currentUserId,
//        List<RecruiterProfile> recruiterData)
//    {
//        var recruiterRepo = Substitute.For<IRepository<RecruiterProfile, Guid>>();
//        recruiterRepo.WithDetailsAsync(Arg.Any<Expression<Func<RecruiterProfile, object>>[]>())
//            .Returns(Task.FromResult(recruiterData.AsQueryable()));
//        recruiterRepo.GetAsync(Arg.Any<Guid>(), Arg.Any<bool>())
//            .Returns(ci =>
//            {
//                var id = ci.ArgAt<Guid>(0);
//                return Task.FromResult(recruiterData.First(r => r.Id == id));
//            });
//        recruiterRepo.UpdateAsync(Arg.Any<RecruiterProfile>(), Arg.Any<bool>())
//            .Returns(ci => Task.FromResult(ci.Arg<RecruiterProfile>()));
//        recruiterRepo.InsertAsync(Arg.Any<RecruiterProfile>(), Arg.Any<bool>())
//            .Returns(ci => Task.FromResult(ci.Arg<RecruiterProfile>()));

//        var employeeRepo = Substitute.For<IRepository<EmployeeProfile, Guid>>();
//        var currentUser = Substitute.For<ICurrentUser>();
//        currentUser.IsAuthenticated.Returns(true);
//        currentUser.Id.Returns((Guid?)currentUserId);

//        var service = new TeamManagementAppService(
//            recruiterRepo,
//            employeeRepo,
//            null!,
//            null!,
//            currentUser,
//            null!,
//            null!);

//        // Lưu ý: Các test hiện tại không gọi InviteStaffAsync (đã Skip),
//        // nên không cần cấu hình UnitOfWorkManager/CurrentUnitOfWork.
//        return (service, recruiterRepo);
//    }
//}

