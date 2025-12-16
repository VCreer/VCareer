using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class initDb3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SalePercent",
                table: "SubcriptionPrices");

            migrationBuilder.AddColumn<decimal>(
                name: "NewPrice",
                table: "SubcriptionPrices",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NewPrice",
                table: "SubcriptionPrices");

            migrationBuilder.AddColumn<int>(
                name: "SalePercent",
                table: "SubcriptionPrices",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
