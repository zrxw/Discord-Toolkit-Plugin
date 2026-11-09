/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { findByPropsLazy } from "@webpack";
import { Menu, RelationshipStore } from "@webpack/common";
import { RelationshipType } from "@vencord/discord-types/enums";

const relationshipActions = findByPropsLazy("cancelFriendRequest", "addRelationship");

const userContextPatch: NavContextMenuPatchCallback = (children, { user }) => {
    if (!user || RelationshipStore.getRelationshipType(user.id) !== RelationshipType.OUTGOING_REQUEST) return;

    children.push(
        <Menu.MenuItem
            id="gon-toolkit-cancel-outgoing-friend-request"
            label="Cancel outgoing friend request"
            action={() => relationshipActions.cancelFriendRequest(user.id)}
        />
    );
};

export default {
    contextMenus: {
        "user-profile-overflow-menu": userContextPatch
    }
};
