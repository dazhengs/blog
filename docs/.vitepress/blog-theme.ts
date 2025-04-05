// 主题独有配置
import { getThemeConfig } from '@sugarat/theme/node'

// 开启RSS支持（RSS配置）
// import type { Theme } from '@sugarat/theme'

// const baseUrl = 'https://sugarat.top'
// const RSS: Theme.RSSOptions = {
//   title: 'dazheng',
//   baseUrl,
//   copyright: 'Copyright (c) 2018-present, dazheng',
//   description: '你的指尖,拥有改变世界的力量（大前端相关技术分享）',
//   language: 'zh-cn',
//   image: 'https://img.cdn.sugarat.top/mdImg/MTY3NDk5NTE2NzAzMA==674995167030',
//   favicon: 'https://sugarat.top/favicon.ico',
// }

// 所有配置项，详见文档: https://theme.sugarat.top/
const blogTheme = getThemeConfig({
  // 开启RSS支持
  // RSS,

  // 搜索
  // 默认开启pagefind离线的全文搜索支持（如使用其它的可以设置为false）
  // search: true,

  // markdown 图表支持（会增加一定的构建耗时）
  // mermaid: true


  article: {
    /**
     * 是否展示文章的预计阅读时间
     */
    readingTime: true,
    /**
     * 是否隐藏文章页的封面展示
     */
    hiddenCover: false,
    /**
     * 阅读时间分析展示位置
     */
    readingTimePosition: 'inline',
    /**
     * 自定义一系列文案标题
     */
     analyzeTitles: {
       inlineWordCount: '{{value}} word counts',
       inlineReadTime: '{{value}} min read time',
       wordCount: 'Total word count',
       readTime: 'Total read time',
       author: 'Author',
       publishDate: 'Published on',
       lastUpdated: 'Last updated on',
       tag: 'Tags',
     }
  },
  formatShowDate: {
    secondsAgo: ' seconds ago',
    minutesAgo: ' minutes ago',
    hoursAgo: ' hours ago',
    daysAgo: ' days ago',
  },

  hotArticle: {
    title: '🔥 Featured Articles',
    nextText: 'Next Group',
    pageSize: 9,
    empty: 'No featured content yet'
  },

  // 页脚
  footer: {
    // message 字段支持配置为HTML内容，配置多条可以配置为数组
    // message: '下面 的内容和图标都是可以修改的噢（当然本条内容也是可以隐藏的）',
    copyright: 'MIT License | aaron',
    // icpRecord: {
    //   name: '蜀ICP备19011724号',
    //   link: 'https://beian.miit.gov.cn/'
    // },
    // securityRecord: {
    //   name: '公网安备xxxxx',
    //   link: 'https://www.beian.gov.cn/portal/index.do'
    // },
  },

  recommend: {
    title: "Related articles",
    pageSize: 10,
    showSelf: false,
    empty: "No related articles yet"
  },
  // 主题色修改
  themeColor: 'el-blue',

  // 文章默认作者
  author: 'aaron',
  //评论
  comment: {
    type: 'giscus',
    options: {
      repo: 'dazhengs/blog',
      repoId: 'R_kgDOOSN_BA',
      category: 'Announcements',
      categoryId: 'DIC_kwDOOSN_BM4CovGc',
      inputPosition: 'top',
      lang: 'en',
    },
    mobileMinify: true
  }

  // 友链
  // friend: [
  //   {
  //     nickname: 'dazheng',
  //     des: '你的指尖用于改变世界的力量',
  //     avatar:
  //       'https://img.cdn.sugarat.top/mdImg/MTY3NDk5NTE2NzAzMA==674995167030',
  //     url: 'https://sugarat.top',
  //   },
  //   {
  //     nickname: 'Vitepress',
  //     des: 'Vite & Vue Powered Static Site Generator',
  //     avatar:
  //       'https://vitepress.dev/vitepress-logo-large.webp',
  //     url: 'https://vitepress.dev/',
  //   },
  // ],

  // 公告
  // popover: {
  //   title: '公告',
  //   body: [
  //     { type: 'text', content: '👇公众号👇---👇 微信 👇' },
  //     {
  //       type: 'image',
  //       src: 'https://img.cdn.sugarat.top/mdImg/MTYxNTAxODc2NTIxMA==615018765210~fmt.webp'
  //     },
  //     {
  //       type: 'text',
  //       content: '欢迎大家加群&私信交流'
  //     },
  //     {
  //       type: 'text',
  //       content: '文章首/文尾有群二维码',
  //       style: 'padding-top:0'
  //     },
  //     {
  //       type: 'button',
  //       content: '作者博客',
  //       link: 'https://sugarat.top'
  //     },
  //     {
  //       type: 'button',
  //       content: '加群交流',
  //       props: {
  //         type: 'success'
  //       },
  //       link: 'https://theme.sugarat.top/group.html',
  //     }
  //   ],
  //   duration: 0
  // },
})

export { blogTheme }
