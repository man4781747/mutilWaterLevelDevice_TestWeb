<template>
  <div class="container-fluid my-2">
    <div class="alert alert-danger alert-dismissible py-2 mb-2" v-if="errorMessage">
      <i class="fa-solid fa-circle-exclamation me-1"></i>{{ errorMessage }}
      <button type="button" class="btn-close py-2" aria-label="關閉" @click="errorMessage = ''"></button>
    </div>
    <div class="d-flex flex-wrap gap-2">
      <div class="input-group device-filter-input">
        <span class="input-group-text"><i class="fa-solid fa-magnifying-glass me-1"></i>過濾</span>
        <input type="text" class="form-control" placeholder="請輸入名稱" v-model="filterStr">
      </div>
      <!-- 快速過濾：每種連線狀態各自開關，開著的才顯示 -->
      <div class="d-flex flex-wrap gap-2" role="group" aria-label="依連線狀態過濾">
        <button type="button" v-for="option of statusFilterOptions" :key="option.key"
          class="btn" :class="statusFilter[option.key] ? 'btn-' + option.color : 'btn-outline-' + option.color"
          :aria-pressed="statusFilter[option.key]"
          :title="statusFilter[option.key] ? '點一下隱藏' : '點一下顯示'"
          @click="statusFilter[option.key] = !statusFilter[option.key]">
          <i class="fa-solid me-1" :class="statusFilter[option.key] ? 'fa-toggle-on' : 'fa-toggle-off'"></i>{{ option.label }}
          <span class="badge rounded-pill ms-1" :class="statusFilter[option.key] ? 'text-bg-light' : 'text-bg-' + option.color">{{ statusCounts[option.key] }}</span>
        </button>
      </div>
    </div>
  </div>
  <div class="container-fluid">
    <div class="row g-2">
      <div class="col-12 col-lg-6 col-xl-4" v-for="name of deviceList" :key="name" v-show="isDeviceVisible(name)">
        <div class="card device-card" :class="'device-card-' + connectionStatus(DeviceInfoList[name].base).key"
          :data-bs-theme="connectionStatus(DeviceInfoList[name].base).key === 'offline' ? 'dark' : null">
          <div class="card-header bg-body-tertiary device-card-header">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-tower-cell text-secondary"></i>
              <h5 class="mb-0">{{name}}</h5>
              <span class="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border" v-if="DeviceInfoList[name].base?.firmware_version" title="韌體版本"><i class="fa-solid fa-microchip me-1"></i>{{DeviceInfoList[name].base.firmware_version}}</span>
            </div>
            <div class="small text-body-secondary d-flex align-items-center gap-2" v-if="DeviceInfoList[name].base">
              <span class="badge connection-badge" v-if="connectionStatus(DeviceInfoList[name].base).label">
                <i class="fa-solid fa-plug-circle-xmark me-1"></i>{{ connectionStatus(DeviceInfoList[name].base).label }}
              </span>
              <span :title="'最新連線 ' + formatTaiwanDateTime(DeviceInfoList[name].base.updated_at)">
                <i class="fa-regular fa-clock me-1"></i>最新連線 {{formatTaiwanDateTime(DeviceInfoList[name].base.updated_at)}}
                <template v-if="connectionStatus(DeviceInfoList[name].base).ago">（{{ connectionStatus(DeviceInfoList[name].base).ago }}）</template>
              </span>
            </div>
          </div>
          <div class="card-body">
            <div class="device-warning" v-if="DeviceInfoList[name]['waring'] !== undefined">
              <template v-if="hasWarning(DeviceInfoList[name]['waring'])">
                <span class="small text-danger me-1"><i class="fa-solid fa-triangle-exclamation me-1"></i>1 小時內錯誤</span>
                <template v-for="bit of errorCodeBits" :key="bit.name">
                  <span class="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle fw-medium" v-if="DeviceInfoList[name]['waring'][bit.name]" :title="bit.name">{{ bit.label }}</span>
                </template>
              </template>
              <span class="small text-success" v-else><i class="fa-solid fa-circle-check me-1"></i>1 小時內沒有錯誤</span>
            </div>
            <div class="device-stats" v-if="DeviceInfoList[name]['base'] !== undefined">
              <div class="device-stat" v-for="signal of statTypes" :key="signal.field"
                :style="{ borderTopColor: signalLevel(signal, DeviceInfoList[name].base[signal.field])?.color }">
                <div class="device-stat-label">
                  <span><i class="fa-solid me-1" :class="signal.icon"></i>{{ signal.name }}</span>
                  <span class="signal-info">
                    <i class="fa-solid fa-circle-info"></i>
                    <div class="signal-info-popover">
                      <div class="fw-bold mb-1">{{ signal.name }}（{{ signal.fullName }}）</div>
                      <div class="mb-2">{{ signal.description }}</div>
                      <div v-for="range of signalRanges(signal)" :key="range.label" class="d-flex justify-content-between">
                        <span :style="{ color: range.color, fontWeight: 'bold' }">{{ range.label }}</span>
                        <span>{{ range.text }} {{ signal.unit }}</span>
                      </div>
                    </div>
                  </span>
                </div>
                <div class="device-stat-value" :style="signalStyle(signal, DeviceInfoList[name].base[signal.field])">
                  <span>{{formatNumber(DeviceInfoList[name].base[signal.field])}} <small>{{ signal.unit }}</small></span>
                  <span class="device-stat-level">{{ signalLevel(signal, DeviceInfoList[name].base[signal.field])?.label }}</span>
                </div>
              </div>
            </div>
            <div class="text-muted mb-2" v-else>沒有機台資訊</div>
            <div class="table-responsive">
              <table class="table table-sm table-hover align-middle mb-0 device-table">
                <thead>
                  <tr>
                    <th scope="col">資料時間（台灣）</th>
                    <th scope="col" class="text-end">壓力 (mm)</th>
                    <th scope="col" class="text-end">聲波 (mm)</th>
                    <th scope="col" class="text-end">雷達測距 (mm)</th>
                    <th scope="col" class="text-end">雷達測速 (mm/s)</th>
                    <th scope="col" class="text-end">濁度 (NTU)</th>
                    <th scope="col" class="text-end">濁度 (mg/L)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="SensorData of DeviceInfoList[name].last3data" :key="SensorData.data_time">
                    <td class="text-nowrap">{{formatTaiwanDateTime(SensorData.data_time)}}</td>
                    <td class="text-end">{{formatNumber(SensorData.distance_pressure)}}</td>
                    <td class="text-end">{{formatNumber(SensorData.distance_sound)}}</td>
                    <td class="text-end">{{formatNumber(SensorData.distance_radar)}}</td>
                    <td class="text-end">{{formatNumber(SensorData.speed_radar)}}</td>
                    <td class="text-end">{{formatNumber(SensorData.turbidity_ntu)}}</td>
                    <td class="text-end">{{formatNumber(SensorData.turbidity_mg_l)}}</td>
                  </tr>
                  <tr v-if="!DeviceInfoList[name].last3data?.length">
                    <td colspan="7" class="text-center text-muted">沒有資料</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <hr class="mx-2 my-2">

  <!-- 歷史資料查詢：搜尋列 → 圖表 → 資料表 -->
  <div class="container-fluid my-2">
    <div class="card">
      <div class="card-body py-2">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <div class="input-group input-group-sm search-device">
            <span class="input-group-text"><i class="fa-solid fa-tower-cell me-1"></i>機台</span>
            <!-- 可以打字篩選，也可以從清單選；必須是清單中的機台才能搜尋 -->
            <DeviceSelect v-model="filters.device" :options="deviceList" placeholder="輸入或選擇機台" @enter="search()" />
          </div>
          <div class="input-group input-group-sm search-date">
            <span class="input-group-text"><i class="fa-regular fa-calendar me-1"></i>日期</span>
            <input class="form-control" type="date" v-model="filters.start">
            <span class="input-group-text">~</span>
            <input class="form-control" type="date" v-model="filters.end">
          </div>
          <div class="input-group input-group-sm search-limit">
            <span class="input-group-text">筆數</span>
            <select class="form-select form-select-sm" v-model="filters.maxNum">
              <option :value="200">200</option>
              <option :value="2000">2000</option>
              <option :value="99999999">全部</option>
            </select>
          </div>
          <button class="btn btn-sm btn-primary" :disabled="!canSearch" @click="search()"><i class="fa-solid fa-magnifying-glass me-1"></i>搜尋</button>
          <button class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-download me-1"></i>下載</button>
        </div>
      </div>
    </div>
  </div>
  <div class="container-fluid my-2" v-if="!hasQueried">
    <div class="card">
      <div class="card-body text-center text-muted py-5">
        <i class="fa-solid fa-chart-line fa-2x mb-2 d-block"></i>
        請選擇機台與日期後按「搜尋」
      </div>
    </div>
  </div>
  <div class="container-fluid my-2" v-show="hasQueried">
    <div class="row g-2">
      <div class="col-12 col-xl-6">
        <div class="card overflow-hidden">
          <div class="card-body p-0 position-relative">
            <div id="base-plot-dir" class="chart-box"></div>
            <div class="update-ing" v-show="basePlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card overflow-hidden">
          <div class="card-body p-0 position-relative">
            <div id="warning-plot-dir" class="chart-box"></div>
            <div class="update-ing" v-show="warningPlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card overflow-hidden">
          <div class="card-body p-0 position-relative">
            <div id="range-plot-dir" class="chart-box"></div>
            <div class="update-ing" v-show="basePlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card overflow-hidden">
          <div class="card-body p-0 position-relative">
            <div id="gyro-plot-dir" class="chart-box"></div>
            <div class="update-ing" v-show="basePlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="container-fluid my-2" v-show="hasQueried">
    <div class="card">
      <div class="card-body p-0 history-table-wrap">
        <table class="table table-sm table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">機器編號</th>
              <th scope="col">資料時間（台灣）</th>
              <th scope="col" class="text-end">電壓 (V)</th>
              <th scope="col" class="text-end">溫度 (攝氏)</th>
              <th scope="col" class="text-end">加速度x,y,z (g)</th>
              <th scope="col" class="text-end">與垂直線的夾角 (度)</th>
              <th scope="col" class="text-end">壓力式測距 (mm)</th>
              <th scope="col" class="text-end">超聲波測距 (mm)</th>
              <th scope="col" class="text-end">雷達波測距 (mm)</th>
              <th scope="col" class="text-end">雷達波測速 (mm/s)</th>
              <th scope="col" class="text-end">RS485濁度 (NTU)</th>
              <th scope="col" class="text-end">RS485濁度 (mg/L)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="SensorData of nowQueryData?.data" :key="SensorData.data_time">
              <td>{{ SensorData.device }}</td>
              <td class="text-nowrap">{{formatTaiwanDateTime(SensorData.data_time)}}</td>
              <td class="text-end">{{ formatNumber(SensorData.voltage, 2) }}</td>
              <td class="text-end">{{ formatNumber(SensorData.temperature, 2) }}</td>
              <td class="text-end text-nowrap">{{ formatNumber(SensorData.acceleration_x, 2) }}, {{ formatNumber(SensorData.acceleration_y, 2) }}, {{ formatNumber(SensorData.acceleration_z, 2) }}</td>
              <td class="text-end">{{ calculateAngleWithVertical(SensorData.roll, SensorData.pitch)?.planeToVertical ?? '-' }}</td>
              <td class="text-end">{{ formatNumber(SensorData.distance_pressure, 0) }}</td>
              <td class="text-end">{{ formatNumber(SensorData.distance_sound, 0) }}</td>
              <td class="text-end">{{ formatNumber(SensorData.distance_radar, 0) }}</td>
              <td class="text-end">{{ formatNumber(SensorData.speed_radar, 0) }}</td>
              <td class="text-end">{{ formatNumber(SensorData.turbidity_ntu, 2) }}</td>
              <td class="text-end">{{ formatNumber(SensorData.turbidity_mg_l, 2) }}</td>
            </tr>
            <tr v-if="!nowQueryData?.data?.length">
              <td colspan="12" class="text-center text-muted">沒有資料</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, ScatterChart, CustomChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent, ToolboxComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { parseApiTime, taiwanFormat, formatTaiwanDateTime, taiwanDate, taiwanDayRange } from '../../assets/TaiwanTime.js'
