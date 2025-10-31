using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class AddFileLimitAtributeTouser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "MaxQuotaBytes",
                table: "RecruiterProfile",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "QuotaUsedBytes",
                table: "RecruiterProfile",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "MaxQuotaBytes",
                table: "CandidateProfile",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "QuotaUsedBytes",
                table: "CandidateProfile",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxQuotaBytes",
                table: "RecruiterProfile");

            migrationBuilder.DropColumn(
                name: "QuotaUsedBytes",
                table: "RecruiterProfile");

            migrationBuilder.DropColumn(
                name: "MaxQuotaBytes",
                table: "CandidateProfile");

            migrationBuilder.DropColumn(
                name: "QuotaUsedBytes",
                table: "CandidateProfile");
        }
    }
}
