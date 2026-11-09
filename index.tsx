/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { migrateOldSettingToNewPlugin, migrateSettingsFromPlugin, Settings, SettingsStore } from "@api/Settings";
import { BadgePosition } from "@api/Badges";
import definePlugin from "@utils/types";
import type { ProfileBadge } from "@api/Badges";

import backpack from "./modules/backpack";
import autoQuests from "./modules/autoQuests";
import bulkFriendRemove from "./modules/bulkFriendRemove";
import cancelFriendRequest from "./modules/cancelFriendRequest";
import clearDMs from "./modules/clearDMs";
import dmPurger from "./modules/dmPurger";
import exportDM from "./modules/exportDM";
import DmPurgerSettingsModalPanel from "./modules/dmPurger/components/DmPurgerSettingsModalPanel";
import fakeDM from "./modules/fakeDM";
import fakeSwitcher from "./modules/fakeSwitcher";
import fakeVoice from "./modules/fakeVoice";
import fastDiscord from "./modules/fastDiscord";
import messageCleaner from "./modules/messageCleaner";
import previewMessage from "./modules/previewMessage";
import platformIndicators from "./modules/platformIndicators";
import platformSpoofer from "./modules/platformSpoofer";
import selfDestruct from "./modules/selfDestruct";
import serverCloner from "./modules/serverCloner";
import silentDelete from "./modules/silentDelete";
import silentEdit from "./modules/silentEdit";
import { startModule, stopModule } from "./runner";
import { pluginName, settings } from "./settings";
import { ToolkitModule } from "./types";

const modules: [id: string, module: ToolkitModule, toggle: keyof typeof settings.store][] = [
    ["Backpack", backpack, "enableBackpack"],
    ["AutoQuests", autoQuests, "enableAutoQuests"],
    ["BulkFriendRemove", bulkFriendRemove, "enableBulkFriendRemove"],
    ["CancelFriendRequest", cancelFriendRequest, "enableCancelFriendRequest"],
    ["ClearDMs", clearDMs, "enableClearDMs"],
    ["DmPurger", dmPurger, "enableDmPurger"],
    ["ExportDM", exportDM, "enableExportDM"],
    ["FakeDM", fakeDM, "enableFakeDM"],
    ["FakeSwitcher", fakeSwitcher, "enableFakeSwitcher"],
    ["FakeVoice", fakeVoice, "enableFakeVoice"],
    ["FastDiscord", fastDiscord, "enableFastDiscord"],
    ["MessageCleaner", messageCleaner, "enableMessageCleaner"],
    ["PlatformIndicators", platformIndicators, "enablePlatformIndicators"],
    ["PlatformSpoofer", platformSpoofer, "enablePlatformSpoofer"],
    ["PreviewMessage", previewMessage, "enablePreviewMessage"],
    ["SelfDestruct", selfDestruct, "enableSelfDestruct"],
    ["ServerCloner", serverCloner, "enableServerCloner"],
    ["SilentDelete", silentDelete, "enableSilentDelete"],
    ["SilentEdit", silentEdit, "enableSilentEdit"]
];