import DeviceSelect from '../../components/DeviceSelect.vue'

echarts.use([LineChart, ScatterChart, CustomChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, DataZoomComponent, ToolboxComponent, CanvasRenderer])

// 圖表共用設定：同一個 group 的圖縮放與提示框連動；相鄰兩筆資料超過 30 分鐘視為斷線
const CHART_GROUP = 'device-data'
const CHART_COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
const GAP_THRESHOLD_MS = 30 * 60 * 1000
const GAP_SERIES_ID = '__gap'
const RESET_ICON = 'path://M512 160a352 352 0 1 0 352 352h-80a272 272 0 1 1-80-192.4L608 416h256V160l-90.5 90.5A351 351 0 0 0 512 160z'
echarts.connect(CHART_GROUP)

// ErrorCode 位元定義（裝置資訊 byte 12～17 → errorcode_0～5）。
// 名稱採韌體「ErrorCode 擴充提案」的新名稱（D-128），位置與 specs/error-code.md 一致；
// label 是實際的寫入條件，要同時符合韌體 0.0.x 與 0.1.0。
// byte 15～17（errorcode_3～5）是韌體 0.1.0 起的新位元，舊韌體一律為 0。
// 不列出：保留位元（byte 14 bit 7、byte 17 bit 5～7、byte 18）、沒有寫入點的 SleepBoundarySkipped（byte 17 bit 0）。
const ERROR_CODE_BITS = [
  { name: 'DeviceStart',               byte: 0, mask: 0b00000001, label: '非 Timer 喚醒（重開機）' },
  { name: 'RTC_Reset',                 byte: 0, mask: 0b00000010, label: '校時偏差超過 600 秒' },
  { name: 'IOT_AtNoResponse',          byte: 0, mask: 0b00000100, label: '數據機無 AT 回應' },
  { name: 'IOT_SignalFail',            byte: 0, mask: 0b00001000, label: '讀不到訊號強度' },
  { name: 'IOT_NetFlowRetryExhausted', byte: 0, mask: 0b00010000, label: '連網流程 3 次都失敗，沒有送出資料' },
  { name: 'SD_InitFail',               byte: 0, mask: 0b00100000, label: '開機時 SD 卡初始化失敗' },
  { name: 'DataAbandonByAge',          byte: 0, mask: 0b01000000, label: '待傳資料過舊或過多，被刪除' },
  { name: 'ErrorCodeFileRebuilt',      byte: 0, mask: 0b10000000, label: 'ErrorCode 紀錄檔重建' },
  { name: 'DataAbandonByServerReject', byte: 1, mask: 0b00000001, label: '伺服器多次拒收，資料被刪除' },
  { name: 'IOT_IpOrCpsiFail',          byte: 1, mask: 0b00000010, label: '拿不到 IP 或讀不到 CPSI' },
  { name: 'IOT_NetRegisterFail',       byte: 1, mask: 0b00000100, label: '網路註冊、APN 設定或 GPS 失敗' },
  { name: 'IOT_HttpRetryExhausted',    byte: 1, mask: 0b00001000, label: 'HTTP 3 次都失敗，放棄上傳' },
  { name: 'IOT_UploadAnyFail',         byte: 1, mask: 0b00010000, label: '上傳過程有失敗' },
  { name: 'IOT_HttpInitFail',          byte: 1, mask: 0b00100000, label: 'HTTP 初始化失敗' },
  { name: 'IOT_Modem600NotHttp',       byte: 1, mask: 0b01000000, label: '數據機回報 600' },
  { name: 'IOT_LocalFileLenFail',      byte: 1, mask: 0b10000000, label: '待傳檔案長度錯誤' },
  { name: 'IOT_Server598',             byte: 2, mask: 0b00000001, label: '伺服器回覆 598（校驗錯誤）' },
  { name: 'IOT_Server599',             byte: 2, mask: 0b00000010, label: '伺服器回覆 599（長度錯誤）' },
  { name: 'IOT_Server597',             byte: 2, mask: 0b00000100, label: '伺服器回覆 597（解析失敗）' },
  { name: 'IOT_HttpActionTimeout',     byte: 2, mask: 0b00001000, label: 'HTTP 等不到結果' },
  { name: 'IOT_ResponseAllocFail',     byte: 2, mask: 0b00010000, label: '回應記憶體配置失敗' },
  { name: 'IOT_OtherFail',             byte: 2, mask: 0b00100000, label: '其他上傳失敗' },
  { name: 'IOT_FileOpenOrMoveFail',    byte: 2, mask: 0b01000000, label: '檔案開啟或搬移失敗' },
  { name: 'SD_RuntimeWriteFail',       byte: 3, mask: 0b00000001, label: '清醒中 SD 寫入失敗' },
  { name: 'SD_DegradedMode',           byte: 3, mask: 0b00000010, label: 'SD 降級模式（資料暫存 LittleFS）' },
  { name: 'WakeTimeLimitHit',          byte: 3, mask: 0b00000100, label: '清醒時間到期，強制休眠' },
  { name: 'SubtaskTimeout',            byte: 3, mask: 0b00001000, label: '採樣或感測工作逾時' },
  { name: 'RTC_Untrusted',             byte: 3, mask: 0b00010000, label: '開機時 RTC 時間不可信' },
  { name: 'RestartDegraded',           byte: 3, mask: 0b00100000, label: '連續異常重啟，降級運作' },
  { name: 'TaskCreateFail',            byte: 3, mask: 0b01000000, label: '工作建立失敗（記憶體不足）' },
  { name: 'TempFileCleaned',           byte: 3, mask: 0b10000000, label: '清除上次中斷的暫存檔' },
  { name: 'GPS_CommandFail',           byte: 4, mask: 0b00000001, label: 'GPS 啟動指令失敗' },
  { name: 'GPS_Timeout',               byte: 4, mask: 0b00000010, label: 'GPS 10 分鐘定不到' },
  { name: 'GPS_ManualSkip',            byte: 4, mask: 0b00000100, label: 'GPS 定位被手動略過' },
  { name: 'ServerTimeRejected',        byte: 4, mask: 0b00001000, label: '伺服器時間不合理，沒有校時' },
  { name: 'ModemNetworkError',         byte: 4, mask: 0b00010000, label: '數據機回報 601（網路錯誤）' },
  { name: 'UploadRetryExhausted',      byte: 4, mask: 0b00100000, label: '3 次上傳都失敗，資料留到下次' },
  { name: 'ConfigFieldDefaulted',      byte: 4, mask: 0b01000000, label: '設定檔欄位改用預設值' },
  { name: 'ConfigWriteFail',           byte: 4, mask: 0b10000000, label: '設定檔寫入失敗' },
  { name: 'ModemDnsError',             byte: 5, mask: 0b00000010, label: '數據機回報 603（DNS 錯誤）' },
  { name: 'PreopenAbandoned',          byte: 5, mask: 0b00000100, label: '放棄濁度預開' },
  { name: 'SleepCountdownCapped',      byte: 5, mask: 0b00001000, label: '休眠倒數超過上限，被截短' },
  { name: 'ForcedKillInLock',          byte: 5, mask: 0b00010000, label: '強制結束持鎖中的工作' },
  { name: 'DataAbandonByBufferFull',   byte: 5, mask: 0b00100000, label: 'SD 失效期間暫存超過 20 筆，刪除最舊資料' },
]

