using EventSalesAgent.Config;
using EventSalesAgent.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace EventSalesAgent;

public static class Program
{
    public static async Task<int> Main(string[] args)
    {
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Information()
            .WriteTo.Console()
            .CreateBootstrapLogger();

        try
        {
            var builder = Host.CreateDefaultBuilder(args)
                .UseContentRoot(AppContext.BaseDirectory)
                .UseSerilog((ctx, lc) =>
                {
                    lc.ReadFrom.Configuration(ctx.Configuration);
                }, writeToProviders: true)
                .ConfigureServices((ctx, services) =>
                {
                    services.Configure<AppConfig>(ctx.Configuration.GetSection(AppConfig.Section));
                    services.Configure<SqlConfig>(ctx.Configuration.GetSection(SqlConfig.Section));

                    // Fonte de dados
                    var cfg = ctx.Configuration.GetSection(AppConfig.Section).Get<AppConfig>() ?? new AppConfig();
                    if (cfg.UseMockDataSource)
                    {
                        services.AddSingleton<ISqlDataSource, MockSqlDataSource>();
                    }
                    else
                    {
                        // A implementação real lança NotImplementedException
                        // enquanto as queries não forem fornecidas e validadas manualmente.
                        services.AddSingleton<ISqlDataSource, SqlServerDataSource>();
                    }

                    services.AddHttpClient<IApiClient, ApiClient>();
                    services.AddHostedService<SyncWorker>();
                });

            var host = builder.Build();

            Log.Information("EventSalesAgent iniciando... (use Mock={Mock}",
                host.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<AppConfig>>().Value.UseMockDataSource);

            await host.RunAsync();
            return 0;
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Host terminou inesperadamente");
            return 1;
        }
        finally
        {
            Log.CloseAndFlush();
        }
    }
}
