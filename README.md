# Mooncord-AIFork

> [!WARNING]
> **DISCLAIMER: This is a fork of Mooncord that is fully maintained with AI.**

![Title](https://raw.githubusercontent.com/eliteSchwein/mooncord/master/assets/images/github-title.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This is a modernized, highly-optimized fork of [Mooncord](https://github.com/eliteSchwein/mooncord) by eliteSchwein. Mooncord is a Discord Bot for [Moonraker](https://github.com/Arksine/moonraker).

## 🚀 Fork Features & Improvements

This fork brings the original Mooncord codebase up to modern Node.js and TypeScript standards, featuring several critical bug fixes and massive performance optimizations:

- **Strict TypeScript Compliance**: Full `strict: true` and `noUncheckedIndexedAccess: true` compliance for zero-error type safety.
- **Dependency Upgrades**: Uses modern `discord.js@14.26+`, `typescript@5.6+`, and resolves high-severity security vulnerabilities.
- **Memory Leak Fix**: Resolved a critical memory leak in the Moonraker WebSocket client caused by orphaned/timed-out JSON-RPC requests.
- **Continuous Reconnect Loop**: Fixed a bug where the bot would stop trying to reconnect if the printer was left offline. The bot now explicitly cleans up old WebSocket connections on failure and maintains an infinite, stable reconnect loop with flat memory usage.
- **Discord Interaction Optimization**: Massively optimized command execution. Previously, all 26 command handlers were blindly instantiated on *every* Discord interaction; it now statically maps strictly to the target command ID to instantly execute only the requested command.
- **Floating Promise Safety**: Refactored the internal interaction structures so they no longer execute asynchronous tasks as floating promises inside constructors, completely eliminating the risk of Unhandled Promise Rejections silently crashing Node.js.

---

## 📦 What is Mooncord?

Mooncord has basic Controls, example Start/Pause/Stop a Print, but also has a [Timelapse](https://github.com/mainsail-crew/moonraker-timelapse) integration.
It will also send you via DM or/and in a Guide Text Channel automatically Status Messages.

## 📖 Setup & Guides

Please go into the original [Wiki Tab](https://github.com/eliteSchwein/mooncord/wiki) for the official Setup Guides.
