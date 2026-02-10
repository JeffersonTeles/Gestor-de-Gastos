Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ SERVIDOR FUNCIONANDO - Status:" $response.StatusCode
    Write-Host "Acesse: http://localhost:3000"
} catch {
    Write-Host "✗ Erro:" $_.Exception.Message
    Write-Host "Verifique se o servidor está rodando."
}
