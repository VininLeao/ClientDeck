// Templates pré-definidos
const defaultTemplates = {
    'onboarding-amazon': {
        name: 'Onboarding Amazon',
        items: [
            { id: 'conta-amazon', text: 'Abriu conta Amazon?', type: 'checkbox', isRequired: true },
            { id: 'pagamento', text: 'Método de pagamento confirmado?', type: 'checkbox', isRequired: true },
            { id: 'produtos', text: 'Subiu produtos?', type: 'checkbox', isRequired: false },
            { id: 'quantidade-produtos', text: 'Quantos produtos?', type: 'number', isRequired: false },
            { id: 'observacoes', text: 'Observações', type: 'observacoes', isRequired: false }
        ],
        isDefault: true
    }
};

// Dados globais
let clients = [];
let templates = {};
let currentClientId = null;
let selectedTemplateId = null;
let editingTemplateId = null;
let currentFilter = 'all';
let tableVisible = false;
let expandedClientIds = new Set();
let currentEditingRow = null;
let templateSortable = null;
let originalFieldState = null; // Para armazenar estado original na edição

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderClients();
    renderTableView();
    updateStats();
    renderTemplateFilters();
    setupDragAndDrop();
    setupSearch();
    setupKeyboardShortcuts();
    setupDropdowns();
});

// Configurar dropdowns
function setupDropdowns() {
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
            document.querySelectorAll('.dropdown-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
    });
}

// Alternar dropdown
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    const btn = document.getElementById(id + 'Btn');
    const isOpen = dropdown.classList.contains('show');
    
    // Fechar todos os dropdowns
    document.querySelectorAll('.dropdown-content').forEach(dd => dd.classList.remove('show'));
    document.querySelectorAll('.dropdown-btn').forEach(b => b.classList.remove('active'));
    
    if (!isOpen) {
        dropdown.classList.add('show');
        btn.classList.add('active');
    }
}

// Fechar dropdown
        function closeDropdown(id) {
    const dropdown = document.getElementById(id);
    const btn = document.getElementById(id + 'Btn');
    dropdown.classList.remove('show');
    btn.classList.remove('active');
}

// Alternar abas
function switchTab(tabName) {
    // Remover classe ativa de todos os botões e conteúdos
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Ativar aba selecionada
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    // Controlar visibilidade do botão "Fechar" no rodapé
    const modalActions = document.getElementById('templateModalActions');
    if (tabName === 'templateEditor') {
        modalActions.style.display = 'none';
        // Inicializar sortable para novos templates se não estiver editando
        if (!editingTemplateId) {
            initTemplateSortable();
        }
    } else {
        modalActions.style.display = 'flex';
        loadExistingTemplates();
    }
}

// Configurar atalhos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            openNewClientModal();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            if (currentEditingRow) {
                cancelInlineEdit();
            }
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
        if (e.key === 'Enter' && e.ctrlKey) {
            const activeModal = Array.from(document.querySelectorAll('.modal')).find(modal => 
                modal.style.display === 'block'
            );
            if (activeModal) {
                const submitBtn = activeModal.querySelector('button[type="submit"], .btn:not(.btn-secondary):not(.btn-danger):not(.btn-ghost)');
                if (submitBtn) {
                    submitBtn.click();
                }
            }
        }
    });
}

// Alternar visibilidade da tabela
function toggleTableView() {
    const tableView = document.getElementById('tableView');
    const toggleBtn = document.getElementById('tableToggleBtn');

    tableVisible = !tableVisible;
    
    if (tableVisible) {
        tableView.classList.remove('hidden');
        toggleBtn.innerHTML = '<span>📋</span> Ocultar Planilha';
    } else {
        tableView.classList.add('hidden');
        toggleBtn.innerHTML = '<span>📊</span> Mostrar Planilha';
    }
}

// Renderizar filtros de template
function renderTemplateFilters() {
    const dropdown = document.getElementById('templateFilter');
    
    while (dropdown.children.length > 1) {
        dropdown.removeChild(dropdown.lastChild);
    }

    Object.keys(templates).forEach(templateId => {
        const template = templates[templateId];
        const option = document.createElement('option');
        option.value = templateId;
        option.textContent = template.name;
        if (templateId === currentFilter) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });

    dropdown.value = currentFilter;
}

// Filtrar por template
function filterByTemplate(templateId) {
    currentFilter = templateId;
    renderClients();
    renderTableView();
    updateStats();
}

// Validar campos obrigatórios
function validateRequiredFields(client) {
    const template = templates[client.template];
    if (!template) return { valid: true, missing: [] };

    const missing = [];
    
    template.items.forEach(item => {
        if (item.isRequired) {
            const response = client.responses[item.id];
            
            if (item.type === 'checkbox') {
                if (!response) missing.push(item.text);
            } else {
                if (!response || response.toString().trim() === '') {
                    missing.push(item.text);
                }
            }
        }
    });

    return {
        valid: missing.length === 0,
        missing: missing
    };
}

