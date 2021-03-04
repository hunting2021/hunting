/* eslint-disable prefer-destructuring */
/* eslint-disable quote-props */
import * as d3 from 'd3';

export const normalType = 'abnormal';
const sizes = {
  normal: {
    'icon': {
      width: 16, height: 16,
    },
  },
  hover: {
    'icon': {
      width: 26, height: 26,
    },
  },
  focus: {
    'icon': {
      width: 26, height: 26,
    },
  },
};

export const labelC = {
  '严重': 'severity',
  '高危': 'high',
  '中危': 'middle',
  '轻危': 'low',
  '异常': 'abnormal',
  'both': 'both',
};
export const getEnglishName = (d) => labelC[d.label || d.properties.alertLevelLabel] || normalType;
export const styleSize = {
  normal: {
    refX: 30,
    markerHeight: 8,
    markerWidth: 8,
  },
  hover: {
    refX: 28,
    markerHeight: 10,
    markerWidth: 10,
  },
  click: {
    refX: 19,
    markerHeight: 17.5,
    markerWidth: 17.5,
  },
  dotnormal: {
    refX: 35,
    markerHeight: 8,
    markerWidth: 8,
  },
  dothover: {
    refX: 43,
    markerHeight: 10,
    markerWidth: 10,
  },
  dotclick: {
    refX: 48,
    markerHeight: 10,
    markerWidth: 10,
  },
  dotlineclick: {
    refX: 28,
    markerHeight: 25,
    markerWidth: 20,
  },
};
// markerColors, styleSize;
export const markerColors = {
  severity: {
    hover: '#E37474',
    normal: '#E37474',
    click: '#AB4348',
  },
  high: {
    hover: '#FC6980',
    normal: '#FC6980',
    click: '#C7445A',
  },
  middle: {
    hover: '#FFB952',
    normal: '#FFB952',
    click: '#E09A22',
  },
  low: {
    hover: '#47A1FF',
    normal: '#47A1FF',
    click: '#0080C9',
  },
  abnormal: {
    hover: '#A2E5FF',
    normal: '#A2E5FF',
    click: '#5CAECC',
  },
  disabled: {
    hover: '#A5ADBA',
    normal: '#A5ADBA',
    click: '#A5ADBA',
  },
};
export const setDotClass = (d, other) => `${other} ${getEnglishName(d)}`;

export const setAttr = (objs, type) => {
  // eslint-disable-next-line func-names
  objs.each(function () {
    const _this = d3.select(this);
    const part = _this.attr('svgType');
    if (part) {
      sizes[type][part] && Object.keys(sizes[type][part]).forEach((key) => {
        _this.attr(key, sizes[type][part][key]);
      });
    }
  });
};
// export const getColor = (d) => colors[d];
function mNumber(n) {
  return n;
}

export const circleInfo = {
  r: 32,
  stroke: 1,
  sr: 6,
  sPadding: 5,
};
const getText = (d) => {
  if (d.type === 'mechine') {
    return `${d.id}(${d.ipIsInner})`;
  }
  if (d.properties) {
    const { intranet, attackedCount } = d.properties;
    if (intranet) {
      return `${d.id}(内网)攻击${attackedCount}次`;
    }
    if (intranet === false) {
      return `${d.id}(互联网)攻击${attackedCount}次`;
    }
    return `${d.properties.city}`;
  }
  return ''
};
function getLength(str) {
  let realLength = 0;
  const len = str.length;
  let charCode = -1;
  for (let i = 0; i < len; i++) {
    charCode = str.charCodeAt(i);
    if (charCode >= 0 && charCode <= 128) realLength += 0.6;
    else realLength += 1.5;
  }
  return realLength;
}

