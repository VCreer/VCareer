using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class fixConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobPost_RecruiterProfile_RecruiterId",
                table: "JobPost");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_RecruiterProfile_Id",
                table: "RecruiterProfile",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_JobPost_RecruiterProfile_RecruiterId",
                table: "JobPost",
                column: "RecruiterId",
                principalTable: "RecruiterProfile",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobPost_RecruiterProfile_RecruiterId",
                table: "JobPost");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_RecruiterProfile_Id",
                table: "RecruiterProfile");

            migrationBuilder.AddForeignKey(
                name: "FK_JobPost_RecruiterProfile_RecruiterId",
                table: "JobPost",
                column: "RecruiterId",
                principalTable: "RecruiterProfile",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
