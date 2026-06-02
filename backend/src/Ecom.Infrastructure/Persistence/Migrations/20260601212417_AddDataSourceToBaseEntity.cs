using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDataSourceToBaseEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "WishlistItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "VisitorLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "UserRoles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "UserRefreshTokens",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "UserAddresses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Stocks",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "StockMovements",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "SiteSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ShippingCarriers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Shipments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "SalesGoals",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ReviewReports",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ReviewReplies",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ReviewLikes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ProductVariants",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ProductReviews",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ProductImages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "OrderStatusHistories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "OrderItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Licenses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "InvoiceItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ImportJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ExternalSources",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ExternalSourceImportLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "ErrorLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "DeployServers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "DeployLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "CouponUsages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Coupons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Carts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "CartItems",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Brands",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "AuditLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DataSource",
                table: "Announcements",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "WishlistItems");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "VisitorLogs");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "UserRoles");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "UserRefreshTokens");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "UserAddresses");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ShippingCarriers");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "SalesGoals");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ReviewReports");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ReviewReplies");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ReviewLikes");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ProductVariants");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ProductReviews");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ProductImages");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "OrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Licenses");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ImportJobs");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ExternalSources");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ExternalSourceImportLogs");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "ErrorLogs");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "DeployServers");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "DeployLogs");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "CouponUsages");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Carts");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "DataSource",
                table: "Announcements");
        }
    }
}
