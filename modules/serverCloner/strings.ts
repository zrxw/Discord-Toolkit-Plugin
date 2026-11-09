/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { settings } from "../../settings";

const translations: Record<string, string> = {
    "Server settings": "Configurações do servidor",
    "Icon": "Ícone",
    "Roles": "Cargos",
    "Delete existing roles": "Excluir cargos existentes",
    "Channels": "Canais",
    "Do not delete existing channels": "Não excluir canais existentes",
    "Permissions": "Permissões",
    "Emojis": "Emojis",
    "Bot embeds": "Incorporações de bots",
    "Source server": "Servidor de origem",
    "Choose a server...": "Escolha um servidor...",
    "Server Cloner": "Clonar servidor",
    "Target server (ADMIN required)": "Servidor de destino (requer ADMIN)",
    "No server with ADMIN permission found.": "Nenhum servidor com permissão de ADMIN encontrado.",
    "Cloning options": "Opções de clonagem",
    "Cloning in progress...": "Clonagem em andamento...",
    "Start cloning": "Iniciar clonagem",
    "Stop": "Parar"
};

export function t(value: string): string {
    return settings.store.language === "pt-BR" ? translations[value] ?? value : value;
}
