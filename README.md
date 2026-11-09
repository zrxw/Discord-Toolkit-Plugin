# Gon Toolkit

Gon Toolkit is a user plugin/mod for Discord clients based on Vencord, including Vencord and Equicord. It brings optional chat, message, account, performance, and server utilities into one settings page.

**Maintainer:** [tlwm](https://discord.com/users/280370001569906690)

Features run in your local client and some perform actions through your account. Review each feature and its settings before use. Use server tools only in servers you own or administer.

## Features

| Feature | Description and use |
| --- | --- |
| Backpack | Groups chat bar buttons. Enable it, then use the button controls to pack or unpack buttons. |
| Auto Quests | Runs supported Discord quest tasks. Enable it and use the quest panel to choose a task. |
| Bulk Friend Remove | Selects multiple friends for removal from its header button. Review the selection before confirming. |
| Cancel Friend Request | Adds an action to cancel an outgoing friend request from a user profile menu. |
| Clear DMs | Closes direct message conversations from their context menu. |
| DM Purger | Finds and removes messages using a Discord data package. Load or request your package in its settings panel, review matches, configure exclusions, then start. |
| Export DMs | Exports accessible direct and group conversations as HTML, TXT, Markdown, JSON, or CSV. Open its header button, choose conversations and format, then export. HTML styling uses a third-party component CDN. |
| Fake DM | Adds sample messages locally in the client. They are not sent to Discord. Use its chat bar button. |
| Fake Switcher | Adds local entries to the account switcher to preview another user's appearance. It does not sign in to that account. |
| Fake Voice | Changes local mute and deafen indicators while keeping incoming audio available. Other users may see a different state. |
| Fast Discord | Turns selected animations and background work on or off to reduce client load. Configure its individual settings. |
| Message Cleaner | Finds and removes your messages in supported DMs, servers, or channels. Choose a scope and review it before starting. |
| Platform Indicators | Displays the platform associated with a user's presence in member lists, profiles, or messages. |
| Platform Spoofer | Changes the platform reported by this client. This affects reported client presence. |
| Preview Message | Previews unread DM content when hovering over an unread conversation. |
| Self Destruct | Deletes a message after a configured delay. Configure the delay and replacement behavior, then enable it from the chat bar before sending. |
| Server Cloner | Copies selected settings and server structure to a destination server where you have administrator access. Discord permissions, role hierarchy, managed roles, and service limits can prevent individual items from copying. Review every option before starting. |
| Silent Delete | Replaces a message before deleting it. Configure the replacement text and delay in settings. |
| Silent Edit | Edits a message with the configured follow-up cleanup behavior. Configure deletion and notification options in settings. |

Each feature has its own switch under **Settings → Plugins → Gon Toolkit**. Availability and results depend on client version, permissions, options, and Discord limits. Back up important data before using message deletion or server modification features.

## Language

Open **Gon Toolkit → Language / Idioma** and select **English** or **Português (Brasil)**. The choice is saved in plugin settings. Some interface text provided by Discord or the client remains in the Discord language.

## Installation

Gon Toolkit is a source user plugin. Copy this plugin folder into `src/userplugins/` in a Vencord or Equicord source checkout, install that project's dependencies, and build it:

```powershell
pnpm install --frozen-lockfile
pnpm build
```

On Windows PowerShell, use `pnpm.cmd` if PowerShell blocks `pnpm.ps1`:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
```

If the client has not been injected with Vencord or Equicord, run that project's `pnpm inject` command and choose the intended Discord installation. After rebuilding an existing installation, fully close and reopen Discord. Copying plugin files into a prebuilt installation does not add the plugin; it must be bundled from source.

Refer to the project instructions for [Equicord source installs](https://docs.equicord.org/installing/), [Equicord custom plugins](https://docs.equicord.org/installing/custom-plugin/), [Vencord source installs](https://docs.vencord.dev/installing/), and [Vencord custom plugins](https://docs.vencord.dev/installing/custom-plugins/).

## Troubleshooting

- If the plugin does not appear, confirm the plugin folder is inside `src/userplugins/`, contains `index.tsx`, and was included in a fresh build.
- If the new build does not appear, close every Discord process and reopen the client.
- If an export or clone operation stops, check its progress log. Permissions, client changes, and Discord limits can cause individual operations to fail.

## License

Gon Toolkit is created and maintained by `tlwm`. It is distributed under the **GNU GPL version 3 or, at your option, any later version**; see [`LICENSE`](LICENSE).

---

# Gon Toolkit (Português)

Gon Toolkit é um plugin/mod de usuário para clientes Discord baseados em Vencord, incluindo Vencord e Equicord. Ele reúne ferramentas opcionais de chat, mensagens, conta, desempenho e servidores em uma única página de configurações.

**Responsável pelo projeto:** [tlwm](https://discord.com/users/280370001569906690)

Os recursos funcionam no cliente local e alguns executam ações usando sua conta. Leia cada descrição e configuração antes de usar. Use as ferramentas de servidor somente em servidores que você possui ou administra.

## Recursos

| Recurso | Descrição e uso |
| --- | --- |
| Backpack | Agrupa botões da barra de chat. Ative e use os controles dos botões para guardar ou retirar itens. |
| Auto Quests | Executa tarefas compatíveis das missões do Discord. Ative e escolha uma tarefa no painel de missões. |
| Bulk Friend Remove | Permite selecionar vários amigos pelo botão da barra superior. Confira a seleção antes de confirmar. |
| Cancel Friend Request | Adiciona uma ação para cancelar solicitações de amizade enviadas no menu de perfil. |
| Clear DMs | Fecha conversas diretas pelo respectivo menu de contexto. |
| DM Purger | Localiza e remove mensagens usando um pacote de dados do Discord. Carregue ou solicite o pacote no painel, confira os resultados, configure exceções e inicie. |
| Export DMs | Exporta conversas diretas e em grupo acessíveis em HTML, TXT, Markdown, JSON ou CSV. Abra o botão na barra superior, escolha conversas e formato e exporte. A formatação HTML usa um componente de CDN de terceiros. |
| Fake DM | Adiciona mensagens de exemplo localmente no cliente. Elas não são enviadas ao Discord. Use o botão da barra de chat. |
| Fake Switcher | Adiciona entradas locais ao alternador de contas para pré-visualizar a aparência de outra pessoa. Não entra nessa conta. |
| Fake Voice | Altera os indicadores locais de silenciado e ensurdecido sem interromper o áudio recebido. Outras pessoas podem ver um estado diferente. |
| Fast Discord | Desativa animações e tarefas em segundo plano selecionadas para reduzir o uso do cliente. Configure cada opção individualmente. |
| Message Cleaner | Localiza e remove mensagens suas em DMs, servidores ou canais compatíveis. Escolha o escopo e confira antes de iniciar. |
| Platform Indicators | Mostra a plataforma associada à presença de uma pessoa na lista de membros, nos perfis ou nas mensagens. |
| Platform Spoofer | Altera a plataforma informada por este cliente e afeta a presença reportada. |
| Preview Message | Pré-visualiza o conteúdo de DMs não lidas ao passar o cursor sobre a conversa. |
| Self Destruct | Apaga uma mensagem após o intervalo configurado. Ajuste o atraso e a substituição e ative pela barra de chat antes de enviar. |
| Server Cloner | Copia configurações e partes selecionadas da estrutura para outro servidor onde você tem acesso de administrador. Permissões, hierarquia de cargos, cargos gerenciados e limites do Discord podem impedir cópias individuais. Confira as opções antes de iniciar. |
| Silent Delete | Substitui uma mensagem antes de apagá-la. Configure o texto de substituição e o intervalo nas opções. |
| Silent Edit | Edita uma mensagem com o comportamento de limpeza posterior configurado. Ajuste a exclusão e as notificações nas opções. |

Cada recurso tem seu próprio botão em **Configurações → Plugins → Gon Toolkit**. A disponibilidade depende da versão do cliente, das permissões, das opções e dos limites do Discord. Faça backup de dados importantes antes de usar recursos que apagam mensagens ou modificam servidores.

## Idioma

Abra **Gon Toolkit → Language / Idioma** e selecione **English** ou **Português (Brasil)**. A escolha fica salva nas configurações do plugin. Alguns textos fornecidos pelo Discord ou pelo cliente permanecem no idioma configurado no Discord.

## Instalação

Gon Toolkit é um plugin de usuário que precisa ser compilado a partir do código-fonte. Copie esta pasta do plugin para `src/userplugins/` em um checkout do Vencord ou Equicord, instale as dependências do projeto e compile:

```powershell
pnpm install --frozen-lockfile
pnpm build
```

No PowerShell do Windows, use `pnpm.cmd` se o PowerShell bloquear `pnpm.ps1`:

```powershell
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
```

Se o cliente ainda não tiver Vencord ou Equicord instalado, execute o comando `pnpm inject` do respectivo projeto e escolha a instalação do Discord desejada. Depois de recompilar uma instalação existente, feche o Discord completamente e abra-o novamente. Copiar arquivos para uma instalação pré-compilada não adiciona o plugin; é necessário incluí-lo na compilação do código-fonte.

Consulte as instruções dos projetos: [instalação do Equicord](https://docs.equicord.org/installing/), [plugins personalizados no Equicord](https://docs.equicord.org/installing/custom-plugin/), [instalação do Vencord](https://docs.vencord.dev/installing/) e [plugins personalizados no Vencord](https://docs.vencord.dev/installing/custom-plugins/).

## Solução de problemas

- Se o plugin não aparecer, confira se a pasta está dentro de `src/userplugins/`, contém `index.tsx` e foi incluída em uma nova compilação.
- Se a nova compilação não aparecer, feche todos os processos do Discord e abra o cliente novamente.
- Se uma exportação ou clonagem parar, confira o registro de progresso. Permissões, mudanças no cliente e limites do Discord podem fazer operações individuais falharem.

## Licença

Gon Toolkit foi criado e é mantido por `tlwm`. O projeto é distribuído sob a **GNU GPL versão 3 ou, a seu critério, qualquer versão posterior**; consulte [`LICENSE`](LICENSE).