const portugueseSettings: Record<string, [string, string]> = {
    enableBackpack: ["Ferramentas de chat · Mochila", "Organize os botões da barra de chat em uma mochila. Clique com o botão esquerdo para usar um botão guardado e com o direito para guardar ou retirar."],
    enableAutoQuests: ["Automação · Missões automáticas", "Conclua automaticamente tarefas compatíveis das missões do Discord."],
    enableBulkFriendRemove: ["Amigos · Remover vários amigos", "Remova vários amigos de uma vez pelo botão da barra superior."],
    enableExportDM: ["Exportar DMs", "Exporte conversas diretas e em grupo para formatos de arquivo comuns."],
    enablePlatformIndicators: ["Indicadores de plataforma", "Veja se as pessoas estão usando desktop, celular, navegador, console ou VR."],
    enablePlatformSpoofer: ["Conta · Simular plataforma", "Altere a plataforma ou o dispositivo informado pelo seu cliente Discord."],
    enableServerCloner: ["Servidores · Clonar servidor", "Copie partes da estrutura e das configurações para outro servidor que você administra."],
    enableCancelFriendRequest: ["Amigos · Cancelar solicitação", "Cancele uma solicitação de amizade enviada pelo menu do perfil."],
    enableClearDMs: ["Mensagens diretas · Fechar DMs", "Feche todas as suas DMs pelo menu de contexto."],
    enableDmPurger: ["Mensagens diretas · Limpar DMs", "Remova mensagens e conversas em grupo usando seu pacote de dados do Discord."],
    enableFakeDM: ["Ferramentas de chat · DM falsa", "Adicione mensagens falsas locais em DMs e grupos pelo botão da barra de chat."],
    enableFakeSwitcher: ["Contas · Alternador falso", "Adicione usuários ao alternador de contas e use a aparência deles localmente."],
    enableFakeVoice: ["Voz · Voz falsa", "Mostre o estado de silenciado ou ensurdecido enquanto continua ouvindo."],
    enableFastDiscord: ["Desempenho · Discord rápido", "Reduza animações, mídia, cache, FPS em segundo plano e tráfego de presença."],
    enableMessageCleaner: ["Mensagens · Limpador de mensagens", "Limpe suas mensagens em DMs, servidores e canais pela barra superior e menus de contexto."],
    enablePreviewMessage: ["Mensagens · Prévia de mensagem", "Passe o cursor sobre uma DM não lida para pré-visualizar mensagens sem abri-la."],
    enableSelfDestruct: ["Mensagens · Autodestruição", "Envie mensagens que são apagadas após um intervalo."],
    enableSilentDelete: ["Mensagens · Exclusão silenciosa", "Substitua uma mensagem por um texto antes de apagá-la."],
    enableSilentEdit: ["Mensagens · Edição silenciosa", "Edite uma mensagem sem mostrar a indicação de edição."],
    selfDestructActive: ["Autodestruição ativa", "Ative ou desative a autodestruição. Também pode ser alterada pela barra de chat."],
    selfDestructDelay: ["Atraso da autodestruição", "Segundos até a mensagem ser apagada."],
    selfDestructSilentMode: ["Modo silencioso", "Use a substituição de texto antes de apagar a mensagem."],
    selfDestructReplacementText: ["Texto de substituição", "Texto exibido enquanto a mensagem é apagada."],
    silentDeleteReplacementText: ["Texto de substituição", "Texto que substitui a mensagem antes da exclusão."],
    silentDeleteDeleteDelay: ["Atraso da exclusão", "Milissegundos entre a substituição e a exclusão da mensagem."],
    silentDeleteSuppressNotifications: ["Suprimir notificações", "Evite notificar pessoas mencionadas ao substituir a mensagem."],
    silentDeleteDeleteOriginal: ["Apagar mensagem original", "Apague a mensagem original no servidor para que ela não volte após reiniciar o cliente."],
    silentEditDeleteOriginalMessage: ["Apagar mensagem original", "Apague a mensagem original no servidor após uma edição silenciosa."],
    silentEditDeleteDelay: ["Atraso da exclusão", "Milissegundos até a mensagem original ser apagada."],
    fastDiscordDisableSpringAnimations: ["Desativar animações elásticas", "Desative animações em botões, modais e transições."],
    fastDiscordDisableTypingDots: ["Desativar animação de digitação", "Oculte os pontos animados de digitação."],
    fastDiscordNoGifAvatars: ["Desativar avatares GIF", "Bloqueie avatares GIF animados em listas e mensagens."],
    fastDiscordNoAnimatedEmoji: ["Desativar emojis animados", "Desative animações de emoji."],
    fastDiscordNoStickers: ["Desativar animação de figurinhas", "Impeça a reprodução automática de figurinhas Lottie."],
    fastDiscordNoActivities: ["Ocultar atividades", "Oculte a seção de atividades na lista de membros."],
    fastDiscordNoVideoAutoplay: ["Desativar reprodução automática de vídeo", "Impeça a reprodução automática de vídeos incorporados."],
    fastDiscordNoSoundboardPreview: ["Desativar prévia do soundboard", "Desative a prévia de áudio ao passar o cursor sobre sons."],
    fastDiscordReduceBlurEffects: ["Reduzir desfoque", "Desative efeitos de desfoque que exigem mais do computador."],
    fastDiscordDisableHoverTransitions: ["Desativar transições ao passar o cursor", "Faça as transições CSS acontecerem imediatamente."],
    fastDiscordLimitMsgCache: ["Limitar cache de mensagens", "Execute periodicamente a coleta de lixo nativa para liberar memória."],
    fastDiscordReduceFpsBackground: ["Reduzir FPS em segundo plano", "Limite a renderização quando a janela estiver em segundo plano."],
    fastDiscordThrottlePresence: ["Reduzir atualizações de presença", "Envie atualizações de presença com menos frequência."],
    fastDiscordLowEndMode: ["Modo para computadores modestos", "Use coleta de lixo mais frequente e menos FPS em segundo plano."],
    autoStart: ["Iniciar missões automaticamente", "Execute missões ativas em segundo plano quando o Discord abrir."],
    autoResume: ["Retomar missões automaticamente", "Retome missões em andamento ao iniciar o Discord."],
    autoEnroll: ["Inscrever-se automaticamente", "Aceite e inscreva-se automaticamente em missões disponíveis."],
    showToasts: ["Mostrar notificações", "Mostre notificações sobre o progresso e a conclusão das missões."],
    platform: ["Dispositivo", "Escolha a plataforma que será informada pelo cliente."],
    list: ["Lista de membros", "Mostre indicadores na lista de membros."],
    profiles: ["Perfis", "Mostre indicadores nos perfis de usuário."],
    messages: ["Mensagens", "Mostre indicadores nas mensagens."],
    colorMobileIndicator: ["Combinar a cor do indicador móvel com o status", "Use a cor do status do usuário no indicador móvel."],
    showBots: ["Mostrar indicadores em bots", "Mostre indicadores de plataforma em contas de bot."],
    ConsoleIcon: ["Ícone de console", "Escolha o ícone usado para consoles."],
    cloner: ["Painel de clonagem", "Abra o painel para copiar estrutura de servidor."],
    dmPurgerAutoRequestEvery30Days: ["Solicitar pacote de dados automaticamente", "Solicite um pacote de dados do Discord a cada 30 dias."],
    dmPurgerLastRequestTimestamp: ["Última solicitação", "Data e hora da última solicitação de dados."],
    dmPurgerRequestMessagesOnly: ["Solicitar somente mensagens", "Inclua apenas dados de mensagens na solicitação do pacote."],
    dmPurgerDeleteDelay: ["Intervalo entre exclusões", "Atraso em milissegundos entre mensagens para reduzir limites de requisição."],
    dmPurgerEmailProvider: ["Provedor de e-mail", "Provedor usado para buscar o pacote de dados automaticamente."],
    dmPurgerEmailAddress: ["Endereço de e-mail", "Endereço de e-mail vinculado à sua conta Discord."],
    dmPurgerEmailPassword: ["Senha do e-mail", "Senha do e-mail ou senha de aplicativo."],
    dmPurgerCustomImapHost: ["Servidor IMAP personalizado", "Endereço do servidor IMAP personalizado."],
    dmPurgerCustomImapPort: ["Porta IMAP personalizada", "Porta IMAP personalizada. Use 993 para SSL."],
    dmPurgerAutoDeleteZipAfterExtract: ["Apagar o pacote após extração", "Apague package.zip depois de extrair os dados."],
    dmPurgerIncludeGroupDms: ["Incluir DMs em grupo", "Inclua DMs em grupo na limpeza. Por padrão, somente conversas individuais."],
    dmPurgerWhitelistUsers: ["IDs de usuários preservados", "IDs separados por vírgula que serão excluídos da limpeza."],
    dmPurgerWhitelistGroups: ["IDs de grupos preservados", "IDs de canais de grupo separados por vírgula que serão excluídos da limpeza."],
    dmPurgerAutoResumeOnStartup: ["Retomar limpeza ao iniciar", "Retome uma limpeza interrompida quando o Discord abrir."]
};

