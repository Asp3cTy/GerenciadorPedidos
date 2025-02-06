let currentPage = 1; // Página atual
let totalPages = 1; // Total de páginas (será calculado)
let pedidosCarregados = []; // Array para armazenar os pedidos carregados


// Função para coletar dados do formulário
function getDadosFormulario() {
    return {
        pedido: document.getElementById("pedido").value,
        data: document.getElementById("data").value, // Já virá no formato correto
        matricula: document.getElementById("matricula").value,
        onus: document.getElementById("onus").value,
        folhas: document.getElementById("folhas").value,
        imagens: document.getElementById("imagens").value,
        tipoCertidao: document.getElementById("tipoCertidao").value,
        codigoArirj: document.getElementById("codigoArirj").value,
        codigoEcartorio: document.getElementById("codigoEcartorio").value,
        protocolos:
            document.getElementById("protocolosAdicionados").dataset.protocolos ||
            "",
        proprietarios:
            document.getElementById("proprietariosAdicionados").dataset
                .proprietarios || "",
    };
}

function validarFormulario(formulario) {
    let isValid = true;
    const campos = formulario.querySelectorAll('input, select, textarea');

    campos.forEach(campo => {
        // Verifica se o campo é obrigatório e se está vazio
        if (campo.required && campo.value.trim() === '') {
            isValid = false;
            // Adiciona uma classe de erro ao campo (opcional)
            campo.classList.add('border-red-500');
            // Exibe uma mensagem de erro (opcional)
            if (!campo.nextElementSibling || !campo.nextElementSibling.classList.contains('erro')) {
                const erroSpan = document.createElement('span');
                erroSpan.textContent = 'Este campo é obrigatório.';
                erroSpan.classList.add('erro', 'text-red-500', 'text-xs');
                campo.parentNode.insertBefore(erroSpan, campo.nextSibling);
            }
        } else {
            // Remove a classe de erro se o campo for preenchido (opcional)
            campo.classList.remove('border-red-500');
            // Remove a mensagem de erro (opcional)
            if (campo.nextElementSibling && campo.nextElementSibling.classList.contains('erro')) {
                campo.nextElementSibling.remove();
            }
        }
    });

    return isValid;
}

function toUpperCaseInputs() {
    const inputs = document.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(input => {
        input.addEventListener('input', function (event) {
            const start = this.selectionStart; // Guarda a posição do cursor
            const end = this.selectionEnd;
            this.value = this.value.toUpperCase();
            this.setSelectionRange(start, end); // Restaura a posição do cursor
        });
    });
}

// Chame a função depois que o DOM estiver carregado:
document.addEventListener('DOMContentLoaded', function () {
    toUpperCaseInputs();
});

// Event listener do botão 'salvarPedido' com fetch e async/await
document.getElementById('salvarPedido').addEventListener('click', async () => {
    const formulario = document.querySelector('form');

    if (validarFormulario(formulario)) {
        console.log("Botão salvarPedido clicado!");
        const dadosPedido = getDadosFormulario();

        const pedidoId = document.getElementById('salvarPedido').getAttribute('data-pedido-id');
        const novoPedido = { ...dadosPedido };

        if (pedidoId) {
            novoPedido.id = parseInt(pedidoId);
        }
        // else {  Removido, pois o banco tem auto incremento
        //     novoPedido.id = Date.now();
        //}

        novoPedido.data = novoPedido.data; // Data já está formatada

        try {
            const url = pedidoId ? "/editar_pedido.php" : "/salvar_pedido.php";
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(novoPedido),
            });

            if (!response.ok) {
                //Pega a mensagem de erro do servidor, se houver.
                throw new Error(`Erro ao salvar/editar pedido: ${response.status} - ${await response.text()}`);
            }

            const resposta = await response.json(); // Já converte para JSON

            if (resposta.status === 'sucesso') {
                document.getElementById('salvarPedido').removeAttribute('data-pedido-id');
                currentPage = 1;
                await carregarPedidos(); // Usa await aqui também
                document.getElementById('closeModal').click();
                alert(resposta.mensagem);

                // Limpar campos do formulário
                document.getElementById('pedido').value = '';
                document.getElementById('matricula').value = '';
                document.getElementById('onus').value = 'NEGATIVA';
                document.getElementById('folhas').value = '';
                document.getElementById('imagens').value = '';
                document.getElementById('tipoCertidao').value = 'BALCAO';
                document.getElementById('codigoArirj').value = '';
                document.getElementById('codigoEcartorio').value = '';
                document.getElementById('protocolosAdicionados').innerHTML = '';
                document.getElementById('proprietariosAdicionados').innerHTML = '';
                document.getElementById('protocolosAdicionados').dataset.protocolos = '';
                document.getElementById('proprietariosAdicionados').dataset.proprietarios = '';
                document.getElementById('data').valueAsDate = new Date();

                // Disparar o evento 'change' no tipoCertidao
                document.getElementById('tipoCertidao').dispatchEvent(new Event('change'));

                // Fechar os popups
                fecharPopupProtocolos();
                fecharPopupProprietarios();

            } else {
                alert(resposta.mensagem); // Exibe mensagem de erro do servidor
            }

        } catch (error) {
            console.error("Erro:", error);
            alert(`Erro ao salvar/editar o pedido: ${error.message}`);
        }
    } else {
        alert('Por favor, preencha todos os campos obrigatórios.');
    }
});