/** 把 errorcode_0～5 轉成 { 位元名稱: 是否設定 }。API 沒有回傳的 byte 當作 0。 */
function decodeErrorCode(data) {
  const errorCode = [0, 1, 2, 3, 4, 5].map(i => Number(data['errorcode_' + i]) || 0)
  return Object.fromEntries(ERROR_CODE_BITS.map(bit => [bit.name, (errorCode[bit.byte] & bit.mask) !== 0]))
}

// 機台卡片的電壓與訊號分級：4 級，數值 ≥ 門檻即屬於該級（由好到壞依序比對）
// 等級名稱預設用 SIGNAL_LEVELS 的 label，項目有 labels 時改用自己的
const SIGNAL_LEVELS = [
  { label: '極佳', color: '#198754' },
  { label: '良好', color: '#5cb85c' },
  { label: '普通', color: '#fd7e14' },
  { label: '差',   color: '#dc3545' },
]
// field：device_info 的欄位名稱。電壓門檻以 3 串鋰電池、單顆 3.9／3.6／3.3 V 換算；訊號門檻為 LTE 常用參考值
const STAT_TYPES = [
  { field: 'voltage', name: '電壓', icon: 'fa-car-battery', unit: 'V', thresholds: [11.7, 10.8, 9.9],
    labels: ['充足', '良好', '偏低', '過低'],
    fullName: '3 串鋰電池', description: '電池電壓。滿電 12.6 V、標稱 11.1 V（單顆 4.2／3.7 V），單顆約 3.0 V（9.0 V）為放電截止。' },
  { field: 'RSRP',  name: 'RSRP',  icon: 'fa-signal', unit: 'dBm', thresholds: [-80, -90, -100],
    fullName: '參考訊號接收功率', description: '收到的基地台訊號有多強，越接近 0 越強。' },
  { field: 'RSRQ',  name: 'RSRQ',  icon: 'fa-signal', unit: 'dB',  thresholds: [-10, -15, -20],
    fullName: '參考訊號接收品質', description: '訊號品質，會受干擾和基地台忙碌程度影響，越接近 0 越好。' },
  { field: 'RSSI',  name: 'RSSI',  icon: 'fa-signal', unit: 'dBm', thresholds: [-65, -75, -85],
    fullName: '接收訊號強度', description: '整個頻寬收到的總功率，包含雜訊與干擾，越接近 0 越強。' },
  { field: 'RSSNR', name: 'RSSNR', icon: 'fa-signal', unit: 'dB',  thresholds: [20, 13, 0],
    fullName: '訊號雜訊比', description: '訊號比雜訊強多少，數值越大越好。' },
]

