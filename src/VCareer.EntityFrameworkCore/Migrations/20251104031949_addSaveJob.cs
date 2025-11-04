using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class addSaveJob : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AppSavedJobs",
                columns: table => new
                {
                    CandidateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppSavedJobs", x => new { x.CandidateId, x.JobId });
                    table.ForeignKey(
                        name: "FK_AppSavedJobs_CandidateProfile_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "CandidateProfile",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AppSavedJobs_JobPostings_JobId",
                        column: x => x.JobId,
                        principalTable: "JobPostings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AppSavedJobs_CandidateId",
                table: "AppSavedJobs",
                column: "CandidateId");

            migrationBuilder.CreateIndex(
                name: "IX_AppSavedJobs_CandidateId_JobId",
                table: "AppSavedJobs",
                columns: new[] { "CandidateId", "JobId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppSavedJobs_JobId",
                table: "AppSavedJobs",
                column: "JobId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AppSavedJobs");
        }
    }
}
