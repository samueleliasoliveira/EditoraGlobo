using System.Text.Json.Serialization;

namespace EventSalesAgent.Models;

public class ConsolidatedSummary
{
    [JsonPropertyName("totalSold")]
    public decimal TotalSold { get; set; }

    [JsonPropertyName("ordersCount")]
    public long OrdersCount { get; set; }

    [JsonPropertyName("itemsCount")]
    public long ItemsCount { get; set; }

    [JsonPropertyName("averageTicket")]
    public decimal AverageTicket { get; set; }
}

public class ProductRankingItem
{
    [JsonPropertyName("rank")]
    public int Rank { get; set; }

    [JsonPropertyName("productId")]
    public string ProductId { get; set; } = "";

    [JsonPropertyName("productName")]
    public string ProductName { get; set; } = "";

    [JsonPropertyName("quantity")]
    public long Quantity { get; set; }

    [JsonPropertyName("revenue")]
    public decimal Revenue { get; set; }
}

public class ConsolidatedData
{
    public DateTimeOffset GeneratedAt { get; set; }
    public ConsolidatedSummary Summary { get; set; } = new();
    public IList<ProductRankingItem> ProductRanking { get; set; } = new List<ProductRankingItem>();
}

public class SyncPayload
{
    [JsonPropertyName("eventId")]
    public string EventId { get; set; } = "";

    [JsonPropertyName("generatedAt")]
    public DateTimeOffset GeneratedAt { get; set; }

    [JsonPropertyName("summary")]
    public ConsolidatedSummary Summary { get; set; } = new();

    [JsonPropertyName("productRanking")]
    public IList<ProductRankingItem> ProductRanking { get; set; } = new List<ProductRankingItem>();
}