export const circleTextWidth = (d, type) => {
  const strin = getText(d);
  const min = type ? 24 : 12;
  const size = type ? 10 : 6;
  const hasPadding = strin > 1 ? circleInfo.sPadding : 0;
  const now = getLength(strin) * size + hasPadding;
  return now > min ? now : min;
};
export const drawLine = (svg, type, links) => {
  const isThumb = type === 'thumb';
  const warp = isThumb ? svg.insert('g', '.dragThumb') : svg.append('g');
  const lineWarp = warp
    .attr('class', `${isThumb ? 'thumbG' : 'forceLines forceMainG'}`)
    .selectAll('g')
    .data(links)
    .enter()
    .append('a')
    .attr('class', (d) => `${d.domStyle} force-link`);

  const {
    refX, markerWidth, markerHeight,
  } = styleSize.normal;
  const markerId = (d) => `marker-${(d.id)}`;
  lineWarp
    .append('marker')
    .attr('id', markerId)
    .attr('markerUnits', 'userSpaceOnUse')
    .attr('viewBox', '0 -5 10 10') // 坐标系的区域
    .attr('refX', refX) // 箭头坐标
    .attr('markerWidth', markerWidth) // 标识的大小
    .attr('markerHeight', markerHeight)
    .attr('orient', 'auto') // 绘制方向，可设定为：auto（自动确认方向）和 角度值
    .attr('stroke-width', 2) // 箭头宽度
    .attr('stroke', 'none') // 箭头宽度
    .attr('fill', (d) => {
      const label = d.domStyle;
      return markerColors[label].normal;
    })
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5') // 箭头的路径
    .attr('fill', 'inherit'); // 箭头的路径
  const line = lineWarp.append('path')
    .attr('id', (d, i) => `edgepath${i}`)
    .attr('stroke-dasharray', (d) => (d.properties && d.properties.resultName === '攻击失败' && type === 'normal' ? '8,5' : ''))
    .attr('marker-end', (d) => {
      if (isThumb) return '';
      return `url(#${(markerId(d))})`;
    });
  const bkLine = lineWarp.append('path')
    .attr('stroke-width', 10)
    .attr('stroke', 'red')
    .attr('fill', 'none')
    .attr('opacity', '0')
    .attr('stroke-dasharray', (d) => (d.properties && d.properties.resultName === '攻击失败' && type === 'normal' ? '8,5' : ''));
  // const lineText = !isThumb ? lineWarp.append('text')
  //   .attr('pointer-events', 'none')
  //   .attr('user-select', 'none')
  //   .attr('class', 'linetext edgelabel')
  // // .attr('id', (d, i) => `edgepath${i}`)
  //   .attr('dx', 50)
  //   .attr('dy', -5)
  //   .attr('fill', '#5C5F66')
  //   .append('textPath')
  //   .attr('xlink:href', (d, i) => `#edgepath${i}`)
  //   .style('pointer-events', 'none')
  //   .text((d) => d.properties.attackChainStageLabel) : {};
  return {
    lineWarp,
    line,
    // lineText,
    bkLine,
  };
};
export const drawCircle = (svg, nodes, type) => {
  const dotWarp = svg
    .append('g')
    .attr('class', 'forceNodes forceMainG')
    .selectAll('g')
    .data(nodes)
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
    // eslint-disable-next-line no-script-url
    .attr('xlink:href', 'javascript:void(0)');
  const circle = dotWarp.append('circle')
    .attr('class', 'forceNode regionNode');
  const innerCircle = dotWarp.append('circle').attr('class', 'innerCircle');
  const circleText = dotWarp.append('use')
    .attr('svgType', 'icon')
    .attr('user-select', '#none') // 在圆圈中加上数据
    .attr('xlink:href', (d) => {
      let end;
      if (d.sufferer && d.attack) {
        end = '#icon-attrackAndSuffer';
      } else if (d.sufferer) {
        end = '#icon-sufferer';
      } else if (d.attack) {
        end = '#icon-attacker';
      } else {
        end = '#icon-ip';
      }
      return end;
    });
  setAttr(circleText, 'normal');
  let statusRect;
  let statusText;
  const typeCircle = dotWarp.append('rect')
    .attr('width', (d) => circleTextWidth(d, ''))
    .attr('class', 'forceTypeRect')
    .attr('svgType', 'typeRect');
  const typeCircleText = dotWarp.append('text')
    .attr('class', 'forceTypeText')
    .attr('svgType', 'typeText')
    .text((d) => getText(d));
  if (type === 'normal') {
    statusRect = dotWarp.append('rect')
      .attr('width', (d) => circleTextWidth(d, ''))
      .attr('class', (d) => `forceStatusRect ${d.properties.collapsedState === '可疑' ? 'grey' : ''}`)
      .attr('svgType', 'statusRect')
      .attr('display', (d) => (!d.sufferer ? 'none' : ''));
    statusText = dotWarp.append('text')
      .attr('class', (d) => `forceStatusText ${d.properties.collapsedState === '可疑' ? 'grey' : ''}`)
      .attr('x', 0)
      .attr('y', 0)
      .attr('svgType', 'statusText')
      .attr('display', (d) => (!d.sufferer ? 'none' : ''))
      .text((d) => d.properties.collapsedState);
  }
  return {
    circle, circleText, typeCircle, typeCircleText, dotWarp, innerCircle, statusRect, statusText,
  };
};
export const setLinkNumber = (group, type) => {
  if (group.length === 0) return;
  // 对该分组内的关系按照方向进行分类，此处根据连接的实体ASCII值大小分成两部分
  const linksA = [];
  const linksB = [];
  for (let i = 0; i < group.length; i++) {
    const link = group[i];
    if (link.source.id < link.target.id) {
      linksA.push(link);
    } else {
      linksB.push(link);
    }
  }
  // 确定关系最大编号。为了使得连接两个实体的关系曲线呈现对称，根据关系数量奇偶性进行平分。
  // 特殊情况：当关系都是连接到同一个实体时，不平分
  let maxLinkNumber = 0;
  if (type === 'self') {
    maxLinkNumber = group.length;
  } else {
    maxLinkNumber = group.length % 2 === 0 ? group.length / 2 : (group.length + 1) / 2;
  }
  // 如果两个方向的关系数量一样多，直接分别设置编号即可
  if (linksA.length === linksB.length) {
    let startLinkNumber = 1;
    for (let i = 0; i < linksA.length; i++) {
      linksA[i].linknum = startLinkNumber++;
    }
    startLinkNumber = 1;
    for (let i = 0; i < linksB.length; i++) {
      linksB[i].linknum = startLinkNumber++;
    }
  } else {
    // 当两个方向的关系数量不对等时，先对数量少的那组关系从最大编号值进行逆序编号，然后在对另一组数量多的关系从编号1一直编号到最大编号，再对剩余关系进行负编号
    // 如果抛开负号，可以发现，最终所有关系的编号序列一定是对称的（对称是为了保证后续绘图时曲线的弯曲程度也是对称的）
    let biggerLinks;
    let smallerLinks;
    if (linksA.length > linksB.length) {
      biggerLinks = linksA;
      smallerLinks = linksB;
    } else {
      biggerLinks = linksB;
      smallerLinks = linksA;
    }

    let startLinkNumber = maxLinkNumber;
    for (let i = 0; i < smallerLinks.length; i++) {
      smallerLinks[i].linknum = startLinkNumber--;
    }
    const tmpNumber = startLinkNumber;

    startLinkNumber = 1;
    let p = 0;
    while (startLinkNumber <= maxLinkNumber) {
      biggerLinks[p++].linknum = startLinkNumber++;
    }
    // 开始负编号
    startLinkNumber = 0 - tmpNumber;
    for (let i = p; i < biggerLinks.length; i++) {
      biggerLinks[i].linknum = startLinkNumber++;
    }
  }
};
export const setTransform = (node) => {
  const { x, y, k } = node;
  let result = '';
  if (x && y)result += `translate(${x},${y})`;
  if (k)result += ` scale(${k})`;
  return result;
};
export const pathD = (d, type, dom) => {
  let { x: sx, y: sy } = d.source;
  let { x: tx, y: ty } = d.target;
  let dr;
  sx = mNumber(sx, type);
  sy = mNumber(sy, type);
  tx = mNumber(tx, type);
  ty = mNumber(ty, type);
  // 如果连接线连接的是同一个实体，则对path属性进行调整，绘制的圆弧属于长圆弧，同时对终点坐标进行微调，避免因坐标一致导致弧无法绘制
  if (d.target === d.source) {
    dr = mNumber(30 / d.linknum, type);
    return (
      `M${
        sx
      },${
        sy
      }A${
        dr
      },${
        dr
      } 0 ${mNumber(1, type)},${mNumber(1, type)} ${
        tx
      },${
        ty + mNumber(1, type)}`
    );
  } if (d.size % 2 !== 0 && d.linknum === 1) {
    // 如果两个节点之间的连接线数量为奇数条，则设置编号为1的连接线为直线，其他连接线会均分在两边
    return `M ${sx},${sy},L ${tx},${ty}`;
  }
  // 根据连接线编号值来动态确定该条椭圆弧线的长半轴和短半轴，当两者一致时绘制的是圆弧
  // 注意A属性后面的参数，前两个为长半轴和短半轴，第三个默认为0，
  // 第四个表示弧度大于180度则为1，小于则为0，这在绘制连接到相同节点的连接线时用到；
  // 第五个参数，0表示正角，1表示负角，即用来控制弧形凹凸的方向。本文正是结合编号的正负情况来控制该条连接线的凹凸方向，从而达到连接线对称的效果

  const curve = 1.5;
  const homogeneous = 2;
  const dx = d.target.x - d.source.x;
  const dy = d.target.y - d.source.y;
  dr = (Math.sqrt(dx * dx + dy * dy) * (d.linknum + homogeneous))
      / (curve * homogeneous);
  dr = mNumber(dr, type);
  // 当节点编号为负数时，对弧形进行反向凹凸，达到对称效果
  if (d.linknum < 0) {
    if (dom) {
      d3.select(dom.previousElementSibling).attr('refY', 4).attr('oldRefY', 4);
    }
    dr = (Math.sqrt(dx * dx + dy * dy) * (-1 * d.linknum + homogeneous))
      / (curve * homogeneous);
    dr = mNumber(dr, type);
    return (
      `M${sx},${sy}A${dr},${dr} 0 0,0 ${tx},${ty}`
    );
  }
  if (dom) {
    d3.select(dom.previousElementSibling).attr('refY', -4).attr('oldRefY', -4);
  }
  return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
};

