const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3000;

// Configurações do banco de dados
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

// Pool de conexões
const pool = mysql.createPool(dbConfig);

// Middleware para lidar com CORS
app.use(cors({
  origin: '*' // Em produção, substitua '*' pelo seu domínio frontend
}));

// Middleware para fazer o parse do corpo das requisições como JSON
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Função para executar queries no banco de dados
function executeQuery(sql, values, res) {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Erro ao obter conexão do pool:', err);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao conectar ao banco de dados.' });
    }

    connection.query(sql, values, (err, results) => {
      connection.release(); // Libera a conexão de volta para o pool

      if (err) {
        console.error('Erro ao executar query:', err);
        return res.status(500).json({ status: 'erro', mensagem: 'Erro ao executar a operação no banco de dados.' });
      }

      res.json({ status: 'sucesso', mensagem: 'Operação realizada com sucesso!', results });
    });
  });
}

// Rota para lidar com a requisição POST para salvar pedidos
app.post('/salvar_pedido.php', (req, res) => {
  const pedido = req.body;
  console.log("Dados recebidos em /salvar_pedido.php:", pedido);

  const sql = `INSERT INTO pedidos (pedido, data, matricula, onus, folhas, imagens, tipoCertidao, codigoArirj, codigoEcartorio, protocolos, proprietarios) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    pedido.pedido,
    pedido.data, // Já está no formato correto
    pedido.matricula,
    pedido.onus,
    pedido.folhas,
    pedido.imagens,
    pedido.tipoCertidao,
    pedido.codigoArirj,
    pedido.codigoEcartorio,
    pedido.protocolos,
    pedido.proprietarios
  ];

  executeQuery(sql, values, res);
});

// Rota para lidar com a requisição POST para editar pedidos
app.post('/editar_pedido.php', (req, res) => {
  const pedido = req.body;
  console.log("Dados recebidos em /editar_pedido.php:", pedido);

  const sql = `UPDATE pedidos SET pedido = ?, data = ?, matricula = ?, onus = ?, folhas = ?, imagens = ?, tipoCertidao = ?, codigoArirj = ?, codigoEcartorio = ?, protocolos = ?, proprietarios = ? WHERE id = ?`;
  const values = [
    pedido.pedido,
    pedido.data, // Já está no formato correto
    pedido.matricula,
    pedido.onus,
    pedido.folhas,
    pedido.imagens,
    pedido.tipoCertidao,
    pedido.codigoArirj,
    pedido.codigoEcartorio,
    pedido.protocolos,
    pedido.proprietarios,
    pedido.id
  ];

  executeQuery(sql, values, res);
});

// Rota para lidar com requisições para listar pedidos
app.get('/listar/_pedidos.php', (req, res) => {
  console.log("Requisição GET para /listar/_pedidos.php recebida.");
  const page = parseInt(req.query.page) || 1;
  const limit = 3;
  const offset = (page - 1) * limit;

  const countSql = `SELECT COUNT(*) AS total FROM pedidos`;
  const sql = `SELECT * FROM pedidos ORDER BY id DESC, data DESC LIMIT ? OFFSET ?`;

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Erro ao obter conexão do pool:', err);
      return res.status(500).json({ status: 'erro', mensagem: 'Erro interno ao conectar ao banco de dados.' });
    }

    connection.query(countSql, (countErr, countResults) => {
      if (countErr) {
        connection.release();
        console.error('Erro ao contar o total de pedidos:', countErr);
        return res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar os pedidos.' });
      }

      const totalPedidos = countResults[0].total;

      connection.query(sql, [limit, offset], (err, results) => {
        connection.release();

        if (err) {
          console.error('Erro ao buscar pedidos do banco de dados:', err);
          return res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar os pedidos.' });
        }

        console.log('Pedidos encontrados com sucesso!');
        res.json({
          totalPedidos: totalPedidos,
          pedidos: results
        });
      });
    });
  });
});

// Rota para excluir pedidos
app.post('/excluir_pedido.php', (req, res) => {
  const pedidoId = req.body.id;
  console.log("Requisição para excluir pedido recebida. ID:", pedidoId);

  const sql = `DELETE FROM pedidos WHERE id = ?`;
  const values = [pedidoId];

  executeQuery(sql, values, res);
});

// Rota para lidar com a requisição POST do frontend
app.post('/pesquisar-cnib', async (req, res) => {
  const cpfCnpj = req.body.cpfCnpj;

  if (!cpfCnpj) {
    return res.status(400).json({ error: 'CPF/CNPJ não fornecido' });
  }

  console.log("Requisição recebida para /pesquisar-cnib. CPF/CNPJ:", cpfCnpj);

  // Aqui você não faz nada além de retornar uma resposta de sucesso.
  // O processamento agora é feito pelo script do Tampermonkey na página de indisponibilidade.

  return res.json({ mensagem: 'Requisição recebida com sucesso!' });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
