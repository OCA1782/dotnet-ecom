using Ecom.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260711150000_AddPreviewJobs")]
public partial class AddPreviewJobs : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""PreviewJobs"" (
    ""Id""               uuid                        NOT NULL DEFAULT gen_random_uuid(),
    ""ExternalSourceId"" uuid                        NOT NULL,
    ""RequestedByUserId"" uuid                       NULL,
    ""Status""           text                        NOT NULL DEFAULT 'Queued',
    ""TotalPages""       integer                     NOT NULL DEFAULT 0,
    ""ProcessedPages""   integer                     NOT NULL DEFAULT 0,
    ""TotalRows""        integer                     NOT NULL DEFAULT 0,
    ""ErrorMessage""     text                        NULL,
    ""StartedAt""        timestamp with time zone    NULL,
    ""CompletedAt""      timestamp with time zone    NULL,
    ""DataSource""       text                        NULL,
    ""IsDeleted""        boolean                     NOT NULL DEFAULT false,
    ""CreatedDate""      timestamp with time zone    NOT NULL DEFAULT now(),
    ""UpdatedDate""      timestamp with time zone    NULL,
    CONSTRAINT ""PK_PreviewJobs"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_PreviewJobs_ExternalSources"" FOREIGN KEY (""ExternalSourceId"")
        REFERENCES ""ExternalSources""(""Id"") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ""IX_PreviewJobs_ExternalSourceId"" ON ""PreviewJobs""(""ExternalSourceId"");
CREATE INDEX IF NOT EXISTS ""IX_PreviewJobs_Status"" ON ""PreviewJobs""(""Status"");
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""PreviewJobs"";");
    }
}
