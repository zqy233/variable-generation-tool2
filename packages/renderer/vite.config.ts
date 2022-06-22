import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import re from "vite-plugin-resolve"
import electron from "vite-plugin-electron-renderer"
import pkg from "../../package.json"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"
import Pages from "vite-plugin-pages"
import commonjs from "vite-plugin-commonjs"
import { resolve } from "path"

export default defineConfig({
  mode: process.env.NODE_ENV,
  root: __dirname,
  base: "./",
  // 全局加载scss文件
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "packages/renderer/src/assets/theme/index.scss" as *;`
      }
    }
  },
  plugins: [
    vue(),
    electron(),
    AutoImport({
      imports: ["vue", "vue-router"], // 自动导入vue相关函数
      dts: "src/auto-import.d.ts" // 生成 `auto-import.d.ts` 全局声明
    }),
    Components({
      dirs: ["src/components"], // 要导入组件的目录路径
      deep: true, // 搜索子目录
      dts: "src/components/components.d.ts", // 生成 `components.d.ts` 全局声明
      resolvers: [
        ElementPlusResolver({
          importStyle: "sass"
        })
      ]
    }),
    Pages({
      // 自动读取src/views下的vue文件，生成路由信息，默认路由路径'/‘
      dirs: [{ dir: "src/views", baseRoute: "/" }],
      // 异步方式加载路由组件
      importMode: "sync"
      // 遍历路由信息，给默认路由加一个redirect
      // extendRoute(route) {
      //   if (route.path === "/") return { ...route, redirect: "" }
      // }
    }),
    re(
      /**
       * Here you can specify other modules
       * 🚧 You have to make sure that your module is in `dependencies` and not in the` devDependencies`,
       *    which will ensure that the electron-builder can package it correctly
       */
      {
        // If you use electron-store, this will work
        "electron-store": 'const Store = require("electron-store"); export default Store;'
      }
    )
  ],
  build: {
    outDir: "../../dist/renderer",
    rollupOptions: {
      output: {
        format: "commonjs"
      }
    }
  },
  resolve: {
    alias: {
      "@": resolve("./src"),
      "@utils": resolve("./src/utils")
    }
  },
  server: {
    host: pkg.env.VITE_DEV_SERVER_HOST,
    port: pkg.env.VITE_DEV_SERVER_PORT
  }
})