// Função para formatar a data (Centralizada, para evitar duplicação)
function formatarData(data) {
  if (!data) return `<p><strong>Data:</strong> Data inválida</p>`;

  let dataFormatada = new Date(data);
  if (isNaN(dataFormatada.getTime())) {
    return `<p><strong>Data:</strong> Data inválida</p>`;
  }

  const dia = String(dataFormatada.getDate()).padStart(3, "0");
  const mes = String(dataFormatada.getMonth() + 1).padStart(2, "0");
  const ano = dataFormatada.getFullYear();
  return `<p><strong>${dia}/${mes}/${ano}</strong></p>`;
}



function renderPedidos(pedidos) {
    // Limpa os pedidos anteriores
    const pedidosResumo = document.getElementById('pedidosResumo');
    pedidosResumo.innerHTML = '';

    // Adiciona os pedidos da página atual à tela
    pedidos.forEach((pedido) => {
        const pedidoDiv = document.createElement('div');
        pedidoDiv.classList.add(
            "bg-secondary",
            "text-black",
            "p-4",
            "rounded",
            "shadow-md",
            "mb-4",
            "flex",
            "justify-between",
            "items-start"
        );

        // Formata a data manualmente e insere no HTML
        let dataFormatada = "";
        if (pedido.data) {
            const data = new Date(pedido.data);
            const dia = String(data.getUTCDate()).padStart(2, "0");
            const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
            const ano = data.getUTCFullYear();
            dataFormatada = `<p><strong>Data:</strong> ${dia}/${mes}/${ano}</p>`;
        } else {
            dataFormatada = `<p><strong>Data:</strong> Data inválida</p>`;
        }

        // Chama a função auxiliar para renderizar os participantes com a lupa
        const participantesHTML = renderizarParticipantes(pedido.proprietarios);

        pedidoDiv.innerHTML = `
            <div class="flex-grow">
                <h3 class="font-bold">Pedido: ${pedido.pedido}</h3>
                ${dataFormatada}
                <p><strong>Matrícula:</strong> ${pedido.matricula}</p>
                <p><strong>Ônus:</strong> ${pedido.onus}</p>
                <p><strong>N.º Folhas:</strong> ${pedido.folhas}</p>
                <p><strong>N.º Imagens:</strong> ${pedido.imagens}</p>
                <p><strong>Tipo de Certidão:</strong> ${pedido.tipoCertidao}</p>
                ${pedido.tipoCertidao === "ARIRJ"? `<p><strong>Código ARIRJ:</strong> ${pedido.codigoArirj}</p>`: ""}
                ${pedido.tipoCertidao === "E-CARTORIO"? `<p><strong>Código E-CARTORIO:</strong> ${pedido.codigoEcartorio}</p>`: ""}
                <div data-participantes>
                <p><strong>Participantes:</strong></p>
                    ${participantesHTML} 
                </div>
                <div>
                    <p><strong>Protocolos:</strong></p>
                    ${pedido.protocolos
                      ? pedido.protocolos
                          .split("|")
                          .filter((item) => item.trim()!== "")
                          .map((p) => {
                                const protocoloText = p.replace(/<button.*?>.*?<\/button>/gi, "").trim();
                                return `<p>${protocoloText}</p>`;
                            })
                          .join("")
                      : "<p>Nenhum protocolo adicionado</p>"}
                </div>
            </div>

            
            <div class="flex flex-col space-y-2 items-center ml-4">
                <button class="editar-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline" data-id="${pedido.id}">Editar</button>
                <button class="copiar-button bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline" data-id="${pedido.id}">Copiar</button>
                <button class="excluir-button bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline" data-id="${pedido.id}">Excluir</button>
            </div>
        `;


        pedidosResumo.appendChild(pedidoDiv);
    });
}


function renderizarParticipantes(proprietarios) {
    if (!proprietarios) return "<p>Nenhum participante adicionado</p>";

    const participantesHTML = proprietarios
        .split("|")
        .filter((item) => item.trim() !== "")
        .map(criarElementoParticipante)
        .join("");


    // Delegação de Eventos para os botões "pesquisarCNIB"
    setTimeout(() => {
        document.querySelectorAll('.pesquisarCNIB').forEach(button => {
            button.removeEventListener('click', handleClickPesquisarCNIB); // Remova o listener antigo
            button.addEventListener('click', handleClickPesquisarCNIB); // Adicione o novo
        });
    }, 0);


    return participantesHTML;
}

function handleClickPesquisarCNIB(event) {
    event.stopPropagation();
    const cpfCnpj = event.target.dataset.cpf;

    console.log("Botão CNIB clicado. CPF/CNPJ:", cpfCnpj);

    // Abre a página de indisponibilidade em uma nova aba
    const newWindow = window.open('https://indisponibilidade.onr.org.br/ordem/consulta/simplificada', '_blank');

    // Envia a mensagem via postMessage após a nova aba ser carregada
    newWindow.postMessage({ action: "pesquisarCNIB", cpfCnpj: cpfCnpj }, 'https://indisponibilidade.onr.org.br/ordem/consulta/simplificada');
    console.log("Mensagem enviada via postMessage para a nova aba.");
}

