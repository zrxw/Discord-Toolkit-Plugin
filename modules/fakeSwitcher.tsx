/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addContextMenuPatch, NavContextMenuPatchCallback, removeContextMenuPatch } from "@api/ContextMenu";
import { addHeaderBarButton, HeaderBarButton, removeHeaderBarButton } from "@api/HeaderBar";
import { DataStore } from "@api/index";
import { findStoreLazy, waitFor } from "@webpack";
import { FluxDispatcher, Menu, React, UserStore } from "@webpack/common";

import { ToolkitModule } from "../types";

const UserProfileStore = findStoreLazy("UserProfileStore");
const EmojiStore = findStoreLazy("EmojiStore");
const DS_KEY = "fakeAccount_switcher";

let fakeAccounts: any[] = [];
let activeFakeId: string | null = null;
let realUserSnapshot: any = null;
let _store: any = null;
let _origGetUsers: (() => any[]) | null = null;
let _origGetValidUsers: (() => any[]) | null = null;

function isMultiAccountStore(mod: any): boolean {
    try {
        if (typeof mod.getUsers !== "function") return false;
        if (typeof mod.getValidUsers !== "function" && typeof mod.getHasLoggedInAccounts !== "function") return false;

        const users = mod.getUsers();
        if (!Array.isArray(users)) return false;

        if (users.length > 0) {
            const first = users[0];
            if (typeof first !== "object" || first === null) return false;
            if (typeof first.id !== "string") return false;
            if (!("tokenStatus" in first) && !("pushSyncToken" in first)) {
                if ("type" in first || "permissions" in first || "parentId" in first) return false;
            }
        }

        if (typeof mod.getFrequentlyUsedEmojis === "function") return false;

        return true;
    } catch {
        return false;
    }
}

function patchStore() {
    if (!_store || _origGetUsers) return;

    _origGetUsers = _store.getUsers.bind(_store);
    _origGetValidUsers = _store.getValidUsers?.bind(_store) ?? (() => []);

    _store.getUsers = () => {
        const real: any[] = _origGetUsers?.() ?? [];
        const realIds = new Set(real.map((u: any) => u.id));
        const extras = fakeAccounts
            .filter(f => !realIds.has(f.id))
            .map(f => ({
                id: f.id,
                username: f.username,
                globalName: f.globalName ?? f.username,
                discriminator: f.discriminator ?? "0",
                avatar: f.avatar ?? null,
                tokenStatus: 2,
                pushSyncToken: null,
            }));
        return [...real, ...extras];
    };

    _store.getValidUsers = () => {
        const real: any[] = _origGetValidUsers?.() ?? [];
        const realIds = new Set(real.map((u: any) => u.id));
        const extras = fakeAccounts
            .filter(f => !realIds.has(f.id))
            .map(f => ({
                id: f.id,
                username: f.username,
                globalName: f.globalName ?? f.username,
                discriminator: f.discriminator ?? "0",
                avatar: f.avatar ?? null,
                tokenStatus: 2,
                pushSyncToken: null,
            }));
        return [...real, ...extras.filter(e => !realIds.has(e.id))];
    };

    _store.getHasLoggedInAccounts = () => true;
}

function unpatchStore() {
    if (!_store || !_origGetUsers) return;
    _store.getUsers = _origGetUsers;
    if (_origGetValidUsers) _store.getValidUsers = _origGetValidUsers;
    _origGetUsers = null;
    _origGetValidUsers = null;
    _store.emitChange?.();
}

