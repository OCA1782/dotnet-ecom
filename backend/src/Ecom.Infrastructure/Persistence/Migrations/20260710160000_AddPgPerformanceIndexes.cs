using Ecom.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260710160000_AddPgPerformanceIndexes")]
public partial class AddPgPerformanceIndexes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // pg_trgm: enable trigram extension (needed for GIN ILIKE index)
        migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

        // GIN trigram index on Name — turns ILIKE '%term%' from full-scan into index seek
        migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Products_Name_Trgm"" ON ""Products"" USING GIN (""Name"" gin_trgm_ops);");

        // Covering sort index — ORDER BY ""CreatedDate"" DESC served from index without sort step
        // Eliminates 4-second full-scan on the default (no-filter) product list
        migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Products_CreatedDate"" ON ""Products"" (""IsDeleted"", ""IsActive"", ""IsPublished"", ""CreatedDate"" DESC);");

        // Partial index — smaller than full VehicleModel index since NULL rows are excluded
        migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Products_VehicleModel_Partial"" ON ""Products"" (""VehicleModel"") WHERE ""VehicleModel"" IS NOT NULL;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Products_Name_Trgm"";");
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Products_CreatedDate"";");
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Products_VehicleModel_Partial"";");
    }
}
