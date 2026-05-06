using Ecom.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecom.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Email).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Surname).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(200).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(20);
        builder.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();

        builder.HasMany(x => x.Roles).WithOne(r => r.User).HasForeignKey(r => r.UserId);
        builder.HasMany(x => x.Addresses).WithOne(a => a.User).HasForeignKey(a => a.UserId);
        builder.HasMany(x => x.Orders).WithOne(o => o.User).HasForeignKey(o => o.UserId);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
