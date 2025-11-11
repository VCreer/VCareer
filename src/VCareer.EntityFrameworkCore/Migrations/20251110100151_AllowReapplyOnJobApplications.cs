using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class AllowReapplyOnJobApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobApplications_JobId_CandidateId",
                table: "JobApplications");

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_JobId_CandidateId",
                table: "JobApplications",
                columns: new[] { "JobId", "CandidateId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobApplications_JobId_CandidateId",
                table: "JobApplications");

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_JobId_CandidateId",
                table: "JobApplications",
                columns: new[] { "JobId", "CandidateId" },
                unique: true);
        }
    }
}
