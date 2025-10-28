using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class update_Add_field_Job_Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "JobPostings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_JobPostings_ProvinceId",
                table: "JobPostings",
                column: "ProvinceId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobPostings_Provinces_ProvinceId",
                table: "JobPostings",
                column: "ProvinceId",
                principalTable: "Provinces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobPostings_Provinces_ProvinceId",
                table: "JobPostings");

            migrationBuilder.DropIndex(
                name: "IX_JobPostings_ProvinceId",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "JobPostings");
        }
    }
}
