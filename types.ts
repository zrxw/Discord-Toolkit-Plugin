/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PluginDef } from "@utils/types";

export type ToolkitModule = Pick<PluginDef,
    "start" | "stop" | "commands" | "contextMenus" | "flux" | "managedStyle" |
    "chatBarButton" | "headerBarButton" | "userAreaButton" | "renderMessageAccessory" |
    "renderNicknameIcon" | "renderMemberListDecorator" | "renderMessageDecoration" | "settings" | "patches"
>;
