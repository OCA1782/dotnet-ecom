using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductIdempotencyAndFilterIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Unique partial index: prevents concurrent import jobs from inserting the same
            // (source, SKU) pair. Application-level idempotency (seenSku dict) covers the
            // single-thread case; this index is the DB-level safety net for concurrent jobs.
            migrationBuilder.CreateIndex(
                name: "UX_Products_SourceId_SKU",
                table: "Products",
                columns: ["ImportedFromSourceId", "SKU"],
                unique: true,
                filter: "[ImportedFromSourceId] IS NOT NULL AND [SKU] IS NOT NULL");

            // Composite covering index for filtered product lists (admin + customer category pages).
            // Covers: WHERE IsDeleted=0 AND CategoryId=? ORDER BY Price ASC/DESC
            migrationBuilder.CreateIndex(
                name: "IX_Products_IsDeleted_CategoryId_Price",
                table: "Products",
                columns: ["IsDeleted", "CategoryId", "Price"]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "UX_Products_SourceId_SKU", table: "Products");
            migrationBuilder.DropIndex(name: "IX_Products_IsDeleted_CategoryId_Price", table: "Products");
        }
    }
}
