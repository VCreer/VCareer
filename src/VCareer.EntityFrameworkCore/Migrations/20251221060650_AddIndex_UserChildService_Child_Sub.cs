using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class AddIndex_UserChildService_Child_Sub : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_User_ChildServices_ChildServiceId",
                table: "User_ChildServices");

            migrationBuilder.CreateIndex(
                name: "IX_UserChildService_Child_Sub",
                table: "User_ChildServices",
                columns: new[] { "ChildServiceId", "UserSubcriptionId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserChildService_Child_Sub",
                table: "User_ChildServices");

            migrationBuilder.CreateIndex(
                name: "IX_User_ChildServices_ChildServiceId",
                table: "User_ChildServices",
                column: "ChildServiceId");
        }
    }
}
