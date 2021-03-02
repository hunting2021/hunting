const path = require('path')
// 主网地址
// const ETHHOST = 'https://mainnet.infura.io/v3/febcd95a1c534c46a2e098e383698b26'
// const BNBHOST = 'https://mainnet.infura.io/v3/febcd95a1c534c46a2e098e383698b26'
const host = 'https://api.etherscan.io/'

const CompressionPlugin = require('compression-webpack-plugin')
const TerserPlugin = require("terser-webpack-plugin");
const PrerenderSPAPlugin = require('prerender-spa-plugin')
const webpack = require('webpack')

module.exports = {
  lintOnSave: process.env.NODE_ENV === 'development',
  publicPath: '/',
  productionSourceMap: false,
  devServer: {
    open: true,
    proxy: {
      '/api': {
        target: host,
        changeOrigin: true,
      },
      // '/coins': {
      //   target: coinsHost,
      //   changeOrigin: true
      // }
    }
  },
  css: {
    loaderOptions: {
      stylus: {
        import: ['~assets/stylus/index.styl']
      }
    }
  },
  configureWebpack: () => {
    const returnConfig = {
      resolve: {
        alias: {
          '@': path.join(__dirname, 'src'),
          'assets': path.join(__dirname, 'src/assets')
        }
      },
      devtool: 'source-map',
      plugins: [
        new webpack.ProvidePlugin({
          $: 'jquery',
          jQuery: 'jquery',
          "windows.jQuery": 'jquery',
          "windows.$": 'jquery'
        })
      ]
    }
    const optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          test: /\.js(\?.*)?$/i,
          parallel: true,
          terserOptions: {
            compress: {
              drop_console: true
            }
          }
        })
      ]
    }
    if (process.env.NODE_ENV === 'production') {
      // 为生产环境修改配置...
      returnConfig['optimization'] = optimization
      returnConfig.plugins.push(
        new CompressionPlugin({
          test: /\.js(\?.*)?$/i,
          threshold: 1024 * 2000,
          algorithm: 'gzip',
          deleteOriginalAssets: false
        }),
        new PrerenderSPAPlugin({
          staticDir: path.join(__dirname, 'dist'),
          routes: ['/'],
          renderAfterDocumentEvent: 'custom-render-trigger',
          headless: false,
          maxConcurrentRoutes: 3
        })
      )
    }
    return returnConfig
  },
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title = 'The hunting'
        return args
      })
    config.plugins.delete('prefetch')
  },
  transpileDependencies: [ 'dom7', 'swiper', 'marked' ]
}
