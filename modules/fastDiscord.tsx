/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { SettingsStore } from "@api/Settings";
import { Logger } from "@utils/Logger";
import { isObject } from "@utils/misc";
import { findAll } from "@webpack";
import { FluxDispatcher } from "@webpack/common";

import { pluginName, settings } from "../settings";
import { ToolkitModule } from "../types";

const log = new Logger("FastDiscord");

interface SpringModule {
    Globals: {
        assign(options: { skipAnimation: boolean; }): void;
    };
    Springs: object;
}

let springs: SpringModule[] = [];

const isSpringGlobals = (v: unknown): v is SpringModule["Globals"] =>
    isObject(v) && "assign" in v && typeof (v as any).assign === "function";

const isSpringModule = (v: unknown): v is SpringModule => {
    if (!isObject(v)) return false;
    const m = v as Partial<SpringModule>;
    return isSpringGlobals(m.Globals) && isObject(m.Springs);
};

function loadSprings() {
    springs = findAll(isSpringModule);
}

function applySpringSkip(skip: boolean) {
    for (const s of springs) {
        try { s.Globals.assign({ skipAnimation: skip }); } catch (err) { log.warn("spring skip failed", err); }
    }
}

const CSS_ID = "fastdiscord-css";

function buildCss(): string {
    const s = settings.store;
    let css = "";

    css += `
body.fastdiscord-bg-mode * {
    animation-play-state: paused !important;
}
`;

    if (s.fastDiscordNoAnimatedEmoji) {
        css += `
[class*="emoji"][class*="animated"],
img[class*="emoji"][src*="gif"] {
    animation: none !important;
}
`;
    }

    if (s.fastDiscordNoStickers) {
        css += `
[class*="sticker"][class*="lottie"],
[class*="stickerAsset"][class*="animated"] {
    visibility: hidden !important;
}
`;
    }

    if (s.fastDiscordNoActivities) {
        css += `
[class*="activity"],
[class*="activityText"],
[class*="Game"] {
    display: none !important;
}
`;
    }

    if (s.fastDiscordNoSoundboardPreview) {
        css += `
[class*="soundboardEmoji"]:hover [class*="soundWave"],
[class*="soundboardEmoji"] [class*="soundWave"] {
    animation: none !important;
    opacity: 0 !important;
}
`;
    }

    if (s.fastDiscordReduceBlurEffects) {
        css += `
[class*="backdropFilter"],
[style*="backdrop-filter"] {
    backdrop-filter: none !important;
}
[class*="acrylic"] {
    background-color: var(--background-secondary) !important;
}
`;
    }

    if (s.fastDiscordDisableHoverTransitions) {
        css += `
[class*="button_"],
[class*="clickable_"],
[class*="wrapper_"] {
    transition-duration: 0.001s !important;
}
`;
    }

    return css.trim();
}

function injectCss() {
    const css = buildCss();
    let el = document.getElementById(CSS_ID) as HTMLStyleElement | null;
    if (!css) { el?.remove(); return; }
    if (!el) { el = document.createElement("style"); el.id = CSS_ID; document.head?.appendChild(el); }
    el.textContent = css;
}

function removeCss() {
    document.getElementById(CSS_ID)?.remove();
    document.body.classList.remove("fastdiscord-bg-mode");
}

let cacheCleanerInterval: ReturnType<typeof setInterval> | null = null;

function forceGC() {
    try {
        if (typeof (window as any).gc === "function") {
            if ("requestIdleCallback" in window) {
                (window as any).requestIdleCallback(() => {
                    try { (window as any).gc(); } catch { }
                }, { timeout: 2000 });
            } else {
                (window as any).gc();
            }
        }
    } catch { }
}

function cacheCleanIntervalMs(): number {
    return settings.store.fastDiscordLowEndMode ? 90 * 1000 : 5 * 60 * 1000;
}

function startCacheCleaner() {
    stopCacheCleaner();
    cacheCleanerInterval = setInterval(() => {
        if (!settings.store.fastDiscordLimitMsgCache) return;
        forceGC();
    }, cacheCleanIntervalMs());
}

function stopCacheCleaner() {
    if (cacheCleanerInterval !== null) {
        clearInterval(cacheCleanerInterval);
        cacheCleanerInterval = null;
    }
}

let bgFpsActive = false;

function onVisibilityChange() {
    if (document.hidden) {
        document.body.classList.add("fastdiscord-bg-mode");
    } else if (document.hasFocus()) {
        document.body.classList.remove("fastdiscord-bg-mode");
    }
}

function onWindowBlur() {
    document.body.classList.add("fastdiscord-bg-mode");
}

function onWindowFocus() {
    if (!document.hidden) {
        document.body.classList.remove("fastdiscord-bg-mode");
    }
}

