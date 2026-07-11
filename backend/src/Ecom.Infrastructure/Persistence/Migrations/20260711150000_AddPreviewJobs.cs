using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPreviewJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PreviewJobs",
                columns: table => new
                {
                    Id              = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    ExternalSourceId= table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedByUserId=table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status          = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Queued"),
                    TotalPages      = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    ProcessedPages  = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    TotalRows       = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    ErrorMessage    = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    StartedAt       = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt     = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedDate     = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedDate     = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted       = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreviewJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreviewJobs_ExternalSources_ExternalSourceId",
                        column: x => x.ExternalSourceId,
                        principalTable: "ExternalSources",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PreviewJobs_ExternalSourceId",
                table: "PreviewJobs",
                column: "ExternalSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_PreviewJobs_Status",
                table: "PreviewJobs",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PreviewJobs");
        }
    }
}