// Função para lidar com mudança de tipo no template
function handleTypeChange(selectElement) {
    const questionBlock = selectElement.closest('.template-question-block');
    const textInput = questionBlock.querySelector('input[type="text"]');
    const existingOptionsInput = questionBlock.querySelector('.options-input');
    
    if (existingOptionsInput) {
        existingOptionsInput.remove();
    }

    if (selectElement.value === 'observacoes') {
        textInput.value = 'Observações';
        textInput.disabled = true;
    } else {
        textInput.disabled = false;
        if (textInput.value === 'Observações') {
            textInput.value = '';
        }
    }

    if (selectElement.value === 'select') {
        const optionsInput = document.createElement('input');
        optionsInput.type = 'text';
        optionsInput.className = 'options-input';
        optionsInput.placeholder = 'Digite as opções separadas por vírgula (ex: Opção A, Opção B, Opção C)';
        
        const templateItem = selectElement.closest('.template-item');
        questionBlock.insertBefore(optionsInput, questionBlock.querySelector('.template-item-controls'));
    }
}

// Função para expandir/recolher detalhes do cliente na tabela
function toggleClientDetails(clientId, event) {
    if (event && event.target.classList.contains('expand-btn')) {
        return;
    }
    
    const detailRows = document.querySelectorAll(`[data-parent="${clientId}"]`);
    const expandBtn = document.querySelector(`[data-client-id="${clientId}"] .expand-btn`);
    const isExpanded = expandBtn.classList.contains('expanded');
    
    detailRows.forEach(row => {
        if (isExpanded) {
            row.classList.remove('expanded');
        } else {
            row.classList.add('expanded');
        }
    });
    
    if (isExpanded) {
        expandBtn.classList.remove('expanded');
        expandBtn.textContent = '+';
        expandedClientIds.delete(clientId);
    } else {
        expandBtn.classList.add('expanded');
        expandBtn.textContent = '−';
        expandedClientIds.add(clientId);
    }
}

// Função para formatar datas no padrão brasileiro
function formatDateBR(dateString) {
    if (!dateString || !dateString.includes('-')) return 'Não preenchido';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Nova função de edição inline corrigida
function enableInlineEdit(element, clientId, itemId, itemType) {
    if (currentEditingRow && currentEditingRow !== element) {
        cancelInlineEdit();
    }

    if (currentEditingRow === element) {
        return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    currentEditingRow = element;
    const originalLastEditedDiv = element.querySelector('.last-edited[data-original="true"]');
    
    // Salvar estado original para cancelamento
    originalFieldState = {
        answerHtml: element.querySelector('.checklist-answer').innerHTML,
        lastEditedHtml: originalLastEditedDiv ? originalLastEditedDiv.outerHTML : null,
        detailRowClasses: element.closest('.detail-row').className
    };

    const detailRow = element.closest('.detail-row');
    detailRow.classList.add('editing');

    const currentValue = client.responses[itemId] || '';
    const questionDiv = element.querySelector('.checklist-question');
    const answerDiv = element.querySelector('.checklist-answer');
    
    answerDiv.style.display = 'none';
    if (originalLastEditedDiv) {
        originalLastEditedDiv.style.display = 'none';
    }
    
    if (!questionDiv.querySelector('.editing-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'editing-indicator';
        indicator.textContent = '(editando...)';
        questionDiv.appendChild(indicator);
    }
    
    let input;
    
    if (itemType === 'checkbox') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = currentValue;
        input.className = 'inline-edit-checkbox';
    } else if (itemType === 'select') {
        const template = templates[client.template];
        const item = template.items.find(i => i.id === itemId);
        
        input = document.createElement('select');
        input.className = 'inline-edit-select';
        
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Selecione...';
        input.appendChild(emptyOption);
        
        if (item.options) {
            item.options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                if (option === currentValue) opt.selected = true;
                input.appendChild(opt);
            });
        }
    } else if (itemType === 'observacoes') {
        input = document.createElement('textarea');
        input.value = currentValue;
        input.className = 'inline-edit';
        input.placeholder = 'Digite suas observações...';
        input.style.minHeight = '80px';
        input.style.width = '100%';
        input.style.maxWidth = '400px';
    } else {
        input = document.createElement('input');
        input.type = itemType === 'textarea' ? 'text' : itemType;
        input.value = currentValue;
        input.className = 'inline-edit';
        input.placeholder = 'Digite aqui...';
    }

    const saveEdit = () => {
        let newValue;
        if (itemType === 'checkbox') {
            newValue = input.checked;
        } else {
            newValue = input.value;
        }
        
        client.responses[itemId] = newValue;
        
        if (itemType === 'observacoes' && newValue && newValue.toString().trim() !== '') {
            client.observationLastEdited = new Date().toISOString();
        }
        
        updateStatusByProgress(client);
        
        saveData();
        renderClients();
        renderTableViewPreservingState();
        updateStats();
        
        currentEditingRow = null;
        originalFieldState = null;
    };

    const cancelEdit = () => {
        cancelInlineEdit();
    };

    // Criar container com botões de ação
    const container = document.createElement('div');
    container.className = 'inline-edit-container';
    
    container.appendChild(input);
    
    if (itemType !== 'checkbox') {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-mini btn-save';
        saveBtn.innerHTML = '✔️';
        saveBtn.onclick = (e) => {
            e.stopPropagation();
            saveEdit();
        };
        saveBtn.title = 'Salvar';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-mini btn-ghost';
        cancelBtn.innerHTML = '❌';
        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            cancelEdit();
        };
        cancelBtn.title = 'Cancelar';
        
        container.appendChild(saveBtn);
        container.appendChild(cancelBtn);
    }

    // Para campos de observações, preservar informação de última edição
    if (itemType === 'observacoes' && client.observationLastEdited) {
         const editedInfo = document.createElement('div');
         editedInfo.className = 'last-edited editing-last-edited';
         editedInfo.textContent = `Última edição: ${formatDateTime(client.observationLastEdited)}`;
         container.appendChild(editedInfo);
    }

    input.onblur = () => {
        if (itemType === 'checkbox') {
            saveEdit();
        }
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter' && itemType !== 'observacoes') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    };

    element.appendChild(container);
    input.focus();
}