// 機台卡片的連線狀態：超過 30 分鐘沒連線為灰色，超過 3 小時為深色（可能已斷線）
const STALE_THRESHOLD_MS = 30 * 60 * 1000
const OFFLINE_THRESHOLD_MS = 3 * 60 * 60 * 1000
// 首頁快速過濾開關；key 對應 connectionStatus() 的 key，color 是 Bootstrap 顏色名稱
const STATUS_FILTER_OPTIONS = [
  { key: 'online',  label: '連線中',     color: 'success' },
  { key: 'stale',   label: '稍久沒連線', color: 'secondary' },
  { key: 'offline', label: '可能已斷線', color: 'danger' },
]

// DB 數值欄位沒有資料時存 -999（specs/db-schema.md），畫面一律當成沒有資料
const MISSING_VALUE = -999

/** 轉成數字；null、空字串、非數字、-999 都回傳 null */
function validNumber(value) {
  if (value == null || value === '') return null
  const n = Number(value)
  if (Number.isNaN(n) || n === MISSING_VALUE) return null
  return n
}

/** fetch JSON（同網域的相對路徑）；HTTP 狀態不是 2xx 時丟出錯誤 */
async function fetchJson(path) {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

export default {
  components: { DeviceSelect },
  data () {
    return {
      errorCodeBits: ERROR_CODE_BITS,
      statTypes: STAT_TYPES,
      DeviceInfoList: {},
      filters: {
        "device": "",
        "maxNum": 200,
        "start": taiwanDate(-3),
        "end": taiwanDate(),
      },
      nowQueryData : [],
      nowQueryWarning: [],
      filterStr: "",
      basePlotUpdateing: false,
      warningPlotUpdateing: false,
      hasQueried: false,
      errorMessage: "",
      now: Date.now(),
      statusFilter: { online: true, stale: true, offline: true },
      statusFilterOptions: STATUS_FILTER_OPTIONS,
    }
  },
  computed:{
    deviceList(){
      return Object.keys(this.DeviceInfoList).sort((a, b) => a.localeCompare(b))
    },
    /** 各連線狀態的機台數（快速過濾按鈕上的數字） */
    statusCounts(){
      const counts = { online: 0, stale: 0, offline: 0 }
      for (let name of this.deviceList) {
        counts[this.connectionStatus(this.DeviceInfoList[name].base).key]++
      }
      return counts
    },
    canSearch(){
      return this.deviceList.includes(this.filters.device) && !this.basePlotUpdateing && !this.warningPlotUpdateing
    },
  },
  methods:{
    formatTaiwanDateTime,
    /** 依 STAT_TYPES 的門檻回傳 { label, color }；沒有數值（含 -999）時回傳 null */
    signalLevel(signal, value) {
      const n = validNumber(value)
      if (n == null) return null
      let index = signal.thresholds.findIndex(threshold => n >= threshold)
      if (index === -1) index = SIGNAL_LEVELS.length - 1
      return { label: signal.labels?.[index] ?? SIGNAL_LEVELS[index].label, color: SIGNAL_LEVELS[index].color }
    },
    signalStyle(signal, value) {
      const level = this.signalLevel(signal, value)
      return level ? { color: level.color, fontWeight: 'bold' } : {}
    },
    /** 各分級的數值區間文字（說明框用），例如 極佳 ≥ -80、良好 -90 ～ -80、差 < -100 */
    signalRanges(signal) {
      const t = signal.thresholds
      return SIGNAL_LEVELS.map((level, i) => ({
        label: signal.labels?.[i] ?? level.label,
        color: level.color,
        text: i === 0 ? `≥ ${t[0]}` : i < t.length ? `${t[i]} ～ ${t[i - 1]}` : `< ${t[t.length - 1]}`,
      }))
    },
    /** 名稱過濾與連線狀態快速過濾都符合才顯示 */
    isDeviceVisible(name) {
      if (name.indexOf(this.filterStr) === -1) return false
      return this.statusFilter[this.connectionStatus(this.DeviceInfoList[name].base).key]
    },
    hasWarning(flags) {
      return ERROR_CODE_BITS.some(bit => flags[bit.name])
    },
    /**
     * 依最新連線時間（device_info.updated_at）距今多久判斷連線狀態：
     * online 正常、stale 稍久沒連線（灰色卡片）、offline 太久沒連線，可能已斷線（深色卡片）。
     * now 每分鐘更新一次，畫面不用重新整理也會變色。
     */
    connectionStatus(base) {
      const updated = base ? parseApiTime(base.updated_at).getTime() : NaN
      if (Number.isNaN(updated)) return { key: 'online', label: '', ago: '' }
      const elapsed = this.now - updated
      const minutes = Math.floor(elapsed / 60000)
      const ago = minutes < 60 ? `${Math.max(minutes, 0)} 分鐘前`
        : minutes < 1440 ? `${Math.floor(minutes / 60)} 小時前`
        : `${Math.floor(minutes / 1440)} 天前`
      if (elapsed > OFFLINE_THRESHOLD_MS) return { key: 'offline', label: '可能已斷線', ago }
      if (elapsed > STALE_THRESHOLD_MS) return { key: 'stale', label: '稍久沒連線', ago }
      return { key: 'online', label: '', ago }
    },
    /** roll、pitch 的單位是度（specs/db-schema.md）；任一個沒有資料（null、-999）時回傳 null */
    calculateAngleWithVertical(rollDeg, pitchDeg) {
      const roll = validNumber(rollDeg);
      const pitch = validNumber(pitchDeg);
      if (roll == null || pitch == null) return null;
      const rollRad = roll * (Math.PI / 180);
      const pitchRad = pitch * (Math.PI / 180);

      // 計算法向量與垂直線的夾角 (總傾斜角 α)
      const cosAlpha = Math.cos(pitchRad) * Math.cos(rollRad);
      const alphaRad = Math.acos(cosAlpha);
      const alphaDeg = alphaRad * (180 / Math.PI);

      // 計算平面與垂直線的夾角 (β = 90 - α)
      const planeToVerticalDeg = 90 - alphaDeg;

      return {
        tiltAngle: Number(alphaDeg.toFixed(2)),       // 平面傾斜角 (法線與垂直線夾角)
        planeToVertical: Number(planeToVerticalDeg.toFixed(2)) // 平面本身與垂直線夾角
      };
    },
    /** 表格用：沒有資料（null、-999）顯示 '-'；digits 有給時固定小數位數 */
    formatNumber(value, digits) {
      const n = validNumber(value)
      if (n == null) return '-'
      return digits == null ? String(n) : n.toFixed(digits)
    },
    showError(what, error) {
      console.error(what, error)
      this.errorMessage = `${what}失敗：${error.message}`
    },
    async getAllDeviceInfo(){
      try {
        const myJson = await fetchJson("/api/device_info")
        for (let DeviceData of myJson) {
          if (this.DeviceInfoList[DeviceData.device] === undefined) {
            this.DeviceInfoList[DeviceData.device] = {}
          }
          this.DeviceInfoList[DeviceData.device]["base"] = DeviceData
        }
      } catch (error) {
        this.showError("讀取機台資訊", error)
      }
    },
    async getLast3Data(){
      try {
        const myJson = await fetchJson("/api/last3data")
        for (let deviceName of Object.keys(this.DeviceInfoList)) {
          this.DeviceInfoList[deviceName]["last3data"] = []
        }
        for (let data of myJson) {
          const device = this.DeviceInfoList[data.device]
          if (device === undefined) {
            continue
          }
          device["last3data"].push(data)
        }
        for (let deviceName of Object.keys(this.DeviceInfoList)) {
          this.DeviceInfoList[deviceName]["last3data"].sort((a, b) => parseApiTime(b.data_time) - parseApiTime(a.data_time))
        }
      } catch (error) {
        this.showError("讀取最新 3 筆資料", error)
      }
    },
    async getDeviceWaringListInOneHour(){
      try {
        const myJson = await fetchJson("/api/device_waring_in_onehour")
        for (let data of myJson) {
          if (this.DeviceInfoList[data.device] === undefined) {
            this.DeviceInfoList[data.device] = {}
          }
          this.DeviceInfoList[data.device]["waring"] = decodeErrorCode(data)
        }
      } catch (error) {
        this.showError("讀取 1 小時內錯誤", error)
      }
    },

    search(){
      if (!this.canSearch) return
      this.hasQueried = true
      this.errorMessage = ""
      this.getDeviceDatas()
      this.getDeviceWarning()
    },
    async getDeviceDatas(){
      this.basePlotUpdateing = true
      // 篩選的日期是台灣日期，轉成帶時區的時間再送（結束不含）；+ 要編碼
      const range = taiwanDayRange(this.filters.start, this.filters.end)
      try {
        const myJson = await fetchJson("/api/data?machine_id="+encodeURIComponent(this.filters.device)+"&maxLimit="+this.filters.maxNum+"&startDate="+encodeURIComponent(range.start)+"&endDate="+encodeURIComponent(range.end)+"&reverse=true")
        this.nowQueryData = myJson["data"]
        this.replotDirs()
      } catch (error) {
        this.showError("查詢歷史資料", error)
      } finally {
        this.basePlotUpdateing = false
      }
    },
    async getDeviceWarning(){
      this.warningPlotUpdateing = true
      const range = taiwanDayRange(this.filters.start, this.filters.end)
      try {
        const myJson = await fetchJson("/api/device_warning/"+encodeURIComponent(this.filters.device)+"?start_time="+encodeURIComponent(range.start)+"&end_time="+encodeURIComponent(range.end))
        this.nowQueryWarning = myJson
        this.replotWarningDir()
      } catch (error) {
        this.showError("查詢 Error Code", error)
      } finally {
        this.warningPlotUpdateing = false
      }
    },
    
    replotWarningDir(){
      // 每個位元畫成一條：y 值是該位元在 ERROR_CODE_BITS 中的序號（1 起），未設定為 0（之後濾掉）
      var datas = { data_times: [] }
      for (let bit of ERROR_CODE_BITS) {
        datas[bit.name] = []
      }
      const warningList = Array.isArray(this.nowQueryWarning)
        ? this.nowQueryWarning
        : []
      for (let data of warningList) {
        const flags = decodeErrorCode(data)
        datas["data_times"].push(data["data_time"])
        ERROR_CODE_BITS.forEach((bit, index) => {
          datas[bit.name].push(flags[bit.name] ? index + 1 : 0)
        })
      }
      
      var bar_data = [];
      
      for (let keyChose of Object.keys(datas)) {
        if (keyChose === "data_times") {continue}
        // 過濾掉y值為0的數據點
        const filteredX = []
        const filteredY = []
        for (let i = 0; i < datas[keyChose].length; i++) {
          if (datas[keyChose][i] !== 0) {
            filteredX.push(datas["data_times"][i])
            filteredY.push(datas[keyChose][i])
          }
        }
        if (filteredX.length > 0) {
          bar_data.push({
              x: filteredX,
              y: filteredY,
              name: keyChose,
              type: 'scatter',
          })
        }
      }

      this.replotTargetDir('warning-plot-dir', bar_data, {
        title: 'Error Code',
        gapSourceId: 'base-plot-dir',
        yaxis: {
          showticklabels: false
        }
      })
    },

    replotDirs(){
      // 直接取用的數值欄位；-999（沒有資料）轉成 null，圖上不畫
      const numberFields = ['voltage', 'temperature', 'acceleration_x', 'acceleration_y', 'acceleration_z', 'distance_pressure', 'distance_sound', 'distance_radar']
      const datas = { data_time: [], time_diff: [], planeToVertical: [] }
      numberFields.forEach(field => { datas[field] = [] })

      for (let data of this.nowQueryData?.data ?? []) {
        datas["data_time"].push(data["data_time"])
        numberFields.forEach(field => datas[field].push(validNumber(data[field])))

        const dataTime = parseApiTime(data["data_time"])
        dataTime.setSeconds(0, 0)
        datas["time_diff"].push(parseApiTime(data["created"]).getTime() - dataTime.getTime())

        datas["planeToVertical"].push(this.calculateAngleWithVertical(data.roll, data.pitch)?.planeToVertical ?? null)
      }

      this.replotTargetDir(
        'base-plot-dir',
        [
          {
            x: datas["data_time"],
            y: datas["voltage"],
            name: '電壓 (V)',
          },
          {
            x: datas["data_time"],
            y: datas["temperature"],
            name: '溫度 (攝氏)',
            yaxis: 'y2',
          },
        ], 
        {
          title: '電壓/溫度',
          yaxis: {title: '電壓'},
          yaxis2: {
            title: '溫度',
          },
        }
      )

      this.replotTargetDir(
        'gyro-plot-dir',
        [
          {
            x: datas["data_time"],
            y: datas["acceleration_x"],
            name: 'X (g)',
          },
          {
            x: datas["data_time"],
            y: datas["acceleration_y"],
            name: 'Y (g)',
          },
          {
            x: datas["data_time"],
            y: datas["acceleration_z"],
            name: 'Z (g)',
          },
          {
            x: datas["data_time"],
            y: datas["planeToVertical"],
            name: '平面與垂直線夾角 (度)',
            yaxis: 'y2',
          },
        ], 
        {
          title: '三軸感測器',
          yaxis: {title: '加速度 (g)'},
          yaxis2: {title: '夾角 (度)'},
        }
      )

      this.replotTargetDir(
        'range-plot-dir',
        [
          {
            x: datas["data_time"],
            y: datas["distance_pressure"],
            name: '壓力式 (mm)',
          },
          {
            x: datas["data_time"],
            y: datas["distance_sound"],
            name: '超聲波 (mm)',
          },
          {
            x: datas["data_time"],
            y: datas["distance_radar"],
            name: '雷達波 (mm)',
          },
          {
            x: datas["data_time"],
            y: datas["time_diff"].map((timeDiff) => timeDiff / 1000),
            name: '時間差 (秒)',
            type: 'scatter',
            marker: {color: 'red'},
            yaxis: 'y2',
          },
        ], 
        {
          title: '測距相關感測器',
          yaxis: {title: '距離 (mm)'},
          yaxis2: {
            title: '時間差 (秒)',
          },
        }
      )
    },

    replotTargetDir(ID, data, layout) {
      this.renderChart(ID, data, layout);
    },

    /**
     * 用 ECharts 畫一張時間序列圖。
     * seriesList：[{ x, y, name, yaxis: 'y1' | 'y2', type: 'line' | 'scatter', marker: { color } }]
     * options：{ title, yaxis: { title, showticklabels }, yaxis2: { title }, gapSourceId }
     * 所有圖同一個 group，縮放、十字線、提示框會連動；x 範圍由 syncCharts() 統一成全部圖的聯集。
     */
    renderChart(containerId, seriesList, options = {}) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const isNewChart = !echarts.getInstanceByDom(container);
      const chart = echarts.getInstanceByDom(container) || echarts.init(container);
      chart.group = CHART_GROUP;

      const parsedSeries = seriesList.map((s, idx) => {
        const rawPoints = [];
        if (s.x && s.y) {
          for (let i = 0; i < s.x.length; i++) {
            const rx = s.x[i];
            const ry = s.y[i];
            if (rx != null && ry != null && !isNaN(ry)) {
              const d = parseApiTime(rx);
              if (!isNaN(d.getTime())) {
                rawPoints.push([d.getTime(), Number(ry)]);
              }
            }
          }
        }
        rawPoints.sort((a, b) => a[0] - b[0]);

        // 相鄰兩點超過 GAP_THRESHOLD_MS 時插入空值，讓折線在斷線處斷開
        const points = [];
        for (let i = 0; i < rawPoints.length; i++) {
          if (i > 0 && rawPoints[i][0] - rawPoints[i - 1][0] > GAP_THRESHOLD_MS) {
            points.push([rawPoints[i - 1][0] + 1, null]);
          }
          points.push(rawPoints[i]);
        }

        return {
          name: s.name || `Series ${idx + 1}`,
          rawPoints,
          points,
          yaxis: s.yaxis || 'y1',
          type: s.type || 'line',
          color: s.marker?.color || s.color || CHART_COLORS[idx % CHART_COLORS.length],
        };
      });

      const chartTimes = Array.from(new Set(
        parsedSeries.flatMap(series => series.rawPoints.map(point => point[0]))
      )).sort((a, b) => a - b);
      const gapIntervals = [];
      for (let i = 1; i < chartTimes.length; i++) {
        if (chartTimes[i] - chartTimes[i - 1] > GAP_THRESHOLD_MS) {
          gapIntervals.push([chartTimes[i - 1], chartTimes[i]]);
        }
      }

      const hasY2 = parsedSeries.some(s => s.yaxis === 'y2');
      const hideValue = options.yaxis?.showticklabels === false;
      const formatAxisTime = taiwanFormat('%m/%d %H:%M');

      chart.setOption({
        animation: false,
        title: {
          text: options.title,
          left: 'center',
          top: 8,
          textStyle: { fontSize: 15, fontWeight: 600, color: '#212529' },
        },
        legend: {
          type: 'scroll',
          top: 34,
          data: parsedSeries.map(s => s.name),
          textStyle: { fontSize: 11, color: '#495057' },
        },
        toolbox: {
          right: 12,
          top: 6,
          feature: {
            myReset: {
              show: true,
              title: '還原縮放',
              icon: RESET_ICON,
              onclick: () => this.resetChartZoom(),
            },
          },
        },
        grid: { top: 72, left: 65, right: hasY2 ? 65 : 30, bottom: 62 },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'line', lineStyle: { type: 'dashed', color: '#6c757d' } },
          formatter: (params) => {
            const list = (Array.isArray(params) ? params : [params])
              .filter(p => p.seriesId !== GAP_SERIES_ID && p.value?.[1] != null);
            if (list.length === 0) return '';
            let html = `<div style="font-weight:bold;margin-bottom:2px;">${formatTaiwanDateTime(new Date(list[0].axisValue))}</div>`;
            list.forEach(p => {
              html += hideValue
                ? `<div>${p.marker}${p.seriesName}</div>`
                : `<div>${p.marker}${p.seriesName}: <b>${Number(p.value[1]).toFixed(2)}</b></div>`;
            });
            return html;
          },
        },
        xAxis: {
          type: 'time',
          axisLabel: { formatter: value => formatAxisTime(new Date(value)), hideOverlap: true, color: '#495057' },
          splitLine: { show: false },
        },
        yAxis: [
          {
            type: 'value',
            scale: true,
            name: options.yaxis?.title,
            nameLocation: 'middle',
            nameGap: 48,
            nameTextStyle: { color: '#495057' },
            axisLabel: { show: !hideValue, color: '#495057' },
            splitLine: { lineStyle: { type: 'dashed', color: '#dee2e6' } },
          },
          ...(hasY2 ? [{
            type: 'value',
            scale: true,
            position: 'right',
            name: options.yaxis2?.title,
            nameLocation: 'middle',
            nameGap: 48,
            nameTextStyle: { color: '#495057' },
            axisLabel: { color: '#495057' },
            splitLine: { show: false },
          }] : []),
        ],
        dataZoom: [
          { type: 'inside', filterMode: 'weakFilter' },
          {
            type: 'slider',
            filterMode: 'weakFilter',
            height: 18,
            bottom: 10,
            labelFormatter: value => formatTaiwanDateTime(new Date(value)),
          },
        ],
        series: [
          {
            // 斷線灰色區：不列在圖例，不能被關掉
            id: GAP_SERIES_ID,
            name: '斷線',
            type: 'custom',
            silent: true,
            z: 0,
            encode: { x: [0, 1] },
            data: [],
            renderItem: (params, api) => {
              const coordSys = params.coordSys;
              const start = api.coord([api.value(0), 0]);
              const end = api.coord([api.value(1), 0]);
              const shape = echarts.graphic.clipRectByRect(
                { x: start[0], y: coordSys.y, width: end[0] - start[0], height: coordSys.height },
                { x: coordSys.x, y: coordSys.y, width: coordSys.width, height: coordSys.height }
              );
              return shape && { type: 'rect', shape, style: { fill: 'rgba(108, 117, 125, 0.18)' } };
            },
          },
          ...parsedSeries.map(s => s.type === 'line'
            ? {
              name: s.name,
              type: 'line',
              yAxisIndex: s.yaxis === 'y2' ? 1 : 0,
              data: s.points,
              showSymbol: false,
              sampling: 'lttb',
              lineStyle: { width: 2 },
              color: s.color,
            }
            : {
              name: s.name,
              type: 'scatter',
              yAxisIndex: s.yaxis === 'y2' ? 1 : 0,
              data: s.rawPoints,
              symbolSize: 7,
              color: s.color,
            }),
        ],
      }, true);

      if (isNewChart) {
        chart.getZr().on('dblclick', () => this.resetChartZoom());
      }

      this.charts[containerId] = markRaw({
        chart,
        gapIntervals,
        gapSourceId: options.gapSourceId,
        xExtent: chartTimes.length > 0 ? [chartTimes[0], chartTimes[chartTimes.length - 1]] : null,
      });
      this.syncCharts();
    },

    /**
     * 把所有圖的 x 範圍統一成聯集（縮放用百分比連動，範圍不同會對不齊），並更新斷線灰色區。
     * options.gapSourceId 的圖（Error Code 只有出錯才有點，無法自己判斷斷線）改用來源圖算出的區間，
     * 來源圖晚畫完時，這裡也會跟著更新。
     */
    syncCharts() {
      const records = Object.values(this.charts);
      const extents = records.map(record => record.xExtent).filter(Boolean);
      if (extents.length === 0) return;

      let min = Math.min(...extents.map(extent => extent[0]));
      let max = Math.max(...extents.map(extent => extent[1]));
      if (min === max) {
        min -= 3600000;
        max += 3600000;
      }

      records.forEach((record) => {
        const gapIntervals = record.gapSourceId
          ? (this.charts[record.gapSourceId]?.gapIntervals || [])
          : record.gapIntervals;
        record.chart.setOption({
          xAxis: { min, max },
          series: [{ id: GAP_SERIES_ID, data: gapIntervals }],
        });
      });
    },

    /** 還原縮放；同 group 的圖會跟著還原 */
    resetChartZoom() {
      const record = Object.values(this.charts)[0];
      if (record) {
        record.chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 });
      }
    }
  },
  created() {
    // ECharts 實例不放進 data()，避免被 Vue 包成 reactive
    this.charts = {}
  },
  async mounted() {
    window.test = this
    this.handleResize = () => {
      Object.values(this.charts).forEach(record => record.chart.resize());
    };
    window.addEventListener('resize', this.handleResize);
    this.nowTimer = setInterval(() => { this.now = Date.now() }, 60 * 1000);

    await this.getAllDeviceInfo()
    await this.getLast3Data()
    await this.getDeviceWaringListInOneHour()
  },
  unmounted() {
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
    clearInterval(this.nowTimer);
    Object.values(this.charts).forEach(record => record.chart.dispose());
    this.charts = {}
  }
}
</script>
<style lang="postcss">
/* https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting */
.update-ing {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.chart-box {
  height: 380px;
}

/* 首頁過濾列：名稱輸入框占滿剩餘寬度，快速過濾按鈕在右邊，太窄時換行 */
.device-filter-input {
  flex: 1 1 260px;
  width: auto;
}

/* 搜尋列：各欄位的最小寬度，視窗太窄時整組換行 */
.search-device {
  width: auto;
  min-width: 200px;
}
.search-date {
  width: auto;
  min-width: 320px;
}
.search-limit {
  width: auto;
  min-width: 140px;
}

/* 歷史資料表：表頭在捲動時固定 */
.history-table-wrap {
  max-height: 500px;
  overflow: auto;
}
.history-table-wrap thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}

