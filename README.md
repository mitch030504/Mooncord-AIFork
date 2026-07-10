# Mooncord-AIFork 🚀

> [!NOTE]
> **This is a modernized, actively maintained fork of eliteSchwein's [Mooncord](https://github.com/eliteSchwein/mooncord).** It is specifically optimized for stability, premium user experience, and visual enhancements.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Mooncord is a Discord Bot that lets you monitor, control, and get real-time notifications for your Klipper/Moonraker 3D printer directly from Discord.

---

## 🌟 Why use this Fork? (End-User Comparison)

Here is how this fork compares directly to the original upstream project from a 3D printer owner's perspective:

| Feature / Capability | Original Mooncord (Upstream) | Mooncord-AIFork (This Project) |
| :--- | :--- | :--- |
| **Bed Mesh Visualizer** | 🟥 Flat, basic 2D color squares. Hard to judge bed leveling at a glance; legends and text often clip at the borders. | 🟩 **Sleek 3D Isometric Mesh View**. Visualizes your bed leveling just like Fluidd/Mainsail, complete with zero-plane grid alignment, dynamic Z-axis height scaling, and a color-gradient legend. |
| **Read-Only Viewer Access** | ❌ All-or-nothing permissions. Non-admin users are blocked from checking status or viewing files. | 🛡️ **Granular Read-Only Access**. Non-admins can run informative commands (`/status`, `/temp`, `/info`, `/history`, `/listgcodes`, `/listlogs`, `/listtimelapses`), navigate pages, and download logs/videos. However, printer control commands (like pausing, starting prints, heating, or toggling power) remain securely restricted to admins. |
| **Printer Offline Resilience** | ⚠️ Gets stuck in a timed-out loop or stops trying to reconnect if the printer is powered off overnight, requiring a manual bot restart. | 🔄 **Automatic Auto-Recovery**. Instantly detects half-open "zombie" connections or command timeouts, resets the socket connection, and continuously attempts to reconnect silently until the printer is powered back on. |
| **Timelapse Encoding Support** | ❌ Fails to parse complex video encoding options containing colons (e.g., `-tag:v hvc1`), causing settings corruption. | 🎥 **Full FFmpeg Argument Support**. Correctly handles advanced video processing and encoding settings, allowing you to use high-quality codecs like H.265 out of the box. |
| **System Update Safety** | ❌ Exposes system update buttons that can accidentally corrupt firmware on closed-source Klipper printers. | 🔒 **Safety Toggles**. Hides system update options for closed-system printers (like Qidi) to prevent accidental firmware corruption. |
| **File List Stability** | ⚠️ G-code files or timelapses randomly disappear from Discord lists due to internal search state bugs. | 📁 **Rock-solid lists**. Resolves stateful indexing bugs so your files and timelapse videos are always visible. |

---

## 📸 Visual Showcase

### Isometric 3D Bed Mesh
Run `/bedmesh` in Discord to receive an isometric 3D visualization of your bed leveling mesh. It helps you instantly spot high or low points in your build plate:
* Realistic 3D rotation and depth sorting.
* Interactive color gradient key mapping height in millimeters.
* Zero-plane alignment grid to easily identify deviation.

---

## 📦 Key Features

*   **Real-time Print Notifications:** Automatically sends notifications to your Discord server or DMs when a print starts, pauses, cancels, finishes, or reaches specific progress milestones (with webcam snapshots!).
*   **Webcam Stream & Snapshots:** Get live snapshots of your build plate inside Discord notifications.
*   **Print Job Control:** Start, pause, resume, or cancel prints using buttons directly on the Discord interface.
*   **Printer Diagnostics:** Monitor hotend/bed temperatures, CPU/RAM usage of your printer host, and view system logs.
*   **History Logs:** Look back at your recent printing sessions and total print times.
*   **Timelapse Integration:** Download recorded print timelapse videos directly to your device via Discord.

---

## 🚀 Quick Setup & Installation

### Option 1: Docker (Recommended)

Our Docker images are continuously updated and hosted on the GitHub Container Registry. 

1. Create a `config` directory in your project folder and place your `mooncord.cfg` configuration file inside it.
2. Run the following command:
```bash
docker run -d \
  --name mooncord \
  --restart unless-stopped \
  -v $(pwd)/config:/app/config \
  ghcr.io/mitch030504/mooncord-aifork:latest
```

### Option 2: Manual Installation

1. Clone the repository and install the dependencies:
   ```bash
   git clone https://github.com/mitch030504/Mooncord-AIFork.git
   cd Mooncord-AIFork
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Copy the configuration template, configure it with your bot token and printer IP, and start the bot:
   ```bash
   cp config/mooncord.json.dist config/mooncord.json
   npm start
   ```

---

## ⚙️ Configuration Help

For a detailed explanation of all configuration parameters (including Discord Bot creation, connection URLs, and camera options), please visit the official [Mooncord Wiki](https://github.com/eliteSchwein/mooncord/wiki). All configuration templates and variables remain fully backward-compatible with this fork.
