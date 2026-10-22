<template>
  <div class="">
    <div class="container-fluid" style="margin: 8px 0;">
      <div class="input-group">
        <span class="input-group-text" id="basic-addon1">過濾</span>
        <input type="text" class="form-control" placeholder="請輸入名稱" v-model="filterStr">
      </div>
    </div>
    <div class="container-fluid">
      <div class="row g-2">
        <div class="col-12 col-xl-6" v-for="(name, index) of deviceList" v-show="name.indexOf(filterStr) != -1">
        <!-- <div class="col-12 col-xl-6" v-for="(data, name, index) of DeviceInfoList" v-show="name.indexOf(filterStr) != -1"> -->
          <div class="card" style="min-width: 560px;">
            <div class="card-body">
              <h5 class="card-title">{{name}}</h5>
              <template v-if="DeviceInfoList[name]['waring'] !== undefined">
                1小時內錯誤警訊: 
                <!-- {{ data['waring'] }} -->
                <template v-for="bit of errorCodeBits" :key="bit.name">
                  <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'][bit.name]" :title="bit.name">{{ bit.label }}</div>
                </template>

              </template>
              <template v-if="DeviceInfoList[name]['base'] !== undefined">
                <div>最新連線時間: {{(new Date(DeviceInfoList[name].base.updated_at)).format("yyyy-MM-dd hh:mm:ss")}}</div>
                <div>電壓: {{DeviceInfoList[name].base.voltage}} V</div>
                <div>訊號: RSRP {{DeviceInfoList[name].base.RSRP ?? '-'}} dBm, RSRQ {{DeviceInfoList[name].base.RSRQ ?? '-'}} dB, RSSI {{DeviceInfoList[name].base.RSSI ?? '-'}} dBm, RSSNR {{DeviceInfoList[name].base.RSSNR ?? '-'}} dB</div>
                <div>版本: {{DeviceInfoList[name].base.firmware_version}}</div>
              </template>
              <div v-else>資料讀取中</div>  
              <hr>
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th scope="col">資料時間(+8)</th>
                    <th scope="col">壓力 (mm)</th>
                    <th scope="col">聲波 (mm)</th>
                    <th scope="col">雷達測距 (mm)</th>
                    <th scope="col">雷達測速 (mm/s)</th>
                    <th scope="col">濁度 (NTU)</th>
                    <th scope="col">濁度 (mg/L)</th>
                  </tr>
                </thead>
                <tbody>
                  
                  <tr v-for="(SensorData, index) of DeviceInfoList[name].last3data">
                    <td style="white-space:nowrap;">{{new Date((new Date(SensorData.data_time)).getTime() + 8 * 60 * 60 * 1000).format("yyyy-MM-dd hh:mm:ss")}}</td>
                    <td>{{SensorData.distance_pressure ?? '-'}}</td>
                    <td>{{SensorData.distance_sound ?? '-'}}</td>
                    <td>{{SensorData.distance_radar ?? '-'}}</td>
                    <td>{{SensorData.speed_radar ?? '-'}}</td>
                    <td>{{SensorData.turbidity_ntu ?? '-'}}</td>
                    <td>{{SensorData.turbidity_mg_l ?? '-'}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
  <hr style="margin: 8px 8px;">
  <div class="container-fluid" style="margin: 8px 0;">
    <div class="row g-2">
      <div class="col-12 col-xl-6">
        <div class="card" style="overflow: hidden;">
          <div class="card-body" style="padding:0; position: relative;">
            <div id="base-plot-dir"></div>
            <div class="update-ing" v-show="basePlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card" style="overflow: hidden;">
          <div class="card-body" style="padding:0; position: relative;">
            <div id="warning-plot-dir"></div>
            <div class="update-ing" v-show="warningPlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card" style="overflow: hidden;">
          <div class="card-body" style="padding:0; position: relative;">
            <div id="range-plot-dir"></div>
            <div class="update-ing" v-show="basePlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card" style="overflow: hidden;">
          <div class="card-body" style="padding:0; position: relative;">
            <div id="gyro-plot-dir"></div>
            <div class="update-ing" v-show="basePlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- <div class="container-fluid" style="margin: 8px 0;">
    <div class="card">
      <div class="card-body">
        <div id="warning-plot-dir"></div>
      </div>
    </div>
  </div> -->
  <div class="container-fluid" style="margin: 8px 0;">
    <div class="card">
      <div class="card-body">
        <div class="container">
          <div class="row">
            <div class="col-2">
              <div class="input-group input-group-sm mb-3">
                <span class="input-group-text" id="inputGroup-sizing-sm">筆數</span>
                <select class="form-select form-select-sm" v-model="filters.maxNum">
                  <option>200</option>
                  <option>2000</option>
                  <option>99999999</option>
                </select>
              </div>
            </div>
            <div class="col-2">
              <div class="input-group input-group-sm mb-3">
                <select class="form-select form-select-sm" v-model="filters.device">
                  <option>-</option>
                  <option v-for="name in deviceList" :key="name">{{name}}</option>
                </select>
              </div>
            </div>
            <div class="col-6">
              <div class="input-group input-group-sm mb-3">
                <input class="form-control" type="date"  v-model="filters.start">
                <span class="input-group-text">~</span>
                <input class="form-control" type="date"  v-model="filters.end">
              </div>
            </div>
            <div class="col-1">
              <button class="btn btn-sm btn-primary" @click="getDeviceDatas();getDeviceWarning();">搜尋</button>
            </div>
            <div class="col-1">
              <button class="btn btn-sm btn-primary">下載</button>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body" style="max-height: 500px;overflow: auto;">
        <table class="table table-sm">
          <thead>
            <tr>
              <th scope="col">機器編號</th>
              <th scope="col">資料時間 (+8)</th>
              <th scope="col">電壓 (V)</th>
              <th scope="col">溫度 (攝氏)</th>
              <th scope="col">加速度x,y,z (g)</th>
              <th scope="col">與垂直線的夾角</th>
              <th scope="col">壓力式測距 (mm)</th>
              <th scope="col">超聲波測距 (mm)</th>
              <th scope="col">雷達波測距 (mm)</th>
              <th scope="col">雷達波測速 (mm/s)</th>
              <th scope="col">RS485濁度 (NTU)</th>
              <th scope="col">RS485濁度 (mg/L)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(SensorData, index) of nowQueryData.data">
              <td>{{ SensorData.device }}</td>
              <td>{{(new Date(SensorData.data_time)).format("yyyy-MM-dd hh:mm:ss")}}</td>
              <td>{{ SensorData.voltage?.toFixed(2) ?? '-' }}</td>
              <td>{{ SensorData.temperature?.toFixed(2) ?? '-' }}</td>
              <td>{{ SensorData.acceleration_x?.toFixed(2) }},{{ SensorData.acceleration_y?.toFixed(2) }},{{ SensorData.acceleration_z?.toFixed(2) }}</td>
              <td>{{ calculateAngleWithVertical(SensorData.roll??0, SensorData.pitch??0).planeToVertical ?? '-' }}</td>
              <td>{{ SensorData.distance_pressure?.toFixed(0) ?? '-' }}</td>
              <td>{{ SensorData.distance_sound?.toFixed(0) ?? '-' }}</td>
              <td>{{ SensorData.distance_radar?.toFixed(0) ?? '-' }}</td>
              <td>{{ SensorData.speed_radar?.toFixed(0) ?? '-' }}</td>
              <td>{{ SensorData.turbidity_ntu?.toFixed(2) ?? '-' }}</td>
              <td>{{ SensorData.turbidity_mg_l?.toFixed(2) ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

</template>

<script>
import * as d3 from 'd3'

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
]

/** 把 errorcode_0～5 轉成 { 位元名稱: 是否設定 }。API 沒有回傳的 byte 當作 0。 */
function decodeErrorCode(data) {
  const errorCode = [0, 1, 2, 3, 4, 5].map(i => Number(data['errorcode_' + i]) || 0)
  return Object.fromEntries(ERROR_CODE_BITS.map(bit => [bit.name, (errorCode[bit.byte] & bit.mask) !== 0]))
}

export default {
  data () {
    return {
      errorCodeBits: ERROR_CODE_BITS,
      DeviceInfoList: {},
      filters: {
        "device": "",
        "maxNum": 200,
        "start": (new Date()).addHours(-24*3).format("yyyy-MM-dd"),
        "end": (new Date()).format("yyyy-MM-dd"),
      },
      nowQueryData : [],
      nowQueryWarning: [],
      filterStr: "",
      basePlotUpdateing: false,
      warningPlotUpdateing: false,
      gyroPlotUpdateing: false,
      isSyncingPlot: false,
      d3Charts: {},
    }
  },
  computed:{
    deviceList(){
      let data = Object.keys(this.DeviceInfoList).sort((a, b) => {
        return a.localeCompare(b)
      })
      console.log(data) 
      return data
    },
  },
  methods:{
    calculateAngleWithVertical(rollRad, pitchRad) {
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
    async getAllDeviceInfo(){
      var This = this
      await fetch("http://35.206.236.245/api/device_info")
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson) {
        for (let DeviceData of myJson) {
          if (This.DeviceInfoList[DeviceData.device] === undefined) {
            This.DeviceInfoList[DeviceData.device] = {}
          }
          This.DeviceInfoList[DeviceData.device]["base"] = DeviceData
        }
      });
    },
    async getLast3Data(){
      var This = this
      await fetch("http://35.206.236.245/api/last3data")
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson) {
        for (var deviceName of Object.keys(This.DeviceInfoList)) {
          This.DeviceInfoList[deviceName]["last3data"] = []
        }

        for (let data of myJson) {
          var deviceName = data.device
          console.log(deviceName)
          if (This.DeviceInfoList[deviceName] === undefined) {
            continue
          }
          if (This.DeviceInfoList[deviceName]["last3data"] === undefined) {
            This.DeviceInfoList[deviceName]["last3data"] = []
          }
          This.DeviceInfoList[deviceName]["last3data"].push(data)
          This.DeviceInfoList[deviceName]["last3data"].sort((a, b) => {
            return new Date(b.data_time) - new Date(a.data_time)
          })
        }
      });
    },
    async getDeviceWaringListInOneHour(){
      var This = this
      fetch("http://35.206.236.245/api/device_waring_in_onehour")
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson) {
        for (let data of myJson) {
          var deviceName = data.device
          if (This.DeviceInfoList[deviceName] === undefined) {
            This.DeviceInfoList[deviceName] = {}
          }
          console.log(data)
          This.DeviceInfoList[deviceName]["waring"] = decodeErrorCode(data)
        }
      });
    },

    getDeviceDatas(){
      var This = this
      this.basePlotUpdateing = true
      fetch("http://35.206.236.245/api/data?machine_id="+this.filters.device+"&maxLimit="+this.filters.maxNum+"&startDate="+this.filters.start+"&endDate="+this.filters.end+"&reverse=true")
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson) {
        // console.log(myJson)
        This.nowQueryData = myJson["data"]
        This.replotDirs()
        This.basePlotUpdateing = false
      });
    },
    getDeviceWarning(){
      var This = this
      this.warningPlotUpdateing = true
      fetch("http://35.206.236.245/api/device_warning/"+this.filters.device+"?start_time="+this.filters.start+"&end_time="+this.filters.end)
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson) {
        This.nowQueryWarning = myJson
        This.replotWarningDir()
        This.warningPlotUpdateing = false
      });
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
      console.log(warningList)
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
        yaxis: {
          showticklabels: false
        }
      })
    },

    replotDirs(){
      var datas = {
        acceleration_x: [],
        acceleration_y: [],
        acceleration_z: [],
        roll: [],
        pitch: [],
        yaw: [],
        planeToVertical: [],
        conductivity: [],
        data_time: [],
        distance_pressure: [],
        distance_radar: [],
        distance_sound: [],
        humidity: [],
        temperature: [],
        turbidity: [],
        voltage:[],
        time_diff: []
      }
      console.log(this.nowQueryData)
      for (let data of this.nowQueryData.data) {
        for (let keyChose of Object.keys(datas)) {
          datas[keyChose].push(data[keyChose])
        }
        const dataTime = new Date(data["data_time"])
        data["data_time"] = new Date(data["data_time"])
        dataTime.setSeconds(0, 0)
        datas["time_diff"].push(new Date(data["created"]).getTime() - dataTime.getTime())

        datas["planeToVertical"].push(this.calculateAngleWithVertical(data.roll??0, data.pitch??0).planeToVertical)
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
          title: '電壓/溫度/濕度',
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
            name: 'X (度)',
          },
          {
            x: datas["data_time"],
            y: datas["acceleration_y"],
            name: 'Y (度)',
          },
          {
            x: datas["data_time"],
            y: datas["acceleration_z"],
            name: 'Z (度)',
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
          yaxis: {title: '角度'},
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
      this.renderD3Chart(ID, data, layout);
    },

    syncChartXDomains() {
      const charts = Object.values(this.d3Charts).filter(chart => chart && chart.seriesList && chart.xScale && chart.xAxisG && chart.drawSeries)
      if (charts.length === 0) return

      const allDates = []
      charts.forEach((chart) => {
        chart.seriesList.forEach((series) => {
          if (!series || !Array.isArray(series.x)) return
          series.x.forEach((value) => {
            if (value == null) return
            const date = value instanceof Date ? value : new Date(value)
            if (!Number.isNaN(date.getTime())) {
              allDates.push(date)
            }
          })
        })
      })

      if (allDates.length === 0) return

      const minDate = d3.min(allDates)
      const maxDate = d3.max(allDates)
      if (!minDate || !maxDate) return

      charts.forEach((chart) => {
        chart.xScale.domain([minDate, maxDate])
        chart.xAxisG.call(d3.axisBottom(chart.xScale).ticks(5).tickFormat(d3.timeFormat('%m/%d %H:%M')))
        chart.drawSeries(chart.xScale, chart.y1Scale, chart.y2Scale)
      })
    },

    renderD3Chart(containerId, seriesList, options = {}) {
      const container = document.getElementById(containerId);
      if (!container) return;

      d3.select(container).selectAll('*').remove();

      const containerWidth = container.clientWidth || 550;
      const containerHeight = 350;

      const margin = { top: 60, right: 65, bottom: 45, left: 65 };
      const width = Math.max(100, containerWidth - margin.left - margin.right);
      const height = Math.max(100, containerHeight - margin.top - margin.bottom);

      const colorPalette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
      const GAP_THRESHOLD_MS = 30 * 60 * 1000;

      const parsedSeries = seriesList.map((s, idx) => {
        const rawPoints = [];
        if (s.x && s.y) {
          for (let i = 0; i < s.x.length; i++) {
            const rx = s.x[i];
            const ry = s.y[i];
            if (rx != null && ry != null && !isNaN(ry)) {
              const d = rx instanceof Date ? rx : new Date(rx);
              if (!isNaN(d.getTime())) {
                rawPoints.push({ x: d, y: Number(ry) });
              }
            }
          }
        }
        rawPoints.sort((a, b) => a.x - b.x);

        const points = [];
        for (let i = 0; i < rawPoints.length; i++) {
          if (i > 0) {
            const diff = rawPoints[i].x.getTime() - rawPoints[i - 1].x.getTime();
            if (diff > GAP_THRESHOLD_MS) {
              points.push({ x: new Date(rawPoints[i - 1].x.getTime() + 1), y: null });
            }
          }
          points.push(rawPoints[i]);
        }

        return {
          name: s.name || `Series ${idx + 1}`,
          points,
          yaxis: s.yaxis || 'y1',
          type: s.type || 'line',
          color: s.marker?.color || s.color || colorPalette[idx % colorPalette.length],
          visible: true,
        };
      });

      const chartTimes = Array.from(new Set(
        parsedSeries.flatMap(series => series.points
          .filter(point => point.y != null)
          .map(point => point.x.getTime()))
      )).sort((a, b) => a - b);
      const gapIntervals = [];
      for (let i = 1; i < chartTimes.length; i++) {
        if (chartTimes[i] - chartTimes[i - 1] > GAP_THRESHOLD_MS) {
          gapIntervals.push({ start: new Date(chartTimes[i - 1]), end: new Date(chartTimes[i]) });
        }
      }

      let allX = [];
      parsedSeries.forEach(s => {
        s.points.forEach(p => {
          if (p.x) allX.push(p.x);
        });
      });

      let xDomain = d3.extent(allX);
      if (!xDomain[0] || !xDomain[1]) {
        const now = new Date();
        xDomain = [new Date(now.getTime() - 86400000), now];
      } else if (xDomain[0].getTime() === xDomain[1].getTime()) {
        xDomain = [new Date(xDomain[0].getTime() - 3600000), new Date(xDomain[1].getTime() + 3600000)];
      }

      const computeYDomains = (currXScale) => {
        const visibleSeries = parsedSeries.filter(s => s.visible);

        const currentDomainX = currXScale ? currXScale.domain() : null;

        const isPointInXRange = (p) => {
          if (!p || p.x == null) return false;
          if (!currentDomainX) return true;
          const time = p.x.getTime();
          return time >= currentDomainX[0].getTime() && time <= currentDomainX[1].getTime();
        };

        const y1Points = [];
        visibleSeries.filter(s => s.yaxis !== 'y2').forEach(s => {
          s.points.forEach(p => {
            if (p.y != null && !isNaN(p.y) && isPointInXRange(p)) y1Points.push(p.y);
          });
        });

        if (y1Points.length === 0) {
          visibleSeries.filter(s => s.yaxis !== 'y2').forEach(s => {
            s.points.forEach(p => {
              if (p.y != null && !isNaN(p.y)) y1Points.push(p.y);
            });
          });
        }

        let y1Dom = d3.extent(y1Points);
        if (y1Dom[0] === undefined || y1Dom[1] === undefined) {
          y1Dom = [0, 10];
        } else if (y1Dom[0] === y1Dom[1]) {
          y1Dom = [y1Dom[0] - 1, y1Dom[1] + 1];
        } else {
          const pad = (y1Dom[1] - y1Dom[0]) * 0.05;
          y1Dom = [y1Dom[0] - pad, y1Dom[1] + pad];
        }

        let y2Dom = [0, 10];
        const hasVisibleY2 = visibleSeries.some(s => s.yaxis === 'y2');
        if (hasVisibleY2) {
          const y2Points = [];
          visibleSeries.filter(s => s.yaxis === 'y2').forEach(s => {
            s.points.forEach(p => {
              if (p.y != null && !isNaN(p.y) && isPointInXRange(p)) y2Points.push(p.y);
            });
          });

          if (y2Points.length === 0) {
            visibleSeries.filter(s => s.yaxis === 'y2').forEach(s => {
              s.points.forEach(p => {
                if (p.y != null && !isNaN(p.y)) y2Points.push(p.y);
              });
            });
          }

          let ext = d3.extent(y2Points);
          if (ext[0] !== undefined && ext[1] !== undefined) {
            if (ext[0] === ext[1]) {
              y2Dom = [ext[0] - 1, ext[1] + 1];
            } else {
              const pad = (ext[1] - ext[0]) * 0.05;
              y2Dom = [ext[0] - pad, ext[1] + pad];
            }
          }
        }

        return { y1Domain: y1Dom, y2Domain: y2Dom };
      };

      const initialDomains = computeYDomains();
      let y1Domain = initialDomains.y1Domain;
      let y2Domain = initialDomains.y2Domain;
      const hasY2 = parsedSeries.some(s => s.yaxis === 'y2');

      const svg = d3.select(container)
        .append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .style('display', 'block')
        .style('overflow', 'hidden');

      if (options.title) {
        svg.append('text')
          .attr('x', containerWidth / 2)
          .attr('y', 22)
          .attr('text-anchor', 'middle')
          .style('font-size', '15px')
          .style('font-weight', '600')
          .style('fill', '#212529')
          .text(options.title);
      }

      const legendG = svg.append('g')
        .attr('transform', `translate(${margin.left}, 38)`);

      let currentLegendX = 0;
      parsedSeries.forEach((s) => {
        const legGroup = legendG.append('g')
          .attr('transform', `translate(${currentLegendX}, 0)`)
          .style('cursor', 'pointer');

        let symbol;
        if (s.type === 'line') {
          symbol = legGroup.append('line')
            .attr('x1', 0).attr('y1', 0).attr('x2', 14).attr('y2', 0)
            .attr('stroke', s.color).attr('stroke-width', 2);
        } else {
          symbol = legGroup.append('circle')
            .attr('cx', 7).attr('cy', 0).attr('r', 3.5)
            .attr('fill', s.color);
        }
        const textNode = legGroup.append('text')
          .attr('x', 18).attr('y', 4)
          .style('font-size', '11px')
          .style('fill', '#495057')
          .text(s.name);

        legGroup.on('click', () => {
          s.visible = !s.visible;
          legGroup.style('opacity', s.visible ? 1 : 0.35);

          const { y1Domain: newY1Dom, y2Domain: newY2Dom } = computeYDomains(currentXScale);
          y1Scale.domain(newY1Dom);
          if (y2Scale) {
            y2Scale.domain(newY2Dom);
          }

          yAxis1G.call(yAxis1Axis.scale(y1Scale));
          if (yAxis2G && y2Scale) {
            yAxis2G.call(d3.axisRight(y2Scale));
          }
          drawGrid(y1Scale);
          drawSeries(currentXScale, y1Scale, y2Scale);
        });

        const bbox = textNode.node().getBBox();
        currentLegendX += bbox.width + 28;
      });

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const xScale = d3.scaleTime().domain(xDomain).range([0, width]);
      const y1Scale = d3.scaleLinear().domain(y1Domain).range([height, 0]);
      const y2Scale = hasY2 ? d3.scaleLinear().domain(y2Domain).range([height, 0]) : null;

      const clipId = `clip-${containerId}`;
      svg.append('defs')
        .append('clipPath')
        .attr('id', clipId)
        .append('rect')
        .attr('width', width)
        .attr('height', height);

      const gridG = g.append('g')
        .attr('class', 'grid');

      const drawGrid = (currYScale) => {
        gridG.call(
          d3.axisLeft(currYScale)
            .tickSize(-width)
            .tickFormat('')
        ).selectAll('.domain').remove();

        gridG.selectAll('line')
          .style('stroke', '#6c757d')
          .style('stroke-dasharray', '2,4')
          .style('opacity', '0.2');
      };
      drawGrid(y1Scale);

      const xAxisG = g.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat('%m/%d %H:%M')));

      const yAxis1Axis = d3.axisLeft(y1Scale);
      if (options.yaxis?.showticklabels === false) {
        yAxis1Axis.tickFormat('');
      }
      const yAxis1G = g.append('g').call(yAxis1Axis);

      if (options.yaxis?.title) {
        g.append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', -48)
          .attr('x', -height / 2)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('fill', '#495057')
          .text(options.yaxis.title);
      }

      let yAxis2G = null;
      if (hasY2 && y2Scale) {
        yAxis2G = g.append('g')
          .attr('transform', `translate(${width}, 0)`)
          .call(d3.axisRight(y2Scale));

        if (options.yaxis2?.title) {
          g.append('text')
            .attr('transform', 'rotate(90)')
            .attr('y', -width - 48)
            .attr('x', height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#495057')
            .text(options.yaxis2.title);
        }
      }

      const plotG = g.append('g').attr('clip-path', `url(#${clipId})`);

      const drawSeries = (currXScale, currY1Scale, currY2Scale) => {
        plotG.selectAll('*').remove();

        plotG.selectAll('.data-gap')
          .data(gapIntervals)
          .join('rect')
          .attr('class', 'data-gap')
          .attr('x', gap => currXScale(gap.start))
          .attr('y', 0)
          .attr('width', gap => Math.max(0, currXScale(gap.end) - currXScale(gap.start)))
          .attr('height', height)
          .attr('fill', '#6c757d')
          .attr('opacity', 0.18);

        parsedSeries.forEach(s => {
          if (!s.visible) return;

          const yScale = s.yaxis === 'y2' ? currY2Scale : currY1Scale;
          if (!yScale) return;

          if (s.type === 'line') {
            const lineGen = d3.line()
              .defined(d => d.y != null && !isNaN(d.y))
              .x(d => currXScale(d.x))
              .y(d => yScale(d.y));

            plotG.append('path')
              .datum(s.points)
              .attr('fill', 'none')
              .attr('stroke', s.color)
              .attr('stroke-width', 2)
              .attr('d', lineGen);
          } else {
            plotG.selectAll(`circle-${s.name.replace(/[^a-zA-Z0-9]/g, '')}`)
              .data(s.points.filter(p => p.y != null && !isNaN(p.y)))
              .join('circle')
              .attr('cx', d => currXScale(d.x))
              .attr('cy', d => yScale(d.y))
              .attr('r', 3.5)
              .attr('fill', s.color);
          }
        });
      };

      drawSeries(xScale, y1Scale, y2Scale);

      const focusG = g.append('g').style('display', 'none');
      focusG.append('line')
        .attr('class', 'focus-line')
        .attr('y1', 0).attr('y2', height)
        .style('stroke', '#6c757d')
        .style('stroke-dasharray', '3,3');

      const tooltip = d3.select(container)
        .append('div')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(33, 37, 41, 0.85)')
        .style('color', '#fff')
        .style('padding', '6px 10px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '100')
        .style('box-shadow', '0 2px 5px rgba(0,0,0,0.2)');

      const overlay = g.append('rect')
        .attr('width', width)
        .attr('height', height)
        .style('fill', 'none')
        .style('pointer-events', 'all');

      let currentXScale = xScale;
      let currentY1Scale = y1Scale;
      let currentY2Scale = y2Scale;

      const showCrosshair = (xDate) => {
        if (!xDate) {
          hideCrosshair();
          return;
        }
        const mouseX = currentXScale(xDate);
        if (mouseX < 0 || mouseX > width) {
          hideCrosshair();
          return;
        }

        focusG.style('display', null);
        tooltip.style('visibility', 'visible');

        focusG.select('.focus-line').attr('transform', `translate(${mouseX}, 0)`);

        let html = `<div style="font-weight:bold;margin-bottom:2px;">${d3.timeFormat('%Y-%m-%d %H:%M:%S')(xDate)}</div>`;
        parsedSeries.forEach(s => {
          const validPoints = s.points.filter(p => p.y != null && !isNaN(p.y));
          if (!s.visible || validPoints.length === 0) return;
          const bisect = d3.bisector(d => d.x).left;
          const idx = bisect(validPoints, xDate);
          const d0 = validPoints[idx - 1];
          const d1 = validPoints[idx];
          let d = d0;
          if (d1 && d0) {
            d = (xDate - d0.x > d1.x - xDate) ? d1 : d0;
          } else if (d1) {
            d = d1;
          }
          if (d && d.y != null) {
            html += `<div><span style="color:${s.color};">●</span> ${s.name}: <b>${d.y.toFixed(2)}</b></div>`;
          }
        });

        const tooltipX = mouseX + margin.left;
        tooltip.html(html)
          .style('left', (tooltipX + 15 > containerWidth - 160 ? tooltipX - 165 : tooltipX + 15) + 'px')
          .style('top', (margin.top + 10) + 'px');
      };

      const hideCrosshair = () => {
        focusG.style('display', 'none');
        tooltip.style('visibility', 'hidden');
      };

      overlay
        .on('mouseout touchend', () => {
          Object.values(this.d3Charts).forEach(chart => {
            if (chart && chart.hideCrosshair) chart.hideCrosshair();
          });
        })
        .on('mousemove touchmove', (event) => {
          const [mouseX] = d3.pointer(event);
          const xDate = currentXScale.invert(mouseX);
          Object.values(this.d3Charts).forEach(chart => {
            if (chart && chart.showCrosshair) chart.showCrosshair(xDate);
          });
        });

      const zoom = d3.zoom()
        .scaleExtent([0.2, 50])
        .on('zoom', (event) => {
          if (this.isSyncingPlot) return;
          this.isSyncingPlot = true;
          const transform = event.transform;

          Object.values(this.d3Charts).forEach(chart => {
            if (chart && chart.applyTransform) {
              chart.applyTransform(transform);
            }
          });

          this.isSyncingPlot = false;
        });

      overlay.call(zoom);

      const applyTransform = (transform) => {
        currentXScale = transform.rescaleX(xScale);

        const { y1Domain: autoY1Dom, y2Domain: autoY2Dom } = computeYDomains(currentXScale);
        y1Scale.domain(autoY1Dom);
        if (y2Scale) {
          y2Scale.domain(autoY2Dom);
        }

        currentY1Scale = y1Scale;
        currentY2Scale = y2Scale;

        xAxisG.call(d3.axisBottom(currentXScale).ticks(5).tickFormat(d3.timeFormat('%m/%d %H:%M')));
        yAxis1G.call(yAxis1Axis.scale(currentY1Scale));
        if (yAxis2G && currentY2Scale) {
          yAxis2G.call(d3.axisRight(currentY2Scale));
        }
        drawGrid(currentY1Scale);
        drawSeries(currentXScale, currentY1Scale, currentY2Scale);
      };

      const resetZoom = () => {
        overlay.call(zoom.transform, d3.zoomIdentity);
      };

      overlay.on('dblclick.zoom', () => {
        if (this.isSyncingPlot) return;
        this.isSyncingPlot = true;
        Object.values(this.d3Charts).forEach(chart => {
          if (chart && chart.resetZoom) {
            chart.resetZoom();
          }
        });
        this.isSyncingPlot = false;
      });

      this.d3Charts[containerId] = {
        seriesList,
        xScale,
        y1Scale,
        y2Scale,
        xAxisG,
        yAxis1G,
        drawSeries,
        drawGrid,
        applyTransform,
        resetZoom,
        showCrosshair,
        hideCrosshair,
        reRender: () => this.renderD3Chart(containerId, seriesList, options)
      };
      this.syncChartXDomains();
    }
  },
  async mounted() {
    window.test = this
    this.handleResize = () => {
      Object.values(this.d3Charts).forEach(chart => {
        if (chart && chart.reRender) chart.reRender();
      });
    };
    window.addEventListener('resize', this.handleResize);

    await this.getAllDeviceInfo()
    await this.getLast3Data()
    await this.getDeviceWaringListInOneHour()
    this.filters.device = "-"
  },
  unmounted() {
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
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
</style>