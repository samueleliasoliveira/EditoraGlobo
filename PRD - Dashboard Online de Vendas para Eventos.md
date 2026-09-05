# PRD — Dashboard Online de Vendas para Eventos

## 1. Objetivo do projeto

Criar um sistema de monitoramento de vendas em tempo quase real para eventos.

Atualmente existe um servidor Windows local no evento executando Microsoft SQL Server 2008 R2. Diversos caixas/PDVs se conectam a esse banco para registrar vendas e emitir documentos fiscais.

Durante o evento, a gerência e a diretoria solicitam frequentemente informações como:

- total vendido até o momento;
- quantidade de pedidos;
- quantidade de itens vendidos;
- ticket médio;
- ranking de produtos mais vendidos;
- faturamento por produto;
- vendas por hora;
- desempenho dos caixas.

O objetivo é eliminar a necessidade de gerar esses relatórios manualmente.

O sistema deverá consultar o SQL Server local automaticamente e disponibilizar os indicadores em um dashboard web acessível pela internet através de login e senha.

---

# 2. Regra principal de arquitetura

O SQL Server do evento NÃO poderá ser exposto diretamente à internet.

Não abrir porta 1433 no roteador.

Não permitir conexão da aplicação cloud diretamente ao SQL Server local.

A arquitetura deve utilizar comunicação outbound.

Fluxo:

SQL Server 2008 R2 local
↓
Agente de sincronização instalado no servidor
↓
API HTTPS
↓
Banco de dados cloud
↓
Dashboard web
↓
Usuários autorizados

O agente local é o responsável por consultar o SQL Server e enviar somente os dados necessários para a API.

---

# 3. Arquitetura desejada

Criar três componentes independentes.

## COMPONENTE 1 — Agente Local

Aplicação instalada no Windows Server/PC que possui o SQL Server.

Tecnologia preferencial:

C# / .NET

O agente deverá:

1. conectar ao SQL Server 2008 R2;
2. executar consultas somente leitura;
3. coletar dados de vendas;
4. enviar os dados para uma API externa via HTTPS;
5. executar automaticamente em intervalos configuráveis;
6. continuar funcionando mesmo se a internet cair;
7. retomar a sincronização automaticamente quando a internet voltar;
8. registrar logs;
9. permitir testar conexão;
10. exibir status de sincronização.

Inicialmente utilizar intervalo padrão de:

30 segundos.

Criar configuração para permitir alterar posteriormente para:

15 segundos  
30 segundos  
60 segundos  
120 segundos

---

# 4. Segurança do SQL Server

Criar documentação para utilização de um usuário SQL exclusivo para relatórios.

Exemplo:

relatorio_evento

Esse usuário deverá possuir apenas:

SELECT

Nunca permitir:

INSERT  
UPDATE  
DELETE  
ALTER  
DROP  
CREATE

O sistema não poderá alterar nenhuma informação no banco operacional.

---

# 5. Configuração da conexão local

Criar arquivo de configuração seguro.

Exemplo conceitual:

Servidor SQL:
SERVIDOR01

Instância:
SQLEXPRESS ou instância configurada

Banco:
BANCO_EVENTO

Usuário:
relatorio_evento

Senha:
********

Intervalo:
30 segundos

API:
https://api.exemplo.com

Token:
********

Não deixar senha hardcoded no código.

---

# 6. Interface do Agente Local

Criar uma interface simples.

Tela:

EVENT SALES SYNC

Status SQL Server:
CONECTADO / DESCONECTADO

Status Internet:
CONECTADO / DESCONECTADO

Status API:
CONECTADO / DESCONECTADO

Última consulta:
05/09/2026 15:43:20

Último envio:
05/09/2026 15:43:21

Próxima sincronização:
00:00:29

Mostrar também:

Total de vendas enviado

Quantidade de pedidos

Quantidade de itens

Botões:

Testar SQL

Testar API

Sincronizar agora

Configurações

Ver logs

Minimizar

O programa deverá continuar executando minimizado.

Preferencialmente criar opção:

"Iniciar automaticamente com o Windows"

---

# 7. Tratamento de queda de internet

Esse ponto é crítico.

A operação do evento jamais poderá depender da internet.

Se a internet cair:

