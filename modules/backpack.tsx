/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton, ChatBarButtonFactory, ChatBarButtonMap, ChatBarProps } from "@api/ChatButtons";
import { get, set } from "@api/DataStore";
import ErrorBoundary from "@components/ErrorBoundary";
import { ContextMenuApi, Menu, Popout, React, Tooltip, useEffect, useRef, useState } from "@webpack/common";

import { ToolkitModule } from "../types";
import managedStyle from "./backpack.css?managed";

const STORE_KEY = "Backpack_packedButtons";

async function loadPacked(): Promise<string[]> {
    try { return (await get<string[]>(STORE_KEY)) ?? []; }
    catch { return []; }
}

async function savePacked(ids: string[]) {
    try { await set(STORE_KEY, ids); } catch { }
}

const packedSet = new Set<string>();
const packedDataCache = new Map<string, any>();
const updateListeners: Set<() => void> = new Set();

function notifyChange() {
    updateListeners.forEach(fn => fn());
}

function useBackpack() {
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const listener = () => forceUpdate(n => n + 1);
        updateListeners.add(listener);
        return () => { updateListeners.delete(listener); };
    }, []);
    return {
        packed: Array.from(packedSet),
        available: Array.from(ChatBarButtonMap.keys()).filter(id => id !== "Backpack" && !packedSet.has(id))
    };
}

async function packButton(id: string) {
    if (packedSet.has(id)) return;
    const data = ChatBarButtonMap.get(id);
    if (data) {
        packedDataCache.set(id, data);
        ChatBarButtonMap.delete(id);
    }
    packedSet.add(id);
    await savePacked([...packedSet]);
    notifyChange();
}

async function unpackButton(id: string) {
    if (!packedSet.has(id)) return;
    const data = packedDataCache.get(id);
    if (data) {
        ChatBarButtonMap.set(id, data);
        packedDataCache.delete(id);
    }
    packedSet.delete(id);
    await savePacked([...packedSet]);
    notifyChange();
}

function ChevronUpIcon(props: Record<string, any>) {
    const { width = 20, height = 20, ...rest } = props;
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
            <path fill="currentColor" d="M3.3 15.7a1 1 0 0 0 1.4 0L12 8.42l7.3 7.3a1 1 0 0 0 1.4-1.42l-8-8a1 1 0 0 0-1.4 0l-8 8a1 1 0 0 0 0 1.42Z" />
        </svg>
    );
}

function ChevronDownIcon(props: Record<string, any>) {
    const { width = 20, height = 20, ...rest } = props;
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
            <path fill="currentColor" d="M5.3 9.3a1 1 0 0 1 1.4 0l5.3 5.29 5.3-5.3a1 1 0 1 1 1.4 1.42l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.42Z" />
        </svg>
    );
}

function BackpackPopout({ chatBarProps, closePopout }: { chatBarProps: ChatBarProps; closePopout: () => void; }) {
    const { packed: packedIds } = useBackpack();
    const packed = packedIds
        .filter(id => ChatBarButtonMap.has(id) || packedDataCache.has(id))
        .map(id => {
            const data = ChatBarButtonMap.get(id) || packedDataCache.get(id);
            return { id, data };
        })
        .filter(item => item.data) as { id: string; data: any }[];

    const popoutContainerRef = useRef<HTMLDivElement>(null);

    if (packed.length === 0) {
        return (
            <div className="backpack-popout-horizontal-empty">
                Right-click to pack plugins
            </div>
        );
    }

    return (
        <div className="backpack-popout-horizontal" ref={popoutContainerRef} style={{ overflow: "visible" }}>
            {packed.map(({ id, data }) => (
                <Tooltip text={id} key={id}>
                    {(tooltipProps: any) => (
                        <div
                            className="backpack-item-horizontal"
                            {...tooltipProps}
                            style={{ overflow: "visible" }}
                        >
                            <ErrorBoundary noop>
                                <data.render
                                    {...chatBarProps}
                                    isMainChat={true}
                                    isAnyChat={true}
                                    popoutContainer={popoutContainerRef.current}
                                />
                            </ErrorBoundary>
                        </div>
                    )}
                </Tooltip>
            ))}
        </div>
    );
}

function BackpackContextMenu() {
    const { packed, available } = useBackpack();

    return (
        <Menu.Menu navId="backpack-context" onClose={ContextMenuApi.closeContextMenu}>
            <Menu.MenuGroup label="Pack Plugins into Backpack">
                {Array.from(ChatBarButtonMap.keys())
                    .filter(id => id !== "Backpack")
                    .sort()
                    .map(id => {
                        const isPacked = packedSet.has(id);
                        return (
                            <Menu.MenuCheckboxItem
                                key={`bp-toggle-${id}`}
                                id={`bp-toggle-${id}`}
                                label={id}
                                checked={isPacked}
                                action={() => isPacked ? unpackButton(id) : packButton(id)}
                            />
                        );
                    })}
            </Menu.MenuGroup>
        </Menu.Menu>
    );
}

