using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBusinessLicenseNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Companies_BusinessLicenseNumber",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BusinessLicenseNumber",
                table: "Companies");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessLicenseNumber",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Companies_BusinessLicenseNumber",
                table: "Companies",
                column: "BusinessLicenseNumber",
                unique: true,
                filter: "[BusinessLicenseNumber] IS NOT NULL");
        }
    }
}
