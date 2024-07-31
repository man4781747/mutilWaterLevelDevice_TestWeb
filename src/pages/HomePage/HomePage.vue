<template>
  <div class="">
    <div class="container-fluid" style="margin: 8px 0;">
      <div class="input-group">
        <span class="input-group-text" id="basic-addon1">過濾</span>
        <input type="text" class="form-control" placeholder="請輸入名稱" v-model="filterStr">
      </div>
    </div>
    <div class="container-fluid">
      <div class="row">
        <div class="col-12 col-xl-6" v-for="(data, name, index) of DeviceInfoList" v-show="name.indexOf(filterStr) != -1">
          <div class="card" style="min-width: 560px;">
            <div class="card-body">
              <h5 class="card-title">{{name}}</h5>
              <template v-if="data['waring'] !== undefined">
                1小時內錯誤警訊: 
                <!-- {{ data['waring'] }} -->
                <div class="badge bg-secondary" v-if="data['waring'].device_start">重開機</div>
                <div class="badge bg-secondary" v-if="data['waring'].rtc_reset">時鐘重設</div>
                <div class="badge bg-secondary" v-if="data['waring'].iot_no_response">IOT模組無回應</div>
                <div class="badge bg-secondary" v-if="data['waring'].iot_single_fail">找不到訊號</div>
                <div class="badge bg-secondary" v-if="data['waring'].iot_upload_fail">上傳失敗</div>
              </template>
              <template v-if="data['base'] !== undefined  ">
                <div>最新連線時間: {{(new Date(data.base.updated_at)).format("yyyy-MM-dd hh:mm:ss")}}</div>
                <div>電壓: {{data.base.voltage}} V, 訊號強度: {{data.base.antenna_signal_strength}}</div>
                <div>版本: {{data.base.firmware_version}}</div>
              </template>
              <div v-else>資料讀取中</div>  
              <hr>
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th scope="col">資料時間</th>
                    <th scope="col">壓力距離 (mm)</th>
                    <th scope="col">聲波數值 (mm)</th>
                    <th scope="col">雷達數值 (mm)</th>
                    <th scope="col">濁度 (NTU)</th>
                    <th scope="col">導電 (???)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(SensorData, index) of data.last3data">
                    <td style="white-space:nowrap;">{{(new Date(SensorData.data_time)).format("yyyy-MM-dd hh:mm:ss")}}</td>
                    <td>{{SensorData.distance_pressure}}</td>
                    <td>{{SensorData.distance_sound}}</td>
                    <td>{{SensorData.distance_radar}}</td>
                    <td>{{SensorData.turbidity}}</td>
                    <td>{{SensorData.conductivity}}</td>
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
    <div class="row">
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
                  <option v-for="(data, name, index) of DeviceInfoList">{{name}}</option>
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
              <th scope="col">#</th>
              <th scope="col">機器編號</th>
              <th scope="col">資料時間</th>
              <th scope="col">電壓 (V)</th>
              <th scope="col">溫度 (攝氏)</th>
              <th scope="col">濕度 (%)</th>
              <th scope="col">頃角x,y,z (度)</th>
              <th scope="col">壓力 (mm)</th>
              <th scope="col">聲波 (mm)</th>
              <th scope="col">雷達 (mm)</th>
              <th scope="col">濁度 (NTU)</th>
              <th scope="col">導電 (??)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(SensorData, index) of nowQueryData">
              <td>{{ SensorData.index }}</td>
              <td>{{ SensorData.device }}</td>
              <td>{{(new Date(SensorData.data_time)).format("yyyy-MM-dd hh:mm:ss")}}</td>
              <td>{{ SensorData.voltage.toFixed(1) }}</td>
              <td>{{ SensorData.temperature.toFixed(1) }}</td>
              <td>{{ SensorData.humidity.toFixed(1) }}</td>
              <td>{{ SensorData.acceleration_x }},{{ SensorData.acceleration_y }},{{ SensorData.acceleration_z }}</td>
              <td>{{ SensorData.distance_pressure }}</td>
              <td>{{ SensorData.distance_sound }}</td>
              <td>{{ SensorData.distance_radar }}</td>
              <td>{{ SensorData.turbidity }}</td>
              <td>{{ SensorData.conductivity }}</td>
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
  },
  methods:{
    getAllDeviceInfo(){
      var This = this
      fetch("http://35.206.236.245/api/device_info")
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
    getLast3Data(){
      var This = this
      fetch("http://35.206.236.245/api/last3data")
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson) {
        for (var deviceName of Object.keys(This.DeviceInfoList)) {
          This.DeviceInfoList[deviceName]["last3data"] = []
        }

        for (let data of myJson) {
          var deviceName = data.device
          if (This.DeviceInfoList[deviceName] === undefined) {
            This.DeviceInfoList[deviceName] = {}
            This.DeviceInfoList[deviceName]["last3data"] = []
          }
          This.DeviceInfoList[deviceName]["last3data"].push(data)
        }
      });
    },
    getDeviceWaringListInOneHour(){
      var This = this
      fetch("http://35.206.236.245/api/device_waring_in_onehur")
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson) {
        for (let data of myJson) {
          var deviceName = data.device
          if (This.DeviceInfoList[deviceName] === undefined) {
            This.DeviceInfoList[deviceName] = {}
          }
          This.DeviceInfoList[deviceName]["waring"] = data
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
      var datas = {
        created: [],
        device_start: [],
        iot_no_response: [],
        iot_single_fail: [],
        iot_upload_fail: [],
        rtc_reset: []
      }
      for (let data of this.nowQueryWarning) {
        for (let keyChose of Object.keys(datas)) {
          datas[keyChose].push(data[keyChose])
        }
      }
      console.log(datas)
      
      var bar_data = [];
      
      for (let keyChose of Object.keys(datas)) {
        if (keyChose === "created") {continue}
        bar_data.push({
            x: datas["created"],
            y: datas[keyChose],
            name: keyChose,
            type: 'bar',
        })
      }
      var layout = {
        title: 'Error Code',
        barmode: 'stack'
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
        voltage:[]
      }
      for (let data of this.nowQueryData) {
        for (let keyChose of Object.keys(datas))
        datas[keyChose].push(data[keyChose])
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
          {
            x: datas["data_time"],
            y: datas["humidity"],
            name: '濕度 (%)',
            yaxis: 'y3',
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
          yaxis3: {
            title: '濕度',
            overlaying: 'y',
            side: 'right',
            anchor: 'free',
            position: 0.975
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
        ], 
        {
          title: '測距相關感測器',
          yaxis: {title: ''},
        }
      )
    },
    replotTargetDir(ID, data, layout) {
      Plotly.newPlot(ID, data, layout);
    }
  },
  mounted() {
    window.test = this
    this.getAllDeviceInfo()
    this.getLast3Data()
    this.getDeviceWaringListInOneHour()
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