// A função criarElementoParticipante provavelmente está definida em outro lugar do seu código,
// mas ela é chamada pela renderizarParticipantes para criar o HTML para cada participante.
// Aqui está um exemplo de como ela pode ser:
function criarElementoParticipante(p) {
    const { cpfCnpj, texto } = extrairDadosParticipante(p);

    // Se o cpfCnpj for encontrado, substitua-o no texto pelo formato
  const textoFormatado = cpfCnpj ? texto.replace(cpfCnpj, formatCpfCnpj(cpfCnpj)) : texto;
    
    return `
      <div class="participante flex items-center w-full flex-wrap">
        <p class="mr-2">${texto}</p>
        ${cpfCnpj ? `<button class="pesquisarCNIB" data-cpf="${cpfCnpj}" aria-label="Pesquisar CNIB para ${cpfCnpj}">CNIB</button>` : ''}
      </div>
    `;
}

function extrairDadosParticipante(textoParticipante) {
    // Regex simplificada para capturar 11 ou 14 dígitos
    const cpfCnpjMatch = textoParticipante.match(/\d{11,14}/);
    const cpfCnpj = cpfCnpjMatch ? cpfCnpjMatch[0] : null;

    // Mantém o texto original do participante, sem remover o CPF/CNPJ
    const texto = textoParticipante;

    return { cpfCnpj, texto };
}