/* 機台卡片 */
.device-card {
  height: 100%;
}
.device-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.device-warning {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}
.device-stats {
  display: grid;
  /* 寬度不夠時自動換行，手機上不會撐出橫向捲軸 */
  grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}
/* 訊號說明：滑鼠移到 ⓘ 上顯示，靠右對齊避免超出卡片 */
.signal-info {
  position: relative;
  color: #adb5bd;
  cursor: help;
}
.signal-info:hover {
  color: #6c757d;
}
.signal-info-popover {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  right: -6px;
  z-index: 10;
  width: 230px;
  padding: 8px 10px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #212529;
  font-size: 0.8rem;
  line-height: 1.5;
  white-space: normal;
  cursor: default;
}
.signal-info:hover .signal-info-popover {
  display: block;
}
/* 顏色用 Bootstrap 變數，卡片切成深色（data-bs-theme="dark"）時會跟著變 */
.device-stat {
  border: 1px solid var(--bs-border-color);
  border-top: 3px solid #adb5bd;
  border-radius: 6px;
  padding: 6px 10px;
  background-color: var(--bs-body-bg);
}
.device-stat-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
}
.device-stat-value {
  display: flex;
  align-items: baseline;
  column-gap: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
}
.device-stat-value small {
  font-size: 0.75rem;
  font-weight: 400;
}
/* 評價與數值同一行、靠右 */
.device-stat-level {
  margin-left: auto;
  font-size: 0.75rem;
}
/* 表頭底色用主題變數（不用 table-light），深色卡片時不會出現一條白色 */
.device-table thead th {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--bs-secondary-color);
  background-color: var(--bs-tertiary-bg);
}

/* 連線狀態：stale 稍久沒連線 → 整張卡片灰色；offline 可能已斷線 → 深色（data-bs-theme="dark"） */
.device-card-stale {
  --bs-body-bg: #e9ecef;
  --bs-tertiary-bg: #dee2e6;
  --bs-tertiary-bg-rgb: 206, 212, 218;
  --bs-border-color: #ced4da;
  border-color: #adb5bd;
}
/* 深色卡片半透明，滑鼠移上去時恢復，方便查看 */
.device-card-offline {
  border-color: #495057;
  opacity: 0.75;
  transition: opacity 0.2s;
}
.device-card-offline:hover {
  opacity: 1;
}
.connection-badge {
  font-weight: 500;
}
.device-card-stale .connection-badge {
  background-color: #6c757d;
}
.device-card-offline .connection-badge {
  background-color: #dc3545;
}
</style>