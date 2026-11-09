/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RestAPI, showToast } from "@webpack/common";

import { settings } from "../../settings";
import { ToolkitModule } from "../../types";
import { purgerEngine } from "./utils/purgerEngine";

let intervalTimer: any = null;

export async function requestDiscordData(types: string[] = ["messages"]): Promise<{ success: boolean; message: string }> {
    try {
        await RestAPI.post({
            url: "/users/@me/harvest",
            body: { types }
        });
        settings.store.dmPurgerLastRequestTimestamp = Date.now();
        return { success: true, message: "Discord data requested successfully." };
    } catch (e: any) {
        const errorMsg = e?.body?.message || e?.message || "Failed to request data from Discord.";
        return { success: false, message: errorMsg };
    }
}

export async function checkDiscordHarvestStatus(): Promise<any> {
    try {
        const res = await RestAPI.get({ url: "/users/@me/harvest" });
        return res?.body || res;
    } catch {
        return null;
    }
}

function checkPeriodicHarvest() {
    if (!settings.store.dmPurgerAutoRequestEvery30Days) return;
    const last = settings.store.dmPurgerLastRequestTimestamp || 0;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - last >= thirtyDaysMs) {
        const types = settings.store.dmPurgerRequestMessagesOnly ? ["messages"] : ["all"];
        void requestDiscordData(types).then(res => {
            if (res.success) {
                showToast({ text: "Discord data requested successfully.", variant: "success" });
            }
        });
    }
}

export default {
    start() {
        checkPeriodicHarvest();
        intervalTimer = setInterval(checkPeriodicHarvest, 6 * 60 * 60 * 1000);

        if (settings.store.dmPurgerAutoResumeOnStartup) {
            setTimeout(() => {
                const state = purgerEngine.getState();
                if ((state.status === "paused" || state.status === "running") && state.queue.length > 0 && state.currentIndex < state.queue.length) {
                    showToast({ text: "Auto-resuming DM Purge..." });
                    purgerEngine.resumePurge(settings.store.dmPurgerDeleteDelay);
                }
            }, 3000);
        }
    },
    stop() {
        if (intervalTimer) {
            clearInterval(intervalTimer);
            intervalTimer = null;
        }
        purgerEngine.pausePurge();
    }
} satisfies ToolkitModule;
