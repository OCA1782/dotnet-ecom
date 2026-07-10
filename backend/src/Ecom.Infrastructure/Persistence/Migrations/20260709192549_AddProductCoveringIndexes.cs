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
            // Both IX_Products_ActivePublished and IX_Products_VehicleModel are already defined
            // via HasIndex() in ProductConfiguration and created in earlier migrations.
            // IF NOT EXISTS guards ensure this is idempotent on both providers.
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Products_ActivePublished"" ON ""Products"" (""IsDeleted"", ""IsActive"", ""IsPublished"");");
            migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Products_VehicleModel"" ON ""Products"" (""VehicleModel"");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // These indexes are managed by HasIndex() — Down() is a no-op to avoid removing EF-owned indexes.
        }
    }
}
