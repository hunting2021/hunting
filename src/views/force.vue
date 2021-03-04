<template>
  <div class="layout">
    <chart :chartData="chartData" @selected="selected"></chart>
  </div>
</template>

<script>
import Chart from '../components/forceGraph/chart.vue';
const accountData = (d)=>`https://api.etherscan.io/api?module=account&action=txlist&address=${d}&startblock=0&endblock=99999999&sort=asc&apikey=E955EBJPF8CMCFFJYX6SZW2FQRICY8IPV4`
    export default {
        name:'App',
        components: {
                Chart
        },
        data() {
            return {
              datas:[],
              chartData:{dots:[],links:[]},
              address:'0x55D3aB0d2C6795a31022439F188eE4e642C87831',
            };
        },
        created(){
          this.getData()
        },
        methods:{
          selected(data){
            if(data.length===1){
              window.open(`https://etherscan.io/tx/${data[0].hash}`)
            }
          },
          getData(){
          const {address} = this;
          fetch(accountData(address))
          .then(res=>{
            return res.json();
          })
          .then(res=>{
            let {result} = res;
            let allDots = [];
            result.forEach(element => {
              let {from,to} = element;
              element.source = element.from;
              element.target = element.to;
              allDots.push(from);
              allDots.push(to)
            });
            allDots = Array.from(new Set(allDots));
            allDots.splice(allDots.indexOf(address),1);
            this.dots = allDots.map(item=>({id:item}));
            console.log(result)
            this.links = result;
            this.chartData = {dots:this.dots,links:this.links}
          })
          },
          operationData(data){
            this.datas
          },
        },
    }
</script>

<style scoped>
.layout,.forceWarp{
  height: 700px;
}
.layout{
    width: 80%;
    margin: 0 auto;
}
</style>
