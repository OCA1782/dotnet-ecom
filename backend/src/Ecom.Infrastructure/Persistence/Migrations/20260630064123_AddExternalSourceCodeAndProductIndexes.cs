using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalSourceCodeAndProductIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "ExternalSources",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // Composite filter index: covers the base WHERE clause for every product query
            migrationBuilder.CreateIndex(
                name: "IX_Products_FilterBase",
                table: "Products",
                columns: ["IsDeleted", "IsPublished", "IsActive"]);

            // Admin source-filter index
            migrationBuilder.CreateIndex(
                name: "IX_Products_ImportedFromSourceId",
                table: "Products",
                column: "ImportedFromSourceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Products_FilterBase", table: "Products");
            migrationBuilder.DropIndex(name: "IX_Products_ImportedFromSourceId", table: "Products");
            migrationBuilder.DropColumn(name: "Code", table: "ExternalSources");
        }
    }
}
