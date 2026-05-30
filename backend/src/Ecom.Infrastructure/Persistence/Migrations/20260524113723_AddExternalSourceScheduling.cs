using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalSourceScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AutoImportTarget",
                table: "ExternalSources",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FetchSchedule",
                table: "ExternalSources",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastAutoImportAt",
                table: "ExternalSources",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextScheduledFetchAt",
                table: "ExternalSources",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutoImportTarget",
                table: "ExternalSources");

            migrationBuilder.DropColumn(
                name: "FetchSchedule",
                table: "ExternalSources");

            migrationBuilder.DropColumn(
                name: "LastAutoImportAt",
                table: "ExternalSources");

            migrationBuilder.DropColumn(
                name: "NextScheduledFetchAt",
                table: "ExternalSources");
        }
    }
}
