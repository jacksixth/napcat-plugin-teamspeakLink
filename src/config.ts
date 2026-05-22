/**
 * 插件配置模块
 * 定义默认配置值
 */

import type { PluginConfig } from './types';

/** 默认配置 */
export const DEFAULT_CONFIG: PluginConfig = {
    enabled: true,
    debug: false,
    commandPrefix: '#ts',
    cooldownSeconds: 60,
    ts3: {
        host: '127.0.0.1',
        protocol: 'RAW',
        queryPort: 10011,
        serverPort: 9987,
        username: 'serveradmin',
        password: '',
        nickname: 'NapCat-BOT',
        serverName: 'TeamSpeak3 Server',
        reconnectTimer: -1,
    },
    ts3Notify: {
        noticeGroupIds: [],
        disNotifyNameList: ['NapCat-BOT'],
        enableChannelMoveNotify: false,
    },
    groupConfigs: {},
};