PDVs continuam funcionando normalmente.

SQL Server continua funcionando normalmente.

O agente deverá detectar a ausência de conexão.

Não deverá apresentar erros que interfiram no SQL Server.

O agente deverá armazenar localmente o estado da sincronização.

Quando a conexão voltar:

sincronizar novamente automaticamente.

---

# 8. Estratégia de sincronização

Evitar consultar todas as vendas do evento a cada 30 segundos.

Implementar sincronização incremental.

Exemplo:

guardar:

ultimo_id_venda

ou:

ultima_data_sincronizada

Então consultar somente registros posteriores.

Exemplo conceitual:

SELECT ...
FROM vendas
WHERE id_venda > @ultimo_id

Se a estrutura do banco não permitir isso, implementar outra estratégia segura.

Nunca criar carga excessiva no SQL Server operacional.

---

# 9. Banco Cloud

Utilizar preferencialmente:

PostgreSQL.

Pode ser:

Supabase

Neon

ou outro PostgreSQL compatível com Vercel.

Não utilizar o SQL Server do evento como banco da aplicação web.

Criar tabelas normalizadas para armazenar apenas os dados necessários ao dashboard.

Exemplo:

events

sales_summary

sales_by_hour

products

product_sales

cashier_sales

sync_logs

users

---

# 10. Estrutura inicial do banco cloud

Criar:

## events

id

name

start_date

end_date

status

created_at

## sales

id

event_id

source_sale_id

sale_date

cashier_id

total

items_count

created_at

## sale_items

id

sale_id

source_product_id

product_name

quantity

unit_price

total

## sync_status

event_id

last_sync

last_source_sale_id

status

error_message

updated_at

---

# 11. API

Criar API protegida.

Exemplo:

POST /api/sync/sales

O agente local enviará os dados.

Utilizar autenticação por token/API key.

Exemplo:

Authorization:

Bearer TOKEN_DO_EVENTO

A API deverá validar:

evento

token

estrutura do payload

duplicidades

Não permitir registros duplicados.

Utilizar:

source_sale_id

para identificar vendas vindas do SQL Server.

Implementar idempotência.

Se a mesma venda for enviada duas vezes, não criar duplicidade.

---

# 12. Payload conceitual

Exemplo:

{
  "eventId": "bienal-sp-2026",
  "sentAt": "2026-09-05T15:43:21",
  "sales": [
    {
      "sourceSaleId": 123456,
      "date": "2026-09-05T15:42:30",
      "cashier": "PDV01",
      "total": 349.90,
      "items": [
        {
          "productId": "123",
          "name": "Livro ABC",
          "quantity": 2,
          "unitPrice": 79.90
        }
      ]
    }
  ]
}

---

# 13. Dashboard web

Criar aplicação responsiva utilizando preferencialmente:

Next.js

TypeScript

Tailwind CSS

Hospedagem:

Vercel

O dashboard deve funcionar corretamente em:

desktop

tablet

celular

A maior parte da diretoria provavelmente utilizará celular.

---

# 14. Login

O dashboard não poderá ser público.

Criar autenticação.

Cada diretor deverá possuir seu próprio usuário.

Exemplo de perfis:

ADMIN

DIRETORIA

GERENCIA

VISUALIZACAO

O administrador poderá criar e bloquear usuários.

---

# 15. Dashboard principal

Criar cards superiores.

## Card 1

TOTAL VENDIDO

Exemplo:

R$ 487.521,80

## Card 2

PEDIDOS

3.842

## Card 3

TICKET MÉDIO

R$ 126,89

## Card 4

ITENS VENDIDOS

7.291

---

# 16. Atualização do dashboard

Atualizar os indicadores automaticamente.

Intervalo inicial:

30 segundos.

Mostrar sempre:

Última atualização:

15:43:21

Se não houver sincronização por mais de 2 minutos:

mostrar aviso.

Exemplo:

"Dados sem atualização há 3 minutos."

Não apagar os dados existentes.

---

# 17. Ranking de produtos

Criar tabela:

MAIS VENDIDOS

Colunas:

Posição

Produto

Quantidade

Faturamento

Preço médio

Exemplo:

1 | Livro ABC | 842 | R$ 52.329,00

2 | Livro XYZ | 710 | R$ 41.200,00

