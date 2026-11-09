/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { settings } from "../settings";

const translations: Record<string, string> = {
    "Quests runner stopped": "Execução de missões parada",
    "Quests runner started": "Execução de missões iniciada",
    "You don't have any uncompleted active quests!": "Você não tem missões ativas incompletas.",
    "Quest completed": "Missão concluída",
    "All active quests completed!": "Todas as missões ativas foram concluídas.",
    "Video Quest": "Missão de vídeo",
    "Activity Quest": "Missão de atividade",
    "Desktop Game / Stream Quest": "Missão de jogo / transmissão no computador",
    "Completed": "Concluída",
    "Stop Quests": "Parar missões",
    "Run Quests": "Executar missões"
};

export function t(value: string): string {
    return settings.store.language === "pt-BR" ? translations[value] ?? value : value;
}
