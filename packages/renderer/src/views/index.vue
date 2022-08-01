<template>
  {{ width }}
  <section class="home">
    <transition name="filter">
      <article class="filter" v-show="filter" />
    </transition>
    <transition name="show">
      <el-card v-show="show" class="show">
        <div class="win-header drag-dom">
          <i-sun v-if="themeMode == 'dark'" @click="darkMode" class="no-drag-dom" />
          <i-moon v-else @click="darkMode" class="no-drag-dom" />
          <i-fixed @click="fixedApp" class="no-drag-dom" />
          <i-close @click="clickIcon('close')" class="no-drag-dom" />
          <i-min @click="clickIcon('minimize')" class="no-drag-dom" />
        </div>
        <div class="content">
          <div class="header">
            <el-select v-model="nameType" placeholder="请选择命名方式">
              <el-option label="lowerCamelCase" value="lowerCamelCase">
                <span style="float: left">lowerCamelCase</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">小驼峰命名法</span>
              </el-option>
              <el-option label="kebab-case" value="kebab-case">
                <span style="float: left">kebab-case</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">串式命名法</span>
              </el-option>
            </el-select>
            <el-button type="primary" @click="translate"> 翻译 </el-button>
          </div>
          <el-input v-model="q" @keydown.enter="translate" ref="ipt" @focus="q = ''" placeholder="输入中文" />
          <div class="result">
            <span>{{ r }}</span>
          </div>
        </div>
      </el-card>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { ipcRenderer } from "electron"

import axios from "axios"
import MD5 from "md5"
import Qs from "qs"
import { ElMessage } from "element-plus"

/** 查询文本 */
const q = ref("")
/** 翻译结果 */
const r = ref("")
const show = ref(false) // 触发el-card显现动画
const filter = ref(true) // 触发背景模糊动画
const width = ref("")

ipcRenderer.on("message", function (event, text) {
  console.log(text)
  ElMessage.info("收到消息：" + text)
})

/** 当前主题 */
const themeMode = ref("dark")
const darkMode = () => {
  if (document.documentElement.classList.contains("dark")) {
    document.documentElement.classList.remove("dark")
    themeMode.value = "sun"
  } else {
    document.documentElement.classList.add("dark")
    themeMode.value = "dark"
  }
}

onMounted(() => {
  show.value = true
  filter.value = false
  // 获取当前页面的宽度
  // nextTick(() => {
  //   console.log(document.querySelector(".show").getBoundingClientRect(), document.querySelector(".show").offsetWidth)
  // })
  nextTick(() => {
    let el = document.querySelector(".show") as HTMLDivElement
    el.onmouseenter = e => {
      console.log(e, "鼠标进入可视区域")
      ipcRenderer.send("setIgnoreMouseEventsFalse")
    }
    el.onmouseleave = (e: any) => {
      console.log(e, "鼠标离开可视区域")
      // 需要判断是否是移入不可视的页面区域
      if (e.toElement == document.documentElement) {
        ipcRenderer.send("setIgnoreMouseEventsTrue")
      }
    }
  })
})

const clickIcon = (iconName: string) => {
  ipcRenderer.send("listen-click-icons", iconName)
}
const fixedApp = () => {
  ipcRenderer.send("fixed-app")
}

const ipt = ref<HTMLElement | null>(null) // 获取input元素，用于自动聚焦
const appid = "20210929000959942" // 应用id
const salt = Math.random() // 随机数
const key = "j3STJyEEXF6YmTCKZMdM" // 密钥
interface dst {
  dst: string
}
type data = {
  error_code?: string
  trans_result: dst[]
}
interface res {
  status: number
  data: data
}
const nameType = ref("lowerCamelCase")
const translate = async () => {
  filter.value = true
  setTimeout(() => {
    filter.value = false
  }, 500)
  if (!q.value) return ElMessage.error("请输入中文文本")
  //请求参数
  const data = {
    q: q.value,
    appid,
    salt,
    from: "zh",
    to: "en",
    sign: MD5(appid + q.value + salt + key)
  }
  // 请求结果
  const res: res = await axios({
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "post",
    // 开发环境使用,需要跨域，配置vue.config.js中proxy
    // url: "/api/trans/vip/translate", // 拼接的url
    // 生产环境使用，且需要注释vue.config.js中proxy
    url: "https://fanyi-api.baidu.com/api/trans/vip/translate", // 完整url
    data: Qs.stringify(data)
  })
  console.log(res)
  if (res.status == 200) {
    // 请求过于频繁
    if (res.data.error_code == "54003") return ElMessage.error("请求百度翻译接口过于频繁，请控制在1s左右")
    // 根据空格分割翻译结果为数组
    const result = res.data.trans_result[0].dst.split(" ")
    let name = ""
    // 小驼峰命名法
    if (nameType.value == "lowerCamelCase") {
      name = result
        .map((v: string, i: number) => {
          return i != 0 ? v.charAt(0).toLocaleUpperCase() + v.slice(1) : v.toLocaleLowerCase()
        })
        .join("")
    }
    // 串式命名法
    if (nameType.value == "kebab-case") name = result.map((v: string) => v.toLocaleLowerCase()).join("-")
    // 处理逗号,撇号 如i'm
    name = name.split(",").join("").split("'").join("")
    r.value = name
    // 自动复制
    const input = document.createElement("input")
    document.body.appendChild(input)
    input.setAttribute("id", "saveStr")
    ;(document.getElementById("saveStr") as HTMLInputElement)!.value = r.value
    input.value = r.value
    input.select()
    document.execCommand("Copy")
    document.body.removeChild(input)
    ipt.value!.focus() // 自动聚焦
  } else {
    ElMessage.error("请求百度翻译接口出错,请稍后再试")
  }
}
</script>
<style lang="scss">
.home {
  overflow: hidden;
}
.win-header {
  display: flex;
  flex-direction: row-reverse;
  padding: 5px 10px;
  border-bottom: 1px solid $font-color;
  img {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
}
.fath {
  pointer-events: auto;
}
.el-card {
  text-align: center;
  position: absolute;
  .el-card__body {
    padding: 0;
  }
  .content {
    padding: 20px;
  }
  padding: 0px;
  /* top: 50%;
  left: 50%;
  transform: translateX(-50%) translateY(-50%); */
  z-index: 2;
  .header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    .el-select {
      margin-right: 10px;
    }
    .el-button {
      margin-top: 0;
    }
  }

  .el-input {
    min-width: 260px;
    .el-input__inner {
      text-align: center !important;
    }
  }

  .el-button {
    margin-top: 10px;
  }
  .result {
    max-width: 320px;
    margin-top: 10px;
    min-height: 20px;
    word-break: break-all;
    span {
      color: $font-color;
      font-weight: bold;
    }
  }
}
.show-enter-active,
.show-leave-active {
  transition: all 1.5s ease;
}
.show-enter-from,
.show-leave-to {
  /* transform: translateX(-50%) translateY(-60%); */
  opacity: 0;
}
.filter-leave-active {
  transition: opacity 0.5s ease-in;
}
.filter-leave-to {
  opacity: 0;
}
.filter:after {
  content: "";
  width: 100%;
  height: 100vh;
  position: absolute;
  left: 0;
  top: 0;
  filter: blur(10px);
  z-index: 1;
}

.drag-dom {
  /* 让元素可拖动，设置了drag的元素不可点击 */
  -webkit-app-region: drag;
}

.no-drag-dom {
  /* 设置了drag的元素,所有子元素将不可点击，故设置no-drag，让元素可点击 */
  -webkit-app-region: no-drag;
}
</style>