// Função para carregar os pedidos do servidor (agora usando async/await)
async function carregarPedidos() {
    console.log(`Carregando pedidos da página ${currentPage}...`); // Debug
    try {
        const response = await fetch(`/listar/_pedidos.php?page=${currentPage}`);
        if (!response.ok) {
            throw new Error(`Erro ao carregar pedidos: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        pedidosCarregados = data.pedidos;
        totalPages = Math.ceil(data.totalPedidos / 2); // Calcula totalPages corretamente

        console.log("Total de páginas:", totalPages); // Debug
        console.log("Pedidos carregados:", pedidosCarregados); //Debug

        renderPedidos(pedidosCarregados);
        updatePaginationButtons();

    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        alert("Erro ao carregar pedidos. Verifique o console para detalhes.");
    }
}

// Funções para mudar de página e atualizar botões (agora usando async/await)
async function changePage(delta) {
    const newPage = currentPage + delta;
    console.log(`Tentando mudar para a página ${newPage}...`); // Debug

    // Verifica se a nova página é válida *antes* de fazer a requisição
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        await carregarPedidos(); // Agora carregarPedidos() é assíncrona
    } else {
        console.log(`Página ${newPage} inválida.`); // Debug
    }
}

function updatePaginationButtons() {
    document.getElementById('pageNumber').textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Evento para excluir pedido (usando delegação de eventos)
document.getElementById('pedidosResumo').addEventListener('click', async function (event) {
    if (event.target.classList.contains('excluir-button')) {
        const pedidoId = parseInt(event.target.getAttribute('data-id'));

        try {
            const response = await fetch("/excluir_pedido.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: pedidoId }),
            });

            if (!response.ok) {
                throw new Error(`Erro ao excluir pedido: ${response.status} - ${await response.text()}`);
            }

            const resposta = await response.json();
            if (resposta.status === 'sucesso') {
                carregarPedidos(); // Recarrega após exclusão
            } else {
                alert(resposta.mensagem);
            }
        } catch (error) {
            console.error("Erro ao excluir pedido:", error);
            alert(`Erro ao excluir o pedido: ${error.message}`);
        }
    }
});

// Evento para editar pedido (usando delegação de eventos)
document.getElementById('pedidosResumo').addEventListener('click', function (event) {
    if (event.target.classList.contains('editar-button')) {
        const pedidoId = parseInt(event.target.getAttribute('data-id'));
        editarPedido(pedidoId);
    }
});


function formatParticipanteText(text) {
  // Divide o texto do participante pelo separador " - "
  const partes = text.split(' - ');
  if (partes.length > 2) {
    // Considera que a terceira parte é o CPF/CNPJ
    const raw = partes[2].replace(/\D/g, '');
    if (raw.length === 11 || raw.length === 14) {
      partes[2] = formatCpfCnpj(raw);
    }
  }
  return partes.join(' - ');
}


// Evento para copiar pedido (usando delegação de eventos)
document.getElementById('pedidosResumo').addEventListener('click', function (event) {
    if (event.target.classList.contains('copiar-button')) {
        const pedidoId = parseInt(event.target.getAttribute('data-id'));
        copiarPedido(pedidoId);

                // Preencher o campo de data formatando para YYYY-MM-dd
        if (pedido.data) {
            const data = new Date(pedido.data);
            const dia = String(data.getUTCDate()).padStart(2, '0');
const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
            const ano = data.getUTCFullYear();
            document.getElementById('data').value = `${ano}-${mes}-${dia}`;
        } else {
            document.getElementById('data').value = pedido.data; // Ou defina uma data padrão
        }
        
    }
});

// Função para buscar um pedido pelo ID (CORRIGIDA)
function buscarPedidoPorId(pedidoId) {
    const pedidoEncontrado = pedidosCarregados.find(p => p.id === pedidoId);
    return pedidoEncontrado;
}


// Função para editar um pedido
function editarPedido(pedidoId) {
    // 1. Buscar o pedido pelo ID (agora usando a lista de pedidos carregados)
    const pedido = buscarPedidoPorId(pedidoId);

    // 2. Preencher o formulário com os dados do pedido
    if (pedido) {
        document.getElementById('pedido').value = pedido.pedido;

        // Preencher o campo de data formatando para YYYY-MM-dd
        if (pedido.data) {
            const data = new Date(pedido.data);
            const dia = String(data.getUTCDate()).padStart(2, '0');
const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
            const ano = data.getUTCFullYear();
            document.getElementById('data').value = `${ano}-${mes}-${dia}`;
        } else {
            document.getElementById('data').value = pedido.data; // Ou defina uma data padrão
        }

        document.getElementById('matricula').value = pedido.matricula;
        document.getElementById('onus').value = pedido.onus;
        document.getElementById('folhas').value = pedido.folhas;
        document.getElementById('imagens').value = pedido.imagens;
        document.getElementById('tipoCertidao').value = pedido.tipoCertidao;
        document.getElementById('codigoArirj').value = pedido.codigoArirj;
        document.getElementById('codigoEcartorio').value = pedido.codigoEcartorio;

        // Tratar protocolos e proprietários
        document.getElementById('protocolosAdicionados').dataset.protocolos = pedido.protocolos;
        document.getElementById('proprietariosAdicionados').dataset.proprietarios = pedido.proprietarios;
        renderizarProtocolos();
        renderizarProprietarios();

        // 3. Disparar o evento 'change' no tipoCertidao
        document.getElementById('tipoCertidao').dispatchEvent(new Event('change'));

        // Adiciona o data-pedido-id ao botão "Salvar Pedido"
        document.getElementById('salvarPedido').setAttribute('data-pedido-id', pedidoId);

        // 4. Abrir o modal
        document.getElementById('modal').classList.remove('hidden');
    } else {
        alert("Pedido não encontrado!");
    }
}

// Função para copiar um pedido
function copiarPedido(pedidoId) {
    // 1. Buscar o pedido pelo ID
    const pedido = buscarPedidoPorId(pedidoId);

    if (!pedido) {
        alert("Pedido não encontrado!");
        return;
    }

    // 2. Formatar a data para YYYY-MM-DD
    let dataFormatada = "";
    if (pedido.data) {
        const data = new Date(pedido.data);
        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();
        dataFormatada = `${ano}-${mes}-${dia}`;
    }

    // 3. Montar o texto do pedido
    let textoPedido = `
Pedido: ${pedido.pedido}
Data: ${dataFormatada}
Matrícula: ${pedido.matricula}
Ônus: ${pedido.onus}
N.º Folhas: ${pedido.folhas}
N.º Imagens: ${pedido.imagens}
Tipo de Certidão: ${pedido.tipoCertidao}
`;

    if (pedido.tipoCertidao === 'ARIRJ') {
        textoPedido += `Código ARIRJ: ${pedido.codigoArirj}\n`;
    }

    if (pedido.tipoCertidao === 'E-CARTORIO') {
        textoPedido += `Código E-CARTORIO: ${pedido.codigoEcartorio}\n`;
    }

    textoPedido += `\nProtocolos:\n`;
    if (pedido.protocolos) {
        textoPedido += pedido.protocolos
            .split('|')
            .filter(item => item.trim() !== '')
            .map(p => p.replace(/<button.*?>.*?<\/button>/gi, '').trim()) // Remove botões HTML
            .join('\n');
    } else {
        textoPedido += `Nenhum protocolo adicionado\n`;
    }

    textoPedido += `\nProprietários:\n`;
    if (pedido.proprietarios) {
        textoPedido += pedido.proprietarios
            .split('|')
            .filter(item => item.trim() !== '')
            .map(p => formatarProprietario(p.trim())) // Formata CPF/CNPJ
            .join('\n');
    } else {
        textoPedido += `Nenhum proprietário adicionado\n`;
    }

    // Adiciona a linha de separação
    textoPedido += `\n----------------------------------------\n`;

    // 4. Copiar para a área de transferência
    navigator.clipboard.writeText(textoPedido).then(() => {
        alert("Pedido copiado para a área de transferência!");
    }, () => {
        alert("Erro ao copiar o pedido!");
    });
}

// Função para extrair e formatar CPF/CNPJ dentro do texto do participante
function formatarParticipante(participante) {
    const regexCpfCnpj = /\d{11}|\d{14}/g; // Captura CPF (11 dígitos) ou CNPJ (14 dígitos)
    return participante.replace(regexCpfCnpj, match => formatCpfCnpj(match));
}

// Evento para baixar os pedidos em JSON
document.getElementById('baixarPedidos').addEventListener('click', async function () {
    try {
        // Faz a requisição para obter todos os pedidos
        const response = await fetch('/listar_todos_pedidos');

        // Verifica se a requisição foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro ao baixar pedidos: ${response.status} ${response.statusText}`);
        }

        // Converte a resposta para JSON
        const data = await response.json();
        const pedidos = data.pedidos; // Obtém o array de pedidos

        // Formata os dados dos pedidos
        const pedidosFormatados = pedidos.map(pedido => ({
            Pedido: pedido.pedido,
            Data: formatarData(pedido.data), // Usa a função para formatar a data
            Matrícula: pedido.matricula,
            Ônus: pedido.onus,
            Folhas: pedido.folhas,
            Imagens: pedido.imagens,
            TipoCertidao: pedido.tipoCertidao,
            CodigoARIRJ: pedido.tipoCertidao === 'ARIRJ' ? pedido.codigoArirj : null,
            CodigoEcartorio: pedido.tipoCertidao === 'E-CARTORIO' ? pedido.codigoEcartorio : null,
            Protocolos: pedido.protocolos
                ? pedido.protocolos
                    .replace(/<[^>]*>/g, '') // Remove tags HTML
                    .split('|') // Divide os protocolos em um array
                    .filter(item => item.trim() !== '') // Remove linhas vazias
                : [],
            Participantes: pedido.proprietarios
                ? pedido.proprietarios
                    .replace(/<[^>]*>/g, '') // Remove tags HTML
                    .split('|') // Divide os proprietários em um array
                    .filter(item => item.trim() !== '') // Remove itens vazios
                    .map(item => formatarParticipante(item.trim())) // Formata CPF/CNPJ
                : []
        }));

        // Converte o array de pedidos formatados para uma string JSON com indentação
        const conteudo = JSON.stringify(pedidosFormatados, null, 2);

        // Cria um Blob para download
        const blob = new Blob([conteudo], { type: 'application/json' });

        // Cria um link temporário para download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'pedidos.json';
        link.click();
        URL.revokeObjectURL(link.href); // Libera a URL

    } catch (error) {
        console.error("Erro ao baixar pedidos:", error);
        alert("Erro ao baixar pedidos. Verifique o console para detalhes.");
    }
});



