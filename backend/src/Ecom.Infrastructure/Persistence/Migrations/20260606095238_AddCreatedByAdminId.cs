using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedByAdminId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "Users",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "UploadedFiles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "Products",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "Coupons",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "Categories",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "Campaigns",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "Brands",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "Announcements",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "UploadedFiles");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "Announcements");
        }
    }
}