export const inSquare = (d, endLoc, startLoc, dom) => {
  let { x: dx, y: dy } = d;
  let transInfo = d3.select(dom.parentElement.parentElement).attr('transform');
  if (transInfo) {
    transInfo = transInfo.split(' ').map((i) => {
      const strings = i.split(',');
      // eslint-disable-next-line no-useless-escape
      const regEx = /[^\d|^\.|^\-]/g;
      return strings.map((s) => s.replace(regEx, ''));
    }) || [[0, 0], 0];
    let [moveX, moveY] = transInfo[0] || [0, 0];
    const [scale] = transInfo[1] || 1;
    moveX = Number(moveX);
    moveY = Number(moveY);
    // 缩放时点的位置发生了变化 所以 * scale + 父集移动的 x,y 的距离
    dx = (dx * scale) + moveX;
    dy = (dy * scale) + moveY;
  }
  const leftTop = []; // LT 为框选左上角 x,y
  const rightBottom = []; // LT 为框选左上角 x,y
  if (endLoc[0] >= startLoc[0]) {
    leftTop[0] = startLoc[0];
    rightBottom[0] = endLoc[0];
  } else {
    leftTop[0] = endLoc[0];
    rightBottom[0] = startLoc[0];
  }

  if (endLoc[1] >= startLoc[1]) {
    leftTop[1] = startLoc[1];
    rightBottom[1] = endLoc[1];
  } else {
    leftTop[1] = endLoc[1];
    rightBottom[1] = startLoc[1];
  }
  return (
    dx < rightBottom[0]
    && dx > leftTop[0]
    && dy > leftTop[1]
    && dy < rightBottom[1]
  );
};
function getKey(target, source) {
  const result = target > source ? `${target}:${source}` : `${source}:${target}`;
  return result;
}
export const operationData = (chartData, clickType) => {
  const linkmap = {};
  const linkGroup = {};
  const { links, dots } = chartData;
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const { target, source } = link;
    const key = getKey(target, source);

    if (linkGroup[key]) {
      linkGroup[key].push(link);
      linkmap[key] += 1;
    } else {
      linkGroup[key] = [links[i]];
    }
  }
  Object.keys(linkGroup).forEach((groupKey) => {
    linkmap[groupKey] = linkGroup[groupKey].length;
  });

  JSON.parse(JSON.stringify(links)).forEach((e) => {
    const sourceNode = dots.filter((n) => n.id === e.source)[0];
    const targetNode = dots.filter((n) => n.id === e.target)[0];
    if (clickType !== 'none' && targetNode) {
      sourceNode['attack'] = true;
      targetNode['sufferer'] = true;
    }
    const nowIndex = links.findIndex(
      (n) => n.source === e.source && n.target === e.target,
    );
    if (!sourceNode || !targetNode) {
      links.splice(nowIndex, 1);
    } else {
      links[nowIndex].source = sourceNode;
      links[nowIndex].target = targetNode;
    }
  });
  for (let i = 0; i < links.length; i++) {
    let { target, source } = links[i];
    target = target.id;
    source = source.id;
    const link = links[i];
    const key = getKey(target, source);
    link.size = linkmap[key];
    const group = linkGroup[key];
    const type = 'noself'; // 标示该组关系是指向两个不同实体还是同一个实体
    setLinkNumber(group, type);
  }
  return { links, dots };
};
