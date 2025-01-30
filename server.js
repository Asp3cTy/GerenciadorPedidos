const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configurações do banco de dados (ajuste conforme necessário)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
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
            pedido: connection.escape(pedido.pedido),
            data: connection.escape(pedido.data),
            matricula: connection.escape(pedido.matricula),
            onus: connection.escape(pedido.onus),
            folhas: connection.escape(pedido.folhas),
            imagens: connection.escape(pedido.imagens),
            tipoCertidao: connection.escape(pedido.tipoCertidao),
            codigoArirj: connection.escape(pedido.codigoArirj),
            codigoEcartorio: connection.escape(pedido.codigoEcartorio),
            protocolos: connection.escape(pedido.protocolos),
            proprietarios: connection.escape(pedido.proprietarios)
        };

        // Query SQL para inserir o pedido (ajuste conforme a estrutura da sua tabela)
        const sql = `INSERT INTO pedidos (pedido, data, matricula, onus, folhas, imagens, tipoCertidao, codigoArirj, codigoEcartorio, protocolos, proprietarios) VALUES (${sanitizedPedido.pedido}, ${sanitizedPedido.data}, ${sanitizedPedido.matricula}, ${sanitizedPedido.onus}, ${sanitizedPedido.folhas}, ${sanitizedPedido.imagens}, ${sanitizedPedido.tipoCertidao}, ${sanitizedPedido.codigoArirj}, ${sanitizedPedido.codigoEcartorio}, ${sanitizedPedido.protocolos}, ${sanitizedPedido.proprietarios})`;

        // Executa a query
        connection.query(sql, (err, results) => {
            if (err) {
                console.error('Erro ao inserir pedido no banco de dados:', err);
                res.status(500).json({ status: 'erro', mensagem: 'Erro ao salvar o pedido.' });
            } else {
                console.log('Pedido inserido com sucesso!');
                console.log("Enviando resposta de sucesso:", { status: 'sucesso', mensagem: 'Pedido salvo com sucesso!' });
                res.json({ status: 'sucesso', mensagem: 'Pedido salvo com sucesso!' });
            }

            // Fecha a conexão com o banco de dados
            connection.end();
        });
    });
});

// Rota para lidar com a requisição POST para editar pedidos
app.post('/editar_pedido.php', (req, res) => {
    const pedido = req.body;
    console.log("Dados recebidos em /editar_pedido.php:", pedido); // Verifique os dados recebidos

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
            id: connection.escape(pedido.id),
            pedido: connection.escape(pedido.pedido),
            data: connection.escape(pedido.data),
            matricula: connection.escape(pedido.matricula),
            onus: connection.escape(pedido.onus),
            folhas: connection.escape(pedido.folhas),
            imagens: connection.escape(pedido.imagens),
            tipoCertidao: connection.escape(pedido.tipoCertidao),
            codigoArirj: connection.escape(pedido.codigoArirj),
            codigoEcartorio: connection.escape(pedido.codigoEcartorio),
            protocolos: connection.escape(pedido.protocolos),
            proprietarios: connection.escape(pedido.proprietarios)
        };

        // Query SQL para atualizar o pedido
        const sql = `UPDATE pedidos SET pedido = ${sanitizedPedido.pedido}, data = ${sanitizedPedido.data}, matricula = ${sanitizedPedido.matricula}, onus = ${sanitizedPedido.onus}, folhas = ${sanitizedPedido.folhas}, imagens = ${sanitizedPedido.imagens}, tipoCertidao = ${sanitizedPedido.tipoCertidao}, codigoArirj = ${sanitizedPedido.codigoArirj}, codigoEcartorio = ${sanitizedPedido.codigoEcartorio}, protocolos = ${sanitizedPedido.protocolos}, proprietarios = ${sanitizedPedido.proprietarios} WHERE id = ${sanitizedPedido.id}`;

        // Executa a query
        connection.query(sql, (err, results) => {
            if (err) {
                console.error('Erro ao atualizar pedido no banco de dados:', err);
                res.status(500).json({ status: 'erro', mensagem: 'Erro ao atualizar o pedido.' });
            } else {
                console.log('Pedido atualizado com sucesso!');
                res.json({ status: 'sucesso', mensagem: 'Pedido atualizado com sucesso!' });
            }

            // Fecha a conexão com o banco de dados
            connection.end();
        });
    });
});


// Rota para lidar com requisições para listar pedidos
app.get('/listar/_pedidos.php', (req, res) => {
    console.log("Requisição GET para /listar/_pedidos.php recebida.");

    // Obtém a página atual da query string, ou usa 1 como padrão
    const page = parseInt(req.query.page) || 1;
    const limit = 3; // Define o limite de pedidos por página
    const offset = (page - 1) * limit; // Calcula o offset

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

        // Query para contar o total de pedidos
        const countSql = `SELECT COUNT(*) AS total FROM pedidos`;

        // Executa a query de contagem
        connection.query(countSql, (countErr, countResults) => {
            if (countErr) {
                console.error('Erro ao contar o total de pedidos:', countErr);
                res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar os pedidos.' });
                connection.end();
                return;
            }

            const totalPedidos = countResults[0].total;

            // Query SQL para buscar pedidos com paginação
            // Agora ordenando por ID DESC (mais recentes primeiro) e DATA também
            const sql = `SELECT * FROM pedidos ORDER BY id DESC, data DESC LIMIT ? OFFSET ?`;

            // Executa a query paginada
            connection.query(sql, [limit, offset], (err, results) => {
                if (err) {
                    console.error('Erro ao buscar pedidos do banco de dados:', err);
                    res.status(500).json({ status: 'erro', mensagem: 'Erro ao buscar os pedidos.' });
                } else {
                    console.log('Pedidos encontrados com sucesso!');
                    // Envia os pedidos e o total como JSON
                    res.json({
                        totalPedidos: totalPedidos,
                        pedidos: results
                    });
                }

                // Fecha a conexão com o banco de dados
                connection.end();
            });
        });
    });
});

// Rota para excluir pedidos
app.post('/excluir_pedido.php', (req, res) => {
    const pedidoId = req.body.id;
    console.log("Requisição para excluir pedido recebida. ID:", pedidoId);

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

        // Sanitiza o ID do pedido
        const sanitizedPedidoId = connection.escape(pedidoId);

        // Query SQL para excluir o pedido
        const sql = `DELETE FROM pedidos WHERE id = ${sanitizedPedidoId}`;

        // Executa a query
        connection.query(sql, (err, results) => {
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
