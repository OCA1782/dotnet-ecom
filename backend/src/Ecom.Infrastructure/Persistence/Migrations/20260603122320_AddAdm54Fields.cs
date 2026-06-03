using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAdm54Fields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StylesJson",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StylesJson",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestPayload",
                table: "ErrorLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Coupons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Coupons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StylesJson",
                table: "Coupons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StylesJson",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Brands",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StylesJson",
                table: "Brands",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "StylesJson",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StylesJson",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "VideoUrl",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RequestPayload",
                table: "ErrorLogs");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "StylesJson",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "StylesJson",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "VideoUrl",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "StylesJson",
                table: "Brands");
        }
    }
}