// Cancelar edição inline corrigida
function cancelInlineEdit() {
    if (!currentEditingRow || !originalFieldState) return;

    const detailRow = currentEditingRow.closest('.detail-row');
    const questionDiv = currentEditingRow.querySelector('.checklist-question');
    const answerDiv = currentEditingRow.querySelector('.checklist-answer');
    const container = currentEditingRow.querySelector('.inline-edit-container');
    const editingIndicator = questionDiv.querySelector('.editing-indicator');
    const originalLastEditedDiv = currentEditingRow.querySelector('.last-edited[data-original="true"]');

    // Restaurar estado original
    detailRow.className = originalFieldState.detailRowClasses;
    answerDiv.innerHTML = originalFieldState.answerHtml;
    answerDiv.style.display = 'block';

    if (originalLastEditedDiv) {
        originalLastEditedDiv.style.display = '';
    }

    // Remover elementos de edição
    if (editingIndicator) {
        editingIndicator.remove();
    }

    if (container) {
        container.remove();
    }
    
    currentEditingRow = null;
    originalFieldState = null;
}

// Nova função para renderizar a tabela preservando o estado de expansão
function renderTableViewPreservingState() {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = '';

    const filteredClients = currentFilter === 'all' 
        ? clients 
        : clients.filter(c => c.template === currentFilter);

    filteredClients.forEach(client => {
        const template = templates[client.template];
        if (!template) return;

        const progress = calculateProgress(client);
        
        const clientRow = document.createElement('tr');
        clientRow.className = 'client-row';
        clientRow.dataset.clientId = client.id;
        clientRow.setAttribute('data-client-id', client.id);
        clientRow.onclick = (e) => toggleClientDetails(client.id, e);

        const statusLabels = {
            'todo': 'A Fazer',
            'progress': 'Em Andamento',
            'done': 'Concluído'
        };

        const isExpanded = expandedClientIds.has(client.id);
        const expandIcon = isExpanded ? '−' : '+';

        clientRow.innerHTML = `
            <td>
                <button class="expand-btn ${isExpanded ? 'expanded' : ''}">${expandIcon}</button>
            </td>
            <td>${client.name}</td>
            <td>${template.name}</td>
            <td><span class="status-badge status-${client.status}">${statusLabels[client.status]}</span></td>
            <td>
                <div class="progress-cell">
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${progress}%"></div>
                    </div>
                    <span>${progress}%</span>
                </div>
            </td>
            <td>${formatDate(client.createdAt)}</td>
            <td>${formatDate(client.completedAt)}</td>
        `;

        tbody.appendChild(clientRow);

        template.items.forEach(item => {
            const detailRow = document.createElement('tr');
            detailRow.className = `detail-row ${isExpanded ? 'expanded' : ''}`;
            detailRow.dataset.parent = client.id;

            let answerContent = '';
            let answerClass = '';
            const response = client.responses[item.id];

            if (item.type === 'checkbox') {
                if (response === true) {
                    answerContent = '✅ Sim';
                    answerClass = 'completed';
                } else {
                    answerContent = '❌ Não';
                    answerClass = 'incomplete';
                }
            } else if (item.type === 'date' && response) {
                answerContent = formatDateBR(response);
                answerClass = 'completed';
            } else {
                answerContent = response || 'Não preenchido';
                answerClass = response ? 'completed' : 'incomplete';
            }

            // Criar conteúdo especial para campo de observações
            let detailContent = '';
            if (item.type === 'observacoes') {
                const lastEdited = client.observationLastEdited 
                    ? formatDateTime(client.observationLastEdited)
                    : null;
                
                detailContent = `
                    <div class="detail-content">
                        <div>
                            <div class="checklist-question">${item.text}${item.isRequired ? ' *' : ''}</div>
                        </div>
                        <div>
                            <div class="checklist-answer ${answerClass}">${answerContent}</div>
                            ${lastEdited ? `<div class="last-edited" data-original="true">Última edição: ${lastEdited}</div>` : ''}
                        </div>
                    </div>
                `;
            } else {
                detailContent = `
                    <div class="detail-content">
                        <div>
                            <div class="checklist-question">${item.text}${item.isRequired ? ' *' : ''}</div>
                        </div>
                        <div>
                            <div class="checklist-answer ${answerClass}">${answerContent}</div>
                        </div>
                    </div>
                `;
            }

            detailRow.innerHTML = `
                <td colspan="7" onclick="enableInlineEdit(this, ${client.id}, '${item.id}', '${item.type}')">
                    ${detailContent}
                </td>
            `;

            tbody.appendChild(detailRow);
        });
    });
}

