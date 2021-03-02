function addComma (num) {
  if (num.toLocaleString) {
    return num.toLocaleString()
  }
  return num
}

function formatNumberByUnit (num) {
  if (num >= 100000000) {
    return (Math.round(num / 1000000) / 100).toFixed(2) + '亿'
  }
  if (num >= 10000000) {
    return (Math.round(num / 100000) / 100).toFixed(2) + '千万'
  }
  if (num >= 1000000) {
    return (Math.round(num / 10000)).toFixed(2) + '万'
  }
  if (num >= 10000) {
    return (Math.round(num / 100) / 100).toFixed(2) + '万'
  }
  return addComma(num)
}

export { formatNumberByUnit, addComma }
