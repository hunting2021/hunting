<template>
  <div>
    <div>The hunter</div>
    <div>Gas speed</div>
    <div class="dashboard--div__gas">
      <div v-for='(item,index) in gas' :key='index'>
        <span> <img :src="item.img" alt=""><span>{{item.label}}</span></span>
        <span>{{item.num}}</span>
        <span>{{item.time}}</span>
      </div>
    </div>
    <div class='dashboard--div__router'>
      <router-link v-for="item in header" :key='item.name' :to="{name:item.name}">{{item.name}}</router-link>
    </div>
    <div>
      <div>
        Top 20 Token
      </div>
      <div class="dashboard--div__tokenList" ref='Top20List'>

      </div>
    </div>
  </div>
</template>

<script>
  const ethApiKey = 'KBEXK16XRKPTJ9RD4A96WZA713W5D28BXD';
  import { getGasTracker } from '@/api/gasTracker.js'
  import axios from 'axios'
  const coinsHost = 'https://coingecko.p.rapidapi.com/coins/markets'
  const instance = axios.create({
    timeout: 24000,
    headers: {
      'X-RapidAPI-Key': 'fa57d0cadamshdcf7ce3b65faa00p16eaebjsncf603ba968ae',
      'x-rapidapi-host': 'coingecko.p.rapidapi.com'
    }
  });

  // import { getMakers } from '@/coinApi/maker.js'
  import echarts from 'echarts'
  import car from 'assets/car.svg'
  import aircraft from 'assets/aircraft.svg'
  import spaceX from 'assets/spaceX.svg'
  import * as formatters from '@/lib/formatters'
  export default {
    data() {
      return {
        header: [
          {
            name: 'assets',
            router: 'assets'
          },
          {
            name: 'history',
            router: 'history'
          },
          {
            name: 'tokenHolder',
            router: 'tokenTop'
          },
          {
            name: 'force',
            router: 'force'
          },
          {
            name: 'approves',
            router: 'approves'
          }
        ],
        gas: [
          {}, {}, {}, {}
        ],
        gasMap: {
          FastGasPrice: {
            name: 'Fast',
            time: '15s',
            img: spaceX
          },
          ProposeGasPrice: {
            name: 'Propose',
            time: '1-3m',
            img: aircraft
          },
          SafeGasPrice: {
            name: 'Safe',
            time: '>3m',
            img: car
          }
        },
        tokenChart: null,
        option: {}
      }
    },
    created() {
      this.getGas()
      this.getMaker()
    },
    mounted() {
      this.initTokenChart()
    },
    methods: {
      getGas() {
        const params = {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: ethApiKey
        }
        getGasTracker(params).then(res => {
          if (res.status === '1') {
            const arr = []
            const results = res.result;
            delete results.LastBlock
            Object.keys(results).forEach(item => {
              arr.push({
                name: item,
                label: this.gasMap[item].name,
                num: results[item],
                time: this.gasMap[item].time,
                img: this.gasMap[item].img
              })
            })
            this.gas = arr.reverse();
          }
        })
        // setTimeout(() => {
        //   this.getGas();
        // }, 5000)
      },
      getMaker() {
        const params = {
          vs_currency: 'usd',
          page: 1,
          per_page: 20,
          order: 'market_cap_desc'
        }
        instance.get(coinsHost, { params }).then(res => {
          if (res.status == '200') {
            this.processOptioin(res.data)
            this.setChartOption()
          }
        })
      },
      initTokenChart() {
        this.tokenChart = echarts.init(this.$refs.Top20List)
      },
      processOptioin(data) {
        console.log(data[0]);
        const names = data.map(item => { return item.symbol })
        const market_cap = data.map(item => { return item.market_cap })
        this.option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross',
              crossStyle: {
                color: '#999'
              }
            },
            formatter: function (value, index) {
              return formatters.formatNumberByUnit(value[0].data)
            }
          },
          grid: {
            left: '20%'
          },
          xAxis: [
            {
              type: 'category',
              data: names,
              axisPointer: {
                type: 'shadow'
              }
            }
          ],
          yAxis: [
            {
              type: 'value',
              min: 0,
              axisLabel: {
                formatter: function (value, index) {
                  return formatters.formatNumberByUnit(value)
                }
              }
            }
          ],
          series: [
            {
              name: '市值',
              type: 'bar',
              data: market_cap
            }
          ]
        };
      },
      setChartOption() {
        this.tokenChart.setOption(this.option)
      }
    }
  }
</script>

<style>
  .dashboard--div__gas {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .dashboard--div__gas>div {
    width: 200px;
    height: 220px;
    border-radius: 10px;
  }

  .dashboard--div__gas>div img {
    margin-top: 10px;
  }

  .dashboard--div__gas>div span:first-child {
    display: inline-flex;
    justify-content: center;
    align-items: center;
  }

  .dashboard--div__gas>div span {
    display: block;
    margin-top: 10px;
  }

  .dashboard--div__router a {
    margin: 10px;
    text-decoration: none;
  }

  .dashboard--div__tokenList {
    width: 100%;
    height: 500px;
  }
</style>