// Renderizar visão de tabela
function renderTableView() {
    renderTableViewPreservingState();
}

// Carregar dados do localStorage
function loadData() {
    const storedClients = localStorage.getItem('clientdeck-clients');
    const storedTemplates = localStorage.getItem('clientdeck-templates');
    
    if (storedClients) {
        clients = JSON.parse(storedClients);
        clients.forEach(client => {
            if (!client.completedAt) client.completedAt = null;
            if (!client.observationLastEdited) client.observationLastEdited = null;
        });
    }
    
    if (storedTemplates) {
        templates = JSON.parse(storedTemplates);
        Object.keys(templates).forEach(templateId => {
            const template = templates[templateId];
            template.items.forEach(item => {
                if (item.isRequired === undefined) {
                    item.isRequired = false;
                }
            });
        });
    } else {
        templates = { ...defaultTemplates };
        saveTemplates();
    }
}

// Salvar dados
function saveData() {
    localStorage.setItem('clientdeck-clients', JSON.stringify(clients));
}

function saveTemplates() {
    localStorage.setItem('clientdeck-templates', JSON.stringify(templates));
}

// Configurar busca
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.querySelector('.clear-search');

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        clearButton.style.display = query ? 'block' : 'none';
        filterClients(query);
    });
}

// Filtrar clientes
function filterClients(query) {
    const cards = document.querySelectorAll('.card');
    const rows = document.querySelectorAll('#clientsTableBody tr.client-row');
    
    cards.forEach(card => {
        const clientName = card.querySelector('h3').textContent.toLowerCase();
        const templateName = card.querySelector('.template-name').textContent.toLowerCase();
        const matches = clientName.includes(query) || templateName.includes(query);
        card.style.display = matches ? 'block' : 'none';
    });

    rows.forEach(row => {
        const clientName = row.cells[1].textContent.toLowerCase();
        const templateName = row.cells[2].textContent.toLowerCase();
        const matches = clientName.includes(query) || templateName.includes(query);
        const clientId = row.dataset.clientId;
        
        row.style.display = matches ? '' : 'none';
        
        const detailRows = document.querySelectorAll(`[data-parent="${clientId}"]`);
        detailRows.forEach(detailRow => {
            detailRow.style.display = matches ? '' : 'none';
        });
    });
}

// Limpar busca
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.querySelector('.clear-search').style.display = 'none';
    filterClients('');
}

// Mostrar toast
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${isError ? 'error' : ''} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Formatar data para exibição
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
    });
}

// Formatar data e hora para exibição
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Abrir modal de novo cliente
function openNewClientModal() {
    document.getElementById('newClientModal').style.display = 'block';
    loadTemplatesForSelection();
    setTimeout(() => {
        document.getElementById('clientName').focus();
    }, 100);
}

// Carregar templates para seleção
function loadTemplatesForSelection() {
    const container = document.getElementById('templatesList');
    container.innerHTML = '';

    Object.keys(templates).forEach(key => {
        const template = templates[key];
        const div = document.createElement('div');
        div.className = 'template-card';
        div.onclick = () => selectTemplate(key, div);
        
        div.innerHTML = `
            <h4>${template.name}</h4>
            <p>${template.items.length} pergunta${template.items.length !== 1 ? 's' : ''}</p>
        `;
        
        container.appendChild(div);
    });
}

// Selecionar template
function selectTemplate(templateId, element) {
    document.querySelectorAll('#templatesList .template-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    element.classList.add('selected');
    selectedTemplateId = templateId;
}

// Fechar modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    selectedTemplateId = null;
    editingTemplateId = null;
}

// Criar novo cliente
document.getElementById('newClientForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('clientName').value.trim();
    
    if (!name || !selectedTemplateId) {
        showToast('❌ Preencha o nome e selecione um template', true);
        return;
    }

    const client = {
        id: Date.now(),
        name: name,
        template: selectedTemplateId,
        status: 'todo',
        responses: {},
        createdAt: new Date().toISOString(),
        completedAt: null,
        observationLastEdited: null
    };

    clients.push(client);
    saveData();
    renderClients();
    renderTableViewPreservingState();
    updateStats();
    renderTemplateFilters();
    
    document.getElementById('newClientForm').reset();
    closeModal('newClientModal');
    showToast('✅ Cliente criado com sucesso!');
});

// Renderizar clientes com mensagens de estado vazio
function renderClients() {
    ['todo', 'progress', 'done'].forEach(status => {
        const column = document.getElementById(status);
        const cards = column.querySelectorAll('.card, .empty-state');
        cards.forEach(card => card.remove());
    });

    const filteredClients = currentFilter === 'all' 
        ? clients 
        : clients.filter(c => c.template === currentFilter);

    // Agrupar clientes por status
    const clientsByStatus = {
        todo: filteredClients.filter(c => c.status === 'todo'),
        progress: filteredClients.filter(c => c.status === 'progress'),
        done: filteredClients.filter(c => c.status === 'done')
    };

    // Renderizar clientes ou mensagem de estado vazio
    ['todo', 'progress', 'done'].forEach(status => {
        const column = document.getElementById(status);
        const statusClients = clientsByStatus[status];
        
        if (statusClients.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'Nenhum cliente aqui.';
            column.appendChild(emptyState);
        } else {
            statusClients.forEach(client => {
                const card = createCardElement(client);
                column.appendChild(card);
            });
        }
    });
}

