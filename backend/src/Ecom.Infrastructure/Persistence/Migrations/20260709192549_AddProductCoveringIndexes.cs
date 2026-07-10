using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductCoveringIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Composite filter index — speeds up COUNT(*) and all product list queries
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_ActivePublished' AND object_id = OBJECT_ID('Products'))
                    CREATE INDEX IX_Products_ActivePublished ON Products (IsDeleted, IsActive, IsPublished);");

            // Rebuild VehicleModel index with INCLUDE columns — eliminates key lookups on VehicleModel LIKE searches
            // Skip if the covering index (with IsDeleted included) already exists to avoid locking the table on re-run
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.index_columns ic
                    JOIN sys.indexes i ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                    WHERE i.name = 'IX_Products_VehicleModel'
                      AND i.object_id = OBJECT_ID('Products')
                      AND ic.is_included_column = 1
                )
                BEGIN
                    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_VehicleModel' AND object_id = OBJECT_ID('Products'))
                        DROP INDEX IX_Products_VehicleModel ON Products;
                    CREATE INDEX IX_Products_VehicleModel ON Products (VehicleModel) INCLUDE (IsDeleted, IsActive, IsPublished, Id);
                END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_ActivePublished' AND object_id = OBJECT_ID('Products'))
                    DROP INDEX IX_Products_ActivePublished ON Products;");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_VehicleModel' AND object_id = OBJECT_ID('Products'))
                    DROP INDEX IX_Products_VehicleModel ON Products;
                CREATE INDEX IX_Products_VehicleModel ON Products (VehicleModel);");
        }
    }
}
