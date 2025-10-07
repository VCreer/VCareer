using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VCareer.Migrations
{
    /// <inheritdoc />
    public partial class Adđed_updateCompany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessLicenseFile",
                table: "Companies",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "BusinessLicenseIssueDate",
                table: "Companies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BusinessLicenseIssuePlace",
                table: "Companies",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BusinessLicenseNumber",
                table: "Companies",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LegalRepresentative",
                table: "Companies",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LegalReviewedAt",
                table: "Companies",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "LegalReviewedBy",
                table: "Companies",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalVerificationStatus",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OtherSupportFile",
                table: "Companies",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RepresentativeIdCardFile",
                table: "Companies",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TaxCertificateFile",
                table: "Companies",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TaxCode",
                table: "Companies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_BusinessLicenseNumber",
                table: "Companies",
                column: "BusinessLicenseNumber",
                unique: true,
                filter: "[BusinessLicenseNumber] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_TaxCode",
                table: "Companies",
                column: "TaxCode",
                unique: true,
                filter: "[TaxCode] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Companies_BusinessLicenseNumber",
                table: "Companies");

            migrationBuilder.DropIndex(
                name: "IX_Companies_TaxCode",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BusinessLicenseFile",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BusinessLicenseIssueDate",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BusinessLicenseIssuePlace",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "BusinessLicenseNumber",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "LegalRepresentative",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "LegalReviewedAt",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "LegalReviewedBy",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "LegalVerificationStatus",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "OtherSupportFile",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "RepresentativeIdCardFile",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "TaxCertificateFile",
                table: "Companies");

            migrationBuilder.DropColumn(
                name: "TaxCode",
                table: "Companies");
        }
    }
}