Permitir:

Top 10

Top 20

Top 50

---

# 18. Gráfico de vendas por hora

Criar gráfico:

VENDAS POR HORA

Exemplo:

10:00 — R$ 31.250

11:00 — R$ 48.920

12:00 — R$ 61.110

13:00 — R$ 89.430

14:00 — R$ 105.321

15:00 — R$ 76.490

Permitir alternar entre:

Valor vendido

Número de pedidos

Ticket médio

---

# 19. Ranking de caixas

Criar seção:

DESEMPENHO DOS PDVs

Exemplo:

PDV 01

R$ 84.120

572 vendas

PDV 02

R$ 72.430

498 vendas

PDV 03

R$ 69.110

461 vendas

---

# 20. Filtros

Criar filtros no dashboard:

Hoje

Ontem

Evento completo

Período personalizado

Caixa

Produto

Categoria

---

# 21. Mais vendidos

Permitir duas formas de ranking:

POR QUANTIDADE

e

POR FATURAMENTO

Exemplo:

Mais vendido por quantidade:

Produto ABC

842 unidades

Mais vendido por faturamento:

Produto XYZ

R$ 89.240

---

# 22. Dashboard mobile

Dar prioridade máxima ao layout mobile.

No celular mostrar inicialmente:

Total vendido

Pedidos

Ticket médio

Itens vendidos

Depois:

Gráfico de vendas

Ranking

PDVs

Não exigir zoom.

---

# 23. Exportação

Adicionar:

Exportar Excel

Exportar PDF

Os relatórios deverão respeitar os filtros selecionados.

---

# 24. Auditoria

Registrar:

usuário

data

hora

login

logout

evento

Não é necessário registrar cada visualização inicialmente.

---

# 25. Multi-evento

Projetar o sistema desde o início para suportar vários eventos.

Exemplo:

Bienal SP 2026

Bienal RJ 2027

Feira XPTO

Evento Cliente ABC

Cada evento terá:

ID

nome

token próprio

dados separados

dashboard separado

---

# 26. Tela de seleção de evento

Após login:

Selecione o evento:

Bienal SP 2026

Status: AO VIVO

Evento Cliente XYZ

Status: FINALIZADO

---

# 27. Status do evento

Estados:

PLANEJADO

AO VIVO

FINALIZADO

ARQUIVADO

---

# 28. Requisito crítico de segurança

Nunca:

abrir SQL Server para internet;

armazenar senha SQL no frontend;

enviar credenciais SQL para Vercel;

permitir comandos SQL enviados pelo dashboard;

executar SQL arbitrário recebido da API;

permitir UPDATE ou DELETE no banco operacional.

Todo acesso ao SQL local deverá acontecer exclusivamente dentro do agente instalado no servidor.

---

# 29. Logs locais

Criar logs do agente.

Exemplo:

15:42:30 SQL conectado

15:42:31 14 vendas encontradas

15:42:32 sincronização concluída

15:43:00 SQL conectado

15:43:01 nenhuma venda nova

15:43:30 internet indisponível

15:44:00 tentativa de reconexão

15:44:30 conexão restaurada

15:44:31 sincronização concluída

Criar rotação de logs para evitar crescimento infinito.

---

# 30. Proteção contra impacto operacional

As consultas SQL devem:

usar SELECT;

ser rápidas;

evitar locks desnecessários;

não utilizar transações longas;

não executar consultas pesadas repetidamente.

Antes de implementar as queries definitivas, criar arquivos separados para:

queries.sql

ou uma camada de Repository.

Não espalhar SQL diretamente pela aplicação.

---

# 31. IMPORTANTE — Banco SQL ainda desconhecido

A estrutura real do SQL Server ainda será fornecida.

Portanto NÃO inventar nomes definitivos das tabelas do ERP.

Criar inicialmente interfaces e queries mock.

Esperar receber informações como:

tabela de cabeçalho da venda;

tabela de itens;

tabela de produtos;

campo de ID da venda;

campo de data;

campo de valor;

campo de cancelamento;

campo do caixa;

campo de quantidade;

campo de produto.

Quando essas informações forem disponibilizadas, adaptar somente a camada de acesso aos dados.

---

# 32. Tratamento de cancelamentos

