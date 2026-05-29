using System.Data.Common;
using Dapper;
using Ecom.Application.Common.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Ecom.Infrastructure.Services;

public class DapperQueryService(IConfiguration configuration) : IDapperQueryService
{
    private DbConnection CreateConnection()
    {
        var connStr = configuration.GetConnectionString("DefaultConnection") ?? "";
        var provider = configuration["Database:Provider"] ?? "SqlServer";
        if (provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
            return new NpgsqlConnection(connStr);
        return new SqlConnection(connStr);
    }

    public async Task<IEnumerable<T>> QueryAsync<T>(string sql, object? param = null, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)CreateConnection();
        return await conn.QueryAsync<T>(new CommandDefinition(sql, param, cancellationToken: ct));
    }

    public async Task<T?> QueryFirstOrDefaultAsync<T>(string sql, object? param = null, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<T>(new CommandDefinition(sql, param, cancellationToken: ct));
    }

    public async Task<int> ExecuteAsync(string sql, object? param = null, CancellationToken ct = default)
    {
        await using var conn = (DbConnection)CreateConnection();
        return await conn.ExecuteAsync(new CommandDefinition(sql, param, cancellationToken: ct));
    }
}
