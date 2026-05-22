/**
 * 插件配置模块
 * 定义默认配置值和 WebUI 配置 Schema
 */

import type { NapCatPluginContext, PluginConfigSchema } from 'napcat-types/napcat-onebot/network/plugin/types';
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

/**
 * 构建 WebUI 配置 Schema
 *
 * 使用 ctx.NapCatConfig 提供的构建器方法生成配置界面：
 *   - boolean(key, label, defaultValue?, description?, reactive?)  → 开关
 *   - text(key, label, defaultValue?, description?, reactive?)     → 文本输入
 *   - number(key, label, defaultValue?, description?, reactive?)   → 数字输入
 *   - select(key, label, options, defaultValue?, description?)     → 下拉单选
 *   - multiSelect(key, label, options, defaultValue?, description?) → 下拉多选
 *   - html(content)     → 自定义 HTML 展示（不保存值）
 *   - plainText(content) → 纯文本说明
 *   - combine(...items)  → 组合多个配置项为 Schema
 */
export function buildConfigSchema(ctx: NapCatPluginContext): PluginConfigSchema {
    return ctx.NapCatConfig.combine(
        // 插件信息头部
        ctx.NapCatConfig.html(`
            <div style="padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 20px; color: white;">
                <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 600;">TeamSpeak3 Link 插件</h3>
                <p style="margin: 0; font-size: 13px; opacity: 0.85;">连接 QQ 机器人与 TeamSpeak3 语音服务器</p>
            </div>
        `),
        // 全局开关
        ctx.NapCatConfig.boolean('enabled', '启用插件', true, '是否启用此插件的功能'),
        // 调试模式
        ctx.NapCatConfig.boolean('debug', '调试模式', false, '启用后将输出详细的调试日志'),
        // 命令前缀
        ctx.NapCatConfig.text('commandPrefix', '命令前缀', '#ts', '触发命令的前缀，默认为 #ts'),
        // 冷却时间
        ctx.NapCatConfig.number('cooldownSeconds', '冷却时间（秒）', 60, '同一命令请求冷却时间，0 表示不限制'),

        // TS3 服务器配置分组
        ctx.NapCatConfig.html('<h4 style="margin: 20px 0 10px 0; color: #333;">🎙️ TeamSpeak3 服务器配置</h4>'),
        ctx.NapCatConfig.text('ts3.host', '服务器地址', '127.0.0.1', 'TS3 服务器的 IP 地址或域名'),
        ctx.NapCatConfig.select('ts3.protocol', '查询协议', [
            { label: 'RAW (TCP)', value: 'RAW' },
            { label: 'SSH (加密)', value: 'SSH' },
        ], 'RAW', 'Server Query 使用的协议类型'),
        ctx.NapCatConfig.number('ts3.queryPort', '查询端口', 10011, 'TS3 Server Query 端口（默认 10011）'),
        ctx.NapCatConfig.number('ts3.serverPort', '语音端口', 9987, 'TS3 语音服务端口（默认 9987）'),
        ctx.NapCatConfig.text('ts3.username', '管理员账号', 'serveradmin', 'TS3 Server Query 管理员用户名'),
        ctx.NapCatConfig.text('ts3.password', '管理员密码', '', 'TS3 Server Query 管理员密码'),
        ctx.NapCatConfig.text('ts3.nickname', '机器人昵称', 'NapCat-BOT', '连接到 TS3 时显示的昵称'),
        ctx.NapCatConfig.text('ts3.serverName', '服务器名称', 'TeamSpeak3 Server', '在消息中展示的服务器名称'),
        ctx.NapCatConfig.number('ts3.reconnectTimer', '重连次数', -1, '断线重连次数，-1 表示无限重试'),

        // TS3 通知配置分组
        ctx.NapCatConfig.html('<h4 style="margin: 20px 0 10px 0; color: #333;">🔔 TeamSpeak3 通知配置</h4>'),
        ctx.NapCatConfig.boolean('ts3Notify.enableChannelMoveNotify', '频道移动通知', false, '当用户在频道间移动时发送通知'),
    );
}