// Função para copiar todos os pedidos para a área de transferência
document.getElementById('copiarTodosPedidos').addEventListener('click', async function() {
    try {
        // Faz a requisição para a rota que retorna todos os pedidos
        const response = await fetch('/listar_todos_pedidos');

        // Verifica se a requisição foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro ao obter pedidos: ${response.status} ${response.statusText}`);
        }

        // Converte a resposta para JSON
        const data = await response.json();
        const pedidos = data.pedidos; // Obtém o array de pedidos


         let textoTodosPedidos = "";
        pedidos.forEach((pedido) => {
            const dataFormatada = formatarData(pedido.data); // <--- USE A FUNÇÃO!
            let textoPedido = `
Pedido: ${pedido.pedido}
Data: ${dataFormatada}
Matrícula: ${pedido.matricula}
Ônus: ${pedido.onus}
N.º Folhas: ${pedido.folhas}
N.º Imagens: ${pedido.imagens}
Tipo de Certidão: ${pedido.tipoCertidao}
`;

            if (pedido.tipoCertidao === "ARIRJ") {
                textoPedido += `Código ARIRJ: ${pedido.codigoArirj}\n`;
            }

            if (pedido.tipoCertidao === "E-CARTORIO") {
                textoPedido += `Código E-CARTORIO: ${pedido.codigoEcartorio}\n`;
            }

            textoPedido += `Protocolos:\n`;
            if (pedido.protocolos) {
                textoPedido += pedido.protocolos
                    .split("|")
                    .filter((item) => item.trim() !== "")
                    .map((p) => p.replace(/<button.*?>.*?<\/button>/gi, "").trim())
                    .join("\n");
            } else {
                textoPedido += "Nenhum protocolo adicionado\n";
            }

            textoPedido += `\nProprietários:\n`;
            if (pedido.proprietarios) {
                textoPedido += pedido.proprietarios
                    .split("|")
                    .filter((item) => item.trim() !== "")
                    .map((p) => p.trim())
                    .join("\n");
            } else {
                textoPedido += "Nenhum proprietário adicionado\n";
            }

            textoPedido += `\n----------------------------------------\n`;
            textoTodosPedidos += textoPedido;
        });

        // Copia para a área de transferência
        navigator.clipboard.writeText(textoTodosPedidos)
            .then(() => {
                alert("Todos os pedidos copiados para a área de transferência!");
            })
            .catch(() => {
                alert("Erro ao copiar os pedidos!");
            });

    } catch (error) {
        console.error("Erro ao copiar pedidos:", error);
        alert("Erro ao copiar pedidos. Verifique o console para detalhes.");
    }
});

// Abrir o modal
document.getElementById('openModal').addEventListener('click', function () {
    document.getElementById('modal').classList.remove('hidden');

    // Define o limite de dígitos e o placeholder do campo "CPF/CNPJ"
    const tipoDocumento = document.getElementById('tipoDocumento').value;
    const campoCpfCnpj = document.getElementById('cpf');
    if (tipoDocumento === 'cpf') {
        campoCpfCnpj.setAttribute('maxlength', '11');
        campoCpfCnpj.setAttribute('placeholder', 'XXX.XXX.XXX-XX');
    } else if (tipoDocumento === 'cnpj') {
        campoCpfCnpj.setAttribute('maxlength', '14');
        campoCpfCnpj.setAttribute('placeholder', 'XX.XXX.XXX/XXXX-XX');
    }
    // Define a data atual no formato YYYY-MM-DD
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const ano = hoje.getFullYear();
    document.getElementById('data').value = `${ano}-${mes}-${dia}`;
});

