# ✨ ClientDeck - Gerenciador de Clientes

![Static Badge](https://img.shields.io/badge/status-conclu%C3%ADdo-green)
![Static Badge](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
![Static Badge](https://img.shields.io/badge/tech-Vanilla_JS-yellow)

Um painel Kanban intuitivo para gerenciamento de fluxos de trabalho de clientes, focado em automação e templates, construído com HTML, CSS e JavaScript puros.

![Demonstração do ClientDeck](caminho/para/sua/imagem.gif)

---

## 🚀 Sobre o Projeto

ClientDeck nasceu da necessidade de uma ferramenta mais inteligente que um simples Trello para gerenciar o onboarding e o fluxo de trabalho de múltiplos clientes. A aplicação combina a simplicidade de um painel Kanban com a eficiência de templates customizáveis, permitindo padronizar processos e acompanhar o progresso de forma automática.

Toda a aplicação funciona localmente no seu navegador, utilizando `localStorage` para salvar seus dados de forma segura e privada, sem a necessidade de um servidor ou banco de dados.

---

## 🎯 Principais Funcionalidades

* **Painel Kanban com Drag & Drop:** Organize clientes nas colunas "A Fazer", "Em Andamento" e "Concluído" com uma interface fluida de arrastar e soltar.
* **Sistema de Templates Dinâmicos:** Crie checklists customizáveis para diferentes tipos de serviço. Defina perguntas, tipos de resposta (texto, data, sim/não, etc.) e marque itens como obrigatórios.
* **Progresso e Status Automáticos:** A barra de progresso de cada cliente é calculada automaticamente com base nos itens obrigatórios do template. Ao atingir 100%, o cliente é movido para "Concluído" de forma automática.
* **Visão de Planilha com Edição Rápida:** Alterne para uma visão de tabela para visualizar todos os clientes e editar qualquer informação diretamente na célula, de forma rápida e prática.
* **Persistência de Dados Local:** Todas as informações de clientes e templates são salvas no `localStorage` do seu navegador, garantindo que seus dados permaneçam entre as sessões.
* **Importação e Exportação de Dados:** Faça backup de todo o seu deck de clientes e templates em um arquivo JSON e importe-o a qualquer momento.
* **Busca e Filtragem:** Encontre clientes rapidamente usando a barra de busca ou filtre o painel para exibir apenas clientes de um template específico.
* **Design Moderno e Responsivo:** Interface com tema escuro, agradável e totalmente funcional em desktops e dispositivos móveis.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído do zero utilizando tecnologias web fundamentais, sem o uso de frameworks complexos, para garantir leveza e performance.

* **HTML5:** Para a estrutura semântica da aplicação.
* **CSS3:** Para a estilização completa, incluindo Flexbox, Grid Layout e animações.
* **JavaScript (Vanilla JS):** Para toda a lógica da aplicação, manipulação do DOM e gerenciamento de estado.
* **[Sortable.js](https://github.com/SortableJS/Sortable):** Uma biblioteca JavaScript leve para a funcionalidade de arrastar e soltar (drag-and-drop).

---

## ⚙️ Como Usar

Como este é um projeto front-end puro, não há necessidade de instalação de dependências ou build steps.

**Opção 1: Abrir diretamente no navegador**

1.  Clone ou baixe este repositório.
2.  Navegue até a pasta do projeto.
3.  Abra o arquivo `index.html` diretamente no seu navegador de preferência (Chrome, Firefox, etc.).

**Opção 2: Usando um servidor local (Recomendado)**

Para evitar possíveis problemas com políticas de segurança do navegador (CORS), é recomendado usar um servidor local simples.

1.  Se você usa o **Visual Studio Code**, instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
2.  Abra a pasta do projeto no VS Code.
3.  Clique com o botão direito no arquivo `index.html` e selecione "Open with Live Server".

---

## 🤝 Como Contribuir

Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

1.  Faça um *Fork* do projeto
2.  Crie uma *Branch* para sua feature (`git checkout -b feature/FeatureIncrivel`)
3.  Faça o *Commit* de suas mudanças (`git commit -m 'Adiciona FeatureIncrivel'`)
4.  Faça o *Push* para a Branch (`git push origin feature/FeatureIncrivel`)
5.  Abra um *Pull Request*

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

## 👨‍💻 Autor

**Vinícius Leão**

* **GitHub:** [@vininleao](https://github.com/vininleao)
