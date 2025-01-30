const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path'); // Importe o módulo 'path' aqui
const app = express();
const port = process.env.PORT || 3000;

// Configurações do banco de dados (ajuste conforme necessário)
const dbConfig = {
  host: 'database-2.cfs2cmiaucif.sa-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'palmares',
  database: 'certidoes_db'
};

// Middleware para lidar com CORS
app.use(cors());

// Middleware para fazer o parse do corpo das requisições como JSON
app.use(express.json());
// Servir arquivos estáticos (HTML, CSS, JS) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota para lidar com a requisição POST para salvar pedidos
app.post('/salvar_pedido.php', (req, res) => {
  const pedido = req.body;
  console.log("Dados recebidos em /salvar_pedido.php:", pedido); // Verifique os dados recebidos

  // Cria uma conexão com o banco de dados
  const connection = mysql.createConnection(dbConfig);

  // Conecta ao banco de dados
  connection.connect((err) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      res.status(500).json({ status: 'erro', mensagem: 'Erro ao conectar ao banco de dados.' });
      return;
    }

    console.log('Conectado ao banco de dados!');

    // Sanitização básica (adapte conforme necessário)
    const sanitizedPedido = {
        pedido: pedido.pedido, // Substitua por uma função de sanitização mais robusta
        data: pedido.data,
        matricula: pedido.matricula, // Substitua por uma função de sanitização mais robusta
        onus: pedido.onus,        
        folhas: pedido.folhas, // Substitua por uma função de sanitização mais robusta
        imagens: pedido.imagens, // Substitua por uma função de sanitização mais robusta
        tipoCertidao: pedido.tipoCertidao, // Substitua por uma função de sanitização mais robusta
        codigoArirj: pedido.codigoArirj, // Substitua por uma função de sanitização mais robusta
        codigoEcartorio: pedido.codigoEcartorio, // Substitua por uma função de sanitização mais robusta
        protocolos: pedido.protocolos, // Substitua por uma função de sanitização mais robusta
        proprietarios: pedido.proprietarios // Substitua por uma função de sanitização mais robusta
    };

    // Query SQL para inserir o pedido (ajuste conforme a estrutura da sua tabela)
    const sql = `INSERT INTO pedidos (pedido, data, matricula, onus, folhas, imagens, tipoCertidao, codigoArirj, codigoEcartorio, protocolos, proprietarios) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // Executa a query
    connection.query(sql, [
      sanitizedPedido.pedido,
      sanitizedPedido.data,
      sanitizedPedido.matricula,
      sanitizedPedido.onus,      
      sanitizedPedido.folhas,
      sanitizedPedido.imagens,
      sanitizedPedido.tipoCertidao,
      sanitizedPedido.codigoArirj,
      sanitizedPedido.codigoEcartorio,
      sanitizedPedido.protocolos,
      sanitizedPedido.proprietarios
    ], (err, results) => {
      if (err) {
        console.error('Erro ao inserir pedido no banco de dados:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao salvar o pedido.' });
      } else {
        console.log('Pedido inserido com sucesso!');
        console.log("Enviando resposta de sucesso:", { status: 'sucesso', mensagem: 'Pedido salvo com sucesso!' }); // Verifique a resposta enviada
        res.json({ status: 'sucesso', mensagem: 'Pedido salvo com sucesso!' });
      }

      // Fecha a conexão com o banco de dados
      connection.end();
    });
  });
});

// Rota para lidar com requisições para listar pedidos
app.get('/listar/_pedidos.php', (req, res) => {
  console.log("Requisição GET para /listar/_pedidos.php recebida.");
  // Cria uma conexão com o banco de dados
  const connection = mysql.createConnection(dbConfig);

  // Conecta ao banco de dados
  connection.connect((err) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      res.status(500).json({ status: 'erro', mensagem: 'Erro ao conectar ao banco de dados.' });
      return;
    }

    console.log('Conectado ao banco de dados!');

    // Query SQL para buscar todos os pedidos, ordenando por data de forma descendente
    const sql = `SELECT * FROM pedidos ORDER BY data ASC, id ASC`; // Ordena por data e ID para garantir consistência

    // Executa a query
    connection.query(sql, (err, results) => {
      if (err) {
        console.error('Erro ao buscar pedidos do banco de dados:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar os pedidos.' });
      } else {
        console.log('Pedidos encontrados com sucesso!');
        // Envia os pedidos como JSON
        res.json(results);
      }

      // Fecha a conexão com o banco de dados
      connection.end();
    });
  });
});

// Rota para excluir pedidos
app.post('/excluir_pedido.php', (req, res) => {
  const pedidoId = req.body.id;
  console.log("Requisição para excluir pedido recebida. ID:", pedidoId); // Verifique o ID recebido

  // Cria uma conexão com o banco de dados
  const connection = mysql.createConnection(dbConfig);

  // Conecta ao banco de dados
  connection.connect((err) => {
    if (err) {
      console.error('Erro ao conectar ao banco de dados:', err);
      res.status(500).json({ status: 'erro', mensagem: 'Erro ao conectar ao banco de dados.' });
      return;
    }

    console.log('Conectado ao banco de dados!');

    // Query SQL para excluir o pedido
    const sql = `DELETE FROM pedidos WHERE id = ?`;

    // Executa a query
    connection.query(sql, [pedidoId], (err, results) => {
      if (err) {
        console.error('Erro ao excluir pedido do banco de dados:', err);
        res.status(500).json({ status: 'erro', mensagem: 'Erro ao excluir o pedido.' });
      } else {
        console.log('Pedido excluído com sucesso!');
        res.json({ status: 'sucesso', mensagem: 'Pedido excluído com sucesso!' });
      }

      // Fecha a conexão com o banco de dados
      connection.end();
    });
  });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
