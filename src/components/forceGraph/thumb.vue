<template>
  <div>
    <div id="thumbWarp" />
  </div>
</template>
<script>
import * as d3 from 'd3';
import {
  drawLine, pathD, setDotClass, setTransform,
} from './utils';

export default {
  components: {
  },
  props: {
    width: {
      type: Number,
      default: 164,
    },
    zoomTransform: {
      type: Object,
      required: true,
    },
    mainWidth: {
      type: Number,
      default: 800,
    },
    mainHeight: {
      type: Number,
      default: 800,
    },
    height: {
      type: Number,
      default: 104,
    },
    zoomMax: {
      type: Number,
      default: 1.5,
    },
    zoomMin: {
      type: Number,
      default: 0.68,
    },
  },
  data() {
    return {
      initTimeout: null,
      thumbSvg: null,
      dragThumb: null,
      // thumbPath: null,
      innerZoomInfo: {},
      moveDiff: { x: 0, y: 0 }, // 缩放后 与缩放前的diff
      thumbTransInfo: { x: 0, y: 0 }, // 蓝框框 "缩略图滚动的蓝框" 被移动的距离
    };
  },
  watch: {
    zoomTransform: {
      immediate: true,
      handler(n) {
        this.innerZoomInfo = n;
      },
    },
    mainHeight: {
      immediate: true,
      handler(n) {
        if (n) this.initSvg();
      },
    },
    mainWidth: {
      immediate: true,
      handler(n) {
        if (n) this.initSvg();
      },
    },
  },
  created() {
    this.initSvg();
  },
  methods: {
    initSvg() {
      if (this.initTimeout)clearTimeout(this.initTimeout);
      this.initTimeout = setTimeout(() => {
        const {
          width, height,
          mainWidth,
          mainHeight,
          zoomMax,
        } = this;
        let { thumbSvg, dragThumb } = this;
        // zoomMax 的作用， 缩略图与主图的 比例是1:5, 而主图最大的缩放比例是1.5倍 所以缩略图需要最大放入1:5 的1.5倍
        // 而拖拽svg 与主图缩放保持一致 则是缩略图长宽的 缩小1.5倍
        if (!thumbSvg) {
          thumbSvg = d3
            .select('#thumbWarp')
            .append('svg');
          dragThumb = thumbSvg.append('rect')
            .attr('class', 'dragThumb')
            .attr('fill', 'none');
        }
        let w; let h; let x = 0; let y = 0;
        thumbSvg.attr('width', width)
          .attr('height', height)
          .attr('id', 'thumbSvg')
          .attr('viewBox', () => {
            w = mainWidth * zoomMax;
            h = mainHeight * zoomMax;
            x = -(w - mainWidth) / 2;
            y = -(h - mainHeight) / 2;
            return `${x} ${y} ${w} ${h}`;
          });
        const dragWidth = mainWidth;
        const dragHeight = mainHeight;
        dragThumb.attr('width', dragWidth)
          .attr('height', dragHeight);
        this.thumbSvg = thumbSvg;
        this.dragThumb = dragThumb;
      }, 500);
    },
    tick({ dots, links }) {
      if (!this.thumbSvg) {
        if (this.thumbTimeout)clearTimeout(this.thumbTimeout);
        this.thumbTimeout = setTimeout(() => {
          this.drawThumb(dots, links);
        }, 1000);
        return;
      }
      this.drawThumb(dots, links);
    },
    drawThumb(dots, links) {
      d3.select('.thumbG').remove();
      d3.select('.thumbDot').remove();
      const { line } = drawLine(this.thumbSvg, 'thumb', links);
      line.attr('d', (data) => pathD(data, 'thumb', null));
      this.thumbSvg
        .insert('g', '.dragThumb')
        .attr('class', 'forceNodes thumbDot')
        .selectAll('g')
        .data(dots)
        .enter()
        .append('a')
        .attr('class', (d) => {
          let classType = '异常'; // 如果都没有 就是资产的 ip
          if (d.sufferer && d.attack) {
            classType = 'both';
          } else if (d.sufferer) {
            classType = '中危';
          } else if (d.attack) {
            classType = '严重';
          }
          d.label = classType;
          return setDotClass(d, 'innerNode');
        })
        .append('circle')
        .attr('class', 'forceNode thumbNode')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
    },
    zoom(mainTransform) {
      if (!mainTransform.x && !mainTransform.y && mainTransform.k === 1) {
        this.initSvg();
        return;
      }

      const {
        innerZoomInfo, mainWidth, mainHeight,
      } = this;
      if (!innerZoomInfo || innerZoomInfo.k !== mainTransform.k) {
        this.moveDiff = {
          x: (mainWidth - innerZoomInfo.k * mainWidth) / 2,
          y: (mainHeight - innerZoomInfo.k * mainHeight) / 2,
        };
      }
      const { x: diffX, y: diffY } = this.moveDiff;
      const { x, y, k } = mainTransform;
      this.dragThumb
        .attr('width', mainWidth / k)
        .attr('height', mainHeight / k)
        .attr('transform', () => setTransform({
          x: -((x - diffX) / k), // 这个地方应该不能直接 除 k 这里的x,y 应该是放大后的x,y应该减去缩放的差值 再 除K
          y: -((y - diffY) / k),
        }));
    },
  },
};
</script>
<style lang="scss">
#thumbWarp{
    border: 1px solid #C1C7D0;
    position:relative;
    width: 164px;
    height:104px;
    overflow: hidden;
    .dragThumb{
        transform-origin: 50% 50% 0;
      stroke-width: 18px;
      stroke:#0065FF;
    }
    path{
      stroke-width:8;
    }
}
.force-link{
        fill: none;
        // stroke: #666;
        // stroke-width: 1.5px;
}
</style>
