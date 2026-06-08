using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SetGoogleDataSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // GoogleId dolu olan eski kullanıcıların DataSource'unu backfill et
            migrationBuilder.Sql(@"
                UPDATE Users
                SET DataSource = 'Google'
                WHERE IsDeleted = 0
                  AND GoogleId IS NOT NULL
                  AND (DataSource IS NULL OR DataSource = '')
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE Users
                SET DataSource = NULL
                WHERE IsDeleted = 0
                  AND GoogleId IS NOT NULL
                  AND DataSource = 'Google'
            ");
        }
    }
}