const originalSettingText = new Map<string, { displayName?: string; description?: string; }>();

function updateSettingsLanguage() {
    for (const [key, option] of Object.entries(settings.def)) {
        if (!originalSettingText.has(key)) originalSettingText.set(key, { displayName: "displayName" in option ? option.displayName : undefined, description: option.description });
        const original = originalSettingText.get(key);
        const translated = settings.store.language === "pt-BR" ? portugueseSettings[key] : undefined;
        if ("displayName" in option && original?.displayName) option.displayName = translated?.[0] ?? original.displayName;
        if (original?.description !== undefined) option.description = translated?.[1] ?? original.description;
    }
}

for (const [id, module, toggle] of modules) {
    const moduleSettings = module.settings;
    if (!moduleSettings) continue;
    Object.assign(settings.def, moduleSettings.def);
    moduleSettings.pluginName = pluginName;
    for (const [key, option] of Object.entries(moduleSettings.def)) {
        const hidden = option.hidden;
        option.hidden = () => !Settings.plugins[pluginName]?.[toggle] || (typeof hidden === "function" ? hidden.call(moduleSettings) : hidden === true);
        if ("displayName" in option) option.displayName ??= `${id.replace(/([a-z])([A-Z])/g, "$1 $2")} · ${key.replace(/([a-z])([A-Z])/g, "$1 $2")}`;
    }
    if (id === "PlatformSpoofer") {
        if ("displayName" in moduleSettings.def.platform) moduleSettings.def.platform.displayName = "Platform Spoofer · Device";
        moduleSettings.def.platform.hidden = () => !Settings.plugins[pluginName]?.enablePlatformSpoofer;
    }
    if (id === "ServerCloner") {
        moduleSettings.def.cloner.hidden = () => !Settings.plugins[pluginName]?.enableServerCloner;
    }
}

