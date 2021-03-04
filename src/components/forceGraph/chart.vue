<template>
  <div class="forceWarp">
    <div class="forceInner">
      <div
        v-if="showLeft"
        class="force-oprations"
      >
        <thumb
          v-if="config.thumb"
          ref="thumb"
          :zoom-max="zoomMax"
          :main-width="mainWidth"
          :main-height="mainHeight"
          :main-scale="mainScale"
          :zoom-transform="zoomTransform"
        />
        <p
          v-if="config.forceInfo"
          class="forceInfos"
        >
          <span>节点数量({{ chartData.dots.length }})</span>
          <i /> <span>边数量({{ chartData.links.length }})</span>
        </p>
        <div class="force-operbtns">
          <!-- <span></span>
            <el-button
              :icon="item.icon"
              @click="clickBtn(item.click)"
            /> -->
        </div>
      </div>
      <div class="force-main">
        <forceMain
          ref="mainChart"
          :select-type="selectType"
          :chart-data="graphData"
          :zoom-max="zoomMax"
          :zoom-min="zoomMin"
          :height="mainHeight"
          :width="mainWidth"
          :click-type="clickType"
          @disableds="disableds"
          @tick="tick"
          @zoom="zoom"
          @hover="hover"
          @leave="leave"
          @selected="selected"
          @deleted="deleted"
        />
        <div
          v-show="chartData.dots<=0"
          class="force-empty"
        />
      </div>
      <div
        v-if="showRight"
        class="force-right"
      >
        <div class="force-clickGroup">
          <span
            v-show="config.click"
            :class="{'active':selectType === 'click'}"
            @click="selectType = 'click'"
          >
            <i class="pi-icon-dianxuan" />
            单选</span>
          <span
            v-if="config.region"
            :class="{'active':selectType === 'region'}"
            @click="selectType = 'region'"
          >
            <i class="pi-icon-kuangxuan" />
            复选</span>
        </div>
        <p
          v-if="config.nowSelect"
          class="force-nowSelect"
        >
          已选择 {{ selectInfo.dots }} 个顶点，{{ selectInfo.lines }} 条边线
        </p>
        <!-- <p class="force-dotOper">
          <el-button
            v-if="config.del"
            :disabled="!selectInfo.dots&&!selectInfo.lines"
            @click="deleteSelect"
          >
            删除
          </el-button>
          <el-button
            v-if="config.disabled"
            :disabled="!selectInfo.dots&&!selectInfo.lines"
            @click="disabledSelect(0)"
          >
            禁用
          </el-button>
          <el-button
            v-if="config.disDisabled"
            :disabled="!selectInfo.dots&&!selectInfo.lines"
            @click="disabledSelect(1)"
          >
            解除
          </el-button>
        </p> -->
        <div class="force-otherInfo">
          <slot
            name="otherInfo"
            :data="clickData"
          />
        </div>
      </div>
    </div>
    <div
      v-if="hoverData"
      class="pathHover"
      :style="movePathData"
    >
      <slot
        name="pathHover"
        :data="hoverData"
      />
    </div>
  </div>
</template>
<script>
import thumb from './thumb.vue';
import forceMain from './forceMain.vue';
import { labelC, normalType } from './utils';

