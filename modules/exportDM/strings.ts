/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { settings } from "../../settings";

const translations: Record<string, string> = {
    "Export DMs": "Exportar DMs",
    "Exported on": "Exportado em",
    "messages": "mensagens",
    "(edited)": "(editada)",
    "[pinned]": "[fixada]",
    "Token not found": "Token não encontrado",
    "Fetching:": "Buscando:",
    "generating file...": "gerando arquivo...",
    "conversations exported": "conversas exportadas",
    "Web page with images/videos": "Página com imagens/vídeos",
    "Plain text": "Texto simples",
    "Full structured": "Completo e estruturado",
    "Search for a friend or a DM...": "Buscar pessoa ou DM...",
    "CHOOSE A CONVERSATION": "ESCOLHA UMA CONVERSA",
    "No results for": "Nenhum resultado para",
    "No DMs found": "Nenhuma DM encontrada",
    "Group": "Grupo",
    "Images / Videos / Audio": "Imagens / Vídeos / Áudio",
    "Links / Embeds": "Links / Incorporações",
    "Reactions": "Reações",
    "EXPORT FORMAT": "FORMATO DE EXPORTAÇÃO",
    "Exporting...": "Exportando...",
    "Export": "Exportar",
    "Could not load messages": "Não foi possível carregar as mensagens",
    "Unexpected response while loading messages": "Resposta inesperada ao carregar as mensagens",
    "Markdown": "Markdown",
    "Spreadsheet": "Planilha",
    "CSV": "CSV",
    "JSON": "JSON",
    "HTML": "HTML",
    "TXT": "TXT",
    "MD": "MD",
    "Total:": "Total:"
};

export function t(value: string): string {
    return settings.store.language === "pt-BR" ? translations[value] ?? value : value;
}