// Criar elemento de card
function createCardElement(client) {
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.clientId = client.id;

    const template = templates[client.template];
    if (!template) {
        console.warn(`Template ${client.template} não encontrado`);
        return card;
    }

    const progress = calculateProgress(client);
    const createdDate = formatDate(client.createdAt);
    const completedDate = formatDate(client.completedAt);

    card.innerHTML = `
        <h3>${client.name}</h3>
        <div class="template-name">${template.name}</div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-text">${progress}% completo</div>
        <div class="card-meta">
            <span>📝 ${template.items.length} itens</span>
        </div>
        <div class="dates-info">
            <div>📅 Início: ${createdDate}</div>
            ${client.completedAt ? `<div>✅ Fim: ${completedDate}</div>` : ''}
        </div>
    `;

    card.addEventListener('click', () => openChecklistModal(client.id));
    
    return card;
}

// Calcular progresso corrigido - baseado apenas em campos obrigatórios
function calculateProgress(client) {
    const template = templates[client.template];
    if (!template) return 0;
    
    const requiredItems = template.items.filter(item => item.isRequired);
    
    // Se não há campos obrigatórios, progresso é 100%
    if (requiredItems.length === 0) return 100;
    
    const completedItems = requiredItems.filter(item => {
        const response = client.responses[item.id];
        
        if (item.type === 'checkbox') {
            return response === true;
        } else {
            return response && response.toString().trim() !== '';
        }
    });
    
    return Math.round((completedItems.length / requiredItems.length) * 100);
}

// Função para atualizar status automaticamente baseado no progresso
function updateStatusByProgress(client) {
    const progress = calculateProgress(client);
    let newStatus = client.status;
    
    if (progress === 100) {
        newStatus = 'done';
        if (!client.completedAt) {
            client.completedAt = new Date().toISOString();
        }
    } else if (progress > 0) {
        newStatus = 'progress';
        client.completedAt = null;
    } else {
        newStatus = 'todo';
        client.completedAt = null;
    }

    if (client.status !== newStatus) {
        const statusNames = {
            'todo': 'A Fazer',
            'progress': 'Em Andamento',
            'done': 'Concluído'
        };
        
        client.status = newStatus;
        showToast(`🔄 ${client.name} movido automaticamente para "${statusNames[newStatus]}"`);
        return true;
    }
    
    return false;
}

// Criar input baseado no tipo
function createInputByType(item, value = '') {
    let input = '';
    
    switch (item.type) {
        case 'checkbox':
            input = `<input type="checkbox" id="${item.id}" ${value ? 'checked' : ''} onchange="updateResponse('${item.id}', this.checked)">`;
            break;
        case 'textarea':
            input = `<textarea id="${item.id}" placeholder="Digite aqui..." onchange="updateResponse('${item.id}', this.value)">${value}</textarea>`;
            break;
        case 'observacoes':
            input = `<textarea id="${item.id}" placeholder="Digite suas observações..." onchange="updateResponse('${item.id}', this.value)">${value}</textarea>`;
            break;
        case 'date':
            input = `<input type="date" id="${item.id}" value="${value}" onchange="updateResponse('${item.id}', this.value)">`;
            break;
        case 'number':
            input = `<input type="number" id="${item.id}" placeholder="Digite um número..." value="${value}" onchange="updateResponse('${item.id}', this.value)">`;
            break;
        case 'url':
            input = `<input type="url" id="${item.id}" placeholder="Digite uma URL..." value="${value}" onchange="updateResponse('${item.id}', this.value)">`;
            break;
        case 'select':
            let options = '<option value="">Selecione...</option>';
            if (item.options) {
                item.options.forEach(option => {
                    const selected = option === value ? 'selected' : '';
                    options += `<option value="${option}" ${selected}>${option}</option>`;
                });
            }
            input = `<select id="${item.id}" onchange="updateResponse('${item.id}', this.value)">${options}</select>`;
            break;
        default:
            input = `<input type="text" id="${item.id}" placeholder="Digite aqui..." value="${value}" onchange="updateResponse('${item.id}', this.value)">`;
    }
    
    return input;
}

