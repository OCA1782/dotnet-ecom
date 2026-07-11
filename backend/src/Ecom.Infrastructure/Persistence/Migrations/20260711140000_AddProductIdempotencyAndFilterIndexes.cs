using Ecom.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260711140000_AddProductIdempotencyAndFilterIndexes")]
public partial class AddProductIdempotencyAndFilterIndexes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Unique partial index: DB-level safety net against concurrent import jobs inserting
        // the same (source, SKU) pair. Application-level seenSku dict covers single-thread case.
        migrationBuilder.Sql(@"CREATE UNIQUE INDEX IF NOT EXISTS ""UX_Products_SourceId_SKU""
            ON ""Products"" (""ImportedFromSourceId"", ""SKU"")
            WHERE ""ImportedFromSourceId"" IS NOT NULL AND ""SKU"" IS NOT NULL;");

        // Covering index for filtered product lists (admin + customer category pages)
        migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Products_IsDeleted_CategoryId_Price""
            ON ""Products"" (""IsDeleted"", ""CategoryId"", ""Price"");");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""UX_Products_SourceId_SKU"";");
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Products_IsDeleted_CategoryId_Price"";");
    }
}