function simulateSwitch(fake: any) {
    const me = UserStore.getCurrentUser();
    if (!me) return;

    if (!realUserSnapshot) {
        realUserSnapshot = {
            username: me.username,
            globalName: (me as any).globalName ?? me.username,
            avatar: me.avatar,
            banner: (me as any).banner ?? null,
            bio: (me as any).bio ?? "",
            accentColor: (me as any).accentColor ?? null,
            discriminator: me.discriminator ?? "0",
            publicFlags: (me as any).publicFlags ?? 0,
            flags: (me as any).flags ?? 0,
            premiumType: (me as any).premiumType ?? 0,
        };
    }

    activeFakeId = fake.id;

    FluxDispatcher.dispatch({
        type: "USER_UPDATE",
        user: {
            id: me.id,
            username: fake.username,
            global_name: fake.globalName ?? fake.username,
            avatar: fake.avatar ?? null,
            banner: fake._banner ?? null,
            bio: fake._bio ?? "",
            accent_color: fake._accentColor ?? null,
            discriminator: fake.discriminator ?? "0",
            public_flags: fake._publicFlags ?? 0,
            flags: fake._flags ?? 0,
            premium_type: fake._premiumType ?? 0,
        },
    });

    try {
        const updated = UserStore.getCurrentUser();
        if (updated) FluxDispatcher.dispatch({ type: "CURRENT_USER_UPDATE", user: { ...updated } });
        FluxDispatcher.dispatch({ type: "IDLE" });
    } catch { }

    _store?.emitChange?.();
}

function restoreRealAccount() {
    if (!realUserSnapshot) return;
    const me = UserStore.getCurrentUser();
    if (!me) return;

    FluxDispatcher.dispatch({
        type: "USER_UPDATE",
        user: {
            id: me.id,
            username: realUserSnapshot.username,
            global_name: realUserSnapshot.globalName,
            avatar: realUserSnapshot.avatar ?? null,
            banner: realUserSnapshot.banner ?? null,
            bio: realUserSnapshot.bio ?? "",
            accent_color: realUserSnapshot.accentColor ?? null,
            discriminator: realUserSnapshot.discriminator ?? "0",
            public_flags: realUserSnapshot.publicFlags ?? 0,
            flags: realUserSnapshot.flags ?? 0,
            premium_type: realUserSnapshot.premiumType ?? 0,
        },
    });

    activeFakeId = null;
    realUserSnapshot = null;

    try {
        const updated = UserStore.getCurrentUser();
        if (updated) FluxDispatcher.dispatch({ type: "CURRENT_USER_UPDATE", user: { ...updated } });
        FluxDispatcher.dispatch({ type: "USER_SETTINGS_PROTO_UPDATE", settings: { type: 1, proto: {} } });
        FluxDispatcher.dispatch({ type: "IDLE" });
    } catch { }

    _store?.emitChange?.();
}

function onSwitchFailure(action: any) {
    const userId = action.userId ?? action.user_id ?? action.id;
    const fake = fakeAccounts.find(f => f.id === userId);
    if (!fake) return;
    simulateSwitch(fake);
}

function onSwitchAttempt(action: any) {
    const userId = action.userId ?? action.user_id ?? action.id;
    const fake = fakeAccounts.find(f => f.id === userId);
    if (!fake) return;
    simulateSwitch(fake);
}

function onRemoveAccount(action: any) {
    const userId = action.userId ?? action.user_id ?? action.id;
    if (!userId) return;

    const idx = fakeAccounts.findIndex(f => f.id === userId);
    if (idx === -1) return;

    if (activeFakeId === userId) {
        restoreRealAccount();
    }

    fakeAccounts.splice(idx, 1);
    DataStore.set(DS_KEY, fakeAccounts.map(f => f.id));

    _store?.emitChange?.();
}

function addToSwitcher(userId: string) {
    if (fakeAccounts.find(f => f.id === userId)) return;

    const user = UserStore.getUser(userId);
    const profile = UserProfileStore.getUserProfile?.(userId) ?? {};
    const username = user?.username ?? `User_${userId.slice(-4)}`;
    const bot = user?.bot ?? false;

    fakeAccounts.push({
        id: userId,
        username,
        globalName: (user as any)?.globalName ?? username,
        discriminator: user?.discriminator ?? "0",
        avatar: user?.avatar ?? null,
        bot,
        _bio: profile.bio ?? "",
        _banner: profile.banner ?? null,
        _accentColor: profile.accentColor ?? null,
        _publicFlags: (user as any)?.publicFlags ?? 0,
        _flags: (user as any)?.flags ?? 0,
        _premiumType: (user as any)?.premiumType ?? 0,
    });

    DataStore.set(DS_KEY, fakeAccounts.map(f => f.id));
    patchStore();
    _store?.emitChange?.();
}

function RestoreIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
        </svg>
    );
}

function RestoreButton() {
    const [active, setActive] = React.useState(!!activeFakeId);
    React.useEffect(() => {
        const t = setInterval(() => setActive(!!activeFakeId), 300);
        return () => clearInterval(t);
    }, []);
    if (!active) return null;
    return (
        <HeaderBarButton
            icon={RestoreIcon}
            tooltip={"Fake account active — click to restore your real account"}
            onClick={() => { restoreRealAccount(); setActive(false); }}
        />
    );
}

function FakeAccountIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
    );
}

const ctxPatch: NavContextMenuPatchCallback = (children, { user }) => {
    if (!children || !Array.isArray(children)) return;
    try {
        if (!user || user.id === UserStore.getCurrentUser()?.id) return;
        children.push(
            <Menu.MenuItem
                id="fake-account-add"
                label={"Add to Switcher (Fake)"}
                icon={FakeAccountIcon}
                action={() => addToSwitcher(user.id)}
            />
        );
    } catch (e) {
        console.error("[FakeAccount] Context menu patch error:", e);
    }
};

export default {
    async start() {
        FluxDispatcher.subscribe("MULTI_ACCOUNT_SWITCH_FAILURE", onSwitchFailure);
        FluxDispatcher.subscribe("MULTI_ACCOUNT_SWITCH_ATTEMPT", onSwitchAttempt);
        FluxDispatcher.subscribe("MULTI_ACCOUNT_REMOVE_ACCOUNT", onRemoveAccount);

        addContextMenuPatch("user-context", ctxPatch);
        addContextMenuPatch("user-profile-actions", ctxPatch);
        addHeaderBarButton("fake-account-restore", () => <RestoreButton />, 5);

        waitFor(["getUsers", "getValidUsers", "getHasLoggedInAccounts"], async (mod: any) => {
            if (!isMultiAccountStore(mod)) return;

            _store = mod;

            const savedIds: string[] = (await DataStore.get(DS_KEY)) ?? [];
            for (const id of savedIds) {
                if (fakeAccounts.find(f => f.id === id)) continue;
                const user = UserStore.getUser(id);
                if (!user) continue;
                const profile = UserProfileStore.getUserProfile?.(id) ?? {};
                const bot = user.bot ?? false;
                fakeAccounts.push({
                    id: user.id,
                    username: user.username,
                    globalName: (user as any).globalName ?? user.username,
                    discriminator: user.discriminator ?? "0",
                    avatar: user.avatar ?? null,
                    bot,
                    _bio: profile.bio ?? "",
                    _banner: profile.banner ?? null,
                    _accentColor: profile.accentColor ?? null,
                    _publicFlags: (user as any).publicFlags ?? 0,
                    _flags: (user as any).flags ?? 0,
                    _premiumType: (user as any).premiumType ?? 0,
                });
            }

            patchStore();
            setTimeout(() => mod.emitChange?.(), 500);
        });
    },
    stop() {
        FluxDispatcher.unsubscribe("MULTI_ACCOUNT_SWITCH_FAILURE", onSwitchFailure);
        FluxDispatcher.unsubscribe("MULTI_ACCOUNT_SWITCH_ATTEMPT", onSwitchAttempt);
        FluxDispatcher.unsubscribe("MULTI_ACCOUNT_REMOVE_ACCOUNT", onRemoveAccount);
        removeContextMenuPatch("user-context", ctxPatch);
        removeContextMenuPatch("user-profile-actions", ctxPatch);
        removeHeaderBarButton("fake-account-restore");
        if (activeFakeId) restoreRealAccount();
        fakeAccounts = [];
        unpatchStore();
        _store = null;
    }
} satisfies ToolkitModule;
