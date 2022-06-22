import { app, BrowserWindow, shell, Menu, Tray, ipcMain, nativeImage, screen } from "electron"
import { release } from "os"
import { join } from "path"
// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true"

// 去除默认菜单
Menu.setApplicationMenu(null)

// 初始化
let tray = null

/** 创建窗口 */
async function createWindow() {
  let win: BrowserWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    title: "Main window",
    transparent: true,
    backgroundColor: "#00000000",
    icon: join(__dirname, "../renderer/public/logo.ico"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.cjs"),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  })

  // 获取页面宽度
  // screen.getPrimaryDisplay().workAreaSize.height

  // 设置初始位置
  win.setPosition(screen.getPrimaryDisplay().workAreaSize.width - 372, 0)

  win.setIgnoreMouseEvents(true, { forward: true })

  // 控制窗口是否位于最上层
  let setAlwaysOnTop = false
  //  shell.showItemInFolder("D:\\projects\\my-projects\\electron\\vite")
  //  shell.beep()

  // 鼠标点击不穿透
  ipcMain.on("setIgnoreMouseEventsFalse", (event, boolean) => {
    win.setIgnoreMouseEvents(false)
  })
  // 鼠标点击穿透,forward: true表示虽然穿透但是响应鼠标移动事件
  ipcMain.on("setIgnoreMouseEventsTrue", (event, boolean) => {
    win.setIgnoreMouseEvents(true, { forward: true })
  })
  // 监听鼠标点击图标
  ipcMain.on("listen-click-icons", (event, iconName) => {
    console.log(iconName)
    win[iconName]()
  })
  // 监听固定图标点击事件
  ipcMain.on("fixed-app", () => {
    setAlwaysOnTop = !setAlwaysOnTop
    win.setAlwaysOnTop(setAlwaysOnTop)
  })
  // 打包（生产）环境
  if (app.isPackaged) {
    win.loadFile(join(__dirname, "../renderer/index.html"))
  }
  // 开发环境
  else {
    // 🚧 Use ['ENV_NAME'] avoid vite:define plugin
    const url = `http://${process.env["VITE_DEV_SERVER_HOST"]}:${process.env["VITE_DEV_SERVER_PORT"]}`
    win.loadURL(url)
  }
  // 窗口不可以调整大小
  win.resizable = false
  win.webContents.on("did-finish-load", () => {
    // 打开开发者工具
    // win.webContents.openDevTools()
  })
  // 窗口不占据任务栏位置
  win.setSkipTaskbar(true)
  // 当点击关闭按钮
  win.on("close", e => {
    // e.preventDefault() // 阻止退出程序
    // win.hide() // 隐藏主程序窗口
  })
  // 创建任务栏图标
  const image = nativeImage.createFromPath(join(__dirname, "../renderer/logo.ico"))
  tray = new Tray(image)
  // 设置鼠标指针在托盘图标上悬停时显示的文本
  tray.setToolTip("变量生成工具")
  // 右击托盘图标后，显示的菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      // 点击退出选项,退出程序
      label: "退出",
      click: () => {
        win.destroy()
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu) // 设置图标的内容菜单
  // 点击托盘图标，显示主窗口
  tray.on("click", () => {
    win.show()
  })
  // Test active push message to Renderer-process
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString())
  })
  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url)
    return { action: "deny" }
  })
}
app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})
