import { useState, useEffect, useCallback } from 'react'
import { noAuthFetch } from '../utils/api'
import { showToast } from '../hooks/useToast'
import type { PluginConfig } from '../types'
import { IconTerminal, IconServer, IconBell } from '../components/icons'

export default function ConfigPage() {
    const [config, setConfig] = useState<PluginConfig | null>(null)
    const [saving, setSaving] = useState(false)

    const fetchConfig = useCallback(async () => {
        try {
            const res = await noAuthFetch<PluginConfig>('/config')
            if (res.code === 0 && res.data) setConfig(res.data)
        } catch { showToast('获取配置失败', 'error') }
    }, [])

    useEffect(() => { fetchConfig() }, [fetchConfig])

    const saveConfig = useCallback(async (update: Partial<PluginConfig>) => {
        if (!config) return
        setSaving(true)
        try {
            const newConfig = { ...config, ...update }
            await noAuthFetch('/config', {
                method: 'POST',
                body: JSON.stringify(newConfig),
            })
            setConfig(newConfig)
            showToast('配置已保存', 'success')
        } catch {
            showToast('保存失败', 'error')
        } finally {
            setSaving(false)
        }
    }, [config])

    const updateField = <K extends keyof PluginConfig>(key: K, value: PluginConfig[K]) => {
        if (!config) return
        const updated = { ...config, [key]: value }
        setConfig(updated)
        saveConfig({ [key]: value })
    }

    const updateNestedField = <T extends keyof PluginConfig, K extends keyof PluginConfig[T]>(
        parentKey: T,
        childKey: K,
        value: PluginConfig[T][K]
    ) => {
        if (!config) return
        const updated = {
            ...config,
            [parentKey]: {
                ...(config[parentKey] as Record<string, unknown>),
                [childKey]: value,
            },
        } as PluginConfig
        setConfig(updated)
        saveConfig(updated)
    }

    if (!config) {
        return (
            <div className="flex items-center justify-center h-64 empty-state">
                <div className="flex flex-col items-center gap-3">
                    <div className="loading-spinner text-primary" />
                    <div className="text-gray-400 text-sm">加载配置中...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 stagger-children">
            {/* 基础配置 */}
            <div className="card p-5 hover-lift">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                    <IconTerminal size={16} className="text-gray-400" />
                    基础配置
                </h3>
                <div className="space-y-5">
                    <ToggleRow
                        label="启用插件"
                        desc="全局开关，关闭后不响应任何命令"
                        checked={config.enabled}
                        onChange={(v) => updateField('enabled', v)}
                    />
                    <ToggleRow
                        label="调试模式"
                        desc="启用后输出详细日志到控制台"
                        checked={config.debug}
                        onChange={(v) => updateField('debug', v)}
                    />
                    <InputRow
                        label="命令前缀"
                        desc="触发命令的前缀"
                        value={config.commandPrefix}
                        onChange={(v) => updateField('commandPrefix', v)}
                    />
                    <InputRow
                        label="冷却时间 (秒)"
                        desc="同一命令请求冷却时间，0 表示不限制"
                        value={String(config.cooldownSeconds)}
                        type="number"
                        onChange={(v) => updateField('cooldownSeconds', Number(v) || 0)}
                    />
                </div>
            </div>

            {/* TS3 服务器配置 */}
            <div className="card p-5 hover-lift">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                    <IconServer size={16} className="text-gray-400" />
                    TeamSpeak3 服务器配置
                </h3>
                <div className="space-y-5">
                    <InputRow
                        label="服务器地址"
                        desc="TS3 服务器的 IP 地址或域名"
                        value={config.ts3.host}
                        onChange={(v) => updateNestedField('ts3', 'host', v)}
                    />
                    <SelectRow
                        label="查询协议"
                        desc="Server Query 使用的协议类型"
                        value={config.ts3.protocol}
                        options={[
                            { label: 'RAW (TCP)', value: 'RAW' },
                            { label: 'SSH (加密)', value: 'SSH' },
                        ]}
                        onChange={(v) => updateNestedField('ts3', 'protocol', v as 'RAW' | 'SSH')}
                    />
                    <InputRow
                        label="查询端口"
                        desc="TS3 Server Query 端口（默认 10011）"
                        value={String(config.ts3.queryPort)}
                        type="number"
                        onChange={(v) => updateNestedField('ts3', 'queryPort', Number(v) || 10011)}
                    />
                    <InputRow
                        label="语音端口"
                        desc="TS3 语音服务端口（默认 9987）"
                        value={String(config.ts3.serverPort)}
                        type="number"
                        onChange={(v) => updateNestedField('ts3', 'serverPort', Number(v) || 9987)}
                    />
                    <InputRow
                        label="管理员账号"
                        desc="TS3 Server Query 管理员用户名"
                        value={config.ts3.username}
                        onChange={(v) => updateNestedField('ts3', 'username', v)}
                    />
                    <InputRow
                        label="管理员密码"
                        desc="TS3 Server Query 管理员密码"
                        value={config.ts3.password}
                        type="password"
                        onChange={(v) => updateNestedField('ts3', 'password', v)}
                    />
                    <InputRow
                        label="机器人昵称"
                        desc="连接到 TS3 时显示的昵称"
                        value={config.ts3.nickname}
                        onChange={(v) => updateNestedField('ts3', 'nickname', v)}
                    />
                    <InputRow
                        label="服务器名称"
                        desc="在消息中展示的服务器名称"
                        value={config.ts3.serverName}
                        onChange={(v) => updateNestedField('ts3', 'serverName', v)}
                    />
                    <InputRow
                        label="重连次数"
                        desc="断线重连次数，-1 表示无限重试"
                        value={String(config.ts3.reconnectTimer)}
                        type="number"
                        onChange={(v) => updateNestedField('ts3', 'reconnectTimer', Number(v) || -1)}
                    />
                </div>
            </div>

            {/* TS3 通知配置 */}
            <div className="card p-5 hover-lift">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                    <IconBell size={16} className="text-gray-400" />
                    TeamSpeak3 通知配置
                </h3>
                <div className="space-y-5">
                    <ToggleRow
                        label="频道移动通知"
                        desc="当用户在频道间移动时发送通知"
                        checked={config.ts3Notify.enableChannelMoveNotify}
                        onChange={(v) => updateNestedField('ts3Notify', 'enableChannelMoveNotify', v)}
                    />
                    <ArrayInputRow
                        label="接收通知的群号"
                        desc="接收 TS3 通知的 QQ 群号列表，每行一个"
                        value={config.ts3Notify.noticeGroupIds}
                        onChange={(v) => updateNestedField('ts3Notify', 'noticeGroupIds', v)}
                    />
                    <ArrayInputRow
                        label="排除通知的昵称"
                        desc="不发送通知的 TS3 昵称列表，每行一个"
                        value={config.ts3Notify.disNotifyNameList}
                        onChange={(v) => updateNestedField('ts3Notify', 'disNotifyNameList', v)}
                    />
                </div>
            </div>

            {saving && (
                <div className="saving-indicator fixed bottom-4 right-4 bg-primary text-white text-xs px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <div className="loading-spinner !w-3 !h-3 !border-[1.5px]" />
                    保存中...
                </div>
            )}
        </div>
    )
}

/* ---- 子组件 ---- */

function ToggleRow({ label, desc, checked, onChange }: {
    label: string; desc: string; checked: boolean; onChange: (v: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
            </div>
            <label className="toggle">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <div className="slider" />
            </label>
        </div>
    )
}

function InputRow({ label, desc, value, type = 'text', onChange }: {
    label: string; desc: string; value: string; type?: string; onChange: (v: string) => void
}) {
    const [local, setLocal] = useState(value)
    useEffect(() => { setLocal(value) }, [value])

    const handleBlur = () => {
        if (local !== value) onChange(local)
    }

    return (
        <div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{label}</div>
            <div className="text-xs text-gray-400 mb-2">{desc}</div>
            <input
                className="input-field"
                type={type}
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            />
        </div>
    )
}

function SelectRow({ label, desc, value, options, onChange }: {
    label: string; desc: string; value: string; options: Array<{ label: string; value: string }>; onChange: (v: string) => void
}) {
    return (
        <div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{label}</div>
            <div className="text-xs text-gray-400 mb-2">{desc}</div>
            <select
                className="input-field"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    )
}

function ArrayInputRow({ label, desc, value, onChange }: {
    label: string; desc: string; value: string[]; onChange: (v: string[]) => void
}) {
    const [local, setLocal] = useState(value.join('\n'))
    useEffect(() => { setLocal(value.join('\n')) }, [value])

    const handleBlur = () => {
        const newValue = local
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        if (JSON.stringify(newValue) !== JSON.stringify(value)) {
            onChange(newValue)
        }
    }

    return (
        <div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{label}</div>
            <div className="text-xs text-gray-400 mb-2">{desc}</div>
            <textarea
                className="input-field min-h-[100px] font-mono text-xs"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                onBlur={handleBlur}
                placeholder="每行一个值"
            />
        </div>
    )
}
