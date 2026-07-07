# Mooncord-AIFork

> [!WARNING]
> **DISCLAIMER: This is a modernized fork of Mooncord that is actively maintained with AI.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This is a modernized, highly-optimized fork of [Mooncord](https://github.com/eliteSchwein/mooncord) by eliteSchwein. Mooncord is a Discord Bot for [Moonraker](https://github.com/Arksine/moonraker).

---

## 📦 What is Mooncord?

Mooncord allows you to monitor and control your Klipper/Moonraker 3D printer directly from Discord.

- **Basic Controls:** Start, pause, resume, and stop prints directly from Discord chat.
- **Status Notifications:** Receive automatic status messages via DM or in a dedicated guild text channel.
- **Visuals:** Integrates seamlessly with [Moonraker-Timelapse](https://github.com/mainsail-crew/moonraker-timelapse) and webcams to show you what your printer is doing.

---

## 🚀 Fork Features & Improvements

This fork brings the original Mooncord codebase up to modern Node.js and TypeScript standards, featuring several critical bug fixes and massive performance optimizations:

- **Strict TypeScript Compliance**: Full `strict: true` and `noUncheckedIndexedAccess: true` compliance for zero-error type safety.
- **Dependency Upgrades**: Uses modern `discord.js@14.26+`, `typescript@5.6+`, and resolves high-severity security vulnerabilities.
- **Memory Leak Fix**: Resolved a critical memory leak in the Moonraker WebSocket client caused by orphaned/timed-out JSON-RPC requests.
- **Continuous Reconnect Loop**: Fixed a bug where the bot would stop trying to reconnect if the printer was left offline. The bot now explicitly cleans up old WebSocket connections on failure and maintains an infinite, stable reconnect loop with flat memory usage.
- **Discord Interaction Optimization**: Massively optimized command execution. Previously, all 26 command handlers were blindly instantiated on *every* Discord interaction; it now statically maps strictly to the target command ID to instantly execute only the requested command.
- **Qidi Q2 / Closed-System Safety**: Added a `disable_system_updates` toggle to safely disable Moonraker upgrade commands from Discord, preventing accidental firmware corruption on custom Klipper machines.
- **Instantaneous API Responses (WebSocket Polling Fix)**: Completely eliminated an artificial 500ms polling bottleneck on every Moonraker request. The bot now uses native Promises to resolve data instantly as soon as the printer replies.
- **Hardened Metadata Handling**: Fixed several crashes and `TypeError` bugs that occurred when closed-source printers omitted certain hardware metadata (like `last_stats` or OS distribution info).
- **Stateful Regex & Race Condition Fixes**: Resolved silent bugs that caused G-code and Timelapse files to randomly disappear from menus, and fixed race conditions in the Print History handler.
- **Floating Promise Safety**: Refactored the internal interaction structures so they no longer execute asynchronous tasks as floating promises inside constructors, completely eliminating the risk of Unhandled Promise Rejections silently crashing Node.js.

---

## 📖 Setup & Installation

### Docker (Recommended)

The easiest way to run this fork is via Docker. We automatically publish images to the GitHub Container Registry (`ghcr.io`).

```bash
docker pull ghcr.io/mitch030504/mooncord-aifork:latest
```

### Configuration

For complete official setup guides, including how to configure your Discord Bot Token and Moonraker connection, please refer to the original [Mooncord Wiki](https://github.com/eliteSchwein/mooncord/wiki).

*Note: All configuration options from the original Mooncord remain compatible with this fork.*
