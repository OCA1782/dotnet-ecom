using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class AiTaskConfiguration : IEntityTypeConfiguration<AiTask>
{
    public void Configure(EntityTypeBuilder<AiTask> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Type).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(50).IsRequired();
        builder.HasMany(x => x.Images).WithOne(i => i.AiTask).HasForeignKey(i => i.AiTaskId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedDate);
    }
}

public class AiTaskImageConfiguration : IEntityTypeConfiguration<AiTaskImage>
{
    public void Configure(EntityTypeBuilder<AiTaskImage> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ImageUrl).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.FileName).HasMaxLength(500);
    }
}
