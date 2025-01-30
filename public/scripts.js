let currentPage = 1; // Página atual
let totalPages = 1; // Total de páginas (será calculado)
let pedidosCarregados = []; // Array para armazenar os pedidos carregados

// Função para formatar CPF e CNPJ
function formatarCpfCnpj(numero) {
  const apenasNumeros = numero.replace(/\D/g, '');
  if (apenasNumeros.length === 11) {
    // Formatar como CPF (XXX.XXX.XXX-XX)
    return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (apenasNumeros.length === 14) {
    // Formatar como CNPJ (XX.XXX.XXX/XXXX-XX)
    return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return numero; // Retorna o número original se não for CPF ou CNPJ válido
}

// Função para coletar dados do formulário
function getDadosFormulario() {
  return {
    pedido: document.getElementById('pedido').value,
    data: document.getElementById('data').valueAsDate,
    matricula: document.getElementById('matricula').value,
    onus: document.getElementById('onus').value,
    folhas: document.getElementById('folhas').value,
    imagens: document.getElementById('imagens').value,
    tipoCertidao: document.getElementById('tipoCertidao').value,
    codigoArirj: document.getElementById('codigoArirj').value,
    codigoEcartorio: document.getElementById('codigoEcartorio').value,
    protocolos: document.getElementById('protocolosAdicionados').dataset.protocolos || '',
    proprietarios: document.getElementById('proprietariosAdicionados').dataset.proprietarios || ''
  };
}

console.log("Associando event listener ao botão salvarPedido");

// Função que será chamada quando o pedido for salvo ou editado
document.getElementById('salvarPedido').addEventListener('click', () => {
  console.log("Botão salvarPedido clicado!");
  const dadosPedido = getDadosFormulario();

  // Verifica se está editando um pedido existente
  const pedidoId = document.getElementById('salvarPedido').getAttribute('data-pedido-id');
  const novoPedido = {
    ...dadosPedido
  };

  // Se tiver pedidoId, é uma edição, então adiciona o ID ao objeto
  if (pedidoId) {
    novoPedido.id = parseInt(pedidoId);
  } else {
    novoPedido.id = Date.now();
  }

  const xhr = new XMLHttpRequest();
  // Usa uma rota diferente para edição, por exemplo, /editar_pedido.php
  xhr.open("POST", pedidoId ? "/editar_pedido.php" : "/salvar_pedido.php", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      console.log("Resposta recebida (texto):", this.responseText);
      let resposta;
      try {
        resposta = JSON.parse(this.responseText);
        console.log("Resposta após o parse:", resposta);
      } catch (error) {
        console.error("Erro ao fazer o parse do JSON:", error);
        console.error("Conteúdo da resposta:", this.responseText);
        alert("Erro ao processar a resposta do servidor.");
        return;
      }

      if (resposta.status === 'sucesso') {
        // Remove o atributo data-pedido-id, já que a edição foi concluída
        document.getElementById('salvarPedido').removeAttribute('data-pedido-id');

        currentPage = 1; // Volta para a página 1 após salvar um pedido
        carregarPedidos(); // Atualiza a lista de pedidos carregados
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

        // Disparar o evento 'change' no tipoCertidao para redefinir a visibilidade dos campos ARIRJ/E-CARTORIO
        document.getElementById('tipoCertidao').dispatchEvent(new Event('change'));

        // Fechar os popups, se estiverem abertos
        fecharPopupProtocolos();
        fecharPopupProprietarios();
      } else {
        alert(resposta.mensagem);
      }
    }
  };

  xhr.send(JSON.stringify(novoPedido));
});

// Função para formatar a data
function formatarData(data) {
    let dataFormatada;
    if (!(data instanceof Date)) {
        dataFormatada = new Date(data);
        if (isNaN(dataFormatada.getTime())) {
            // Se a conversão falhar, retorne a data original ou uma mensagem de erro
            return `<p><strong>Data:</strong> Data inválida</p>`;
        }
    } else {
        dataFormatada = data;
    }

    const dia = String(dataFormatada.getDate()).padStart(2, '0');
    const mes = String(dataFormatada.getMonth() + 1).padStart(2, '0');
    const ano = dataFormatada.getFullYear();
    return `<p><strong>Data:</strong> <span class="math-inline">\{dia\}/</span>{mes}/${ano}</p>`;
}

// Função para renderizar os pedidos
function renderPedidos(pedidos) {
  // Limpa os pedidos anteriores
  const pedidosResumo = document.getElementById('pedidosResumo');
  pedidosResumo.innerHTML = '';

  // Adiciona os pedidos da página atual à tela
  pedidos.forEach((pedido) => {
    const pedidoDiv = document.createElement('div');
    pedidoDiv.classList.add('bg-secondary',  'text-black', 'p-4', 'rounded', 'shadow-md', 'mb-4', 'flex', 'justify-between', 'items-start');
    pedidoDiv.innerHTML = `
        <div class="flex-grow">
          <h3 class="font-bold">Pedido: ${pedido.pedido}</h3>
          ${formatarData(pedido.data)}
          <p><strong>Matrícula:</strong> ${pedido.matricula}</p>
          <p><strong>Ônus:</strong> ${pedido.onus}</p>           
          <p><strong>N.º Folhas:</strong> ${pedido.folhas}</p>
          <p><strong>N.º Imagens:</strong> ${pedido.imagens}</p>
          <p><strong>Tipo de Certidão:</strong> ${pedido.tipoCertidao}</p>
          ${pedido.tipoCertidao === 'ARIRJ'
            ? `<p><strong>Código ARIRJ:</strong> ${pedido.codigoArirj}</p>`
            : ''
          }
          ${pedido.tipoCertidao === 'E-CARTORIO'
            ? `<p><strong>Código E-CARTORIO:</strong> ${pedido.codigoEcartorio}</p>`
            : ''
          }
          <div>
            <p><strong>Protocolos:</strong></p>
            ${pedido.protocolos
              ? pedido.protocolos
                .split('|')
                .filter(item => item.trim() !== '')
                .map(p => {
                  const protocoloText = p.replace(/<button.*?>.*?<\/button>/gi, '').trim();
                  return `<p>${protocoloText}</p>`;
                })
                .join('')
              : '<p>Nenhum protocolo adicionado</p>'
            }
          </div>

          <div>
            <p><strong>Proprietários:</strong></p>
            ${pedido.proprietarios
              ? pedido.proprietarios
                .split('|')
                .filter(item => item.trim() !== '')
                .map(p => `<p>${p.trim()}</p>`)
                .join('')
              : '<p>Nenhum proprietário adicionado</p>'
            }
          </div>
        </div>
        <div class="flex flex-col space-y-2 ml-4">
            <button class="editar-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline" data-id="<span class="math-inline">\{pedido\.id\}"\>
Editar
</button\>
<button class\="copiar\-button bg\-green\-500 hover\:bg\-green\-700 text\-white font\-bold py\-2 px\-4 rounded\-full focus\:outline\-none focus\:shadow\-outline" data\-id\="</span>{pedido.id}">
                Copiar
            </button>
            <button class="excluir-button bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline" data-id="${pedido.id}">
                Excluir
            </button>
        </div>
      `;
    pedidosResumo.appendChild(pedidoDiv);
  });
}

// Função para carregar os pedidos do servidor
function carregarPedidos() {
    console.log("Carregando pedidos...");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `/listar/_pedidos.php?page=${currentPage}`, true);
    xhr.onreadystatechange = function () {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            const resposta = JSON.parse(this.responseText);
            pedidosCarregados = resposta.pedidos; // Atualiza a variável global com os pedidos carregados
            totalPages = Math.ceil(resposta.totalPedidos / 3);
            renderPedidos(pedidosCarregados);
            updatePaginationButtons();
        }
    };
    xhr.send();
}