// Fechar o modal
document.getElementById("closeModal").addEventListener("click", function () {
    console.log("Fechando o modal");
    document.getElementById("modal").classList.add("hidden");

    // Limpar campos e atribuir data atual formatada
    document.getElementById("pedido").value = "";
    document.getElementById("matricula").value = "";
    document.getElementById("onus").value = "NEGATIVA";
    document.getElementById("folhas").value = "";
    document.getElementById("imagens").value = "";
    document.getElementById("tipoCertidao").value = "BALCAO";
    document.getElementById("codigoArirj").value = "";
    document.getElementById("codigoEcartorio").value = "";
    document.getElementById("protocolosAdicionados").innerHTML = "";
    document.getElementById("proprietariosAdicionados").innerHTML = "";
    document.getElementById("protocolosAdicionados").dataset.protocolos = "";
    document.getElementById("proprietariosAdicionados").dataset.proprietarios = "";
    // Formata a data atual para YYYY-MM-DD
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0"); // Janeiro é 0!
    const ano = hoje.getFullYear();
    document.getElementById("data").value =  `${ano}-${mes}-${dia}`;
});

// Funções para abrir e fechar popups
function abrirPopupProtocolos() {
    document.getElementById('popupProtocolos').classList.remove('hidden');
}
function fecharPopupProtocolos() {
    document.getElementById('popupProtocolos').classList.add('hidden');
}
// Função para abrir o popup de participantes
function abrirPopupProprietarios() {
    document.getElementById('popupProprietarios').classList.remove('hidden');
    // Define o limite de dígitos e o placeholder
    const tipoDocumento = document.getElementById('tipoDocumento').value;
    const campoCpfCnpj = document.getElementById('cpf');
    if (tipoDocumento === 'cpf') {
        campoCpfCnpj.setAttribute('maxlength', '11');
        campoCpfCnpj.setAttribute('placeholder', 'XXX.XXX.XXX-XX');
    } else if (tipoDocumento === 'cnpj') {
        campoCpfCnpj.setAttribute('maxlength', '14');
        campoCpfCnpj.setAttribute('placeholder', 'XX.XXX.XXX/XXXX-XX');
    }
}

function fecharPopupProprietarios() {
    document.getElementById('popupProprietarios').classList.add('hidden');
}

// Ações dos botões
document.getElementById('abrirPopupProtocolos').addEventListener('click', abrirPopupProtocolos);
document.getElementById('abrirPopupProprietarios').addEventListener('click', abrirPopupProprietarios);

// Adicionar protocolo
document.getElementById('confirmarProtocolo').addEventListener('click', function () {
    const protocolo = document.getElementById('novoProtocolo').value.trim();
    if (protocolo) {
        // Armazenar os protocolos em um array
        let protocolosArray = [];
        if (document.getElementById('protocolosAdicionados').dataset.protocolos) {
            protocolosArray = document.getElementById('protocolosAdicionados').dataset.protocolos.split('|');
        }

        // Adiciona o novo protocolo ao array
        protocolosArray.push(protocolo);

        // Atualiza o dataset com os protocolos
        document.getElementById('protocolosAdicionados').dataset.protocolos = protocolosArray.join('|');

        // Renderizar a lista de protocolos
        renderizarProtocolos();

        document.getElementById('novoProtocolo').value = ''; // Limpar campo
    }
});

// Função para renderizar a lista de protocolos
function renderizarProtocolos() {
    const protocolosAdicionadosDiv = document.getElementById('protocolosAdicionados');
    protocolosAdicionadosDiv.innerHTML = ''; // Limpa a lista

    let protocolosArray = [];
    if (protocolosAdicionadosDiv.dataset.protocolos) {
        protocolosArray = protocolosAdicionadosDiv.dataset.protocolos.split('|');
    }

    protocolosArray.forEach((protocoloTexto, index) => {
        const protocoloSpan = document.createElement('span');
        protocoloSpan.classList.add('text-white');
        protocoloSpan.textContent = protocoloTexto;

        // Botão Editar
        const editButton = document.createElement('button');
        editButton.classList.add('edit-protocolo-button', 'bg-yellow-500', 'hover:bg-yellow-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'ml-2', 'text-xs');
        editButton.textContent = 'Editar';
        editButton.dataset.index = index; // Armazena o índice

        // Botão Excluir
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-protocolo-button', 'bg-red-500', 'hover:bg-red-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'ml-2', 'text-xs');
        deleteButton.textContent = 'Excluir';
        deleteButton.dataset.index = index; // Armazena o índice

        const container = document.createElement('div');
        container.appendChild(protocoloSpan);
        container.appendChild(editButton);
        container.appendChild(deleteButton);

        protocolosAdicionadosDiv.appendChild(container);
        protocolosAdicionadosDiv.appendChild(document.createElement('br'));
    });

    // Event listeners para editar/excluir
    const editButtons = document.querySelectorAll('.edit-protocolo-button');
    editButtons.forEach(button => {
        button.removeEventListener('click', handleEditProtocoloButtonClick);
        button.addEventListener('click', handleEditProtocoloButtonClick);
    });

    const deleteButtons = document.querySelectorAll('.delete-protocolo-button');
    deleteButtons.forEach(button => {
        button.removeEventListener('click', handleDeleteProtocoloButtonClick);
        button.addEventListener('click', handleDeleteProtocoloButtonClick);
    });
}