// Abrir modal de checklist
function openChecklistModal(clientId) {
    currentClientId = clientId;
    const client = clients.find(c => c.id === clientId);
    const template = templates[client.template];

    if (!template) {
        showToast('❌ Template não encontrado', true);
        return;
    }

    document.getElementById('checklistTitle').textContent = `${client.name} - ${template.name}`;
    
    const content = document.getElementById('checklistContent');
    content.innerHTML = '';

    template.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'checklist-item';

        const value = client.responses[item.id] || '';
        const input = createInputByType(item, value);
        const requiredLabel = item.isRequired ? ' <span style="color: #f85149;">*</span>' : '';

        // Adicionar informação de última edição para campo de observações
        let lastEditedInfo = '';
        if (item.type === 'observacoes' && client.observationLastEdited) {
            lastEditedInfo = `<div class="last-edited">Última edição: ${formatDateTime(client.observationLastEdited)}</div>`;
        }

        div.innerHTML = `
            <label>
                ${item.type === 'checkbox' ? input : ''}
                ${item.text}${requiredLabel}
            </label>
            ${item.type !== 'checkbox' ? input : ''}
            ${lastEditedInfo}
        `;

        content.appendChild(div);
    });

    document.getElementById('checklistModal').style.display = 'block';
}

// Atualizar resposta
function updateResponse(itemId, value) {
    const client = clients.find(c => c.id === currentClientId);
    if (client) {
        client.responses[itemId] = value;
        
        const template = templates[client.template];
        const item = template.items.find(i => i.id === itemId);
        
        if (item && item.type === 'observacoes' && value && value.toString().trim() !== '') {
            client.observationLastEdited = new Date().toISOString();
        }
        
        updateStatusByProgress(client);
        
        saveData();
        renderClients();
        renderTableViewPreservingState();
        updateStats();
    }
}

// Duplicar cliente
function duplicateClient() {
    const client = clients.find(c => c.id === currentClientId);
    if (client) {
        const newClient = {
            ...client,
            id: Date.now(),
            name: client.name + ' (Cópia)',
            status: 'todo',
            responses: {},
            createdAt: new Date().toISOString(),
            completedAt: null,
            observationLastEdited: null
        };
        
        clients.push(newClient);
        saveData();
        renderClients();
        renderTableViewPreservingState();
        updateStats();
        renderTemplateFilters();
        closeModal('checklistModal');
        showToast('✅ Cliente duplicado com sucesso!');
    }
}

// Excluir cliente
function deleteClient() {
    if (confirm('❌ Tem certeza que deseja excluir este cliente?')) {
        clients = clients.filter(c => c.id !== currentClientId);
        saveData();
        renderClients();
        renderTableViewPreservingState();
        updateStats();
        renderTemplateFilters();
        closeModal('checklistModal');
        showToast('✅ Cliente excluído com sucesso!');
    }
}

// Abrir modal de templates
function openTemplateModal() {
    document.getElementById('templateModal').style.display = 'block';
    switchTab('myTemplates');
}

// Carregar templates existentes
function loadExistingTemplates() {
    const container = document.getElementById('existingTemplates');
    container.innerHTML = '';

    Object.keys(templates).forEach(key => {
        const template = templates[key];
        const div = document.createElement('div');
        div.className = 'template-card';
        
        div.innerHTML = `
            <h4>${template.name}</h4>
            <p>${template.items.length} pergunta${template.items.length !== 1 ? 's' : ''}</p>
            <div class="template-actions">
                <button class="btn btn-secondary btn-small" onclick="editTemplate('${key}')">
                    ✏️ Editar
                </button>
                ${!template.isDefault ? `
                    <button class="btn btn-ghost-danger btn-small" onclick="deleteTemplate('${key}')">
                        🗑️ Excluir
                    </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(div);
    });
}

// Editar template
function editTemplate(templateId) {
    editingTemplateId = templateId;
    const template = templates[templateId];
    
    document.getElementById('editorTitle').textContent = '✏️ Editar Template';
    document.getElementById('templateName').value = template.name;
    
    const container = document.getElementById('templateItems');
    container.innerHTML = '';
    
    template.items.forEach((item, index) => {
        const questionBlock = document.createElement('div');
        questionBlock.className = 'template-question-block';
        
        const optionsInput = item.type === 'select' && item.options ? 
            `<input type="text" class="options-input" value="${item.options.join(', ')}" placeholder="Digite as opções separadas por vírgula">` : '';
        
        const isDisabled = item.type === 'observacoes' ? 'disabled' : '';
        
        questionBlock.innerHTML = `
            <button type="button" class="template-remove-btn" onclick="removeTemplateItem(this)">🗑️</button>
            <div class="template-item">
                <input type="text" value="${item.text}" ${isDisabled} required>
                <select onchange="handleTypeChange(this)">
                    <option value="checkbox" ${item.type === 'checkbox' ? 'selected' : ''}>Sim/Não</option>
                    <option value="text" ${item.type === 'text' ? 'selected' : ''}>Texto</option>
                    <option value="textarea" ${item.type === 'textarea' ? 'selected' : ''}>Texto Longo</option>
                    <option value="date" ${item.type === 'date' ? 'selected' : ''}>Data</option>
                    <option value="number" ${item.type === 'number' ? 'selected' : ''}>Número</option>
                    <option value="url" ${item.type === 'url' ? 'selected' : ''}>Link</option>
                    <option value="select" ${item.type === 'select' ? 'selected' : ''}>Lista de Opções</option>
                    <option value="observacoes" ${item.type === 'observacoes' ? 'selected' : ''}>Campo de Observações</option>
                </select>
            </div>
            ${optionsInput}
            <div class="template-item-controls">
                <div class="required-checkbox">
                    <input type="checkbox" id="req-edit-${index}" ${item.isRequired ? 'checked' : ''}>
                    <label for="req-edit-${index}">Obrigatório</label>
                </div>
                <div class="drag-handle">⠿</div>
            </div>
        `;
        
        container.appendChild(questionBlock);
    });
    
    // Inicializar drag and drop para reordenação
    initTemplateSortable();
    
    switchTab('templateEditor');
}

