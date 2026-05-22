/**
 * TeamSpeak3 服务模块
 *
 * 负责管理 TS3 服务器的连接、事件监听和数据查询
 * 基于 ts3-nodejs-library 实现
 */

import type { NapCatPluginContext } from 'napcat-types/napcat-onebot/network/plugin/types';
import { pluginState } from '../core/state';
import type { TS3ServerStatus, TS3UserInfo } from '../types';

// 动态导入 TS3 库（避免编译时类型检查问题）
let TeamSpeak: any;
let QueryProtocol: any;

async function loadTS3Library(): Promise<void> {
    if (!TeamSpeak) {
        try {
            const ts3Module = await import('ts3-nodejs-library');
            TeamSpeak = ts3Module.default || ts3Module.TeamSpeak;
            QueryProtocol = ts3Module.QueryProtocol;
        } catch (error) {
            throw new Error(`无法加载 ts3-nodejs-library: ${error}`);
        }
    }
}

/**
 * TeamSpeak3 服务类
 */
export class TS3Service {
    private ctx: NapCatPluginContext | null = null;
    private teamspeak: any = null;
    private isReconnecting: boolean = false;
    private isConnected: boolean = false;

    /**
     * 初始化服务
     */
    init(ctx: NapCatPluginContext): void {
        this.ctx = ctx;
        this.connect();
    }

    /**
     * 连接到 TS3 服务器
     */
    async connect(): Promise<void> {
        if (!this.ctx) {
            throw new Error('TS3Service 未初始化');
        }

        try {
            await loadTS3Library();

            const config = pluginState.config.ts3;

            this.ctx.logger.info(`正在连接 TS3 服务器: ${config.host}:${config.queryPort}`);

            this.teamspeak = new TeamSpeak({
                host: config.host,
                protocol: QueryProtocol[config.protocol],
                queryport: config.queryPort,
                serverport: config.serverPort,
                username: config.username,
                password: config.password,
                nickname: config.nickname,
            });

            // 注册事件监听器
            this.registerEventListeners();

            this.isConnected = true;
            this.ctx.logger.info('TS3 连接已建立');
        } catch (error) {
            this.ctx.logger.error('TS3 连接失败:', error);
            this.handleReconnect();
        }
    }

    /**
     * 注册事件监听器
     */
    private registerEventListeners(): void {
        if (!this.teamspeak || !this.ctx) return;

        const notifyConfig = pluginState.config.ts3Notify;

        // 连接成功
        this.teamspeak.on('ready', async () => {
            this.ctx!.logger.info('✓ TS3 连接成功');
            this.isConnected = true;
            this.isReconnecting = false;
        });

        // 连接断开
        this.teamspeak.on('close', (e: any) => {
            this.ctx!.logger.warn('⚠ TS3 连接断开', e);
            this.isConnected = false;
            this.handleReconnect();
        });

        // 连接错误
        this.teamspeak.on('error', (err: Error) => {
            this.ctx!.logger.error('✗ TS3 连接出错:', err);
            this.isConnected = false;
        });

        // 用户进入服务器
        this.teamspeak.on('clientconnect', (e: any) => {
            if (!notifyConfig.disNotifyNameList.includes(e.client.nickname)) {
                this.sendNotifyMessage(`${e.client.nickname} 进入 TS`);
            }
        });

        // 用户离开服务器
        this.teamspeak.on('clientdisconnect', (e: any) => {
            if (e.client && !notifyConfig.disNotifyNameList.includes(e.client.nickname)) {
                this.sendNotifyMessage(`${e.client.nickname} 离开 TS`);
            }
        });

        // 用户移动频道
        this.teamspeak.on('clientmoved', (e: any) => {
            if (notifyConfig.enableChannelMoveNotify && e.client && e.channel) {
                if (!notifyConfig.disNotifyNameList.includes(e.client.nickname)) {
                    this.sendNotifyMessage(`${e.client.nickname} 移动到频道: ${e.channel.name}`);
                }
            }
        });
    }

    /**
     * 发送通知消息到配置的 QQ 群
     */
    private async sendNotifyMessage(message: string): Promise<void> {
        if (!this.ctx) return;

        const groupIds = pluginState.config.ts3Notify.noticeGroupIds;
        if (!groupIds || groupIds.length === 0) return;

        for (const groupId of groupIds) {
            try {
                await this.ctx.actions.call(
                    'send_msg',
                    {
                        message_type: 'group',
                        group_id: groupId,
                        message: message,
                    },
                    this.ctx.adapterName,
                    this.ctx.pluginManager.config
                );
            } catch (error) {
                this.ctx.logger.error(`发送通知到群 ${groupId} 失败:`, error);
            }
        }
    }

