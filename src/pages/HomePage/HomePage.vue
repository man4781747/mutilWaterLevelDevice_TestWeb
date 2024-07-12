<template>
  <div class="">
    <div class="container">
      <div class="row">
        <div class="col">
          <div class="card" v-for="(data, name, index) of DeviceInfoList">
            <div class="card-body">
              <h5 class="card-title">{{name}}</h5>
              <template v-if="data['waring'] !== undefined">
                小時內錯誤警訊: 
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
                    <td>{{(new Date(SensorData.data_time)).addHours(8).format("yyyy-MM-dd hh:mm:ss")}}</td>
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
  <div class="card">
    <div class="card-body">
      <div class="container">
        <div class="row">
          <div class="col-2">
            <div class="input-group input-group-sm mb-3">
              <span class="input-group-text" id="inputGroup-sizing-sm">筆數</span>
              <select class="form-select form-select-sm" v-model="filters.maxNum">
                <option>100</option>
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
            <button class="btn btn-sm btn-primary" @click="getDeviceDatas">搜尋</button>
          </div>
          <div class="col-1">
            <button class="btn btn-sm btn-primary">下載</button>
          </div>
        </div>
      </div>
    </div>
    <div class="card-body">
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
</template>

<script>
export default {
  data () {
  return {
    DeviceInfoList: {},
    filters: {
      "device": "",
      "maxNum": 100,
      "start": (new Date()).addHours(-24*3).format("yyyy-MM-dd"),
      "end": (new Date()).format("yyyy-MM-dd"),
    },
    nowQueryData : [],
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
      console.log(this.filters)
      fetch("http://35.206.236.245/api/data?machine_id="+this.filters.device+"&maxLimit="+this.filters.maxNum+"&startDate="+this.filters.start+"&endDate="+this.filters.end+"&reverse=true")
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson) {
        // console.log(myJson)
        This.nowQueryData = myJson["data"]
      });
    },
  },
  mounted() {
    this.getAllDeviceInfo()
    this.getLast3Data()
    this.getDeviceWaringListInOneHour()
    this.filters.device = "-"
  },
}
</script>
<style lang="postcss">
/* https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting */
</style>