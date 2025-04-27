import { defineConfig } from 'vitepress'

// 导入主题的配置
import { blogTheme } from './blog-theme'

// 如果使用 GitHub/Gitee Pages 等公共平台部署
// 通常需要修改 base 路径，通常为“/仓库名/”
// 如果项目名已经为 name.github.io 域名，则不需要修改！
// const base = process.env.GITHUB_ACTIONS === 'true'
//   ? '/vitepress-blog-sugar-template/'
//   : '/'

// Vitepress 默认配置
// 详见文档：https://vitepress.dev/reference/site-config

const base = '/blog'
export default defineConfig({
  // 继承博客主题(@sugarat/theme)
  extends: blogTheme,
  base,
  lang: 'zh-cn',
  title: 'aaron',
  description: 'aaron\'s blog',
  lastUpdated: true,
  // 详见：https://vitepress.dev/zh/reference/site-config#head
  head: [
    // 配置网站的图标（显示在浏览器的 tab 上）
    // ['link', { rel: 'icon', href: `${base}favicon.ico` }], // 修改了 base 这里也需要同步修改
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],
  themeConfig: {
    // 展示 2,3 级标题在目录中
    outline: {
      level: [2, 3, ],
      label: 'Table of Contents'
    },
    // 默认文案修改
    returnToTopLabel: 'Return to Top',
    sidebarMenuLabel: 'Related Articles',
    lastUpdatedText: 'Last Updated',
    lastUpdated: {
      text: 'Last Updated', // Or keep your preferred label
      formatOptions: {
        year: 'numeric',   // Ensures 4-digit year (e.g., 2025)
        month: '2-digit',  // Ensures 2-digit month (e.g., 04)
        day: '2-digit'     // Ensures 2-digit day (e.g., 24)
        // Do NOT include timeStyle or any hour/minute/second options
      }
    },
    // 设置logo
    logo: '/logo.png',
    // editLink: {
    //   pattern:
    //     'https://github.com/dazhengs/blog/tree/main/docs/:path',
    //   text: 'Edit this page on GitHub'
    // },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Tools', link: 'tools' },
      { text: 'About', link: 'about' }
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/dazhengs'
      }
    ]
  }
})
