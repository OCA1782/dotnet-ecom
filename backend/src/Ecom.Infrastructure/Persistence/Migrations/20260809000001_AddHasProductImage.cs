using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHasProductImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasProductImage",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Backfill: ürünün en az bir gerçek resmi varsa true yap
            migrationBuilder.Sql("""
                UPDATE "Products" p
                SET "HasProductImage" = true
                WHERE EXISTS (
                    SELECT 1 FROM "ProductImages" pi
                    WHERE pi."ProductId" = p."Id"
                      AND pi."IsDeleted" = false
                      AND pi."ImageUrl" NOT LIKE '%no-image%'
                );
                """);

            // Index: ORDER BY HasProductImage DESC için
            migrationBuilder.CreateIndex(
                name: "IX_Products_HasProductImage",
                table: "Products",
                column: "HasProductImage");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_HasProductImage",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "HasProductImage",
                table: "Products");
        }
    }
}
