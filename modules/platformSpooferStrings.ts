/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { settings } from "../settings";

const translations: Record<string, string> = {
    "Platform updated! Reconnecting Gateway...": "Plataforma atualizada! Reconectando ao Gateway...",
    "Platform updated!": "Plataforma atualizada!"
};

export function t(value: string): string {
    return settings.store.language === "pt-BR" ? translations[value] ?? value : value;
}