// Função para lidar com o clique no botão de editar protocolo
function handleEditProtocoloButtonClick(event) {
    const index = parseInt(event.target.dataset.index);
    let protocolosArray = document.getElementById('protocolosAdicionados').dataset.protocolos.split('|');
    const protocoloTexto = protocolosArray[index];

    // Preencher o campo de protocolo com o valor atual
    document.getElementById('novoProtocolo').value = protocoloTexto;

    // Remover o protocolo da lista
    protocolosArray.splice(index, 1);
    document.getElementById('protocolosAdicionados').dataset.protocolos = protocolosArray.join('|');
    renderizarProtocolos();

    // Abrir o popup de protocolos
    abrirPopupProtocolos();
}

// Função para lidar com o clique no botão de excluir protocolo
function handleDeleteProtocoloButtonClick(event) {
    const index = parseInt(event.target.dataset.index);
    let protocolosArray = document.getElementById('protocolosAdicionados').dataset.protocolos.split('|');
    protocolosArray.splice(index, 1); // Remove o protocolo do array
    document.getElementById('protocolosAdicionados').dataset.protocolos = protocolosArray.join('|');
    renderizarProtocolos(); // Renderiza a lista atualizada
}

// Alternar visibilidade de campos com base no tipo de documento
// Event listener para o campo "Tipo de Documento"
document.getElementById('tipoDocumento').addEventListener('change', function() {
    const tipoDocumento = this.value;
    const campoCpfCnpj = document.getElementById('cpf');

    if (tipoDocumento === 'cpf') {
        campoCpfCnpj.setAttribute('maxlength', '11');
        campoCpfCnpj.setAttribute('placeholder', 'XXX.XXX.XXX-XX');
    } else if (tipoDocumento === 'cnpj') {
        campoCpfCnpj.setAttribute('maxlength', '14');
        campoCpfCnpj.setAttribute('placeholder', 'XX.XXX.XXX/XXXX-XX');
    }
});

// Event listener para o campo "CPF/CNPJ" (permite apenas números)
document.getElementById('cpf').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, ''); // Remove qualquer caractere que não seja um dígito
});

// Confirmar proprietário
document.getElementById('confirmarProprietario').addEventListener('click', function () {
    const qualificacao = document.getElementById('qualificacao').value;
    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const tipoDocumento = document.getElementById('tipoDocumento').value;

    let propietarioTexto = `${qualificacao} - ${nome} - ${cpf}`;

    if (tipoDocumento === 'cpf') {
        const sexo = document.getElementById('sexo').value;
        const identidade = document.getElementById('identidade').value;
        const orgaoExpedidor = document.getElementById('orgaoExpedidor').value;
        const estadoCivil = document.getElementById('estadoCivil').value;
        propietarioTexto += ` - ${sexo} - ${identidade} - ${orgaoExpedidor} - ${estadoCivil}`;
    }

    // Obter a lista atual de proprietários do dataset
    let proprietariosArray = [];
    if (document.getElementById('proprietariosAdicionados').dataset.proprietarios) {
        proprietariosArray = document.getElementById('proprietariosAdicionados').dataset.proprietarios.split('|');
    }

    // Adicionar o novo proprietário ao array
    proprietariosArray.push(propietarioTexto);

    // Atualizar o dataset com os proprietários
    document.getElementById('proprietariosAdicionados').dataset.proprietarios = proprietariosArray.join('|');

    // Renderizar a lista de proprietários
    renderizarProprietarios();

    // Limpar campos
    document.getElementById('nome').value = '';
    document.getElementById('cpf').value = '';
    document.getElementById('tipoDocumento').value = 'cpf';
    document.getElementById('sexo').value = 'Masculino';
    document.getElementById('identidade').value = '';
    document.getElementById('orgaoExpedidor').value = '';
    document.getElementById('estadoCivil').value = 'Solteiro';
    document.getElementById('camposPessoais').style.display = 'block';
});