// Inicializar SortableJS para reordenação de templates
function initTemplateSortable() {
    if (templateSortable) {
        templateSortable.destroy();
    }
    
    const container = document.getElementById('templateItems');
    templateSortable = new Sortable(container, {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function (evt) {
            // Para novos templates, apenas salvar quando o template for salvo
            if (editingTemplateId && templates[editingTemplateId]) {
                const template = templates[editingTemplateId];
                const movedItem = template.items.splice(evt.oldIndex, 1)[0];
                template.items.splice(evt.newIndex, 0, movedItem);
                saveTemplates();
                showToast('✅ Ordem das perguntas atualizada!');
            }
        }
    });
}

// Cancelar edição de template
function cancelTemplateEdit() {
    editingTemplateId = null;
    document.getElementById('editorTitle').textContent = '➕ Criar Novo Template';
    document.getElementById('templateName').value = '';
    resetTemplateItems();
    if (templateSortable) {
        templateSortable.destroy();
        templateSortable = null;
    }
    switchTab('myTemplates');
}

// Reset template items
function resetTemplateItems() {
    document.getElementById('templateItems').innerHTML = `
        <div class="template-question-block">
            <button type="button" class="template-remove-btn" onclick="removeTemplateItem(this)">🗑️</button>
            <div class="template-item">
                <input type="text" placeholder="Digite uma pergunta..." required>
                <select onchange="handleTypeChange(this)">
                    <option value="checkbox">Sim/Não</option>
                    <option value="text">Texto</option>
                    <option value="textarea">Texto Longo</option>
                    <option value="date">Data</option>
                    <option value="number">Número</option>
                    <option value="url">Link</option>
                    <option value="select">Lista de Opções</option>
                    <option value="observacoes">Campo de Observações</option>
                </select>
            </div>
            <div class="template-item-controls">
                <div class="required-checkbox">
                    <input type="checkbox" id="req-new-0">
                    <label for="req-new-0">Obrigatório</label>
                </div>
                <div class="drag-handle">⠿</div>
            </div>
        </div>
    `;
    
    // Inicializar sortable para novos templates também
    setTimeout(() => {
        initTemplateSortable();
    }, 100);
}

// Adicionar item ao template
function addTemplateItem() {
    const container = document.getElementById('templateItems');
    const itemCount = container.children.length;
    const questionBlock = document.createElement('div');
    questionBlock.className = 'template-question-block';
    
    questionBlock.innerHTML = `
        <button type="button" class="template-remove-btn" onclick="removeTemplateItem(this)">🗑️</button>
        <div class="template-item">
            <input type="text" placeholder="Digite uma pergunta..." required>
            <select onchange="handleTypeChange(this)">
                <option value="checkbox">Sim/Não</option>
                <option value="text">Texto</option>
                <option value="textarea">Texto Longo</option>
                <option value="date">Data</option>
                <option value="number">Número</option>
                <option value="url">Link</option>
                <option value="select">Lista de Opções</option>
                <option value="observacoes">Campo de Observações</option>
            </select>
        </div>
        <div class="template-item-controls">
            <div class="required-checkbox">
                <input type="checkbox" id="req-new-${itemCount}">
                <label for="req-new-${itemCount}">Obrigatório</label>
            </div>
            <div class="drag-handle">⠿</div>
        </div>
    `;
    
    container.appendChild(questionBlock);
    
    // Reinicializar sortable
    initTemplateSortable();
}

// Remover item do template
function removeTemplateItem(button) {
    const container = button.closest('#templateItems');
    if (container.children.length > 1) {
        button.closest('.template-question-block').remove();
        
        // Reinicializar sortable
        initTemplateSortable();
    } else {
        showToast('❌ Deve haver pelo menos uma pergunta no template', true);
    }
}

// Salvar template
function saveTemplate() {
    const name = document.getElementById('templateName').value.trim();
    const items = [];
    
    document.querySelectorAll('#templateItems .template-question-block').forEach((block, index) => {
        const text = block.querySelector('input[type="text"]').value.trim();
        const type = block.querySelector('select').value;
        const isRequired = block.querySelector('input[type="checkbox"]').checked;
        const optionsInput = block.querySelector('.options-input');
        
        if (text) {
            const itemData = {
                id: type === 'observacoes' ? 'system_notes_timestamp' : `item-${Date.now()}-${index}`,
                text: text,
                type: type,
                isRequired: isRequired
            };
            
            if (type === 'select' && optionsInput && optionsInput.value) {
                itemData.options = optionsInput.value.split(',').map(opt => opt.trim()).filter(opt => opt);
            }
            
            items.push(itemData);
        }
    });

    if (!name || items.length === 0) {
        showToast('❌ Preencha o nome e adicione pelo menos uma pergunta', true);
        return;
    }

    if (editingTemplateId) {
        const currentTemplate = templates[editingTemplateId];
        templates[editingTemplateId] = {
            name: name,
            items: items,
            isDefault: currentTemplate?.isDefault || false
        };
        showToast('✅ Template atualizado com sucesso!');
    } else {
        const templateId = `custom-${Date.now()}`;
        templates[templateId] = {
            name: name,
            items: items,
            isDefault: false
        };
        showToast('✅ Template criado com sucesso!');
    }

    saveTemplates();
    loadExistingTemplates();
    renderTemplateFilters();
    
    editingTemplateId = null;
    document.getElementById('editorTitle').textContent = '➕ Criar Novo Template';
    document.getElementById('templateName').value = '';
    resetTemplateItems();
    if (templateSortable) {
        templateSortable.destroy();
        templateSortable = null;
    }
    switchTab('myTemplates');
}

