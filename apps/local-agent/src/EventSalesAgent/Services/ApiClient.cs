using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using EventSalesAgent.Config;
using EventSalesAgent.Models;
using Microsoft.Extensions.Options;

namespace EventSalesAgent.Services;

public class ApiResult
{
    public bool Success { get; set; }
    public int StatusCode { get; set; }
    public string Message { get; set; } = "";
    public override string ToString() => $"[{StatusCode}] {Message}";
}

public interface IApiClient
{
    Task<ApiResult> SendConsolidatedAsync(ConsolidatedData data, CancellationToken ct);
    Task<bool> TestApiAsync(CancellationToken ct);
}

public class ApiClient : IApiClient
{
    private readonly HttpClient _http;
    private readonly AppConfig _cfg;
    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter() },
    };

    public ApiClient(HttpClient http, IOptions<AppConfig> cfg)
    {
        _cfg = cfg.Value;
        _http = http;
        _http.BaseAddress = new Uri(_cfg.ApiBaseUrl.TrimEnd('/') + "/");
        _http.Timeout = TimeSpan.FromSeconds(Math.Max(5, _cfg.ApiTimeoutSeconds));
        _http.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<bool> TestApiAsync(CancellationToken ct)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, _cfg.ApiSyncEndpoint.TrimStart('/'));
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _cfg.ApiToken);
            using var resp = await _http.SendAsync(req, ct).ConfigureAwait(false);
            return resp.IsSuccessStatusCode || resp.StatusCode == System.Net.HttpStatusCode.MethodNotAllowed;
        }
        catch
        {
            return false;
        }
    }

    public async Task<ApiResult> SendConsolidatedAsync(ConsolidatedData data, CancellationToken ct)
    {
        var payload = new SyncPayload
        {
            EventId = _cfg.EventId,
            GeneratedAt = data.GeneratedAt,
            Summary = data.Summary,
            ProductRanking = data.ProductRanking,
        };

        // Retry loop simples com backoff exponencial
        Exception? lastEx = null;
        for (var attempt = 1; attempt <= Math.Max(1, _cfg.MaxRetryCount); attempt++)
        {
            try
            {
                ct.ThrowIfCancellationRequested();
                using var req = new HttpRequestMessage(HttpMethod.Post, _cfg.ApiSyncEndpoint.TrimStart('/'));
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _cfg.ApiToken);
                req.Content = new StringContent(JsonSerializer.Serialize(payload, _jsonOpts), Encoding.UTF8, "application/json");
                using var resp = await _http.SendAsync(req, ct).ConfigureAwait(false);
                var body = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

                if (resp.IsSuccessStatusCode)
                {
                    return new ApiResult
                    {
                        Success = true,
                        StatusCode = (int)resp.StatusCode,
                        Message = body,
                    };
                }

                // 4xx — não retentar (payload inválido / auth errado)
                if ((int)resp.StatusCode is >= 400 and < 500)
                {
                    return new ApiResult
                    {
                        Success = false,
                        StatusCode = (int)resp.StatusCode,
                        Message = "Client error: " + body,
                    };
                }

                lastEx = new HttpRequestException($"HTTP {(int)resp.StatusCode}: {body}");
            }
            catch (Exception ex)
            {
                lastEx = ex;
            }

            if (attempt < _cfg.MaxRetryCount)
            {
                var wait = TimeSpan.FromSeconds(Math.Min(15, Math.Pow(2, attempt)));
                await Task.Delay(wait, ct).SuppressOrThrowCancellation().ConfigureAwait(false);
            }
        }

        return new ApiResult
        {
            Success = false,
            StatusCode = 0,
            Message = "Falha após tentativas: " + lastEx?.Message,
        };
    }
}

internal static class TaskExtensions
{
    public static Task SuppressOrThrowCancellation(this Task t)
    {
        var tcs = new TaskCompletionSource<object?>();
        t.ContinueWith(tk =>
        {
            if (tk.IsCanceled) tcs.SetResult(null);
            else if (tk.IsFaulted) tcs.SetException(tk.Exception!.InnerExceptions);
            else tcs.SetResult(null);
        }, TaskContinuationOptions.ExecuteSynchronously);
        return tcs.Task;
    }
}
