/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { findByPropsLazy, findStoreLazy } from "@webpack";
import { Constants, React, RestAPI } from "@webpack/common";

import plugins from "~plugins";

import { pluginName, settings } from "../settings";
import { ToolkitModule } from "../types";
import managedStyle from "./selfDestruct.css?managed";

const MessageActions = findByPropsLazy("deleteMessage", "startEditMessage");
const UserStore = findStoreLazy("UserStore");

interface TimerEntry {
    channelId: string;
    messageId: string;
    expiresAt: number;
    timerId: ReturnType<typeof setTimeout>;
    deleted: boolean;
}

const activeTimers = new Map<string, TimerEntry>();
const timerListeners = new Set<() => void>();

function notifyListeners() {
    for (const fn of timerListeners) {
        try { fn(); } catch { }
    }
}

const TICK_MS = 100;
let globalTick: ReturnType<typeof setInterval> | null = null;

function ensureGlobalTick() {
    if (globalTick || activeTimers.size === 0) return;
    globalTick = setInterval(() => {
        if (activeTimers.size === 0) {
            stopGlobalTick();
            return;
        }
        notifyListeners();
    }, TICK_MS);
}

function stopGlobalTick() {
    if (globalTick) {
        clearInterval(globalTick);
        globalTick = null;
    }
}

async function silentDeleteMessage(channelId: string, messageId: string): Promise<boolean> {
    try {
        const replacementText = settings.store.selfDestructReplacementText || "** **";
        const deleteDelay = 200;
        const suppressNotifications = true;

        const response = await RestAPI.post({
            url: Constants.Endpoints.MESSAGES(channelId),
            body: {
                content: replacementText,
                flags: suppressNotifications ? 4096 : 0,
                mobile_network_type: "unknown",
                nonce: messageId,
                tts: false,
            },
        });

        await new Promise(r => setTimeout(r, deleteDelay));
        await RestAPI.del({ url: Constants.Endpoints.MESSAGE(channelId, response.body.id) });
        await RestAPI.del({ url: Constants.Endpoints.MESSAGE(channelId, messageId) });

        return true;
    } catch {
        return false;
    }
}

const EXIT_DURATION_MS = 300;

function scheduleDelete(channelId: string, messageId: string, delaySec: number) {
    const expiresAt = Date.now() + delaySec * 1000;

    const timerId = setTimeout(() => {
        const entry = activeTimers.get(messageId);
        if (entry) entry.deleted = true;
        notifyListeners();

        (async () => {
            try {
                if (settings.store.selfDestructSilentMode) {
                    await silentDeleteMessage(channelId, messageId);
                } else {
                    MessageActions?.deleteMessage(channelId, messageId);
                }
            } catch (e) {
            }
        })();

        setTimeout(() => {
            activeTimers.delete(messageId);
            notifyListeners();
            if (activeTimers.size === 0) stopGlobalTick();
        }, EXIT_DURATION_MS);
    }, delaySec * 1000);

    activeTimers.set(messageId, {
        channelId,
        messageId,
        expiresAt,
        timerId,
        deleted: false,
    });

    ensureGlobalTick();
    notifyListeners();
}

function cancelTimer(messageId: string) {
    const entry = activeTimers.get(messageId);
    if (entry) {
        clearTimeout(entry.timerId);
        activeTimers.delete(messageId);
        notifyListeners();
        if (activeTimers.size === 0) stopGlobalTick();
    }
}

function cleanup() {
    for (const [, entry] of activeTimers) {
        clearTimeout(entry.timerId);
    }
    activeTimers.clear();
    timerListeners.clear();
    stopGlobalTick();
}

type BadgePhase = "hidden" | "active" | "exiting";

