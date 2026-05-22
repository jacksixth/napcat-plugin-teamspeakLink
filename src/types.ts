/**
 * 类型定义文件
 * 定义插件内部使用的接口和类型
 *
 * 注意：OneBot 相关类型（OB11Message, OB11PostSendMsg 等）
 * 以及插件框架类型（NapCatPluginContext, PluginModule 等）
 * 均来自 napcat-types 包，无需在此重复定义。
 */

// ==================== 插件配置 ====================

/**
 * TeamSpeak3 服务器配置
 */
export interface TS3Config {
    /** TS3 服务器地址（IP 或域名） */
    host: string;
    /** 查询协议类型 */
    protocol: 'RAW' | 'SSH';
    /** TS3 查询端口（默认 10011） */
    queryPort: number;
    /** TS3 语音端口（默认 9987） */
    serverPort: number;
    /** TS3 管理员账号 */
    username: string;
    /** TS3 管理员密码 */
    password: string;
    /** 连接时使用的昵称 */
    nickname: string;
    /** 展示的服务器名称 */
    serverName: string;
    /** 断线重连次数（-1 表示无限重试） */
    reconnectTimer: number;
}

/**
 * TeamSpeak3 通知配置
 */
export interface TS3NotifyConfig {
    /** 接收通知的 QQ 群号数组 */
    noticeGroupIds: string[];
    /** 不发送通知的昵称列表 */
    disNotifyNameList: string[];
    /** 是否开启频道移动播报 */
    enableChannelMoveNotify: boolean;
}

/**
 * 插件主配置接口
 * 在此定义你的插件所需的所有配置项
 */
export interface PluginConfig {
    /** 全局开关：是否启用插件功能 */
    enabled: boolean;
    /** 调试模式：启用后输出详细日志 */
    debug: boolean;
    /** 触发命令前缀，默认为 #ts */
    commandPrefix: string;
    /** 同一命令请求冷却时间（秒），0 表示不限制 */
    cooldownSeconds: number;
    /** TeamSpeak3 服务器配置 */
    ts3: TS3Config;
    /** TeamSpeak3 通知配置 */
    ts3Notify: TS3NotifyConfig;
    /** 按群的单独配置 */
    groupConfigs: Record<string, GroupConfig>;
}

/**
 * 群配置
 */
export interface GroupConfig {
    /** 是否启用此群的功能 */
    enabled?: boolean;
}

/**
 * TeamSpeak3 用户信息
 */
export interface TS3UserInfo {
    /** 用户昵称 */
    nickName: string;
    /** 最后连接时间 */
    lastconnected: string;
    /** 在线时长（格式：分:秒） */
    connectTime: string;
}

/**
 * TeamSpeak3 频道用户列表
 */
export interface TS3ChannelUsers {
    [channelName: string]: TS3UserInfo[];
}

/**
 * TeamSpeak3 服务器状态
 */
export interface TS3ServerStatus {
    /** 服务器名称 */
    name: string;
    /** 各频道用户列表 */
    res: TS3ChannelUsers;
    /** 总人数 */
    count: number;
}

// ==================== API 响应 ====================

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = unknown> {
    /** 状态码，0 表示成功，-1 表示失败 */
    code: number;
    /** 错误信息（仅错误时返回） */
    message?: string;
    /** 响应数据（仅成功时返回） */
    data?: T;
}
