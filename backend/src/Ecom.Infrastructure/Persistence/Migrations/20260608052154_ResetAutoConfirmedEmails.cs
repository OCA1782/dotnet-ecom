using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ResetAutoConfirmedEmails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Eski kodda admin panelden oluşturulan kullanıcılara otomatik EmailConfirmed=true set ediliyordu.
            // Google ile giriş yapanlar ve SuperAdmin hariç tüm onaylanmış hesapları sıfırla.
            migrationBuilder.Sql(@"
                UPDATE Users
                SET EmailConfirmed = 0
                WHERE IsDeleted = 0
                  AND EmailConfirmed = 1
                  AND GoogleId IS NULL
                  AND Id NOT IN (
                      SELECT UserId FROM UserRoles WHERE Role = 10
                  )
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Users SET EmailConfirmed = 1 WHERE IsDeleted = 0 AND GoogleId IS NULL");
        }
    }
}
