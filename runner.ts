/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addChatBarButton, removeChatBarButton } from "@api/ChatButtons";
import { registerCommand, unregisterCommand } from "@api/Commands";
import { addContextMenuPatch, removeContextMenuPatch } from "@api/ContextMenu";
import { addHeaderBarButton, removeHeaderBarButton } from "@api/HeaderBar";
import { addMessageAccessory, removeMessageAccessory } from "@api/MessageAccessories";
import { addMemberListDecorator, removeMemberListDecorator } from "@api/MemberListDecorators";
import { addMessageDecoration, removeMessageDecoration } from "@api/MessageDecorations";
import { addNicknameIcon, removeNicknameIcon } from "@api/NicknameIcons";
import { disableStyle, enableStyle } from "@api/Styles";
import { addUserAreaButton, removeUserAreaButton } from "@api/UserArea";
import { FluxDispatcher } from "@webpack/common";

import { pluginName } from "./settings";
import { ToolkitModule } from "./types";

const running = new Set<string>();

export function startModule(id: string, module: ToolkitModule) {
    if (running.has(id)) return;
    running.add(id);

    module.start?.();
    module.commands?.forEach(command => registerCommand(command, pluginName));
    for (const [event, handler] of Object.entries(module.flux ?? {})) if (handler) FluxDispatcher.subscribe(event, handler);
    for (const [navId, patch] of Object.entries(module.contextMenus ?? {})) addContextMenuPatch(navId, patch);
    if (module.managedStyle) enableStyle(module.managedStyle);
    if (module.chatBarButton) addChatBarButton(id, module.chatBarButton.render, module.chatBarButton.icon);
    if (module.headerBarButton) addHeaderBarButton(id, module.headerBarButton.render, module.headerBarButton.priority);
    if (module.userAreaButton) addUserAreaButton(id, module.userAreaButton.render, module.userAreaButton.priority);
    if (module.renderMessageAccessory) addMessageAccessory(id, module.renderMessageAccessory);
    if (module.renderNicknameIcon) addNicknameIcon(id, module.renderNicknameIcon);
    if (module.renderMemberListDecorator) addMemberListDecorator(id, module.renderMemberListDecorator);
    if (module.renderMessageDecoration) addMessageDecoration(id, module.renderMessageDecoration);
}

export function stopModule(id: string, module: ToolkitModule) {
    if (!running.delete(id)) return;

    module.stop?.();
    module.commands?.forEach(command => unregisterCommand(command.name));
    for (const [event, handler] of Object.entries(module.flux ?? {})) if (handler) FluxDispatcher.unsubscribe(event, handler);
    for (const [navId, patch] of Object.entries(module.contextMenus ?? {})) removeContextMenuPatch(navId, patch);
    if (module.managedStyle) disableStyle(module.managedStyle);
    if (module.chatBarButton) removeChatBarButton(id);
    if (module.headerBarButton) removeHeaderBarButton(id);
    if (module.userAreaButton) removeUserAreaButton(id);
    if (module.renderMessageAccessory) removeMessageAccessory(id);
    if (module.renderNicknameIcon) removeNicknameIcon(id);
    if (module.renderMemberListDecorator) removeMemberListDecorator(id);
    if (module.renderMessageDecoration) removeMessageDecoration(id);
}
