let pedidos = []; // Array para armazenar os pedidos (não mais usado para exibição, mas mantido para consistência com o código de upload)

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

console.log("Associando event listener ao botão salvarPedido"); // Verifique se o event listener está sendo associado

// Função que será chamada quando o pedido for salvo
document.getElementById('salvarPedido').addEventListener('click', () => {
  console.log("Botão salvarPedido clicado!");
  const dadosPedido = getDadosFormulario();
  const novoPedido = {
    id: Date.now(),
    ...dadosPedido
  };

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/salvar_pedido.php", true);
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
        carregarPedidos();
        document.getElementById('closeModal').click();
        alert(resposta.mensagem);
        // Limpar campos do formulário
        document.getElementById('pedido').value = '';
        document.getElementById('matricula').value = '';
        document.getElementById('onus').value = 'NEGATIVA'; // Ou o valor padrão que você desejar        
        document.getElementById('folhas').value = '';
        document.getElementById('imagens').value = '';
        document.getElementById('tipoCertidao').value = 'BALCAO'; // Ou o valor padrão que você desejar
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
            return 'Data inválida';
        }
    } else {
        dataFormatada = data;
    }

    const dia = String(dataFormatada.getDate()).padStart(2, '0');
    const mes = String(dataFormatada.getMonth() + 1).padStart(2, '0');
    const ano = dataFormatada.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para renderizar os pedidos
function renderPedidos(pedidos) {
  // Limpa os pedidos anteriores
  const pedidosResumo = document.getElementById('pedidosResumo');
  pedidosResumo.innerHTML = '';

  // Adiciona os pedidos à tela
  pedidos.forEach((pedido) => {
    const pedidoDiv = document.createElement('div');
    pedidoDiv.classList.add('bg-secondary', 'p-4', 'rounded', 'shadow-md', 'mb-4', 'flex', 'justify-between', 'items-center');
    pedidoDiv.innerHTML = `
        <div>
          <h3 class="font-bold">Pedido: ${pedido.pedido}</h3>
          <p><strong>Data:</strong> ${formatarData(pedido.data)}</p>
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
                .split('|') // Divide a string em um array usando o pipe como separador
                .filter(item => item.trim() !== '') // Remove itens vazios
                .map(p => {
                    // Remove tags de botão e seus conteúdos usando expressão regular
                    const protocoloText = p.replace(/<button.*?>.*?<\/button>/gi, '').trim();
                    return `<p>${protocoloText}</p>`;
                })
                .join('') // Junta os elementos <p> em uma string
              : '<p>Nenhum protocolo adicionado</p>'
            }
          </div>

          <div>
            <p><strong>Proprietários:</strong></p>
            ${pedido.proprietarios
              ? pedido.proprietarios
                .split('|') // Divide a string em um array usando o pipe como separador
                .filter(item => item.trim() !== '') // Remove itens vazios
                .map(p => `<p>${p.trim()}</p>`) // Cria um elemento <p> para cada proprietário
                .join('') // Junta os elementos <p> em uma string
              : '<p>Nenhum proprietário adicionado</p>'
            }
          </div>
        </div>
        <button class="excluir-button bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline mt-4" data-id="${pedido.id}">
          Excluir
        </button>
      `;
    pedidosResumo.prepend(pedidoDiv); // Insere o pedido no início da lista, para que os mais recentes fiquem no topo
  });
}

// Função para carregar os pedidos do servidor
function carregarPedidos() {
  console.log("Carregando pedidos..."); // Verifique se a função está sendo chamada
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/listar/_pedidos.php", true);
  xhr.onreadystatechange = function () {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      const pedidos = JSON.parse(this.responseText);
      renderPedidos(pedidos);
    }
  };
  xhr.send();
}

// Evento para excluir pedido (usando delegação de eventos)
document.getElementById('pedidosResumo').addEventListener('click', function (event) {
  if (event.target.classList.contains('excluir-button')) {
    const pedidoId = parseInt(event.target.getAttribute('data-id'));

    // Envia uma requisição para o servidor para excluir o pedido
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/excluir_pedido.php", true); // Rota para excluir pedido no servidor Node.js
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

// Abrir o modal
document.getElementById('openModal').addEventListener('click', function () {
  document.getElementById('modal').classList.remove('hidden');
});

// Fechar o modal
document.getElementById('closeModal').addEventListener('click', function () {
  console.log("Fechando o modal"); // Verifique se a função está sendo chamada
  document.getElementById('modal').classList.add('hidden');
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
    protocoloSpan.classList.add('text-white');
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

  // Declaração das variáveis FORA do loop forEach
  let editButton;
  let deleteButton;

  proprietariosArray.forEach((proprietarioTexto, index) => {
    const proprietarioSpan = document.createElement('span');
    proprietarioSpan.classList.add('text-white');
    proprietarioSpan.textContent = proprietarioTexto;

    // Botão Editar
    editButton = document.createElement('button'); // Agora acessível fora do loop
    editButton.classList.add('edit-button', 'bg-yellow-500', 'hover:bg-yellow-700', 'text-white', 'font-bold', 'py-1', 'px-2', 'rounded', 'ml-2', 'text-xs');
    editButton.textContent = 'Editar';
    editButton.dataset.index = index; // Armazena o índice do proprietário

    // Botão Excluir
    deleteButton = document.createElement('button'); // Agora acessível fora do loop
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
    button.removeEventListener('click', handleEditButtonClick); // Remove event listener anterior, se houver
    button.addEventListener('click', handleEditButtonClick);
  });

  const deleteButtons = document.querySelectorAll('.delete-button');
  deleteButtons.forEach(button => {
    button.removeEventListener('click', handleDeleteButtonClick); // Remove event listener anterior, se houver
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
  // Clona o array de pedidos e ajusta o formato
  const pedidosFormatados = pedidos.map(pedido => ({
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

document.getElementById('uploadPedidos').addEventListener('change', function (event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result); // Tenta fazer o parse do JSON

        if (Array.isArray(data)) {
          // Para cada pedido no JSON, adicione ao array de pedidos
          data.forEach(pedido => {
            pedidos.push({
              id: Date.now() + pedidos.length, // Gera IDs sequenciais e únicos
              pedido: pedido.pedido,
              data: pedido.data,
              matricula: pedido.matricula,
              onus: pedido.onus,              
              folhas: pedido.folhas,
              imagens: pedido.imagens,
              tipoCertidao: pedido.tipoCertidao,
              codigoArirj: pedido.codigoArirj,
              codigoEcartorio: pedido.codigoEcartorio,
              protocolos: pedido.protocolos.join('|'), // Junta os protocolos em uma string separada por pipe
              proprietarios: pedido.proprietarios.join('|') // Junta os proprietários em uma string separada por pipe
            });
          });

          renderPedidos(pedidos);
          alert('Pedidos carregados com sucesso!');
        } else {
          alert('Arquivo inválido. O conteúdo deve ser um array JSON.');
        }
      } catch (error) {
        alert('Erro ao processar o arquivo. Certifique-se de que o conteúdo é JSON válido.');
      }
    };

    reader.readAsText(file); // Lê o arquivo como texto
  }
});

// Carrega os pedidos quando a página é carregada
carregarPedidos();
