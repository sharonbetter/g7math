/**
 * 小程序配置。
 *
 * 现在还没有服务器，以下两项留空即可正常预览：
 *   apiBase      —— 留空时用户标识用本机生成的 id，模型批改不可用
 *   bookPageBase —— 留空时书本原页图不显示，只显示讲次文字
 *
 * 将来有了 HTTPS 域名，填进来并在微信公众平台配置 request/uploadFile 合法域名即可。
 */
module.exports = {
  // 例：'https://api.example.com'  留空表示未接入后端
  apiBase: '',
  // 例：'https://cdn.example.com/book-pages'  留空表示不显示扫描页图
  bookPageBase: '',
  appName: '七年级数学学习工具',
  // 登录后是否允许手工输入姓名
  allowDisplayName: true
}
