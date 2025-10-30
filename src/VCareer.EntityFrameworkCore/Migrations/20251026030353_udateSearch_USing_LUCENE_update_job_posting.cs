using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class udateSearch_USing_LUCENE_update_job_posting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExperienceYearsMax",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "ExperienceYearsMin",
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

            migrationBuilder.AddColumn<int>(
                name: "Experience",
                table: "JobPostings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Quantity",
                table: "JobPostings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SalaryText",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WorkTime",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Experience",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "Quantity",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "SalaryText",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "WorkTime",
                table: "JobPostings");

            migrationBuilder.AddColumn<int>(
                name: "ExperienceYearsMax",
                table: "JobPostings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExperienceYearsMin",
                table: "JobPostings",
                type: "int",
                nullable: true);

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
        }
    }
}