const BackpackChatBarButton: ChatBarButtonFactory = props => {
    const { isMainChat, ...chatBarProps } = props;
    const [isOpen, setIsOpen] = useState(false);
    const [count, setCount] = useState(packedSet.size);
    const popoutRef = useRef<HTMLDivElement>(null);
    const overlayCount = useRef(0);

    useEffect(() => {
        const listener = () => {
            setCount(packedSet.size);
        };
        updateListeners.add(listener);
        return () => { updateListeners.delete(listener); };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            overlayCount.current = 0;
            return;
        }

        const bodyChildrenAtOpen = new Set(Array.from(document.body.children));

        function looksLikeOverlay(node: HTMLElement): boolean {
            if (!bodyChildrenAtOpen.has(node)) return true;
            const cls = node.className?.toString() ?? "";
            return ["layerContainer", "focusLock", "backdrop", "modal"].some(p => cls.includes(p));
        }

        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of Array.from(m.addedNodes)) {
                    if (node instanceof HTMLElement && looksLikeOverlay(node)) {
                        overlayCount.current++;
                    }
                }
                for (const node of Array.from(m.removedNodes)) {
                    if (node instanceof HTMLElement && looksLikeOverlay(node)) {
                        overlayCount.current = Math.max(0, overlayCount.current - 1);
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: false });

        return () => {
            observer.disconnect();
            overlayCount.current = 0;
        };
    }, [isOpen]);

    if (!isMainChat) return null;

    return (
        <Popout
            targetElementRef={popoutRef}
            renderPopout={() => <BackpackPopout chatBarProps={chatBarProps as any as ChatBarProps} closePopout={() => setIsOpen(false)} />}
            shouldShow={isOpen}
            onRequestClose={() => {
                if (overlayCount.current > 0) return;
                setIsOpen(false);
            }}
            position="top"
            align="right"
            spacing={8}
        >
            {(_, { isShown }) => (
                <ChatBarButton
                    tooltip={`Backpack${count > 0 ? ` (${count})` : ""}`}
                    onClick={() => setIsOpen(v => !v)}
                    onContextMenu={(e: React.MouseEvent) => {
                        e.preventDefault();
                        ContextMenuApi.openContextMenu(e, (props: any) => (
                            <ErrorBoundary noop>
                                <BackpackContextMenu {...props} />
                            </ErrorBoundary>
                        ));
                    }}
                >
                    <div ref={popoutRef as any} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        {isOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
                        {count > 0 && <div className="backpack-badge">{count}</div>}
                    </div>
                </ChatBarButton>
            )}
        </Popout>
    );
};

async function isExistingUser(): Promise<boolean> {
    try {
        if (await get<boolean>("GonToolkit_installed")) return true;
        if ((await get<any>("Vencord_existingPlugins")) !== undefined) return true;
        if ((await get<any>("TokenImporter_accounts")) !== undefined) return true;
        if ((await get<any>("SaveProfile_presets")) !== undefined) return true;
        if ((await get<any>("Vencord_cloudSecret")) !== undefined) return true;
    } catch { }
    return false;
}

export default {
    managedStyle,
    chatBarButton: {
        icon: ChevronUpIcon,
        render: BackpackChatBarButton,
    },
    async start() {
        const rawPacked = await get<string[] | null>(STORE_KEY);

        if (rawPacked === null || rawPacked === undefined) {
            const existingUser = await isExistingUser();
            if (existingUser) {
                await savePacked([]);
                await set("GonToolkit_installed", true);
            } else {
                await new Promise(r => setTimeout(r, 500));
                const allIds = Array.from(ChatBarButtonMap.keys()).filter(id => id !== "Backpack");
                for (const id of allIds) {
                    const data = ChatBarButtonMap.get(id);
                    if (data) {
                        packedDataCache.set(id, data);
                        ChatBarButtonMap.delete(id);
                    }
                    packedSet.add(id);
                }
                await savePacked([...packedSet]);
                await set("GonToolkit_installed", true);
            }
        } else {
            for (const id of rawPacked) {
                if (ChatBarButtonMap.has(id)) {
                    const data = ChatBarButtonMap.get(id);
                    if (data) {
                        packedDataCache.set(id, data);
                        ChatBarButtonMap.delete(id);
                    }
                }
                packedSet.add(id);
            }
            await set("GonToolkit_installed", true);
        }
        notifyChange();
    },
    stop() {
        for (const [id, data] of packedDataCache) {
            ChatBarButtonMap.set(id, data);
        }
        packedDataCache.clear();
        packedSet.clear();
        notifyChange();
    }
} satisfies ToolkitModule;