// Funções para mudar de página e atualizar botões
function changePage(delta) {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    carregarPedidos();
}

function updatePaginationButtons() {
    document.getElementById('pageNumber').textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// Evento para excluir pedido (usando delegação de eventos)
document.getElementById('pedidosResumo').addEventListener('click', function (event) {
  if (event.target.classList.contains('excluir-button')) {
    const pedidoId = parseInt(event.target.getAttribute('data-id'));

    // Envia uma requisição para o servidor para excluir o pedido
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/excluir_pedido.php", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        const resposta = JSON.parse(this.responseText);
        if (resposta.status === 'sucesso') {
          // Recarrega os pedidos após a exclusão
          carregarPedidos();
        } else {
          // Exibe mensagem de erro
          alert(resposta.mensagem);
        }
      }
    };
    xhr.send(JSON.stringify({ id: pedidoId }));
  }
});

// Evento para editar pedido (usando delegação de eventos)
document.getElementById('pedidosResumo').addEventListener('click', function(event) {
    if (event.target.classList.contains('editar-button')) {
        const pedidoId = parseInt(event.target.getAttribute('data-id'));
        editarPedido(pedidoId);
    }
});

// Evento para copiar pedido (usando delegação de eventos)
document.getElementById('pedidosResumo').addEventListener('click', function(event) {
    if (event.target.classList.contains('copiar-button')) {
        const pedidoId = parseInt(event.target.getAttribute('data-id'));
        copiarPedido(pedidoId);
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
        document.getElementById('data').valueAsDate = new Date(pedido.data);
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
    // 1. Buscar o pedido pelo ID (agora usando a lista de pedidos carregados)
    const pedido = buscarPedidoPorId(pedidoId);

    // 2. Formatar o texto do pedido
    if (pedido) {
        let textoPedido = `
Pedido: ${pedido.pedido}
Data: ${formatarData(pedido.data)}
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

        textoPedido += `Protocolos:\n`;
        if (pedido.protocolos) {
            textoPedido += pedido.protocolos
                .split('|')
                .filter(item => item.trim() !== '')
                .map(p => p.replace(/<button.*?>.*?<\/button>/gi, '').trim())
                .join('\n');
        } else {
            textoPedido += `Nenhum protocolo adicionado\n`;
        }

        textoPedido += `\nProprietários:\n`;
        if (pedido.proprietarios) {
            textoPedido += pedido.proprietarios
                .split('|')
                .filter(item => item.trim() !== '')
                .map(p => p.trim())
                .join('\n');
        } else {
            textoPedido += `Nenhum proprietário adicionado\n`;
        }

        // 3. Copiar para a área de transferência
        navigator.clipboard.writeText(textoPedido).then(() => {
            alert("Pedido copiado para a área de transferência!");
        }, () => {
            alert("Erro ao copiar o pedido!");
        });
    } else {
        alert("Pedido não encontrado!");
    }
}

// Abrir o modal
document.getElementById('openModal').addEventListener('click', function () {
  document.getElementById('modal').classList.remove('hidden');
});

// Fechar o modal
document.getElementById('closeModal').addEventListener('click', function () {
  console.log("Fechando o modal");
  document.getElementById('modal').classList.add('hidden');

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
});

// Funções para abrir e fechar popups
function abrirPopupProtocolos() {
  document.getElementById('popupProtocolos').classList.remove('hidden');
}

function fecharPopupProtocolos() {
  document.getElementById('popupProtocolos').classList.add('hidden');
}

function abrirPopupProprietarios() {
  document.getElementById('popupProprietarios').classList.remove('hidden');
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
  protocolosAdicionadosDiv.innerHTML = ''; // Limpa a lista atual

  let protocolosArray = [];
  if (protocolosAdicionadosDiv.dataset.protocolos) {
    protocolosArray = protocolosAdicionadosDiv.dataset.protocolos.split('|');
  }

  protocolosArray.forEach((protocoloTexto, index) => {
    const protocoloSpan = document.createElement('span');
    protocoloSpan.classList.add('text-black');
    protocoloSpan.textContent = protocoloTexto;

    // Botão Editar
    const editButton = document.createElement('button');
    editButton.classList.add('edit-protocolo-button', 'bg-yellow-500', 'hover:bg-yellow-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'ml-2', 'text-xs');
    editButton.textContent = 'Editar';
    editButton.dataset.index = index; // Armazena o índice do protocolo

    // Botão Excluir
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-protocolo-button', 'bg-red-500', 'hover:bg-red-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'ml-2', 'text-xs');
    deleteButton.textContent = 'Excluir';
    deleteButton.dataset.index = index; // Armazena o índice do protocolo

    const container = document.createElement('div');
    container.appendChild(protocoloSpan);
    container.appendChild(editButton);
    container.appendChild(deleteButton);

    protocolosAdicionadosDiv.appendChild(container);
    protocolosAdicionadosDiv.appendChild(document.createElement('br'));
  });

  // Adiciona event listeners para os botões de editar e excluir protocolos
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
document.getElementById('tipoDocumento').addEventListener('change', function () {
  const tipo = this.value;
  const camposPessoais = document.getElementById('camposPessoais');
  if (tipo === 'cnpj') {
    camposPessoais.style.display = 'none'; // Ocultar campos pessoais
  } else {
    camposPessoais.style.display = 'block'; // Mostrar campos pessoais
  }
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
    proprietarioSpan.classList.add('text-black');
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
  
    if (document.getElementById('tipoDocumento').value === 'cpf') {
      document.getElementById('sexo').value = partes[3];
      document.getElementById('identidade').value = partes[4];
      document.getElementById('orgaoExpedidor').value = partes[5];
      document.getElementById('estadoCivil').value = partes[6];
      document.getElementById('camposPessoais').style.display = 'block';
    } else {
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
permitirSomenteNumeros('cpf');
permitirSomenteNumeros('identidade');
permitirSomenteNumeros('pedido');
permitirSomenteNumeros('matricula');

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

document.getElementById('baixarPedidos').addEventListener('click', function () {
  // Usa os pedidos carregados na variável global
  const pedidosFormatados = pedidosCarregados.map(pedido => ({
    pedido: pedido.pedido,
    data: pedido.data,
    matricula: pedido.matricula,
    onus: pedido.onus,      
    folhas: pedido.folhas,
    imagens: pedido.imagens,
    tipoCertidao: pedido.tipoCertidao,
    codigoArirj: pedido.codigoArirj,
    codigoEcartorio: pedido.codigoEcartorio,
    protocolos: pedido.protocolos
      ? pedido.protocolos
        .replace(/<[^>]*>/g, '') // Remove tags HTML
        .split('|') // Divide os protocolos em um array
        .filter(item => item.trim() !== '') // Remove linhas vazias
      : [],
    proprietarios: pedido.proprietarios
      ? pedido.proprietarios
        .replace(/<[^>]*>/g, '') // Remove tags HTML
        .split('|') // Divide os proprietarios em um array
        .filter(item => item.trim() !== '') // Remove itens vazios
        .map(item => `${item.trim()}`) // Formata
      : []
  }));

  // Converte os pedidos para JSON formatado
  const conteudo = JSON.stringify(pedidosFormatados, null, 2);

  // Cria um blob com o conteúdo em JSON e dispara o download
  const blob = new Blob([conteudo], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'pedidos.json'; // Nome do arquivo para download
  link.click();
});

// Carrega os pedidos quando a página é carregada
carregarPedidos();
