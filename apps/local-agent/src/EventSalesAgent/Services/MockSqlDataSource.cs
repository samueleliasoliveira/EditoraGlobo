using EventSalesAgent.Config;
using EventSalesAgent.Models;
using Microsoft.Extensions.Options;

namespace EventSalesAgent.Services;

/// <summary>
/// Implementação MOCK de ISqlDataSource.
///
/// NÃO acessa o banco real da Softvar.
///
/// Gera indicadores simulados CRESCENTES para simular um evento.
/// Usada enquanto o mapeamento do SQL Server não for fornecido e validado.
/// </summary>
public class MockSqlDataSource : ISqlDataSource
{
    private readonly Random _rnd;
    private readonly object _lock = new();
    private DateTimeOffset _start;

    // Acumuladores
    private decimal _totalSold;
    private long _ordersCount;
    private long _itemsCount;

    // Produtos fixos simulados com estado
    private readonly (string Id, string Name, long Qty, decimal Rev)[] _products =
    {
        ("P001", "Livro ABC Premium", 0, 0m),
        ("P002", "Livro XYZ", 0, 0m),
        ("P003", "Caderno do Evento", 0, 0m),
        ("P004", "Caneta Personalizada", 0, 0m),
        ("P005", "Mochila Oficial", 0, 0m),
        ("P006", "Kit Boas Vindas", 0, 0m),
        ("P007", "Revista Edição Limitada", 0, 0m),
        ("P008", "Poster Gigante", 0, 0m),
        ("P009", "Ecobag", 0, 0m),
        ("P010", "Brinde Exclusivo", 0, 0m),
    };

    private readonly decimal[] _prices = { 79.90m, 59.90m, 29.90m, 5.90m, 149.90m, 99.90m, 49.90m, 39.90m, 19.90m, 9.90m };

    public MockSqlDataSource(IOptions<AppConfig> opts)
    {
        var seed = opts.Value.MockRandomSeed > 0 ? opts.Value.MockRandomSeed : Environment.TickCount;
        _rnd = new Random(seed);
        _start = DateTimeOffset.Now;
    }

    public Task<bool> TestConnectionAsync(CancellationToken ct)
    {
        return Task.FromResult(true);
    }

    public Task<ConsolidatedData> GetConsolidatedDataAsync(CancellationToken ct)
    {
        lock (_lock)
        {
            // Cada chamada = novo lote de vendas simuladas
            var batchOrders = _rnd.Next(15, 70);
            var runningItems = 0L;
            var runningRevenue = 0m;

            for (var o = 0; o < batchOrders; o++)
            {
                var itemsPerOrder = _rnd.Next(1, 6);
                for (var i = 0; i < itemsPerOrder; i++)
                {
                    var pi = _rnd.Next(_products.Length);
                    var qty = _rnd.Next(1, 4);
                    var price = _prices[pi];
                    var total = Math.Round(qty * price, 2);

                    _products[pi].Qty += qty;
                    _products[pi].Rev += total;
                    runningItems += qty;
                    runningRevenue += total;
                }
            }

            _ordersCount += batchOrders;
            _itemsCount += runningItems;
            _totalSold += runningRevenue;
            _totalSold = Math.Round(_totalSold, 2);

            var avg = _ordersCount > 0 ? Math.Round(_totalSold / _ordersCount, 2) : 0m;

            var ranking = _products
                .OrderByDescending(p => p.Qty)
                .Select((p, idx) => new ProductRankingItem
                {
                    Rank = idx + 1,
                    ProductId = p.Id,
                    ProductName = p.Name,
                    Quantity = p.Qty,
                    Revenue = Math.Round(p.Rev, 2),
                })
                .ToList();

            return Task.FromResult(new ConsolidatedData
            {
                GeneratedAt = DateTimeOffset.Now,
                Summary = new ConsolidatedSummary
                {
                    TotalSold = _totalSold,
                    OrdersCount = _ordersCount,
                    ItemsCount = _itemsCount,
                    AverageTicket = avg,
                },
                ProductRanking = ranking,
            });
        }
    }
}
