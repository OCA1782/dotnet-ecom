using Ecom.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260723100000_AddVisitorLogsIndexes")]
public partial class AddVisitorLogsIndexes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Date range filter — most common filter in visitor log queries
        migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_VisitorLogs_CreatedDate"" ON ""VisitorLogs"" (""CreatedDate"" DESC) WHERE ""IsDeleted"" = false;");

        // IP address filter
        migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_VisitorLogs_IpAddress"" ON ""VisitorLogs"" (""IpAddress"") WHERE ""IpAddress"" IS NOT NULL;");

        // Page filter (exact match)
        migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_VisitorLogs_Page"" ON ""VisitorLogs"" (""Page"") WHERE ""Page"" IS NOT NULL;");

        // UserId filter — links visits to registered users
        migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_VisitorLogs_UserId"" ON ""VisitorLogs"" (""UserId"") WHERE ""UserId"" IS NOT NULL;");

        // Country filter for geo stats
        migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_VisitorLogs_Country"" ON ""VisitorLogs"" (""Country"") WHERE ""Country"" IS NOT NULL;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_VisitorLogs_CreatedDate"";");
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_VisitorLogs_IpAddress"";");
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_VisitorLogs_Page"";");
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_VisitorLogs_UserId"";");
        migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_VisitorLogs_Country"";");
    }
}
