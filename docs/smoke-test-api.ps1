
.SYNOPSIS
    Smoke test MANUAL da API /api/sync/summary do dashboard.
    NÃO precisa do agente C# nem do .NET SDK instalado.
    Útil para validar: Supabase OK, migration rodou, seed OK, chaves OK.

.DESCRIPTION
    1) Certifique-se de rodar `npm run dev` no dashboard (Terminal 1).
    2) Edite as duas variáveis abaixo ($baseUrl e $apiToken).
    3) Execute este script 2 ou 3 vezes.
    4) Acesse o dashboard no browser, faça login, confirme se os dados
       do POST abaixo apareceram.
#>

# =====================================================================
# ====== EDITE ESTAS VARIÁVEIS ANTES DE RODAR =========================
# =====================================================================
$baseUrl  = "http://localhost:3000"                        # C3
$apiToken = "tok_evento_demo_mock_MUDE_ESTE_VALOR_0000000000000000000000000001"  # C2 (mesmo valor do seed / events.api_token)
$eventId  = "evento-demo-mock"                             # C1

# Gera lote incremental de teste
$script:total = 0
$script:orders = 0
$script:items = 0
$produtos = @(
    @{ id="P001"; name="Livro ABC Premium";  price=79.90;  qty=[ref]0; rev=[ref]0m },
    @{ id="P002"; name="Livro XYZ";          price=59.90;  qty=[ref]0; rev=[ref]0m },
    @{ id="P003"; name="Caderno do Evento";  price=29.90;  qty=[ref]0; rev=[ref]0m },
    @{ id="P004"; name="Caneta Personalizada";price=5.90;  qty=[ref]0; rev=[ref]0m }
)

function Send-OneBatch {
    param([switch]$ShowBody)
    $rnd = New-Object Random
    $batchOrders = $rnd.Next(10, 40)
    $batchItems = 0
    $batchRev = 0m

    for ($o = 0; $o -lt $batchOrders; $o++) {
        $itensPedido = $rnd.Next(1, 5)
        for ($i = 0; $i -lt $itensPedido; $i++) {
            $p = $produtos[$rnd.Next($produtos.Count)]
            $q = $rnd.Next(1, 3)
            $totalItem = [math]::Round($q * $p.price, 2)
            $p.qty.Value += $q
            $p.rev.Value  = [math]::Round($p.rev.Value + $totalItem, 2)
            $batchItems += $q
            $batchRev   += $totalItem
        }
    }

    $script:orders += $batchOrders
    $script:items  += $batchItems
    $script:total   = [math]::Round($script:total + $batchRev, 2)
    $avg = if ($script:orders -gt 0) { [math]::Round($script:total / $script:orders, 2) } else { 0m }

    $ranking = @($produtos |
        Sort-Object { $_.qty.Value } -Descending |
        ForEach-Object -Begin { $rank = 0 } -Process {
            $rank++
            [ordered]@{
                rank       = $rank
                productId  = $_.id
                productName= $_.name
                quantity   = $_.qty.Value
                revenue    = [math]::Round($_.rev.Value, 2)
            }
        }
    )

    $body = [ordered]@{
        eventId     = $eventId
        generatedAt = (Get-Date).ToString("o")
        summary     = [ordered]@{
            totalSold     = [math]::Round($script:total, 2)
            ordersCount   = [int64]$script:orders
            itemsCount    = [int64]$script:items
            averageTicket = $avg
        }
        productRanking = $ranking
    }

    $json = $body | ConvertTo-Json -Depth 8
    if ($ShowBody) { Write-Host $json }

    $headers = @{
        "Authorization" = "Bearer $apiToken"
        "Content-Type"  = "application/json"
    }

    try {
        $resp = Invoke-WebRequest -UseBasicParsing -Method POST `
            -Uri ($baseUrl.TrimEnd('/') + '/api/sync/summary') `
            -Headers $headers -Body $json
        Write-Host ("[OK] HTTP {0} — Total={1:C} Pedidos={2} Itens={3}" -f
            [int]$resp.StatusCode, $script:total, $script:orders, $script:items)
    }
    catch {
        if ($_.Exception.Response) {
            $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
            $respBody = $reader.ReadToEnd()
            Write-Host ("[ERR] HTTP {0}: {1}" -f [int]$_.Exception.Response.StatusCode, $respBody)
        } else {
            Write-Host ("[ERR] {0}" -f $_.Exception.Message)
        }
    }
}

Write-Host "== Smoke Test API ==" -ForegroundColor Cyan
Write-Host "URL: $baseUrl"
Write-Host "EventId: $eventId"
Write-Host ""
Send-OneBatch
Write-Host ""
Write-Host "Dica: rode Send-OneBatch novamente para enviar mais um lote (valores acumulam)."
Write-Host "No dashboard, verifique cards + ranking + badge ultima atualizacao."