const zoomMin = 0.5;
const zoomMax = 1.5;
export default {
  components: {
    thumb, forceMain,
  },
  props: {
    chartData: {
      type: Object,
      required: true,
    },
    showLeft: {
      type: Boolean,
      default: true,
    },
    showRight: {
      type: Boolean,
      default: true,
    },
    clickType: {
      type: String,
      default: 'multiple',
    },
    config: {
      type: Object,
      default() {
        return {
          forceInfo: true,
          click: true,
          thumb: true,
          region: true,
          nowSelect: true,
          del: true,
          disabled: true,
          disDisabled: true,
          enlarge: true,
          reduce: true,
          recover: true,
          refresh: true,
        };
      },
    },
  },
  data() {
    return {
      bts: [
        {
          content: '放大',
          icon: 'pi-icon-enlarge',
          click: 'enlarge',
        },
        {
          content: '缩小',
          icon: 'pi-icon-reduce',
          click: 'reduce',
        },
        {
          content: '恢复视图',
          icon: 'pi-icon-huifushitu',
          click: 'recover',
        },
        {
          content: '刷新',
          icon: 'pi-icon-shuaxin',
          click: 'refresh',
        },
      ],
      mainHeight: null,
      mainWidth: null,
      selectType: 'click', // region 框选or click 点击
      zoomTransform: { k: 1, x: 0, y: 0 }, // 缩放时 的info
      linkGroup: {}, // 线的组
      linkmap: {}, // 线的组?
      zoomMin, // 最小的缩放
      zoomMax, // 最大缩放到
      mainScale: 5, // 主图与缩略图的比例
      // chartData: {
      //   links: [],
      //   dots: [],
      // },
      graphData: {},
      hoverData: null,
      clickData: null,
      movePathData: { left: 0, top: 0 },
      selectInfo: {
        dots: 0,
        lines: 0,
      },
      // normalScale,
    };
  },
  watch: {
    chartData: {
      handler() {
        const { dots, links } = JSON.parse(JSON.stringify(this.chartData));
        dots.forEach((dot) => {
          dot.objType = 'dot';
        });
        links.forEach((link, index) => {
          // console.log(link);
          const source = dots.find((dot) => link.source === dot.id);
          const target = dots.find((dot) => link.target === dot.id);
          if (!source || !target)index;
          link.objType = 'line';
          link.id = link.id ? link.id : index;
          link.domStyle = labelC[link.label
          || (link.properties && link.properties.alertLevelLabel)] || normalType;
        });
        this.graphData = { dots, links };
      },
      immediate: true,
    },
  },
  mounted() {
    this.setHw();
    window.onresize = () => {
      this.setHw();
      this.$refs.mainChart.resize();
    };
    // setTimeout(() => {
    //   this.$refs.mainChart.changeDots([{
    //     id: '10.16.87.7',
    //     properties: {
    //       attackedCount: 10000,
    //     },
    //   }]);
    // }, 5000);
  },
  methods: {
    changeDots(list) {
      this.$refs.mainChart.changeDots(list);
    },
    disableds(data) {
      this.$emit('disablededs', data);
    },
    clearSelect() {
      this.$refs.mainChart.setSelected([]);
    },
    reload() {
      this.setHw(); // 有可能没有宽高
      this.$refs.mainChart.initData(2);
    },
    deleted(d) {
      this.$emit('deleted', d);
    },
    deleteSelect() {
      this.$refs.mainChart.deleteSelect();
    },
    disabledSelect(type) {
      this.$refs.mainChart.disabledSelect(type);
    },
    // clickData(data) {},
    hover(data, event) {
      if (this.clickType === 'none' && data.objType === 'dot') return;
      if (this.clickType === 'onlyOne' && data.attack) return;
      const { clientX: left, clientY: top } = event;
      this.movePathData = { left: `${left + 25}px`, top: `${top + 25}px` };
      this.hoverData = data;
      this.$emit('hover', data);
    },
    leave() {
      this.$emit('leave', JSON.parse(JSON.stringify(this.hoverData)));
      this.hoverData = null;
    },
    selected(data) {
      const dots = data.filter((item) => item.objType === 'dot').length;
      const lines = data.filter((item) => item.objType === 'line').length;
      this.selectInfo = { dots, lines };
      if ((dots + lines) > 0) {
        this.clickData = data[data.length - 1];
      } else {
        this.clickData = null;
      }
      this.$emit('selected', JSON.parse(JSON.stringify(data)));
    },
    tick(force) {
      const { thumb: rThumb } = this.$refs;
      rThumb && rThumb.tick(force);
    },
    setHw() {
      const { height, width } = this.$refs.mainChart.$el.getBoundingClientRect();
      this.mainHeight = height;
      this.mainWidth = width;
    },
    zoom(d) {
      const { thumb: rThumb } = this.$refs;
      rThumb && rThumb.zoom(d);
    },
    clickBtn(type) {
      if (type === 'enlarge') {
        this.$refs.mainChart.changeSize(1.1);
      } else if (type === 'reduce') {
        this.$refs.mainChart.changeSize(0.9);
      } else if (type === 'recover') { // 恢复
        this.$refs.mainChart.recover();
      } else if (type === 'refresh') { // 恢复
        this.$emit('refresh');
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.force-empty{
  width: 100%;
  height: 100%;
  // background-color: pink;
  position: absolute;
  top: 0;
  // background-image: url('~@assets/images/forceEmpty.png');
  background-repeat:no-repeat;
  background-position: center center;
  background-size: 350px 350px;
}
.pathHover{
  background: #FFFFFF;
  box-shadow: 0 2px 6px 0 rgba(0,0,0,0.20);
  border-radius: 4px;
  position: fixed;
  padding: 10px;
  transform: translateY(-50%);
  z-index: 12;
  max-width: 230px;
}
.forceWarp {
  font-size: 0;
  .forceInner {
    display: flex;
    height: 100%;
    .force-oprations {
      flex: 164px 0 0;

      .forceInfos {
        font-size: 12px;
        color: #5c5f66;
        text-align: left;
        line-height: 18px;
        margin-top: 8px;
        display: flex;
        align-items: center;
        span {
          margin-right: 9px;
          &:last-child {
            margin-right: 0;
          }
        }
        i {
          background: #ebecf0;
          width: 1px;
          height: 14px;
          display: inline-block;
          margin-right: 10px;
        }
      }
      .force-operbtns {
        width: 33px;
        margin-top: 20px;
        .el-button {
          padding: 0;
          width: 33px;
          margin: 0;
          flex-direction: row;
          margin-top: -1px;
        }
      }
    }
    .force-main {
      position: relative;
      flex: 1;
      margin: 0 10px;
    }
    .force-right {
      flex: 232px 0 0;
      .force-clickGroup {
        span {
          display: inline-block;
          width: 80px;
          height: 32px;
          line-height: 32px;
          border: 1px solid #c1c7d0;
          font-size: 12px;
          color: #5c5f66;
          text-align: center;
          user-select: none;
          i{
            font-size: 14px;
            margin-right: 6px;
            vertical-align: middle;
          }
          &.active{
            background: #0065FF;
            border: 1px solid #0065FF;
            color: #fff;
          }
          &:last-child{
              margin-left: -1px;
          }
        }
      }
      .force-nowSelect{
          margin: 10px 0;
        font-size: 12px;
        color: #5C5F66;
        text-align: left;
        line-height: 18px;
      }
      .force-dotOper{
          padding-bottom: 10px;
          border-bottom: 1px solid #EBECF0;
      }
    }
  }
}
</style>
