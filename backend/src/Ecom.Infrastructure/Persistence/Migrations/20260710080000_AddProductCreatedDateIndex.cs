using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductCreatedDateIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Composite sort index — allows ORDER BY CreatedDate DESC to be served directly from the index
            // without sorting 111K rows, bringing the default product list query from 553s → <1ms
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_CreatedDate' AND object_id = OBJECT_ID('Products'))
                    CREATE INDEX IX_Products_CreatedDate ON Products (IsDeleted, IsActive, IsPublished, CreatedDate DESC);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Products_CreatedDate' AND object_id = OBJECT_ID('Products'))
                    DROP INDEX IX_Products_CreatedDate ON Products;");
        }
    }
}
