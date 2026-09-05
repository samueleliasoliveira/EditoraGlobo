# Guia de Execução dos Testes Visuais (itens 5 a 8 da validação)

> Pré-requisito: ter seguido [CONFIG_CHECKLIST.md](./CONFIG_CHECKLIST.md) — Supabase e variáveis preenchidas.
> Pré-requisito: ter instalado **Node.js LTS (18/20)** e **.NET SDK 6**.

---

## Passo 0 — Buildar e rodar

```powershell
# Terminal 1 — Dashboard
cd C:\Agent_Varcom\apps\web-dashboard
npm install
npm run build      # (deve terminar sem erros)
npm run dev        # mantém aberto em http://localhost:3000

# Terminal 2 — Agente C# (MOCK)
cd C:\Agent_Varcom\apps\local-agent\src\EventSalesAgent
dotnet restore
dotnet build       # (deve terminar sem erros)
dotnet run         # mantém aberto: gera e envia dados a cada 30s
```

Se não quiser rodar o agente ainda, use o script PowerShell:
[smoke-test-api.ps1](./smoke-test-api.ps1) — ele simula o agente via POST puro.

---

## 🧪 Teste 5 — Fluxo Completo Mock → Dashboard

**O que observar:**

| Item | Onde? | Resultado esperado | Marcação |
|---|---|---| :---: |
| Login | Abrir http://localhost:3000 → redireciona para `/login`. Entrar com e-mail/senha criado no Supabase Auth (B3). | Entra e mostra a página do dashboard. | ☐ |
| Total Vendido | Card verde topo | Valor em R$ atualizado (cresce com o tempo). Formato `R$ 12.345,67`. | ☐ |
| Pedidos | Card azul | Inteiro formatado pt-BR com separador de milhar. Cresce. | ☐ |
| Itens Vendidos | Card roxo | Inteiro pt-BR. Cresce. | ☐ |
| Ticket Médio | Card laranja | R$ e varia (Total Vendido / Pedidos). | ☐ |
| Ranking Produtos | Tabela "Produtos Mais Vendidos" | Colunas Posição / Produto / Qtd. / Faturamento / (Preço Médio no desktop). 10 produtos MOCK aparecendo. | ☐ |
| Última Atualização | Badge verde no topo | Horário no formato `dd/MM HH:mm:ss` + "há Ns". Cor verde (< 2 min). | ☐ |

---

## 🧪 Teste 6 — Atualização Automática (~30 s)

1. Anote os valores atuais dos cards e o horário no badge.
2. **Não toque em nada, não recarregue a página.**
3. Aguarde **~45 segundos** (1 ciclo de 30 s + margem).

Esperado:
- Badge "Última atualização" muda de horário sozinho.
- Cards sobem de valor sem F5.
- Tabela de ranking pode mudar a ordem (o Mock embaralha).

Se quiser comprovar: abra **DevTools → Network** e filtre por `dashboard-data`. A cada 30 segundos deve aparecer uma nova requisição com `200 OK`.

| Item | Esperado | Marcação |
|---|---| :---: |
| Badge atualiza sem F5 | Sim | ☐ |
| Cards sobem sem F5 | Sim | ☐ |
| Network / fetch de `dashboard-data` aparece a cada ~30 s | Sim | ☐ |

---

## 🧪 Teste 7 — Queda do Agente

**Objetivo:** simular queda de internet/agente. Dashboard continua mostrando os últimos dados.

1. Confirme que os cards tem valores recentes.
2. **Feche / pare o Terminal 2 do agente** (Ctrl+C).
3. Aguarde **2 minutos e 1 segundo** contados a partir da última atualização.
4. **Não recarregue a página.**

Esperado:
- [ ] Valores NÃO são apagados. Cards continuam mostrando os últimos números.
- [ ] Badge muda de **VERDE → AMARELO** com a mensagem:
      `Dados sem atualização há Xmin.`
- [ ] Nenhum erro estoura na tela.

---

## 🧪 Teste 8 — Retorno do Agente

1. Mantenha o dashboard aberto (na tela do Teste 7, com badge amarelo).
2. **Reabra o Terminal 2:**
   ```
   cd C:\Agent_Varcom\apps\local-agent\src\EventSalesAgent
   dotnet run
   ```
3. Aguarde **1 ciclo completo (≈ 30-45 s)**.

Esperado:
- [ ] Badge AMARELO volta para **VERDE** automaticamente.
- [ ] Mensagem "Dados sem atualização há Xmin" desaparece.
- [ ] Cards / ranking sobem de valor (MockSqlDataSource recria estado do zero em CADA execução, logo acumula em memória novamente a partir de zero — mas a API faz UPSERT no banco, então o snapshot é substituído; em produção real o SQL persistiria. O comportamento de voltar a atualizar é o que importa aqui).
- [ ] Não há necessidade de logar novamente.

---

## Critério de Aprovação Geral

Marcar **todas as caixas** dos testes 5, 6, 7, 8 acima = MVP MOCK validado. ✅

NÃO avançar para integração SQL até que todos estejam OK.