function TimerBadge({ messageId }: { messageId: string }) {
    const [remaining, setRemaining] = React.useState<number | null>(null);
    const [phase, setPhase] = React.useState<BadgePhase>("hidden");
    const exitingRef = React.useRef(false);

    React.useEffect(() => {
        exitingRef.current = false;

        function update() {
            const entry = activeTimers.get(messageId);

            if (!entry || entry.deleted) {
                if (exitingRef.current) return;
                exitingRef.current = true;
                setPhase("exiting");
                setTimeout(() => setPhase("hidden"), EXIT_DURATION_MS);
                return;
            }

            const msLeft = Math.max(0, entry.expiresAt - Date.now());
            setRemaining(Math.ceil(msLeft / 1000));
            setPhase("active");
        }

        update();
        timerListeners.add(update);
        return () => { timerListeners.delete(update); };
    }, [messageId]);

    if (phase === "hidden" || remaining === null) return null;

    const isSilent = settings.store.selfDestructSilentMode;
    const isUrgent = remaining <= 5;
    const isExiting = phase === "exiting";
    const enableLoader = settings.store.selfDestructEnableLoader ?? true;
    const baseColor = isSilent ? "#6366f1" : "#ed4245";

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "6px",
                padding: "6px 12px",
                borderRadius: "12px",
                backgroundColor: isSilent
                    ? `rgba(99, 102, 241, ${isUrgent ? 0.20 : 0.08})`
                    : `rgba(237, 66, 69, ${isUrgent ? 0.20 : 0.08})`,
                width: "fit-content",
                border: isUrgent ? `1px solid ${baseColor}40` : "none",
                boxShadow: isUrgent ? `0 0 20px ${baseColor}30` : "none",
                opacity: isExiting ? 0 : 1,
                transform: isExiting ? "translateY(-4px) scale(0.92)" : "translateY(0) scale(1)",
                transition: `opacity ${EXIT_DURATION_MS}ms ease, transform ${EXIT_DURATION_MS}ms ease, background-color 0.3s ease, box-shadow 0.3s ease`,
                animation: isExiting
                    ? undefined
                    : isUrgent
                        ? "vc-sd-pulse 0.8s ease-in-out infinite"
                        : "vc-sd-fade-in 0.3s ease-out",
            }}
            title={
                isSilent
                    ? "SelfDestruct + SilentDelete — this message will be silently deleted"
                    : "SelfDestruct — this message will be deleted automatically"
            }
        >
            {enableLoader ? (
                <div
                    className={`vc-sd-loader-message ${isSilent ? "silent" : ""}`}
                    style={{
                        width: "24px",
                        height: "24px",
                        background: baseColor,
                        borderRadius: "4px",
                        animation: isExiting ? "none" : "vc-sd-loader-flip 1s ease-in-out infinite",
                        display: "inline-block",
                        flexShrink: 0,
                    }}
                />
            ) : (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ flexShrink: 0, color: baseColor }}
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke={baseColor}
                        strokeWidth="2.5"
                        fill="none"
                    />
                    <path
                        d="M12 6v6l4 2"
                        stroke={baseColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                    style={{
                        fontSize: isUrgent ? "14px" : "13px",
                        fontWeight: isUrgent ? 700 : 600,
                        color: baseColor,
                        letterSpacing: isUrgent ? "0.02em" : "0",
                        textShadow: isUrgent ? `0 0 12px ${baseColor}40` : "none",
                    }}
                >
                    {formatTime(remaining)}
                </span>
                {isSilent && (
                    <span style={{ fontSize: "9px", color: baseColor, opacity: 0.5, fontWeight: 500 }}>
                        Silent mode
                    </span>
                )}
                {isUrgent && !isSilent && (
                    <span style={{ fontSize: "9px", color: "#ed4245", opacity: 0.6, fontWeight: 600 }}>
                        Deleting...
                    </span>
                )}
            </div>
        </div>
    );
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}s`;
}

function SelfDestructIcon({
    active,
    width = 20,
    height = 20,
}: {
    active?: boolean;
    width?: number;
    height?: number;
}) {
    const isSilent = settings.store.selfDestructSilentMode;
    const color = active ? (isSilent ? "#6366f1" : "#ed4245") : "currentColor";

    return (
        <svg
            aria-hidden="true"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            fill="none"
            viewBox="0 0 24 24"
            style={{ color }}
        >
            <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 3h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {!active && (
                <path
                    fill="var(--status-danger)"
                    d="M21.178 1.707 22.592 3.12 4.12 21.593l-1.414-1.415L21.178 1.707Z"
                />
            )}
        </svg>
    );
}

const SelfDestructButton: ChatBarButtonFactory = ({ isMainChat }) => {
    const [active, setActive] = React.useState(settings.store.selfDestructActive);

    if (!isMainChat) return null;

    function toggle() {
        settings.store.selfDestructActive = !settings.store.selfDestructActive;
        setActive(settings.store.selfDestructActive);
    }

    const delaySec = settings.store.selfDestructDelay ?? 30;
    const delayStr =
        delaySec >= 60
            ? `${Math.floor(delaySec / 60)}m${delaySec % 60 ? (delaySec % 60) + "s" : ""}`
            : `${delaySec}s`;

    const isSilent = settings.store.selfDestructSilentMode;

    const tooltip = active
        ? `SelfDestruct: ON (${delayStr})${isSilent ? " ✦ Silent" : ""} — click to disable`
        : "SelfDestruct: OFF — click to enable";

    return (
        <ChatBarButton
            tooltip={tooltip}
            onClick={toggle}
            onContextMenu={e => {
                e.preventDefault();
                openPluginModal(plugins[pluginName]);
            }}
        >
            <SelfDestructIcon active={active} width={20} height={20} />
        </ChatBarButton>
    );
};

export default {
    managedStyle,
    chatBarButton: {
        icon: () => <SelfDestructIcon active={settings.store.selfDestructActive} />,
        render: SelfDestructButton,
    },
    renderMessageAccessory(props: Record<string, any>) {
        const message = props?.message;
        if (!message?.id) return null;

        if (!activeTimers.has(message.id)) return null;

        return <TimerBadge messageId={message.id} />;
    },
    flux: {
        MESSAGE_CREATE({ message, optimistic }: { message: any; optimistic?: boolean }) {
            if (optimistic) return;
            if (!settings.store.selfDestructActive) return;
            if (!message?.id || !message?.channel_id) return;

            const currentUser = UserStore?.getCurrentUser?.();
            if (!currentUser || message.author?.id !== currentUser.id) return;

            const delaySec = settings.store.selfDestructDelay ?? 30;
            scheduleDelete(message.channel_id, message.id, delaySec);
        },
        MESSAGE_DELETE({ id }: { id: string }) {
            const entry = activeTimers.get(id);
            if (entry) {
                clearTimeout(entry.timerId);
                activeTimers.delete(id);
                notifyListeners();
                if (activeTimers.size === 0) stopGlobalTick();
            }
        },
    },
    start() {
    },
    stop() {
        cleanup();
    }
} satisfies ToolkitModule;
