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
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].device_start">重開機</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].rtc_reset">時鐘重設</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_no_response">IOT模組無回應</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_single_fail">找不到訊號</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_upload_fail_over_max_retry">IOT上傳超過最大重試次數</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].sd_init_fail">SD卡初始化失敗</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].some_data_abandon_by_time">部分資料因時間限制捨棄</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].rebuild_error_code">重建錯誤碼</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].some_data_abandon_by_len">部分資料因長度限制捨棄</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_connect_fail">IOT連線失敗</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_set_net_setting_fail">IOT設定網路失敗</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_http_requests_fail">IOT HTTP請求失敗</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_upload_fail">上傳失敗,但重試後成功</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_disconnect_when_post_requests">POST請求時IOT中斷連線</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_600_fail">IOT 600錯誤</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_data_len_fail">IOT資料長度錯誤</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_check_sum_fail">IOT檢查碼錯誤</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_server_fail_but_pass">IOT伺服器錯誤但通過</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].iot_server_unknown_fail">IOT伺服器未知錯誤</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].tot_post_command_timeout">TOT POST命令逾時</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].tot_set_data_buffer_fail">TOT設定資料緩衝區失敗</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].tot_put_data_buffer_fail">TOT寫入資料緩衝區失敗</div>
                <div class="badge bg-secondary" v-if="DeviceInfoList[name]['waring'].tot_post_command_fail">TOT POST命令失敗</div>
                
              </template>
              <template v-if="DeviceInfoList[name]['base'] !== undefined">
                <div>最新連線時間: {{(new Date(DeviceInfoList[name].base.updated_at)).format("yyyy-MM-dd hh:mm:ss")}}</div>
                <div>電壓: {{DeviceInfoList[name].base.voltage}} V, 訊號強度: {{DeviceInfoList[name].base.antenna_signal_strength}}</div>
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
          <div class="card-body" style="padding:0;">
            <div id="base-plot-dir"></div>
            <div class="update-ing" v-show="basePlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card" style="overflow: hidden;">
          <div class="card-body" style="padding:0;">
            <div id="warning-plot-dir"></div>
            <div class="update-ing" v-show="warningPlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card" style="overflow: hidden;">
          <div class="card-body" style="padding:0;">
            <div id="range-plot-dir"></div>
            <div class="update-ing" v-show="basePlotUpdateing">更新中</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-6">
        <div class="card" style="overflow: hidden;">
          <div class="card-body" style="padding:0;">
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
              <th scope="col">頃角x,y,z (度)</th>
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
export default {
  data () {
  return {
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
  }
  },
  computed:{
    deviceList(){
      let data = Object.keys(this.DeviceInfoList).sort((a, b) => {
        return a.localeCompare(b)
      })
      console.log(data) 
      return data
    }
  },
  methods:{
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
          const errorCode = [
            Number(data.errorcode_0) || 0,
            Number(data.errorcode_1) || 0,
            Number(data.errorcode_2) || 0
          ]
          This.DeviceInfoList[deviceName]["waring"] = {
            device_start: Boolean(errorCode[0] & 0b00000001),
            rtc_reset: Boolean(errorCode[0] & 0b00000010),
            iot_no_response: Boolean(errorCode[0] & 0b00000100),
            iot_single_fail: Boolean(errorCode[0] & 0b00001000),
            iot_upload_fail_over_max_retry: Boolean(errorCode[0] & 0b00010000),
            sd_init_fail: Boolean(errorCode[0] & 0b00100000),
            some_data_abandon_by_time: Boolean(errorCode[0] & 0b01000000),
            rebuild_error_code: Boolean(errorCode[0] & 0b10000000),
            some_data_abandon_by_len: Boolean(errorCode[1] & 0b00000001),
            iot_connect_fail: Boolean(errorCode[1] & 0b00000010),
            iot_set_net_setting_fail: Boolean(errorCode[1] & 0b00000100),
            iot_http_requests_fail: Boolean(errorCode[1] & 0b00001000),
            iot_upload_fail: Boolean(errorCode[1] & 0b00010000),
            iot_disconnect_when_post_requests: Boolean(errorCode[1] & 0b00100000),
            iot_600_fail: Boolean(errorCode[1] & 0b01000000),
            iot_data_len_fail: Boolean(errorCode[1] & 0b10000000),
            iot_check_sum_fail: Boolean(errorCode[2] & 0b00000001),
            iot_server_fail_but_pass: Boolean(errorCode[2] & 0b00000010),
            iot_server_unknown_fail: Boolean(errorCode[2] & 0b00000100),
            tot_post_command_timeout: Boolean(errorCode[2] & 0b00001000),
            tot_set_data_buffer_fail: Boolean(errorCode[2] & 0b00010000),
            tot_put_data_buffer_fail: Boolean(errorCode[2] & 0b00100000),
            tot_post_command_fail: Boolean(errorCode[2] & 0b01000000)
          }
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
      const warningMasks = {
        device_start: [0, 0b00000001, 0],
        rtc_reset: [0, 0b00000010, 1],
        iot_no_response: [0, 0b00000100, 2],
        iot_single_fail: [0, 0b00001000, 3],
        iot_upload_fail_over_max_retry: [0, 0b00010000, 4],
        sd_init_fail: [0, 0b00100000, 5],
        some_data_abandon_by_time: [0, 0b01000000, 6],
        rebuild_error_code: [0, 0b10000000, 7],
        some_data_abandon_by_len: [1, 0b00000001, 8],
        iot_connect_fail: [1, 0b00000010, 9],
        iot_set_net_setting_fail: [1, 0b00000100, 10],
        iot_http_requests_fail: [1, 0b00001000, 11],
        iot_upload_fail: [1, 0b00010000, 12],
        iot_disconnect_when_post_requests: [1, 0b00100000, 13],
        iot_600_fail: [1, 0b01000000, 14],
        iot_data_len_fail: [1, 0b10000000, 15],
        iot_check_sum_fail: [2, 0b00000001, 16],
        iot_server_fail_but_pass: [2, 0b00000010, 17],
        iot_server_unknown_fail: [2, 0b00000100, 18],
        tot_post_command_timeout: [2, 0b00001000, 19],
        tot_set_data_buffer_fail: [2, 0b00010000, 20],
        tot_put_data_buffer_fail: [2, 0b00100000, 21],
        tot_post_command_fail: [2, 0b01000000, 22]
      }
      var datas = {
        data_times: [],
        device_start: [],
        rtc_reset: [],
        iot_no_response: [],
        iot_single_fail: [],
        iot_upload_fail_over_max_retry: [],
        sd_init_fail: [],
        some_data_abandon_by_time: [],
        rebuild_error_code: [],
        some_data_abandon_by_len: [],
        iot_connect_fail: [],
        iot_set_net_setting_fail: [],
        iot_http_requests_fail: [],
        iot_upload_fail: [],
        iot_disconnect_when_post_requests: [],
        iot_600_fail: [],
        iot_data_len_fail: [],
        iot_check_sum_fail: [],
        iot_server_fail_but_pass: [],
        iot_server_unknown_fail: [],
        tot_post_command_timeout: [],
        tot_set_data_buffer_fail: [],
        tot_put_data_buffer_fail: [],
        tot_post_command_fail: []
      }
      const warningList = Array.isArray(this.nowQueryWarning)
        ? this.nowQueryWarning
        : []
      for (let data of warningList) {
        const errorCode = [
          Number(data.errorcode_0) || 0,
          Number(data.errorcode_1) || 0,
          Number(data.errorcode_2) || 0
        ]
        for (let keyChose of Object.keys(datas)) {
          if (keyChose === "data_times") {
            datas["data_times"].push(data["data_time"])
            continue
          }
          const [codeIndex, mask, type] = warningMasks[keyChose]
          
          datas[keyChose].push((errorCode[codeIndex] & mask)===0?0:type)
        }
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
        bar_data.push({
            x: filteredX,
            y: filteredY,
            name: keyChose,
            type: 'scatter',
            mode: 'markers',
        })
      }
      var layout = {
        title: 'Error Code',
        legend: {
          orientation: 'h',
          x: 0,
          y: 1.15,
        },
        margin: {t: 100},
        yaxis: {
          showticklabels: false
        }
      };
      Plotly.newPlot('warning-plot-dir', bar_data, layout);
    },

    replotDirs(){
      var datas = {
        acceleration_x: [],
        acceleration_y: [],
        acceleration_z: [],
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
        dataTime.setSeconds(0, 0)
        datas["time_diff"].push(new Date(data["created"]).getTime() - dataTime.getTime())
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
          xaxis: {domain: [0, 0.9]},
          yaxis: {title: '電壓'},
          yaxis2: {
            title: '溫度',
            overlaying: 'y',
            side: 'right'
          },
        }
      )

      this.replotTargetDir(
        'gyro-plot-dir',
        [
          {
            x: datas["data_time"],
            y: datas["acceleration_x"],
            name: 'Z (度)',
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
            mode: 'markers',
            marker: {color: 'red'},
            yaxis: 'y2',
          },
        ], 
        {
          title: '測距相關感測器',
          yaxis: {title: '距離 (mm)'},
          yaxis2: {
            title: '時間差 (秒)',
            overlaying: 'y',
            side: 'right'
          },
        }
      )
    },
    replotTargetDir(ID, data, layout) {
      Plotly.newPlot(ID, data, {
        ...layout,
        legend: {
          orientation: 'h',
          x: 0,
          y: 1.15,
        },
        margin: {t: 100},
      });
    }
  },
  async mounted() {
    window.test = this
    await this.getAllDeviceInfo()
    await this.getLast3Data()
    await this.getDeviceWaringListInOneHour()
    this.filters.device = "-"
    // this.replotBaseDir()

  },
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