const platformSettingNames: Record<string, string> = {
    list: "Member list",
    profiles: "Profiles",
    messages: "Messages",
    colorMobileIndicator: "Match mobile indicator to status color",
    showBots: "Show indicators on bots",
    ConsoleIcon: "Console icon"
};

for (const [key, label] of Object.entries(platformSettingNames)) {
    if ("displayName" in settings.def[key]) settings.def[key].displayName = `Platform Indicators · ${label}`;
    settings.def[key].hidden = () => !Settings.plugins[pluginName]?.enablePlatformIndicators;
}


const modulePatches = modules.flatMap(([, module, toggle]) => module.patches?.map(patch => ({
    ...patch,
    predicate: () => !!settings.store[toggle] && (patch.predicate?.() ?? true)
})) ?? []);

const listeners = new Map<string, (enabled: boolean) => void>();

const toolkitOwnerIds = new Set([
    "280370001569906690",
    "1440741587545100351"
]);


const earlySupporter =
    "https://cdn3.emoji.gg/emojis/5053-early-supporter.png";

const verifiedDeveloper =
    "https://upload.wikimedia.org/wikipedia/commons/c/c4/7088-early-verified-bot-developer.png";

function ToolkitBadge({ src, alt }: { src: string; alt: string; }) {
    return (
        <img
            src={src}
            alt={alt}
            width={20}
            height={20}
            draggable={false}
            style={{
                width: "20px",
                height: "20px",
                objectFit: "contain",
                display: "block"
            }}
        />
    );
}

function ToolkitPigBadge() {
    return (
        <ToolkitBadge
            src={earlySupporter}
            alt="Early Supporter"
        />
    );
}

function ToolkitCodeBadge() {
    return (
        <ToolkitBadge
            src={verifiedDeveloper}
            alt="Early Verified Bot Developer"
        />
    );
}