// Excluir template
function deleteTemplate(templateId) {
    if (confirm('❌ Tem certeza que deseja excluir este template?')) {
        const clientsUsingTemplate = clients.filter(c => c.template === templateId);
        
        if (clientsUsingTemplate.length > 0) {
            showToast(`❌ Não é possível excluir. ${clientsUsingTemplate.length} cliente(s) usando este template.`, true);
            return;
        }
        
        delete templates[templateId];
        saveTemplates();
        loadExistingTemplates();
        renderTemplateFilters();
        showToast('✅ Template excluído com sucesso!');
    }
}

// Atualizar estatísticas
function updateStats() {
    const filteredClients = currentFilter === 'all' 
        ? clients 
        : clients.filter(c => c.template === currentFilter);
        
    const todoCount = filteredClients.filter(c => c.status === 'todo').length;
    const progressCount = filteredClients.filter(c => c.status === 'progress').length;
    const doneCount = filteredClients.filter(c => c.status === 'done').length;

    document.getElementById('todoCount').textContent = todoCount;
    document.getElementById('progressCount').textContent = progressCount;
    document.getElementById('doneCount').textContent = doneCount;
}

// Exportar dados
function exportData() {
    const data = {
        clients: clients,
        templates: templates,
        exportDate: new Date().toISOString(),
        version: '6.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientdeck-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✅ Dados exportados com sucesso!');
}

// Importar dados
function importData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.clients && data.templates) {
                if (confirm('⚠️ Isso substituirá todos os dados atuais. Continuar?')) {
                    clients = data.clients;
                    templates = data.templates;
                    
                    clients.forEach(client => {
                        if (!client.completedAt) client.completedAt = null;
                        if (!client.observationLastEdited) client.observationLastEdited = null;
                    });
                    
                    Object.keys(templates).forEach(templateId => {
                        const template = templates[templateId];
                        template.items.forEach(item => {
                            if (item.isRequired === undefined) {
                                item.isRequired = false;
                            }
                        });
                    });
                    
                    expandedClientIds.clear();
                    currentEditingRow = null;
                    
                    saveData();
                    saveTemplates();
                    renderClients();
                    renderTableViewPreservingState();
                    updateStats();
                    renderTemplateFilters();
                    showToast('✅ Dados importados com sucesso!');
                }
            } else {
                showToast('❌ Arquivo inválido', true);
            }
        } catch (error) {
            showToast('❌ Erro ao ler arquivo', true);
        }
    };
    reader.readAsText(file);
    
    input.value = '';
}

// Configurar drag and drop
function setupDragAndDrop() {
    let draggedElement = null;

    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('card')) {
            draggedElement = e.target;
            e.target.classList.add('dragging');
        }
    });

    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('card')) {
            e.target.classList.remove('dragging');
            draggedElement = null;
        }
    });

    ['todo', 'progress', 'done'].forEach(columnId => {
        const column = document.getElementById(columnId);

        column.addEventListener('dragover', function(e) {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', function(e) {
            if (!column.contains(e.relatedTarget)) {
                column.classList.remove('drag-over');
            }
        });

        column.addEventListener('drop', function(e) {
            e.preventDefault();
            column.classList.remove('drag-over');

            if (draggedElement) {
                const clientId = parseInt(draggedElement.dataset.clientId);
                const client = clients.find(c => c.id === clientId);
                
                if (client && client.status !== columnId) {
                    if (columnId === 'done') {
                        const validation = validateRequiredFields(client);
                        if (!validation.valid) {
                            showToast(`❌ Preencha todos os campos obrigatórios para concluir: ${validation.missing.join(', ')}`, true);
                            return;
                        }
                    }
                    
                    const statusNames = {
                        'todo': 'A Fazer',
                        'progress': 'Em Andamento', 
                        'done': 'Concluído'
                    };
                    
                    client.status = columnId;
                    
                    if (columnId === 'done' && !client.completedAt) {
                        client.completedAt = new Date().toISOString();
                    } else if (columnId !== 'done') {
                        client.completedAt = null;
                    }
                    
                    saveData();
                    renderClients();
                    renderTableViewPreservingState();
                    updateStats();
                    showToast(`✅ ${client.name} movido para "${statusNames[columnId]}"`);
                }
            }
        });
    });
}

// Fechar modais ao clicar fora
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});