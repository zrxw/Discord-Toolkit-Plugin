/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { Alerts, ChannelStore, Menu, RestAPI, showToast } from "@webpack/common";

import { ToolkitModule } from "../types";

const strings = {
    noDMs: "No DMs to close",
    closeAllTitle: "Close all DMs",
    close: "Close",
    cancel: "Cancel",
    confirmBody: "Are you sure you want to close all your DMs? Your messages will not be deleted, but the conversations will disappear from your list.",
    closing: (count: number) => `Closing ${count} DMs...`,
    closed: (closed: number, total: number) => `Closed ${closed}/${total} DMs`,
};

async function closeChannelReliably(channelId: string, maxRetries = 3): Promise<boolean> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            await RestAPI.del({ url: `/channels/${channelId}` });
            return true;
        } catch (e: any) {
            const status = e?.status || e?.statusCode;
            if (status === 429) {
                const retryAfter = e?.body?.retry_after ?? 1.5;
                const delay = retryAfter < 100 ? retryAfter * 1000 : retryAfter;
                await new Promise(r => setTimeout(r, delay + 100));
            } else {
                return false;
            }
        }
    }
    return false;
}

async function clearAllDMs() {
    const channels = Object.values(ChannelStore.getMutablePrivateChannels() ?? {})
        .filter((c: any) => c.type === 1);
    if (channels.length === 0) {
        showToast({ text: strings.noDMs });
        return;
    }

    Alerts.show({
        title: strings.closeAllTitle,
        confirmText: strings.close,
        cancelText: strings.cancel,
        body: (
            <div style={{ color: "#dbdee1" }}>
                {strings.confirmBody}
            </div>
        ),
        onConfirm: async () => {
            showToast({ text: strings.closing(channels.length) });
            let closedCount = 0;
            for (const ch of channels) {
                const success = await closeChannelReliably(ch.id);
                if (success) closedCount++;
                await new Promise(r => setTimeout(r, 100));
            }
            showToast({ text: strings.closed(closedCount, channels.length), variant: "success" });
        }
    });
}

const ContextMenuPatch: NavContextMenuPatchCallback = (children, ctx: { channel?: any; message?: any; } = {}) => {
    const { channel, message } = ctx;
    if (!channel || message) return;

    const isPrivateDM = channel.type === 1 || channel.type === 3 || (typeof channel.isPrivate === "function" && channel.isPrivate());
    if (!isPrivateDM) return;

    children.unshift(
        <Menu.MenuGroup key="vc-cleardms-group">
            <Menu.MenuItem
                key="clear-all-dms"
                id="vc-clear-all-dms"
                label={strings.closeAllTitle}
                color="danger"
                action={clearAllDMs}
            />
            <Menu.MenuSeparator key="separator-cleardms" />
        </Menu.MenuGroup>
    );
};

export default {
    contextMenus: {
        "channel-context": ContextMenuPatch,
        "gdm-context": ContextMenuPatch,
        "user-context": ContextMenuPatch,
    }
} satisfies ToolkitModule;