const ownerProfileBadges: ProfileBadge[] = [
    {
        id: "gon-toolkit-owner-pig",
        key: "Early Supporter",
        description: "Early Supporter",
        component: ToolkitPigBadge,
        position: BadgePosition.END,
        shouldShow: ({ userId }) => toolkitOwnerIds.has(userId)
    },
    {
        id: "gon-toolkit-owner-code",
        key: "Early Verified Bot Developer",
        description: "Early Verified Bot Developer",
        component: ToolkitCodeBadge,
        position: BadgePosition.END,
        shouldShow: ({ userId }) => toolkitOwnerIds.has(userId)
    }
];

function DmPurgerPanel() {
    const { enableDmPurger } = settings.use(["enableDmPurger"]);
    return enableDmPurger ? <DmPurgerSettingsModalPanel /> : null;
}

export default definePlugin({
    name: "Gon Toolkit",
    description: "Gon Toolkit combines chat tools, message utilities, performance options and DM management. Enable only the features you need in settings.",
    authors: [
        { name: "tlwm", id: 280370001569906690n },
        { name: "vw4x", id: 1440741587545100351n }
    ],
    dependencies: ["ChatInputButtonAPI", "CommandsAPI", "ContextMenuAPI", "HeaderBarAPI", "MemberListDecoratorsAPI", "MessageAccessoriesAPI", "MessageDecorationsAPI", "MessagePopoverAPI", "MessageUpdaterAPI", "NicknameIconsAPI", "UserAreaAPI"],
    userProfileBadges: ownerProfileBadges,
    settings,
    settingsAboutComponent: DmPurgerPanel,

    patches: [
        ...modulePatches,
        {
            find: "dotCycle",
            predicate: () => settings.store.enableFastDiscord && settings.store.fastDiscordDisableTypingDots && !isPluginEnabled("NoTypingAnimation"),
            replacement: {
                match: /focused:(\i)/g,
                replace: (_, focused) => `_focused:${focused}=false`
            }
        },
        {
            find: "autoplay:!0",
            predicate: () => settings.store.enableFastDiscord && settings.store.fastDiscordNoVideoAutoplay,
            replacement: {
                match: /autoplay:!0/g,
                replace: "autoplay:!1"
            }
        },
        {
            find: /getUserAvatarURL.{0,80}animated/,
            predicate: () => settings.store.enableFastDiscord && settings.store.fastDiscordNoGifAvatars,
            replacement: {
                match: /(animated\s*(?:&&|=).*?)(true)/,
                replace: (_, pre) => `${pre}false`
            }
        },
        {
            find: "soundboard_sound_hover",
            predicate: () => settings.store.enableFastDiscord && settings.store.fastDiscordNoSoundboardPreview,
            replacement: {
                match: /onMouseEnter:\s*\(\)\s*=>\s*\{[^}]*play[^}]*\}/,
                replace: "onMouseEnter:()=>{}"
            }
        },
        {
            find: /StickerType\.STANDARD/,
            predicate: () => settings.store.enableFastDiscord && settings.store.fastDiscordNoStickers,
            replacement: {
                match: /shouldAnimate:!0/g,
                replace: "shouldAnimate:!1"
            }
        },
    ],

    start() {
        updateSettingsLanguage();
        SettingsStore.addChangeListener(`plugins.${pluginName}.language`, updateSettingsLanguage);
        for (const [id, module, toggle] of modules) {
            if (module.settings) migrateSettingsFromPlugin(pluginName, id, ...Object.keys(module.settings.def));
            migrateOldSettingToNewPlugin(pluginName, toggle, id, "enabled");
        }

        for (const [id, module, toggle] of modules) {
            if (settings.store[toggle]) startModule(id, module);

            const path = `plugins.${pluginName}.${toggle}`;
            const listener = (enabled: boolean) => (enabled ? startModule : stopModule)(id, module);
            listeners.set(path, listener);
            SettingsStore.addChangeListener(path, listener);
        }
    },

    stop() {
        SettingsStore.removeChangeListener(`plugins.${pluginName}.language`, updateSettingsLanguage);
        for (const [path, listener] of listeners) SettingsStore.removeChangeListener(path, listener);
        listeners.clear();
        for (const [id, module] of modules) stopModule(id, module);
    }
});
