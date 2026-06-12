using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace Ecom.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260606120000_AddErrorLogPayloads")]
    public partial class AddErrorLogPayloads : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.ErrorLogs', 'RequestPayload') IS NULL
                    ALTER TABLE [ErrorLogs] ADD [RequestPayload] nvarchar(max) NULL;

                IF COL_LENGTH('dbo.ErrorLogs', 'ResponsePayload') IS NULL
                    ALTER TABLE [ErrorLogs] ADD [ResponsePayload] nvarchar(max) NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH('dbo.ErrorLogs', 'ResponsePayload') IS NOT NULL
                    ALTER TABLE [ErrorLogs] DROP COLUMN [ResponsePayload];

                IF COL_LENGTH('dbo.ErrorLogs', 'RequestPayload') IS NOT NULL
                    ALTER TABLE [ErrorLogs] DROP COLUMN [RequestPayload];
                """);
        }
    }
}
