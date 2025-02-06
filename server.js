const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Use a versão com Promises!
const path = require('path');
// const axios = require('axios'); // Removido: Não é mais necessário
// const cheerio = require('cheerio'); // Removido: Não é mais necessário
require('dotenv').config(); // Carrega variáveis de ambiente do .env

const app = express();
const port = process.env.PORT || 3000;

// Configurações do banco de dados (agora com suporte a variáveis de ambiente)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true, // Importante para pools de conexão
    connectionLimit: 10,     // Ajuste conforme necessário
    queueLimit: 0           // 0 = sem limite de fila
};

// Pool de conexões (usando mysql2/promise)
const pool = mysql.createPool(dbConfig);

// Middleware para lidar com CORS
app.use(cors({
    origin: '*' // Em produção, substitua '*' pelo seu domínio frontend
}));

// Middleware para fazer o parse do corpo das requisições como JSON
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));


// Função para executar queries no banco de dados (agora assíncrona)
async function executeQuery(sql, values) { // Remove 'res' do parâmetro
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query(sql, values);
        connection.release();
        return results; // Retorna os resultados diretamente
    } catch (err) {
        console.error('Erro ao executar query:', err);
        throw err; // Lança o erro para ser tratado na rota
    }
}

// Rota para lidar com a requisição POST para salvar pedidos
app.post('/salvar_pedido.php', async (req, res) => { // Rota assíncrona
    try {
        const pedido = req.body;
        console.log("Dados recebidos em /salvar_pedido.php:", pedido);

        const sql = `INSERT INTO pedidos (pedido, data, matricula, onus, folhas, imagens, tipoCertidao, codigoArirj, codigoEcartorio, protocolos, proprietarios) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            pedido.pedido,
            pedido.data,
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

        await executeQuery(sql, values); // Não precisa mais passar 'res'
        res.json({ status: 'sucesso', mensagem: 'Pedido salvo com sucesso!' }); // Resposta aqui

    } catch (error) {
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao salvar pedido', error: error.message }); //Retorna detalhes do erro.
    }
});

// Rota para lidar com a requisição POST para editar pedidos
app.post('/editar_pedido.php', async (req, res) => {  // Rota assíncrona
    try{
        const pedido = req.body;
        console.log("Dados recebidos em /editar_pedido.php:", pedido);

        const sql = `UPDATE pedidos SET pedido = ?, data = ?, matricula = ?, onus = ?, folhas = ?, imagens = ?, tipoCertidao = ?, codigoArirj = ?, codigoEcartorio = ?, protocolos = ?, proprietarios = ? WHERE id = ?`;
        const values = [
          pedido.pedido,
          pedido.data,
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

      await executeQuery(sql, values);
      res.json({ status: 'sucesso', mensagem: 'Pedido atualizado com sucesso!' });

    } catch(error){
      res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar pedido', error: error.message });
    }
});

// Rota para lidar com requisições para listar pedidos (paginada)
app.get('/listar/_pedidos.php', async (req, res) => { // Rota assíncrona
    try {
        console.log("Requisição GET para /listar/_pedidos.php recebida.");
        const page = parseInt(req.query.page) || 1;
        const limit = 2;
        const offset = (page - 1) * limit;

        const countSql = `SELECT COUNT(*) AS total FROM pedidos`;
        const sql = `SELECT * FROM pedidos ORDER BY id DESC, data DESC LIMIT ? OFFSET ?`;

        const [countResult] = await executeQuery(countSql); //Obtem a contagem
        const totalPedidos = countResult.total;
        const results = await executeQuery(sql, [limit, offset]); //Obtem os resultados

        res.json({
            totalPedidos: totalPedidos,
            pedidos: results
        });
    } catch(error){
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao listar pedidos', error: error.message });
    }
});


// Rota para listar *TODOS* os pedidos (sem paginação)
app.get('/listar_todos_pedidos', async (req, res) => { // Rota assíncrona
    try {
        const results = await executeQuery('SELECT * FROM pedidos ORDER BY id DESC, data DESC'); // Sem LIMIT e OFFSET
        res.json({ status: 'sucesso', pedidos: results });
    } catch (err) {
        console.error('Erro ao listar todos os pedidos:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar todos os pedidos.', error: err.message }); //Melhor detalhamento do erro
    }
});


// Rota para excluir pedidos
app.post('/excluir_pedido.php', async (req, res) => { // Rota assíncrona
  try{
    const pedidoId = req.body.id;
    console.log("Requisição para excluir pedido recebida. ID:", pedidoId);

    const sql = `DELETE FROM pedidos WHERE id = ?`;
    const values = [pedidoId];

    await executeQuery(sql, values);
    res.json({ status: 'sucesso', mensagem: 'Pedido excluído com sucesso!' });

  } catch(error){
      res.status(500).json({ status: 'erro', mensagem: 'Erro ao excluir pedido.', error: error.message});
  }
});

// Rota para lidar com a requisição POST do frontend (Removida a parte async, pois não é mais necessária)
app.post('/pesquisar-cnib', (req, res) => {
  const cpfCnpj = req.body.cpfCnpj;

  if (!cpfCnpj) {
    return res.status(400).json({ error: 'CPF/CNPJ não fornecido' });
  }

  console.log("Requisição recebida para /pesquisar-cnib. CPF/CNPJ:", cpfCnpj);

  // Retorna uma resposta de sucesso (a pesquisa em si é feita no frontend)
  return res.json({ mensagem: 'Requisição recebida com sucesso!' });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