function applyBgFpsPatch(enable: boolean) {
    if (enable && !bgFpsActive) {
        bgFpsActive = true;
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("blur", onWindowBlur);
        window.addEventListener("focus", onWindowFocus);
        if (document.hidden || !document.hasFocus()) {
            document.body.classList.add("fastdiscord-bg-mode");
        }
    } else if (!enable && bgFpsActive) {
        bgFpsActive = false;
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("blur", onWindowBlur);
        window.removeEventListener("focus", onWindowFocus);
        document.body.classList.remove("fastdiscord-bg-mode");
    }
}

const PRESENCE_DISPATCH_TYPES = new Set([
    "LOCAL_ACTIVITY_UPDATE",
    "RUNNING_GAMES_CHANGE",
]);

let origFluxDispatch: ((event: any) => unknown) | null = null;
const pendingPresenceDispatch = new Map<string, { event: any; timer: ReturnType<typeof setTimeout>; }>();

function presenceDebounceMs(): number {
    return 8000;
}

function flushPresenceDispatch(type: string) {
    const pending = pendingPresenceDispatch.get(type);
    if (!pending) return;
    pendingPresenceDispatch.delete(type);
    try {
        origFluxDispatch?.call(FluxDispatcher, pending.event);
    } catch (err) {
        log.warn("flush presence dispatch failed", err);
    }
}

function patchedDispatch(event: any) {
    if (!settings.store.fastDiscordThrottlePresence || !event || !PRESENCE_DISPATCH_TYPES.has(event.type)) {
        return origFluxDispatch?.call(FluxDispatcher, event);
    }

    if (event.type === "LOCAL_ACTIVITY_UPDATE" && !event.activity) {
        const existing = pendingPresenceDispatch.get(event.type);
        if (existing) {
            clearTimeout(existing.timer);
            pendingPresenceDispatch.delete(event.type);
        }
        return origFluxDispatch?.call(FluxDispatcher, event);
    }

    const existing = pendingPresenceDispatch.get(event.type);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => flushPresenceDispatch(event.type), presenceDebounceMs());
    pendingPresenceDispatch.set(event.type, { event, timer });
}

function applyPresenceThrottle(enable: boolean) {
    if (enable && !origFluxDispatch) {
        origFluxDispatch = FluxDispatcher.dispatch.bind(FluxDispatcher);
        (FluxDispatcher as any).dispatch = patchedDispatch;
    } else if (!enable && origFluxDispatch) {
        for (const type of Array.from(pendingPresenceDispatch.keys())) {
            const pending = pendingPresenceDispatch.get(type)!;
            clearTimeout(pending.timer);
            try { origFluxDispatch.call(FluxDispatcher, pending.event); } catch { }
        }
        pendingPresenceDispatch.clear();
        (FluxDispatcher as any).dispatch = origFluxDispatch;
        origFluxDispatch = null;
    }
}

const listeners: Record<string, (value: boolean) => void> = {
    fastDiscordDisableSpringAnimations(value) {
        if (value && springs.length === 0) loadSprings();
        applySpringSkip(value);
    },
    fastDiscordNoGifAvatars: injectCss,
    fastDiscordNoAnimatedEmoji: injectCss,
    fastDiscordNoActivities: injectCss,
    fastDiscordReduceBlurEffects: injectCss,
    fastDiscordDisableHoverTransitions: injectCss,
    fastDiscordLimitMsgCache(value) {
        if (value) startCacheCleaner();
        else stopCacheCleaner();
    },
    fastDiscordReduceFpsBackground: applyBgFpsPatch,
    fastDiscordThrottlePresence: applyPresenceThrottle,
    fastDiscordLowEndMode() {
        if (settings.store.fastDiscordLimitMsgCache) startCacheCleaner();
        if (bgFpsActive) {
            applyBgFpsPatch(false);
            applyBgFpsPatch(true);
        }
    }
};

export default {
    start() {
        if (settings.store.fastDiscordDisableSpringAnimations && !isPluginEnabled("DisableAnimations")) {
            loadSprings();
            applySpringSkip(true);
        }

        injectCss();

        if (settings.store.fastDiscordLimitMsgCache) startCacheCleaner();
        if (settings.store.fastDiscordReduceFpsBackground) applyBgFpsPatch(true);
        if (settings.store.fastDiscordThrottlePresence) applyPresenceThrottle(true);

        for (const [key, listener] of Object.entries(listeners)) SettingsStore.addChangeListener(`plugins.${pluginName}.${key}`, listener);
    },
    stop() {
        if (springs.length !== 0 && !isPluginEnabled("DisableAnimations")) {
            applySpringSkip(false);
        }
        springs = [];

        removeCss();
        stopCacheCleaner();
        applyBgFpsPatch(false);
        applyPresenceThrottle(false);

        for (const [key, listener] of Object.entries(listeners)) SettingsStore.removeChangeListener(`plugins.${pluginName}.${key}`, listener);
    }
} satisfies ToolkitModule;
