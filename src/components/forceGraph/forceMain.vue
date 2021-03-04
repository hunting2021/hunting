<template>
  <div class="forceMainWarp" />
</template>
<script>
import * as d3 from 'd3';
import {
  // drawMaker,
  operationData,
  drawLine,
  drawCircle,
  setTransform,
  pathD,
  circleInfo,
  inSquare,
  markerColors,
  circleTextWidth,
  styleSize,
  setAttr,
} from './utils';

export default {
  components: {},
  props: {
    selectType: {
      type: String,
      required: true,
    },
    height: {
      type: Number,
      default: 800,
    },
    width: {
      type: Number,
      default: 800,
    },
    zoomMax: {
      type: Number,
      required: true,
    },
    zoomMin: {
      type: Number,
      required: true,
    },
    clickType: {
      type: String,
      required: true,
    },
    chartData: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  data() {
    return {
      clickTime: 0,
      tips: {},
      startLoc: [], // 拖拽开始时的x,y
      endLoc: [], // 拖拽结束时的x,y
      force: null,
      mainSvg: null, // 主视图的svg
      zoom: null, // zoom
      links: null,
      dots: null,
      paths: null,
      transInfo: null,
      edges_text: null,
      zoomTransform: null,
      onMouseMoveCircle: null,
      regionRect: null,
      bkLine: null,
      lineWarp: null,
      selected: [],
      viewBoxMove: { x: 0, y: 0 },
    };
  },
  computed: {
    canDraw() {
      return this.selectType === 'region';
    },
  },
  watch: {
    selected(n) {
      // this.removeAllClick();
      const result = [];
      const _this = this;
      if (!this.links || !this.dots) return;
      this.links.forEach((item) => { item.select = false; });
      this.dots.forEach((item) => { item.select = false; });
      n.forEach((el) => {
        const data = el.__data__;
        data.select = true; // 先设置select
        _this.changeMaker(data, el, 'click');
        result.push(data);
      });
      this.setSelectClass();
      Object.defineProperty(this.selected, 'ids', {
        value: result.map((item) => item.id),
        writable: true,
      });
      this.$emit('selected', result);
    },
    selectType(n) {
      // console.log(9999);
      if (n === 'region') {
        this.stopZoom();
      } else {
        this.initZoom();
      }
    },
    chartData() {
      this.initData(1);
    },
  },
  mounted() {
    this.setForce();
  },
  methods: {
    setSelectClass() {
      this.setClass(this.dotWarp._groups[0]);
      this.setClass(this.lineWarp._groups[0]);
    },
    setClass(list) {
      list.forEach((el) => {
        if (el.__data__.select) {
          const target = d3.select(el);
          const classS = target.attr('class').split(' ');
          const forceClickIndex = classS.indexOf('forceClick');
          if (forceClickIndex < 0) {
            classS.push('forceClick');
          }
          target.attr('class', classS.join(' '));
          this.setSizeAttr(el, 'focus');
        }
      });
    },
    changeDots(datas) {
      this.changeData(datas, 'dots');
    },
    changeData(datas, type) {
      datas.forEach((el) => {
        const now = this[type].findIndex((innerEl) => {
          if (type === 'dots') {
            return el.id === innerEl.id;
          }
          return false;
        });
        this[type][now] = this.copyObject(this[type][now], el);
      });
      this.resize();
    },
    copyObject(target, souce) {
      Object.keys(souce).forEach((key) => {
        if (typeof souce[key] === 'object' && target[key]) {
          this.copyObject(target[key], souce[key]);
        } else if (target[key]) {
          target[key] = souce[key];
        }
      });
      return target;
    },
    setForce() {
      const force = d3
        .forceSimulation()
        .force(
          'link',
          d3.forceLink().id((d) => d.id),
        )
        .force('collide', d3.forceCollide(72).strength(0.1))
        .force(
          'charge',
          d3.forceManyBody().strength(-400),
        ) // 节点之间作用力
        .force('center', d3.forceCenter());
      this.force = force;
    },
    removeAllClick() {
      const _this = this;
      d3.selectAll('.forceClick').attr('class', function (d) {
        _this.setSizeAttr(this, 'normal');
        const target = d3.select(this);
        const classS = target.attr('class').split(' ');
        const forceClickIndex = classS.indexOf('forceClick');
        if (forceClickIndex >= 0) {
          classS.splice(forceClickIndex, 1);
        }
        return classS.join(' ');
      });
    },
    changeSize(size) {
      console.log(this.zoom.scaleBy);
      this.mainSvg.transition().duration(750).call(this.zoom.scaleBy, size);
    },
    initSvg() {
      const {
        width, height, force,
      } = this;
      let { mainSvg } = this;
      force
        .force('center')
        .x(width / 2)
        .y(height / 2);
      if (!mainSvg) {
        mainSvg = d3
          .select('.forceMainWarp')
          .append('svg');
        this.mainSvg = mainSvg;
        this.initZoom();
      }
      mainSvg.attr('class', 'mainSvg')
        .attr('width', width)
        .attr('height', height);
    },
    drawAll() {
      const _this = this;
      d3.selectAll('.forceMainG').remove();
      const { dots, links, force } = this;
      force.nodes(dots).alpha(0.01).on('tick', this.tick).restart();
      force.force('link').links(links).distance(150);
      this.mainSvg.on('click', () => {
        if (!this.canDraw) this.svgClick();
      });
      const {
        lineWarp,
        line,
        // lineText,
        bkLine,
      } = drawLine(this.mainSvg, this.clickType, links);
      lineWarp
        .on('mousemove', function (e) {
          _this.changeMaker(e, this, 'hover');
          _this.$emit('hover', e, d3.event);
        })
        .on('click', function (e) {
          _this.changeMaker(e, this, 'click');
          _this.setSelected([this], 'clickPath');
        })
        .on('mouseleave', function (e) {
          _this.changeMaker(e, this, 'normal');
          _this.$emit('leave', e, d3.event);
        });
      this.paths = line;
      this.bkLine = bkLine;
      this.lineWarp = lineWarp;
      // this.edges_text = lineText;
      const {
        dotWarp,
      } = drawCircle(this.mainSvg, dots, this.clickType);
      dotWarp
        .on('click', function (d) {
          _this.setSelected([this]);
        })
        .on('mousemove', function (e) {
          const { event } = d3;
          _this.changeMaker(e, this, 'hover');
          _this.$emit('hover', e, event);
          _this.setSizeAttr(this, 'hover');
        }, 10)
        .on('mouseleave', function (e) {
          const isSelect = (_this.selected.ids || []).indexOf(e.id);
          _this.changeMaker(e, this, 'normal');
          if (isSelect < 0) {
            _this.setSizeAttr(this, 'normal');
          }
          _this.$emit('leave', e, d3.event);
        });
      dotWarp.call(
        d3
          .drag()
          .on('start', this.started)
          .on('drag', this.dragged)
          .on('end', this.ended),
      );
      this.dotWarp = dotWarp;
      this.drawSquare();
    },
    initZoom() {
      const { zoomMin, zoomMax, mainSvg } = this;
      const zoom = d3
        .zoom()
        .scaleExtent([zoomMin, zoomMax])
        .on('zoom', () => {
          const transInfo = d3.event.transform;
          mainSvg.selectAll('g').attr('transform', transInfo);
          this.transInfo = transInfo;
          this.$emit('zoom', transInfo);
        });
      mainSvg.call(zoom).on('dblclick.zoom', null);
      this.zoom = zoom;
    },
    stopZoom() {
      const bodyDom = this.mainSvg;
      bodyDom.on('mousedown.zoom', null);
      bodyDom.on('mousemove.zoom', null);
      bodyDom.on('dblclick.zoom', null);
      bodyDom.on('touchstart.zoom', null);
      bodyDom.on('wheel.zoom', null);
      bodyDom.on('mousewheel.zoom', null);
      bodyDom.on('MozMousePixelScroll.zoom', null);
    },
    setSizeAttr(node, type) {
      // 设置内部icon
      const childrens = node.children || [];
      Array.prototype.slice.call(childrens).forEach((d) => {
        const svgType = d3.select(d).attr('svgType');
        if (svgType === 'typeRect') {
          d3.select(d).attr('width', (ddd) => circleTextWidth(ddd, type === 'normal' ? '' : type));
        }
        if (svgType === 'icon') {
          setAttr(d3.select(d), type);
        }
      });
    },
    initData() {
      const { links, dots } = operationData(this.chartData, this.clickType);
      // console.log(JSON.parse(JSON.stringify(links)));
      this.links = links;
      this.dots = dots;
      this.initSvg();
      this.drawAll();
    },
    changeMaker(data, dom, type, hoverId) {
      if (data.objType === 'dot') {
        this.lineWarp._groups[0].forEach((linkDom) => {
          const linkData = linkDom.__data__;
          if (linkData.target.id === data.id) {
            this.changeMaker(linkData, linkDom, type, data.id);
          }
        });
        return;
      }
      const colorInfo = markerColors[data.disabled ? 'disabled' : data.domStyle];
      const marker = d3.select(dom.children[0]);
      let nowY = marker.attr('oldRefY') || 0;
      let {
        refX, markerHeight, markerWidth,
      } = styleSize.normal;
      // 如果线已经是click 状态 那么hover和leaver 都是click 状态
      if (data.select || data.target.select || (hoverId === data.target.id && data.target.select))type = 'click';
      const fill = colorInfo[data.select ? 'click' : 'normal'];
      if (data.objType === 'line') {
        // hoverId === data.target.id 就是 dot hover 了但是没选中
        if (data.target.select || hoverId === data.target.id) {
          type = `dot${type}`;
        }
        if (data.target.select && data.select) {
          type = 'dotlineclick';
        }
        markerHeight = styleSize[type].markerHeight;
        markerWidth = styleSize[type].markerWidth;
        refX = styleSize[type].refX;
        if (type === 'dotlineclick' || type === 'click') {
          nowY /= 2; // 放大后的三角 y 值有变化
        }
      }
      marker
        .attr('refY', nowY)
        .attr('refX', refX)
        .attr('markerHeight', markerHeight)
        .attr('markerWidth', markerWidth)
        .attr('fill', fill);
    },
    tick() {
      const { links, dots } = this;
      this.paths.attr('d', function (data) {
        return pathD(data, this);
      });
      this.bkLine.attr('d', function (data) {
        return pathD(data, this);
      });
      this.dotWarp.attr('transform', setTransform); // 圆圈
      this.$emit('tick', { dots, links });
    },
    setTips(data, text) {
      if (this.canDraw) return;
      const { clientX: x, clientY: y } = d3.event;
      const { tips, mainSvg } = this;
      let target;
      if (this.tips[data.name]) {
        target = tips[data.name];
        target.attr('display', 'block');
      } else {
        target = mainSvg.append('g');
        target
          .append('rect')
          .attr('width', 100)
          .attr('height', 100)
          .attr('fill', 'red')
          .attr('rx', 10)
          .attr('ry', 10);
        target
          .append('text')
          .text(text || data.name)
          .attr('fill', 'white')
          .attr('x', 20)
          .attr('y', 20)
          .attr('text-anchor', 'start')
          .style('font-size', '20px')
          .style('user-select', 'none')
          .style('color', 'blue')
          .attr('dy', 8);
        tips[data.name] = target;
      }
      target.select('text').attr('x', x + 20);
      target.select('text').attr('y', y + 20);
      target.select('rect').attr('x', x);
      target.select('rect').attr('y', y);
    },
    initTips(data) {
      const { tips } = this;
      Object.keys(tips).forEach((key) => {
        tips[key].attr('display', 'none');
      });
    },
    started(d) {
      const { force } = this;
      if (!d3.event.active) {
        force.alphaTarget(0.2).restart(); // 设置衰减系数，对节点位置移动过程的模拟，数值越高移动越快，数值范围[0，1]
      }
      d.fx = d.x;
      d.fy = d.y;
    },
    dragged(d) {
      const { x, y } = d3.event;
      if (this.inBoundaries(x, y).isIn) {
        d.fx = x;
        d.fy = y;
      }
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    },
    ended(d) {
      const { force } = this;
      if (!d3.event.active) {
        force.alphaTarget(0);
      }
      d.fx = null;
      d.fy = null;
    },
    drawSquare() {
      this.mainSvg.on('mousedown', null);
      this.mainSvg.on('mousemove', null);
      this.mainSvg.on('mouseup', null);
      this.mainSvg.on('mousedown', () => {
        if (d3.event.target.localName === 'svg') {
          const { regionRect } = this;
          this.clickTime = new Date().getTime(); // mark start time
          this.drawFlag = true; // 以drawFlag作为可执行圈选的标记
          const { offsetX, offsetY } = d3.event;
          this.startLoc = [offsetX, offsetY];
          let rect;
          if (this.canDraw) {
            if (!regionRect) {
              rect = this.mainSvg
                .append('rect')
                .attr('width', 0)
                .attr('height', 0)
                .attr('transform', 'translate(0,0)')
                .attr('id', 'squareSelect');
            } else {
              rect = regionRect;
            }
            rect.attr('transform', `translate(${offsetX},${offsetY})`);
            rect.attr('endX', offsetX);
            rect.attr('endY', offsetY);
            this.regionRect = rect;
          }
        }
      });

      this.mainSvg.on('mousemove', () => {
        // 判断事件target
        if (this.drawFlag === true) {
          const { startLoc, canDraw, regionRect } = this;
          const { offsetX, offsetY } = d3.event;

          const width = offsetX - startLoc[0];
          const height = offsetY - startLoc[1];
          let endX;
          let endY;
          if (canDraw) {
            // 各种反向
            if (width < 0) {
              regionRect.attr(
                'transform',
                `translate(${offsetX},${startLoc[1]})`,
              );
              endX = offsetX;
              // eslint-disable-next-line prefer-destructuring
              endY = startLoc[1];
            }
            if (height < 0) {
              regionRect.attr(
                'transform',
                `translate(${startLoc[0]},${offsetY})`,
              );
              // eslint-disable-next-line prefer-destructuring
              endX = startLoc[0];
              endY = offsetY;
            }
            if (height < 0 && width < 0) {
              regionRect.attr('transform', `translate(${offsetX},${offsetY})`);
              endX = offsetX;
              endY = offsetY;
            }
            endX && regionRect.attr('endX', endX);
            endY && regionRect.attr('endY', endY);
            regionRect
              .attr('width', Math.abs(width))
              .attr('height', Math.abs(height));
          }
        }
      });

      this.mainSvg.on('mouseup', () => {
        const {
          clickTime, canDraw, drawFlag, regionRect, startLoc,
        } = this;
        const { offsetX, offsetY } = d3.event;
        const times = new Date().getTime() - clickTime;
        if (drawFlag && times >= 100 && canDraw) {
          let results = [];
          const _this = this;
          d3.selectAll('.regionNode').attr('temp', function (d) {
            const endLoc = [offsetX, offsetY]; // 框选结束的点的坐标
            if (inSquare(d, endLoc, startLoc, this)) {
              const { id } = d;
              const paths = _this.lineWarp.filter(
                (item) => item.target.id === id || item.source.id === id,
              );
              results = results.concat(paths._groups[0]);
              results.push(this.parentNode);
            }
          });
          this.setSelected(results);
          regionRect
            .attr('width', 0)
            .attr('height', 0)
            .attr('endX', 0)
            .attr('endY', 0)
            .attr('opacity', 1);
        } else {
          this.svgClick();
        }
        this.drawFlag = false;
      });
    },
    setSelected(select) {
      const { clickType } = this;
      if (select.length === 0) {
        this.removeAllClick();
        this.initAllMarker();
        this.selected = [];
        return;
      }
      if (clickType === 'none') return;
      if (clickType === 'onlyOne') {
        this.initAllMarker();
        const { objType, id, attack } = select[0].__data__;
        if (objType === 'dot' && !attack) {
          this.removeAllClick();
          const paths = this.lineWarp.filter(
            (path) => path.target.id === id || path.source.id === id,
          )._groups[0];
          if (paths.length > 0) {
            select = select.concat(paths);
            paths.forEach((dom) => {
              const { target, source } = dom.__data__;
              const names = [target.id, source.id];
              const dots = this.dotWarp.filter(
                (dot) => dot.id !== id && names.indexOf(dot.id) >= 0,
              )._groups[0];
              select = select.concat(dots);
            });
          }
          this.selected = select;
        }
        return;
      }
      if (this.selectType === 'click') {
        this.initAllMarker();
        this.removeAllClick();
        this.selected = select;
        return;
      }
      const selectedIds = this.selected.map((i) => i.__data__.id);
      select.forEach((a) => {
        const { id } = a.__data__;
        if (selectedIds.indexOf(id) < 0) {
          this.selected.push(a);
          selectedIds.push(id);
        }
      });
    },
    inBoundaries(x, y) {
      const { r } = circleInfo;
      const { width, height, zoomTransform } = this;
      const { k, x: tx, y: ty } = zoomTransform || { k: 1, x: 0, y: 0 }; // 缩略
      const newX = x * k + tx;
      const newY = y * k + ty;
      // 圆点大于左上角 最起码要有一个能 放下 圆形的空间
      // 圆点小于 右边
      const leftX = newX >= r * k;
      const rightX = newX <= width - r * k;
      const topY = newY >= r * k;
      const bottomY = newY <= height - r * k;
      return {
        isIn: leftX && rightX && topY && bottomY,
        leftX,
        rightX,
        topY,
        bottomY,
      };
    },
    svgClick() {
      if (d3.event.target.localName === 'svg') {
        this.setSelected([]);
        this.$emit('svgClick', d3.event);
      }
    },
    initAllMarker() {
      const _this = this;
      this.links && this.links.forEach((link) => {
        link.select = false;
      });
      this.dots && this.dots.forEach((dot) => {
        dot.select = false;
      });
      d3.selectAll('.innerNode').attr('temp', function (data) {
        _this.changeMaker(data, this, 'normal');
      });
    },
    deleteSelect() {
      this.force.stop();
      d3.selectAll('.forceMainG').remove();
      const { selected } = this;
      const removeIds = this.selected.ids;
      const deleted = [];
      let i = 0;
      while (removeIds.length !== 0) {
        const now = selected[i];
        const { id, objType } = now.__data__;
        if (objType === 'dot') {
          // 涉及点的边 的删除
          // 得到所有涉及点的边得到他们的id
          const removeLines = this.links.filter((line) => line.source.id === id
          || line.target.id === id);
          const removeLineIds = removeLines.map((line) => line.id);
          // id 进行循环 并且 得到现在的index  并从 数据中删除，innerRemoverIndex 是为了避免 已选和 被动删除造成重复删除
          removeLineIds.forEach((lineId) => {
            const lineIndex = this.links.findIndex((line) => line.id === lineId);
            if (lineIndex >= 0) {
              deleted.push({ ...this.links[lineIndex] });
              this.links.splice(lineIndex, 1);
            }
            const innerRemoverIndex = removeIds.indexOf(lineId);
            if (innerRemoverIndex >= 0) {
              removeIds.splice(innerRemoverIndex, 1);
            }
          });
          const dotIndex = this.dots.findIndex((dot) => dot.id === id);
          if (dotIndex >= 0) {
            deleted.push({ ...this.dots[dotIndex] });
            this.dots.splice(dotIndex, 1);
          }
        } else {
          const lineIndex = this.links.findIndex((line) => line.id === id);
          if (lineIndex >= 0) {
            deleted.push({ ...this.links[lineIndex] });
            this.links.splice(lineIndex, 1);
          }
        }
        const innerRemoverIndex = removeIds.indexOf(id); // 避免重复删除
        removeIds.splice(innerRemoverIndex, 1);
        i += 1;
      }
      this.$emit('deleted', deleted);
      this.drawAll();
      d3.selectAll('.forceMainG').attr('transform', this.transInfo);
      this.setSelected([]);
    },
    recover() {
      this.mainSvg.transition().duration(750).call(this.zoom.transform, d3.zoomIdentity);
    },
    resize() {
      this.initSvg();
      d3.selectAll('.forceMainG').remove();
      this.drawAll();
      this.setSelectClass();
    },
    disabledSelect(type) {
      const { selected } = this;
      const _this = this;
      const className = 'forceDisabeld';
      let relationPaths = [];
      const setDisabled = function (d) {
        const target = d3.select(this);
        const classArray = target.attr('class').split(' ');
        const nowIndex = classArray.indexOf(className);
        const clickIndex = classArray.indexOf('forceClick');
        if (!type && nowIndex < 0) {
          this.__data__.disabled = true;
          classArray.push(className);
        } else if (type && nowIndex >= 0) {
          this.__data__.disabled = false;
          classArray.splice(nowIndex, 1);
        }
        if (clickIndex >= 0)classArray.splice(clickIndex, 1);
        _this.setSizeAttr(this, 'normal');
        if (d.objType === 'dot') {
          const paths = _this.lineWarp._groups[0].filter(
            (path) => path.__data__.source.id === d.id || path.__data__.target.id === d.id,
          );
          relationPaths = relationPaths.concat(paths);
        }
        return classArray.join(' ');
      };
      // const removeSelect = [];
      d3.selectAll(selected).attr('class', setDisabled);
      d3.selectAll(relationPaths).attr('class', setDisabled);
      const disabledLinks = this.links.filter((item) => item.disabled);
      const disabledDots = this.dots.filter((item) => item.disabled);
      this.$emit('disableds', { disabledLinks, disabledDots });
      this.setSelected([]);
    },
  },
};
</script>
<style lang="scss">
@import './main.scss';
</style>