O sistema deverá estar preparado para identificar:

vendas concluídas;

vendas canceladas;

itens cancelados;

estornos.

Vendas canceladas não deverão compor o faturamento.

A regra exata dependerá da estrutura do banco.

---

# 33. Estrutura do projeto

Criar monorepo ou pastas independentes.

Exemplo:

/event-sales-monitor

/apps

/web-dashboard

/local-agent

/packages

/shared

/database

/docs

/scripts

---

# 34. Documentação

Criar:

README.md

ARCHITECTURE.md

DATABASE.md

DEPLOYMENT.md

SECURITY.md

SQL_MAPPING.md

O SQL_MAPPING.md deverá explicar como mapear o banco do cliente.

---

# 35. Ambiente

Criar:

.env.example

Não inserir senhas reais.

Exemplo:

DATABASE_URL=

NEXTAUTH_SECRET=

SYNC_API_KEY=

EVENT_ID=

---

# 36. Desenvolvimento em fases

NÃO construir todo o projeto de uma vez.

Executar etapa por etapa.

---

# FASE 1 — Estrutura

Criar:

monorepo;

dashboard Next.js;

estrutura do agente;

documentação;

.env.example.

Não integrar SQL ainda.

---

# FASE 2 — Banco Cloud

Criar:

PostgreSQL;

schema;

migrations;

events;

sales;

sale_items;

sync_status;

users.

---

# FASE 3 — API de sincronização

Criar:

POST /api/sync/sales

Autenticação por token.

Validação.

Idempotência.

Logs.

Testes.

---

# FASE 4 — Agente local com dados simulados

Criar agente C#.

Inicialmente utilizar mock.

Gerar vendas simuladas.

Enviar para API.

Testar perda de conexão.

Testar reenvio.

---

# FASE 5 — Dashboard

Criar:

login;

cards;

mais vendidos;

vendas por hora;

PDVs;

última sincronização;

filtros.

---

# FASE 6 — Integração SQL Server

Somente após receber a estrutura real do banco.

Criar conexão com SQL Server 2008 R2.

Substituir mock por consultas reais.

---

# FASE 7 — Resiliência

Implementar:

retry;

fila local;

reconexão;

logs;

timeout;

proteção contra duplicidade.

---

# FASE 8 — Exportações

Adicionar:

Excel;

PDF.

---

# FASE 9 — Produção

Publicar dashboard.

Configurar banco cloud.

Criar primeiro evento.

Criar usuários.

Gerar token.

Instalar agente no servidor.

Testar operação completa.

---

# 37. Critérios de aceite

O projeto será considerado funcional quando:

1. O SQL Server não estiver exposto à internet.

2. O agente conseguir consultar o banco local.

3. O agente conseguir enviar informações por HTTPS.

4. O dashboard conseguir mostrar as vendas.

5. Os dados forem atualizados automaticamente.

6. A queda da internet não afetar os PDVs.

7. Após a internet retornar, os dados forem sincronizados novamente.

8. Não existir duplicidade de vendas.

9. Usuários não autenticados não conseguirem acessar o dashboard.

10. O dashboard funcionar corretamente em celular.

11. O banco operacional nunca sofrer INSERT, UPDATE ou DELETE.

---

# 38. Forma de execução esperada da IA

Você está atuando como arquiteto de software e desenvolvedor responsável pelo projeto.

Não tente implementar tudo imediatamente.

Primeiro:

1. analise este PRD;

2. proponha a arquitetura final;

3. apresente a estrutura de diretórios;

4. identifique riscos técnicos;

5. liste dependências;

6. apresente as decisões de tecnologia;

7. gere um checklist de implementação.

Depois inicie apenas a FASE 1.

Ao terminar cada fase:

- execute build;
- procure erros;
- corrija;
- valide;
- informe os arquivos criados;
- informe o que foi feito;
- informe o que falta para a próxima fase.

Não invente estrutura do banco SQL Server legado.

Quando chegar à integração com o SQL Server, aguarde o mapeamento real das tabelas e campos.

Prioridades do projeto:

1. não interferir nas vendas;

2. segurança;

3. confiabilidade;

4. simplicidade operacional;

5. facilidade de manutenção;

6. dashboard mobile;

7. performance.