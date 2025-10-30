using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class Update_Cateegories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CompanyIndustries_Industries_IndustryId",
                table: "CompanyIndustries");

            // Drop old FK with typo name (RecuterId -> RecruiterId)
            migrationBuilder.DropForeignKey(
                name: "FK_JobPostings_RecruiterProfile_RecuterId",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "District",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "Keywords",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "Province",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "WorkTime",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "JobCategories");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "JobCategories");

            migrationBuilder.RenameColumn(
                name: "RecuterId",
                table: "JobPostings",
                newName: "RecruiterId");

            migrationBuilder.RenameColumn(
                name: "AppllyCount",
                table: "JobPostings",
                newName: "ApplyCount");

            migrationBuilder.RenameIndex(
                name: "IX_JobPostings_RecuterId",
                table: "JobPostings",
                newName: "IX_JobPostings_RecruiterId");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Provinces",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Provinces",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "WorkLocation",
                table: "JobPostings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "JobPostings",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "JobPostings",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AlterColumn<string>(
                name: "Requirements",
                table: "JobPostings",
                type: "nvarchar(max)",
                maxLength: 5000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AlterColumn<DateTime>(
                name: "PostedAt",
                table: "JobPostings",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<string>(
                name: "Image",
                table: "JobPostings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "JobPostings",
                type: "nvarchar(max)",
                maxLength: 5000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AlterColumn<string>(
                name: "Benefits",
                table: "JobPostings",
                type: "nvarchar(max)",
                maxLength: 5000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AddColumn<int>(
                name: "DistrictId",
                table: "JobPostings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PositionType",
                table: "JobPostings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ProvinceId",
                table: "JobPostings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "TimeDeal",
                table: "JobPostings",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "WorkTimeEnd",
                table: "JobPostings",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "WorkTimeStart",
                table: "JobPostings",
                type: "time",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "JobCategories",
                type: "nvarchar(250)",
                maxLength: 250,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "JobCategories",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "JobCategories",
                type: "bit",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "JobCategories",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "JobCount",
                table: "JobCategories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "JobCategories",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Districts",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Districts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_JobCategories_IsActive",
                table: "JobCategories",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_JobCategories_Slug",
                table: "JobCategories",
                column: "Slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_CompanyIndustries_Industries_IndustryId",
                table: "CompanyIndustries",
                column: "IndustryId",
                principalTable: "Industries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // COMMENTED: FK already exists in database - avoid duplicate constraint error
            //migrationBuilder.AddForeignKey(
            //    name: "FK_EmployeeIpAddresses_EmployeeProfiles_EmployeeId",
            //    table: "EmployeeIpAddresses",
            //    column: "EmployeeId",
            //    principalTable: "EmployeeProfiles",
            //    principalColumn: "UserId",
            //    onDelete: ReferentialAction.Cascade);

            //migrationBuilder.AddForeignKey(
            //    name: "FK_EmployeeIpAddresses_EmployeeProfiles_EmployeeProfileUserId",
            //    table: "EmployeeIpAddresses",
            //    column: "EmployeeProfileUserId",
            //    principalTable: "EmployeeProfiles",
            //    principalColumn: "UserId");

            //migrationBuilder.AddForeignKey(
            //    name: "FK_EmployeeIpAddresses_IpAddresses_IpAdressId",
            //    table: "EmployeeIpAddresses",
            //    column: "IpAdressId",
            //    principalTable: "IpAddresses",
            //    principalColumn: "Id",
            //    onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_JobPostings_RecruiterProfile_RecruiterId",
                table: "JobPostings",
                column: "RecruiterId",
                principalTable: "RecruiterProfile",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CompanyIndustries_Industries_IndustryId",
                table: "CompanyIndustries");

            // COMMENTED: FK already exists - no need to drop during rollback
            //migrationBuilder.DropForeignKey(
            //    name: "FK_EmployeeIpAddresses_EmployeeProfiles_EmployeeId",
            //    table: "EmployeeIpAddresses");

            //migrationBuilder.DropForeignKey(
            //    name: "FK_EmployeeIpAddresses_EmployeeProfiles_EmployeeProfileUserId",
            //    table: "EmployeeIpAddresses");

            //migrationBuilder.DropForeignKey(
            //    name: "FK_EmployeeIpAddresses_IpAddresses_IpAdressId",
            //    table: "EmployeeIpAddresses");

            migrationBuilder.DropForeignKey(
                name: "FK_JobPostings_RecruiterProfile_RecruiterId",
                table: "JobPostings");

            migrationBuilder.DropIndex(
                name: "IX_JobCategories_IsActive",
                table: "JobCategories");

            migrationBuilder.DropIndex(
                name: "IX_JobCategories_Slug",
                table: "JobCategories");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Provinces");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Provinces");

            migrationBuilder.DropColumn(
                name: "DistrictId",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "PositionType",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "ProvinceId",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "TimeDeal",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "WorkTimeEnd",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "WorkTimeStart",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "JobCategories");

            migrationBuilder.DropColumn(
                name: "JobCount",
                table: "JobCategories");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "JobCategories");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Districts");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Districts");

            migrationBuilder.RenameColumn(
                name: "RecruiterId",
                table: "JobPostings",
                newName: "RecuterId");

            migrationBuilder.RenameColumn(
                name: "ApplyCount",
                table: "JobPostings",
                newName: "AppllyCount");

            migrationBuilder.RenameIndex(
                name: "IX_JobPostings_RecruiterId",
                table: "JobPostings",
                newName: "IX_JobPostings_RecuterId");

            migrationBuilder.AlterColumn<string>(
                name: "WorkLocation",
                table: "JobPostings",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "JobPostings",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(256)",
                oldMaxLength: 256);

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "JobPostings",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(300)",
                oldMaxLength: 300);

            migrationBuilder.AlterColumn<string>(
                name: "Requirements",
                table: "JobPostings",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldMaxLength: 5000);

            migrationBuilder.AlterColumn<DateTime>(
                name: "PostedAt",
                table: "JobPostings",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "Image",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "JobPostings",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldMaxLength: 5000);

            migrationBuilder.AlterColumn<string>(
                name: "Benefits",
                table: "JobPostings",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldMaxLength: 5000);

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Keywords",
                table: "JobPostings",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Province",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "JobPostings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "WorkTime",
                table: "JobPostings",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "JobCategories",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(250)",
                oldMaxLength: 250);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "JobCategories",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                table: "JobCategories",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "JobCategories",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "JobCategories",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddForeignKey(
                name: "FK_CompanyIndustries_Industries_IndustryId",
                table: "CompanyIndustries",
                column: "IndustryId",
                principalTable: "Industries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_JobPostings_RecruiterProfile_RecuterId",
                table: "JobPostings",
                column: "RecuterId",
                principalTable: "RecruiterProfile",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
