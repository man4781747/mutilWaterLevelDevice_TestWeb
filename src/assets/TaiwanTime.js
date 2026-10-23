// 台灣時間的解析與格式化（specs/cloud-api.md「共通」）
// - API 回傳的時間都帶時區（UTC）；畫面一律以台灣時間（UTC+8）顯示，不受瀏覽器時區影響。
// - 台灣沒有日光節約時間，所以直接用固定的 +8 小時換算。
import { utcFormat } from 'd3'

const TAIWAN_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

// API 的時間字串轉成 Date。
// 相容舊格式：`YYYY-MM-DD HH:MM:SS+00`（空白分隔、只有小時的時區）；沒有時區的當作 UTC，不當成瀏覽器時區。
export function parseApiTime(value) {
  if (value instanceof Date) return new Date(value.getTime())
  if (typeof value !== 'string') return new Date(NaN)
  let s = value.trim().replace(' ', 'T')
  if (/[+-]\d{2}$/.test(s)) {
    s += ':00'
  } else if (!/(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    s += 'Z'
  }
  return new Date(s)
}

// 依 d3 的格式字串（例如 '%Y-%m-%d %H:%M:%S'）產生台灣時間的格式化函式
export function taiwanFormat(specifier) {
  const fmt = utcFormat(specifier)
  return (value) => {
    const date = parseApiTime(value)
    if (Number.isNaN(date.getTime())) return '-'
    return fmt(new Date(date.getTime() + TAIWAN_OFFSET_MS))
  }
}

export const formatTaiwanDateTime = taiwanFormat('%Y-%m-%d %H:%M:%S')

// 台灣日期 `YYYY-MM-DD`；dayOffset 為相對今天的天數
export function taiwanDate(dayOffset = 0) {
  return taiwanFormat('%Y-%m-%d')(new Date(Date.now() + dayOffset * DAY_MS))
}

// 台灣日期 `YYYY-MM-DD` 的整天範圍轉成帶時區的 ISO 8601：開始日 00:00 到結束日隔天 00:00（不含）
export function taiwanDayRange(startDate, endDate) {
  const endNext = new Date(Date.parse(endDate + 'T00:00:00Z') + DAY_MS)
  return {
    start: startDate + 'T00:00:00+08:00',
    end: utcFormat('%Y-%m-%d')(endNext) + 'T00:00:00+08:00',
  }
}