    /**
     * 处理断线重连
     */
    private async handleReconnect(): Promise<void> {
        if (!this.teamspeak || this.isReconnecting || !this.ctx) return;

        const reconnectTimer = pluginState.config.ts3.reconnectTimer;
        if (reconnectTimer === 0) return;

        this.isReconnecting = true;
        this.ctx.logger.info('尝试重新连接 TS3...');

        try {
            // 如果配置为 -1，则无限重试；否则按配置次数重试
            const maxAttempts = reconnectTimer === -1 ? Infinity : reconnectTimer;
            let attempts = 0;

            while (attempts < maxAttempts && !this.isConnected) {
                attempts++;
                this.ctx.logger.info(`重连尝试 ${attempts}${maxAttempts === Infinity ? '' : `/${maxAttempts}`}...`);

                try {
                    await this.teamspeak.reconnect(1, 1000);
                    this.isConnected = true;
                    this.ctx.logger.info('✓ TS3 重连成功');
                } catch (e) {
                    this.ctx.logger.error(`重连失败 (${attempts}):`, e);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (!this.isConnected) {
                this.ctx.logger.error('TS3 重连失败，已达到最大重试次数');
            }
        } catch (error) {
            this.ctx.logger.error('TS3 重连过程中出错:', error);
        } finally {
            this.isReconnecting = false;
        }
    }

    /**
     * 获取所有频道的在线用户列表
     */
    async getAllChannelList(): Promise<string> {
        if (!this.teamspeak || !this.isConnected) {
            return '❌ TS3 未连接或连接已断开';
        }

        try {
            const config = pluginState.config.ts3;
            const channels = await this.teamspeak.getChannelList({ withClients: true });

            const lines: string[] = [];
            lines.push(`====${config.serverName}====`);
            lines.push('仅展示有人的频道');

            let totalCount = 0;

            for (const channel of channels) {
                const clients = await channel.getClients();
                if (clients.length > 0) {
                    lines.push('======');
                    lines.push(`  ${channel.name}`);

                    for (const client of clients) {
                        const idleTime = client.idleTime || 0;
                        const minutes = Math.floor(idleTime / 60);
                        const seconds = idleTime % 60;
                        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                        lines.push(`- ${client.nickname} (${timeStr})`);
                        totalCount++;
                    }
                }
            }

            lines.push('======');
            lines.push(`当前频道内共有 ${totalCount} 人`);

            return lines.join('\n');
        } catch (error) {
            this.ctx?.logger.error('获取频道列表失败:', error);
            return '❌ 获取 TS3 频道列表失败';
        }
    }

    /**
     * 获取结构化的在线用户数据（用于 API）
     */
    async getAllUserList(): Promise<TS3ServerStatus> {
        if (!this.teamspeak || !this.isConnected) {
            return {
                name: pluginState.config.ts3.serverName,
                res: {},
                count: 0,
            };
        }

        try {
            const config = pluginState.config.ts3;
            const channels = await this.teamspeak.getChannelList({ withClients: true });

            const result: TS3ServerStatus = {
                name: config.serverName,
                res: {},
                count: 0,
            };

            for (const channel of channels) {
                const clients = await channel.getClients();
                if (clients.length > 0) {
                    const users: TS3UserInfo[] = [];

                    for (const client of clients) {
                        const idleTime = client.idleTime || 0;
                        const minutes = Math.floor(idleTime / 60);
                        const seconds = idleTime % 60;

                        users.push({
                            nickName: client.nickname,
                            lastconnected: new Date(client.connectedTime || Date.now()).toLocaleString('zh-CN'),
                            connectTime: `${minutes}:${seconds.toString().padStart(2, '0')}`,
                        });
                    }

                    result.res[channel.name] = users;
                    result.count += users.length;
                }
            }

            return result;
        } catch (error) {
            this.ctx?.logger.error('获取用户列表失败:', error);
            return {
                name: pluginState.config.ts3.serverName,
                res: {},
                count: 0,
            };
        }
    }

    /**
     * 关闭 TS3 连接
     */
    async disconnect(): Promise<void> {
        if (this.teamspeak) {
            try {
                this.teamspeak.removeAllListeners();
                this.teamspeak.quit();
                this.teamspeak = null;
                this.isConnected = false;
                this.ctx?.logger.info('TS3 连接已关闭');
            } catch (error) {
                this.ctx?.logger.error('关闭 TS3 连接时出错:', error);
            }
        }
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * 重新初始化连接（配置变更时调用）
     */
    async reinitialize(): Promise<void> {
        await this.disconnect();
        await this.connect();
    }
}

/** 导出单例实例 */
export const ts3Service = new TS3Service();
