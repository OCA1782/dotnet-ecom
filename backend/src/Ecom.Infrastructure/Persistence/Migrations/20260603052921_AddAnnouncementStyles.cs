using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnouncementStyles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StylesJson",
                table: "Announcements",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StylesJson",
                table: "Announcements");
        }
    }
}