// Função para renderizar a lista de proprietários
function renderizarProprietarios() {
    const proprietariosAdicionadosDiv = document.getElementById('proprietariosAdicionados');
    proprietariosAdicionadosDiv.innerHTML = ''; // Limpa a lista atual

    let proprietariosArray = [];
    if (proprietariosAdicionadosDiv.dataset.proprietarios) {
        proprietariosArray = proprietariosAdicionadosDiv.dataset.proprietarios.split('|');
    }

    proprietariosArray.forEach((proprietarioTexto, index) => {
        const proprietarioSpan = document.createElement('span');
        proprietarioSpan.classList.add('text-white');
        proprietarioSpan.textContent = proprietarioTexto;

        // Botão Editar
        const editButton = document.createElement('button');
        editButton.classList.add('edit-button', 'bg-yellow-500', 'hover:bg-yellow-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'ml-2', 'text-xs');
        editButton.textContent = 'Editar';
        editButton.dataset.index = index; // Armazena o índice do proprietário

        // Botão Excluir
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button', 'bg-red-500', 'hover:bg-red-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'ml-2', 'text-xs');
        deleteButton.textContent = 'Excluir';
        deleteButton.dataset.index = index; // Armazena o índice do proprietário

        const container = document.createElement('div');
        container.appendChild(proprietarioSpan);
        container.appendChild(editButton);
        container.appendChild(deleteButton);

        proprietariosAdicionadosDiv.appendChild(container);
        proprietariosAdicionadosDiv.appendChild(document.createElement('br'));
    });

    // Adiciona event listeners para os botões de editar e excluir
    const editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach(button => {
        button.removeEventListener('click', handleEditButtonClick);
        button.addEventListener('click', handleEditButtonClick);
    });

    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.removeEventListener('click', handleDeleteButtonClick);
        button.addEventListener('click', handleDeleteButtonClick);
    });
}

// Função para lidar com o clique no botão de editar
function handleEditButtonClick(event) {
    const index = parseInt(event.target.dataset.index);
    let proprietariosArray = document.getElementById('proprietariosAdicionados').dataset.proprietarios.split('|');
    const proprietarioTexto = proprietariosArray[index];



    // Preencher o formulário com os dados do proprietário
    const partes = proprietarioTexto.split(' - ');
    document.getElementById('qualificacao').value = partes[0];
    document.getElementById('nome').value = partes[1];
    document.getElementById('cpf').value = partes[2];
    document.getElementById('tipoDocumento').value = partes[2].length === 14 ? 'cnpj' : 'cpf';

    const labelCpf = document.querySelector('label[for="cpf"]');

    // Atualizar o texto do label conforme o tipo de documento
    if (document.getElementById('tipoDocumento').value === 'cpf') {
        labelCpf.textContent = 'CPF'; // Garante que o label seja CPF
        document.getElementById('sexo').value = partes[3];
        document.getElementById('identidade').value = partes[4];
        document.getElementById('orgaoExpedidor').value = partes[5];
        document.getElementById('estadoCivil').value = partes[6];
        document.getElementById('camposPessoais').style.display = 'block';
    } else {
        labelCpf.textContent = 'CNPJ'; // Atualiza o label para CNPJ
        document.getElementById('camposPessoais').style.display = 'none';
    }



    // Remover o proprietário da lista
    proprietariosArray.splice(index, 1);
    document.getElementById('proprietariosAdicionados').dataset.proprietarios = proprietariosArray.join('|');
    renderizarProprietarios();

    // Abrir o popup de proprietários
    abrirPopupProprietarios();
}

// Função para lidar com o clique no botão de excluir
function handleDeleteButtonClick(event) {
    const index = parseInt(event.target.dataset.index);
    let proprietariosArray = document.getElementById('proprietariosAdicionados').dataset.proprietarios.split('|');
    proprietariosArray.splice(index, 1); // Remove o proprietário do array
    document.getElementById('proprietariosAdicionados').dataset.proprietarios = proprietariosArray.join('|');
    renderizarProprietarios(); // Renderiza a lista atualizada
}

// Função para permitir apenas números nos campos
function permitirSomenteNumeros(idCampo) {
    const campo = document.getElementById(idCampo);
    campo.addEventListener('input', () => {
        // Remove tudo que não seja dígito
        campo.value = campo.value.replace(/\D/g, '');
    });
}

// Aplicar a funcionalidade para CPF/CNPJ e Identidade

permitirSomenteNumeros('identidade');
permitirSomenteNumeros('pedido');
permitirSomenteNumeros('matricula');
permitirSomenteNumeros('folhas');
permitirSomenteNumeros('imagens');

// Mostrar/ocultar Código ARIRJ e Código E-CARTORIO
document.getElementById('tipoCertidao').addEventListener('change', function () {
    const codigoArirjContainer = document.getElementById('codigoArirjContainer');
    const codigoEcartorioContainer = document.getElementById('codigoEcartorioContainer');

    // Exibe ou esconde os campos com base no tipo de certidão selecionado
    if (this.value === 'ARIRJ') {
        codigoArirjContainer.classList.remove('hidden');
        codigoEcartorioContainer.classList.add('hidden');
    } else if (this.value === 'E-CARTORIO') {
        codigoArirjContainer.classList.add('hidden');
        codigoEcartorioContainer.classList.remove('hidden');
    } else {
        // Caso não seja ARIRJ ou E-CARTORIO, esconde ambos
        codigoArirjContainer.classList.add('hidden');
        codigoEcartorioContainer.classList.add('hidden');
    }
});

// Carrega os pedidos quando a página é carregada e quando o DOM está pronto
document.addEventListener('DOMContentLoaded', function() {
    carregarPedidos();  // Chama carregarPedidos *após* o DOM ter sido carregado.
    toUpperCaseInputs(); // Garante que a função seja chamada.
});

// Adiciona os event listeners para os botões de paginação *fora* da função carregarPedidos
document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
document.getElementById('nextPage').addEventListener('click', () => changePage(1));

// Carrega os pedidos quando a página é carregada
carregarPedidos();
