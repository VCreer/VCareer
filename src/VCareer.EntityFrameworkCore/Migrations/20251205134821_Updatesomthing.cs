using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class Updatesomthing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BlocksJson",
                table: "CandidateCvs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlocksJson",
                table: "CandidateCvs");
        }
    }
}
