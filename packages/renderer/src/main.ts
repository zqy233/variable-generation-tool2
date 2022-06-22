import { createApp } from "vue"
import App from "./App.vue"
import { createRouter, createWebHashHistory } from "vue-router"
// 这里就是vite-plugin-pages生成的路由信息，正常使用即可
import routes from "virtual:generated-pages"
import "element-plus/theme-chalk/src/message.scss"
import "element-plus/theme-chalk/dark/css-vars.css"
import "./assets/fonts/index-screen.css"
import "./assets/theme/dark.scss"
console.log(routes)
const router = createRouter({
  history: createWebHashHistory(),
  routes
})
createApp(App).use(router).mount("#app").$nextTick(window.removeLoading)
