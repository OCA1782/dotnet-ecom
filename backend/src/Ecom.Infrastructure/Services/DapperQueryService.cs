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
        var provider = configuration["Database:Provider"] ?? "PostgreSQL";
        if (provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase))
        {
            var connStr = configuration.GetConnectionString("PostgreSQL")
                       ?? configuration.GetConnectionString("DefaultConnection")
                       ?? "";
            return new NpgsqlConnection(connStr);
        }
        var sqlConnStr = configuration.GetConnectionString("DefaultConnection") ?? "";
        return new SqlConnection(sqlConnStr);
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
