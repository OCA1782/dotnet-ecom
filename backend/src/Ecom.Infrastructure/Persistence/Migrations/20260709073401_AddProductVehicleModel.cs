using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductVehicleModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VehicleModel",
                table: "Products",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_VehicleModel",
                table: "Products",
                column: "VehicleModel");
            // Note: data population (VehicleModel = category name for vehicle nav products)
            // is done at startup via BackfillVehicleModelJob to avoid migration timeout on large tables.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_VehicleModel",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "VehicleModel",
                table: "Products");
        }
    }
}
