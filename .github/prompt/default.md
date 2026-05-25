## {VERSION}

### ✨ 核心更新
- 更新版本至 {VERSION}

### 📦 安装说明

**从 GitHub Releases 下载：**
1. 下载 `napcat-plugin-teamspeakLink.zip`
2. **重要：将压缩包解压到 NapCat 的 `plugins` 文件夹下**
3. 进入解压后的插件目录，执行以下命令安装依赖：
   ```bash
   pnpm install
   ```
4. 重启 NapCat

> ⚠️ **注意**：必须先解压到 `plugins` 目录后再运行 `pnpm install`，否则依赖可能无法正确安装。
>
> **为什么需要安装依赖？** 本插件依赖 `ts3-nodejs-library` 库，该库包含 `ssh2` 等原生 Node.js 模块。这些原生模块无法被 Vite 打包工具处理，必须在运行时环境中通过 `pnpm install` 安装到 `node_modules` 中才能正常工作。

> 💡 你也可以在 NapCat WebUI 中直接安装插件。
