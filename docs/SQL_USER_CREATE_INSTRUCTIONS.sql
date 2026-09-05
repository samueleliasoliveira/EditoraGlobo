-------------------------------------------------------------------------
--  INSTRUÇÃO PARA O DBA DA SOFTVAR
--
--  Criação do usuário de LEITURA EXCLUSIVA (relatorio_evento).
--
--  EXECUTAR SOMENTE SE AUTORIZADO.
--  NÃO executar automaticamente pelo nosso projeto.
--
--  Objetivo: permitir SOMENTE consultas SELECT mínimas.
-------------------------------------------------------------------------

/*
USE [master];
GO
CREATE LOGIN [relatorio_evento] WITH PASSWORD = N'TROQUE_SENHA_FORTE_AQUI',
    CHECK_EXPIRATION = OFF, CHECK_POLICY = OFF, DEFAULT_DATABASE = [SEU_BANCO_EVENTO];
GO

USE [SEU_BANCO_EVENTO];
GO
CREATE USER [relatorio_evento] FOR LOGIN [relatorio_evento];
GO

-- Permissão MÍNIMA POSSÍVEL : leitura em TODO o banco
EXEC sp_addrolemember N'db_datareader', N'relatorio_evento';
GO

-- OPCIONAL: se for desejar BLOQUEAR tabelas específicas, faça DENY.
-- Exemplo:
-- DENY SELECT ON dbo.tabela_sensivel TO relatorio_evento;
*/

-------------------------------------------------------------------------
--  Checklist do DBA:
--  [ ] Usuário criado
--  [ ] db_datareader atribuído
--  [ ] Nenhuma outra permissão (db_datawriter, ddl_admin, etc.)
--  [ ] Connection string repassada via cofre de segredos ou variável de ambiente
-------------------------------------------------------------------------
