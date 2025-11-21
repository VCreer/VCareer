using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class dichvu222 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsLiteTime",
                table: "User_ChildServices",
                newName: "IsLifeTime");

            migrationBuilder.AddColumn<int>(
                name: "DayDuration",
                table: "SubcriptionServices",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsLifeTime",
                table: "SubcriptionServices",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalPrice",
                table: "SubcriptionServices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "TotalBuyEachUser",
                table: "SubcriptionServices",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "EffectingJobServices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsLimitUsedTime",
                table: "ChildServices",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DayDuration",
                table: "SubcriptionServices");

            migrationBuilder.DropColumn(
                name: "IsLifeTime",
                table: "SubcriptionServices");

            migrationBuilder.DropColumn(
                name: "OriginalPrice",
                table: "SubcriptionServices");

            migrationBuilder.DropColumn(
                name: "TotalBuyEachUser",
                table: "SubcriptionServices");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "EffectingJobServices");

            migrationBuilder.DropColumn(
                name: "IsLimitUsedTime",
                table: "ChildServices");

            migrationBuilder.RenameColumn(
                name: "IsLifeTime",
                table: "User_ChildServices",
                newName: "IsLiteTime");
        }
    }
}
