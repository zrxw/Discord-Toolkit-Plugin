/*
 * Gon Toolkit
 * Copyright (c) 2026 tlwm
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { definePluginSettings, migratePluginSettings, Settings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const pluginName = "Gon Toolkit";

const hiddenUnless = (toggle: string) => () => !Settings.plugins[pluginName]?.[toggle];

export const settings = definePluginSettings({
    language: {
        type: OptionType.SELECT,
        displayName: "Language / Idioma",
        description: "Choose the language used by Gon Toolkit.",
        options: [
            { label: "English", value: "en", default: true },
            { label: "Portugu\u00eas (Brasil)", value: "pt-BR" }
        ]
    },
    enableBackpack: {
        type: OptionType.BOOLEAN,
        displayName: "Chat Tools · Backpack",
        description: "Organize chat bar buttons into a backpack. Left click to use packed buttons, right click to pack or unpack them.",
        default: true
    },
    enableAutoQuests: {
        type: OptionType.BOOLEAN,
        displayName: "Automation · Auto Quests",
        description: "Automatically complete supported Discord quest tasks.",
        default: false
    },
    enableBulkFriendRemove: {
        type: OptionType.BOOLEAN,
        displayName: "Friends · Bulk Friend Remove",
        description: "Remove multiple friends at once from a header bar button.",
        default: true
    },
    enableExportDM: {
        type: OptionType.BOOLEAN,
        displayName: "Export DMs",
        description: "Export direct messages and group conversations to common file formats.",
        default: false
    },
    enablePlatformIndicators: {
        type: OptionType.BOOLEAN,
        displayName: "Platform Indicators",
        description: "Show whether users are active on desktop, mobile, web, console, or VR.",
        default: true
    },
    enablePlatformSpoofer: {
        type: OptionType.BOOLEAN,
        displayName: "Account · Platform Spoofer",
        description: "Change the platform or device reported by your Discord client.",
        default: false
    },
    enableServerCloner: {
        type: OptionType.BOOLEAN,
        displayName: "Servers · Server Cloner",
        description: "Copy selected server structure and settings into another server you manage.",
        default: false
    },
    enableCancelFriendRequest: {
        type: OptionType.BOOLEAN,
        displayName: "Friends · Cancel Friend Request",
        description: "Cancel an outgoing friend request from the user's profile menu.",
        default: true
    },
    enableClearDMs: {
        type: OptionType.BOOLEAN,
        displayName: "Direct Messages · Clear DMs",
        description: "Close all your DMs at once from the context menu.",
        default: false
    },
    enableDmPurger: {
        type: OptionType.BOOLEAN,
        displayName: "Direct Messages · DM Purger",
        description: "Purge direct messages and group chats using your Discord data package.",
        default: false
    },
    enableFakeDM: {
        type: OptionType.BOOLEAN,
        displayName: "Chat Tools · Fake DM",
        description: "Inject fake local messages into DMs and group DMs from a chat bar button.",
        default: true
    },
    enableFakeSwitcher: {
        type: OptionType.BOOLEAN,
        displayName: "Accounts · Fake Switcher",
        description: "Add users to the account switcher and take on their appearance locally.",
        default: false
    },
    enableFakeVoice: {
        type: OptionType.BOOLEAN,
        displayName: "Voice · Fake Voice",
        description: "Appear muted or deafened while still listening.",
        default: true
    },
    enableFastDiscord: {
        type: OptionType.BOOLEAN,
        displayName: "Performance · Fast Discord",
        description: "Reduce animations, media, cache, background FPS and presence traffic for a smoother client.",
        default: false,
        restartNeeded: true
    },
    enableMessageCleaner: {
        type: OptionType.BOOLEAN,
        displayName: "Messages · Message Cleaner",
        description: "Clean your messages across DMs, servers and channels from a header bar button and context menus.",
        default: true
    },
    enablePreviewMessage: {
        type: OptionType.BOOLEAN,
        displayName: "Messages · Preview Message",
        description: "Hover a DM with unread messages to preview them without opening the conversation.",
        default: false
    },
    enableSelfDestruct: {
        type: OptionType.BOOLEAN,
        displayName: "Messages · Self Destruct",
        description: "Send messages that delete themselves after a delay.",
        default: true
    },
    enableSilentDelete: {
        type: OptionType.BOOLEAN,
        displayName: "Messages · Silent Delete",
        description: "Replace a message with a placeholder before deleting it so message loggers keep nothing.",
        default: true
    },
    enableSilentEdit: {
        type: OptionType.BOOLEAN,
        displayName: "Messages · Silent Edit",
        description: "Edit a message without the edited tag and without leaving the original in message loggers.",
        default: true
    },

    selfDestructActive: {
        type: OptionType.BOOLEAN,
        description: "Self Destruct is active. Also toggled from the chat bar.",
        default: false,
        hidden: hiddenUnless("enableSelfDestruct")
    },
    selfDestructDelay: {
        type: OptionType.SLIDER,
        description: "Seconds before a Self Destruct message is deleted.",
        markers: [5, 10, 15, 30, 60, 120, 300, 600],
        default: 30,
        stickToMarkers: true,
        hidden: hiddenUnless("enableSelfDestruct")
    },
    selfDestructSilentMode: {
        type: OptionType.BOOLEAN,
        description: "Use Silent Delete style replacement before deleting.",
        default: true,
        hidden: hiddenUnless("enableSelfDestruct")
    },
    selfDestructReplacementText: {
        type: OptionType.STRING,
        description: "Text that replaces the message when silent mode is on.",
        default: "** **",
        hidden: hiddenUnless("enableSelfDestruct")
    },
    selfDestructEnableLoader: {
        type: OptionType.BOOLEAN,
        description: "Show the 3D flip loader on the timer badge.",
        default: true,
        hidden: hiddenUnless("enableSelfDestruct")
    },

    silentDeleteReplacementText: {
        type: OptionType.STRING,
        description: "Text that replaces the message before deletion.",
        default: "** **",
        hidden: hiddenUnless("enableSilentDelete")
    },
    silentDeleteDeleteDelay: {
        type: OptionType.NUMBER,
        description: "Milliseconds before the replacement message is deleted. 100 to 500 is recommended.",
        default: 200,
        hidden: hiddenUnless("enableSilentDelete")
    },
    silentDeleteSuppressNotifications: {
        type: OptionType.BOOLEAN,
        description: "Suppress notifications when replacing the message so mentioned users are not pinged.",
        default: true,
        hidden: hiddenUnless("enableSilentDelete")
    },
    silentDeleteDeleteOriginal: {
        type: OptionType.BOOLEAN,
        description: "Delete the original message from the server. Otherwise it comes back after a client restart.",
        default: true,
        hidden: hiddenUnless("enableSilentDelete")
    },
    silentDeletePurgeInterval: {
        type: OptionType.NUMBER,
        description: "Milliseconds between deletions during /silentpurge. 500 to 1000 avoids rate limits.",
        default: 500,
        hidden: hiddenUnless("enableSilentDelete")
    },

    silentEditDeleteOriginalMessage: {
        type: OptionType.BOOLEAN,
        description: "Delete the original server side message after a silent edit. Otherwise it comes back after a reload.",
        default: true,
        hidden: hiddenUnless("enableSilentEdit")
    },
    silentEditDeleteDelay: {
        type: OptionType.NUMBER,
        description: "Milliseconds before the original message is deleted.",
        default: 500,
        hidden: hiddenUnless("enableSilentEdit")
    },
    silentEditSuppressNotifications: {
        type: OptionType.BOOLEAN,
        description: "Recommended in DMs to prevent pinging users.",
        default: false,
        hidden: hiddenUnless("enableSilentEdit")
    },

    fastDiscordDisableSpringAnimations: {
        type: OptionType.BOOLEAN,
        description: "Disable spring animations in buttons, modals and transitions.",
        default: true,
        disabled: () => isPluginEnabled("DisableAnimations"),
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordDisableTypingDots: {
        type: OptionType.BOOLEAN,
        description: "Hide the typing dots animation.",
        default: true,
        disabled: () => isPluginEnabled("NoTypingAnimation"),
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordNoGifAvatars: {
        type: OptionType.BOOLEAN,
        description: "Block animated GIF avatars in lists and messages.",
        default: true,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordNoAnimatedEmoji: {
        type: OptionType.BOOLEAN,
        description: "Disable emoji animations.",
        default: false,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordNoStickers: {
        type: OptionType.BOOLEAN,
        description: "Stop Lottie stickers from autoplaying.",
        default: false,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordNoActivities: {
        type: OptionType.BOOLEAN,
        description: "Hide the activities section in the member list.",
        default: false,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordNoVideoAutoplay: {
        type: OptionType.BOOLEAN,
        description: "Block autoplay of embedded videos in messages.",
        default: false,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordNoSoundboardPreview: {
        type: OptionType.BOOLEAN,
        description: "Disable the soundboard audio preview on hover.",
        default: true,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordReduceBlurEffects: {
        type: OptionType.BOOLEAN,
        description: "Disable expensive blur effects.",
        default: true,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordDisableHoverTransitions: {
        type: OptionType.BOOLEAN,
        description: "Make CSS hover transitions instant.",
        default: false,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordLimitMsgCache: {
        type: OptionType.BOOLEAN,
        description: "Periodically run the native GC to free message memory.",
        default: true,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordReduceFpsBackground: {
        type: OptionType.BOOLEAN,
        description: "Limit rendering to a few FPS while the window is in the background.",
        default: true,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordThrottlePresence: {
        type: OptionType.BOOLEAN,
        description: "Send presence and activity updates less often. Your status will be less up to date for others.",
        default: false,
        hidden: hiddenUnless("enableFastDiscord")
    },
    fastDiscordLowEndMode: {
        type: OptionType.BOOLEAN,
        description: "Low end PC mode with more frequent GC and lower background FPS.",
        default: false,
        hidden: hiddenUnless("enableFastDiscord")
    },

    dmPurgerAutoRequestEvery30Days: {
        type: OptionType.BOOLEAN,
        description: "Automatically request a Discord data package every 30 days.",
        default: true,
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerLastRequestTimestamp: {
        type: OptionType.NUMBER,
        description: "Timestamp of the last Discord data request.",
        default: 0,
        hidden: true
    },
    dmPurgerRequestMessagesOnly: {
        type: OptionType.BOOLEAN,
        description: "Only request message data in data requests.",
        default: true,
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerDeleteDelay: {
        type: OptionType.SLIDER,
        description: "Deletion delay per message in milliseconds to avoid rate limits.",
        markers: [500, 1000, 1500, 2000, 3000, 5000],
        default: 1500,
        stickToMarkers: false,
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerEmailProvider: {
        type: OptionType.SELECT,
        description: "Email provider used to fetch the data package automatically.",
        options: [
            { label: "Outlook / Hotmail / Office365", value: "outlook", default: true },
            { label: "Gmail", value: "gmail" },
            { label: "Yahoo Mail", value: "yahoo" },
            { label: "Custom IMAP", value: "custom" }
        ],
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerEmailAddress: {
        type: OptionType.STRING,
        description: "Email address linked to your Discord account.",
        default: "",
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerEmailPassword: {
        type: OptionType.STRING,
        description: "Email password or app password.",
        default: "",
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerCustomImapHost: {
        type: OptionType.STRING,
        description: "Custom IMAP host.",
        default: "",
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerCustomImapPort: {
        type: OptionType.NUMBER,
        description: "Custom IMAP port. 993 for SSL.",
        default: 993,
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerAutoDeleteZipAfterExtract: {
        type: OptionType.BOOLEAN,
        description: "Delete package.zip after extraction.",
        default: true,
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerIncludeGroupDms: {
        type: OptionType.BOOLEAN,
        description: "Include group DMs in the purge. Only 1 on 1 DMs by default.",
        default: false,
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerWhitelistUsers: {
        type: OptionType.STRING,
        description: "Comma separated user IDs to keep out of the purge.",
        default: "",
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerWhitelistGroups: {
        type: OptionType.STRING,
        description: "Comma separated group channel IDs to keep out of the purge.",
        default: "",
        hidden: hiddenUnless("enableDmPurger")
    },
    dmPurgerAutoResumeOnStartup: {
        type: OptionType.BOOLEAN,
        description: "Resume an interrupted purge when Discord launches.",
        default: true,
        hidden: hiddenUnless("enableDmPurger")
    }
});
