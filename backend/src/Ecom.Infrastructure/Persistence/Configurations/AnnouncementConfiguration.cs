using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class AnnouncementConfiguration : IEntityTypeConfiguration<Announcement>
{
    public void Configure(EntityTypeBuilder<Announcement> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(500);
        builder.Property(x => x.Content).HasMaxLength(4000);
        builder.Property(x => x.MediaUrl).HasMaxLength(1000);
        builder.Property(x => x.MediaType).HasMaxLength(20).HasDefaultValue("none");
        builder.Property(x => x.Category).HasMaxLength(50).HasDefaultValue("duyuru");
        builder.Property(x => x.LinkUrl).HasMaxLength(500);
        builder.Property(x => x.LinkText).HasMaxLength(100);
        builder.HasIndex(x => x.IsActive);
        builder.HasIndex(x => x.DisplayOrder);
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
