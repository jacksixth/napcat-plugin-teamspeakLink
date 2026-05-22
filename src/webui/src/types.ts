/** WebUI 前端类型定义 */

export interface PluginStatus {
    pluginName: string
    uptime: number
    uptimeFormatted: string
    config: PluginConfig
    stats: {
        processed: number
        todayProcessed: number
        lastUpdateDay: string
    }
}

export interface TS3Config {
    host: string
    protocol: 'RAW' | 'SSH'
    queryPort: number
    serverPort: number
    username: string
    password: string
    nickname: string
    serverName: string
    reconnectTimer: number
}

export interface TS3NotifyConfig {
    noticeGroupIds: string[]
    disNotifyNameList: string[]
    enableChannelMoveNotify: boolean
}

export interface PluginConfig {
    enabled: boolean
    debug: boolean
    commandPrefix: string
    cooldownSeconds: number
    ts3: TS3Config
    ts3Notify: TS3NotifyConfig
    groupConfigs?: Record<string, GroupConfig>
}

export interface GroupConfig {
    enabled?: boolean
}

export interface GroupInfo {
    group_id: number
    group_name: string
    member_count: number
    max_member_count: number
    enabled: boolean
    /** 定时推送时间（如 '08:30'），null 表示未设置（模板默认不使用，按需扩展） */
    scheduleTime?: string | null
}

export interface ApiResponse<T = unknown> {
    code: number
    data?: T
    message?: string
}
