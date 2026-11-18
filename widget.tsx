import {
  HStack,
  Image,
  Rectangle,
  RoundedRectangle,
  Spacer,
  Text,
  VStack,
  Widget,
  ZStack,
} from "scripting"

/* ------------------------------------------------------------------
 * 中国天气网 · Scripting 小组件
 *
 * 使用方法：
 * 1. 在 Scripting 中新建脚本项目「中国天气小组件」；
 * 2. 把本目录的 script.json、index.tsx、widget.tsx 放进项目；
 * 3. 运行 index.tsx 预览，或到桌面添加 Scripting 小组件。
 *
 * 城市可以改下面的 DEFAULT_CITY，也可以在小工具“编辑小组件”的
 * 参数里填：海口   或   {"city":"海口","name":"小明"}
 *
 * 数据只来自中国天气网（weather.com.cn），不读取定位、不上传设备信息。
 * ------------------------------------------------------------------ */

const DEFAULT_CITY = "海口"
const REFRESH_MINUTES = 30

type DynamicColor = { light: string; dark: string }

const C = {
  bg: { light: "#F1F5FA", dark: "#0B1016" } as DynamicColor,
  card: { light: "rgba(255,255,255,0.78)", dark: "rgba(255,255,255,0.07)" } as DynamicColor,
  chip: { light: "rgba(15,23,42,0.05)", dark: "rgba(255,255,255,0.08)" } as DynamicColor,
  text: { light: "#0F172A", dark: "#F8FAFC" } as DynamicColor,
  sub: { light: "#64748B", dark: "#94A3B8" } as DynamicColor,
  line: { light: "rgba(15,23,42,0.08)", dark: "rgba(255,255,255,0.10)" } as DynamicColor,
  blue: "#3B82F6",
  cyan: "#06B6D4",
  amber: "#F59E0B",
  violet: "#8B5CF6",
  red: "#EF4444",
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

/* 常用城市，命中后可直接跳过搜索请求；其余城市自动走天气网搜索接口。 */
const CITY_PRESETS: Record<string, string> = {
  "北京": "101010100", "上海": "101020100", "天津": "101030100", "重庆": "101040100",
  "哈尔滨": "101050101", "长春": "101060101", "沈阳": "101070101", "大连": "101070201",
  "呼和浩特": "101080101", "石家庄": "101090101", "太原": "101100101", "西安": "101110101",
  "济南": "101120101", "青岛": "101120201", "烟台": "101120501", "威海": "101121301",
  "乌鲁木齐": "101130101", "拉萨": "101140101", "西宁": "101150101", "兰州": "101160101",
  "银川": "101170101", "郑州": "101180101", "南京": "101190101", "苏州": "101190401",
  "无锡": "101190201", "常州": "101191101", "南通": "101190501", "武汉": "101200101",
  "杭州": "101210101", "宁波": "101210401", "温州": "101210701", "嘉兴": "101210301",
  "绍兴": "101210507", "金华": "101210901", "台州": "101210601", "合肥": "101220101",
  "福州": "101230101", "厦门": "101230201", "泉州": "101230501", "南昌": "101240101",
  "长沙": "101250101", "贵阳": "101260101", "成都": "101270101", "广州": "101280101",
  "深圳": "101280601", "珠海": "101280701", "佛山": "101280800", "东莞": "101281601",
  "中山": "101281701", "惠州": "101280301", "汕头": "101280501", "湛江": "101281001",
  "昆明": "101290101", "南宁": "101300101", "海口": "101310101", "三亚": "101310201",
  "儋州": "101310205", "琼海": "101310211", "文昌": "101310212", "万宁": "101310215",
  "陵水": "101310216", "澄迈": "101310204", "临高": "101310203", "东方": "101310202",
  "五指山": "101310222", "保亭": "101310214", "乐东": "101310221", "昌江": "101310206",
  "白沙": "101310207", "琼中": "101310208", "定安": "101310209", "屯昌": "101310210",
  "三沙": "101310301", "香港": "101320101", "澳门": "101330101", "台北": "101340101",
  "雄安新区": "101091201", "浦东新区": "101020600", "滨海新区": "101031100",
  "海淀": "101010200", "宝安": "101280605", "龙岗": "101280606",
}

type DayInfo = {
  date: string
  week: string
  tempMax: string
  tempMin: string
  codeDay: string
  codeNight: string
  textDay: string
  textNight: string
  windDay: string
  windNight: string
}

type LifeInfo = {
  label: string
  hint: string
  des: string
}

type WeatherModel = {
  city: string
  date: string
  time: string
  temp: string
  weather: string
  windDir: string
  windScale: string
  humidity: string
  pressure: string
  rain: string
  aqi: string
  vis: string
  todayMax: string
  todayMin: string
  daily: DayInfo[]
  life: LifeInfo[]
}

const HTTP_HEADERS = {
  "Referer": "https://www.weather.com.cn/",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Mobile/15E148 Safari/604.1",
}

/* ------------------------------------------------------------------
 * 配置
 * ------------------------------------------------------------------ */

function readConfig(): { city: string; name: string } {
  const raw = String(Widget.parameter || "").trim()
  let city = DEFAULT_CITY
  let name = ""

  if (raw) {
    if (raw.startsWith("{")) {
      try {
        const obj = JSON.parse(raw)
        city = String(obj.city || obj.CITY || DEFAULT_CITY).trim() || DEFAULT_CITY
        name = String(obj.name || obj.userName || "").trim()
      } catch (_) {
        city = raw
      }
    } else {
      city = raw
    }
  }

  return { city, name }
}

/* ------------------------------------------------------------------
 * 网络
 * ------------------------------------------------------------------ */

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("请求超时")), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

async function getText(url: string): Promise<string> {
  const response = await withTimeout(
    fetch(url, {
      headers: HTTP_HEADERS,
      credentials: "omit",
    }),
    10000,
  )
  if (response.status !== 200) {
    throw new Error(`天气接口 HTTP ${response.status}`)
  }
  return await response.text()
}

async function resolveCity(rawName: string): Promise<{ code: string; city: string }> {
  const name = rawName.trim()
  if (/^\d{9}$/.test(name)) {
    return { code: name, city: name }
  }

  const direct = CITY_PRESETS[name]
  if (direct) {
    return { code: direct, city: name }
  }

  const stripped = name.replace(/(市|县|区)$/, "")
  if (stripped !== name && CITY_PRESETS[stripped]) {
    return { code: CITY_PRESETS[stripped], city: stripped }
  }

  const url = `https://toy1.weather.com.cn/search?cityname=${encodeURIComponent(name)}`
  const text = await getText(url)
  const refs = [...text.matchAll(/"ref":"([^"]+)"/g)].map((item) => item[1])

  for (const ref of refs) {
    const parts = ref.split("~")
    const code = parts[0] || ""
    const foundName = parts[2] || ""
    if (/^\d{9}$/.test(code) && (foundName === name || foundName === stripped)) {
      return { code, city: foundName || name }
    }
  }

  for (const ref of refs) {
    const parts = ref.split("~")
    if (/^\d{9}$/.test(parts[0] || "")) {
      return { code: parts[0], city: parts[2] || name }
    }
  }

  throw new Error(`未找到城市「${name}」，请检查城市名`)
}

function pickObject(text: string, name: string): any | null {
  const index = text.indexOf(`var ${name}`)
  if (index < 0) return null

  const start = text.indexOf("{", index)
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === "\\") {
        escaped = true
        continue
      }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === "{") depth++
    if (ch === "}") {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1))
        } catch (_) {
          return null
        }
      }
    }
  }

  return null
}

async function fetchWeather(code: string): Promise<{
  cityDZ: any
  dataSK: any
  dataZS: any
  fc: any
}> {
  const text = await getText(`https://d1.weather.com.cn/weather_index/${code}.html`)
  const cityDZ = pickObject(text, "cityDZ")
  const dataSK = pickObject(text, "dataSK")
  const dataZS = pickObject(text, "dataZS")
  const fc = pickObject(text, "fc")

  if (!dataSK || !cityDZ) {
    throw new Error("实况接口没有返回有效数据")
  }
  return { cityDZ, dataSK, dataZS, fc }
}

async function fetch7Day(code: string): Promise<DayInfo[] | null> {
  try {
    const html = await getText(`https://www.weather.com.cn/weather/${code}.shtml`)
    const ulIndex = html.indexOf('id="7d"')
    if (ulIndex < 0) return null

    const ulStart = html.indexOf('<ul class="t', ulIndex)
    const ulEnd = html.indexOf("</ul>", ulStart)
    if (ulStart < 0 || ulEnd < 0) return null

    const ul = html.slice(ulStart, ulEnd)
    const items = [...ul.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
    const days: DayInfo[] = []

    for (const item of items) {
      const li = item[1]
      const h1 = (li.match(/<h1>([^<]+)<\/h1>/) || ["", ""])[1]
      const weather = (li.match(/<p[^>]*class="wea"[^>]*>([^<]+)<\/p>/) || ["", ""])[1]
      let temp = li.match(/<p[^>]*class="tem"[^>]*>\s*<span>([^<]+)<\/span>\/<i>([^<]+)<\/i>/)
      if (!temp) {
        const lowOnly = li.match(/<p[^>]*class="tem"[^>]*>\s*<i>([^<]+)<\/i>/)
        if (lowOnly) temp = ["", "", lowOnly[1]] as any
      }

      const dayCode = (li.match(/png40 d([0-9]+)/) || ["", ""])[1]
      const nightCode = (li.match(/png40 n([0-9]+)/) || ["", ""])[1]
      const wind = (li.match(/<p[^>]*class="win"[^>]*>[\s\S]*?<i>([^<]+)<\/i>/) || ["", ""])[1]
      if (!h1) continue

      const datePart = h1.split("（")[0] || ""
      const weekPart = (h1.match(/\uff08([^\uff09]+)\uff09/) || ["", ""])[1]

      days.push({
        date: datePart,
        week: weekPart || "",
        tempMax: temp ? (temp[1] || "").trim().replace("℃", "") : "",
        tempMin: temp ? (temp[2] || "").trim().replace("℃", "") : "",
        codeDay: dayCode || "",
        codeNight: nightCode || "",
        textDay: (weather || "").trim(),
        textNight: "",
        windDay: (wind || "").trim(),
        windNight: "",
      })
    }

    return days.length >= 5 ? days : null
  } catch (_) {
    return null
  }
}

/* ------------------------------------------------------------------
 * 数据整理
 * ------------------------------------------------------------------ */

function codeToText(code: string): string {
  const map: Record<string, string> = {
    "00": "晴", "01": "多云", "02": "阴", "03": "阵雨", "04": "雷阵雨",
    "05": "雷阵雨伴冰雹", "06": "雨夹雪", "07": "小雨", "08": "中雨",
    "09": "大雨", "10": "暴雨", "11": "大暴雨", "12": "特大暴雨",
    "13": "阵雪", "14": "小雪", "15": "中雪", "16": "大雪", "17": "暴雪",
    "18": "雾", "19": "冻雨", "20": "沙尘暴", "21": "小雨到中雨",
    "22": "中雨到大雨", "23": "大雨到暴雨", "24": "暴雨到大暴雨",
    "25": "大暴雨到特大暴雨", "26": "小雪到中雪", "27": "中雪到大雪",
    "28": "大雪到暴雪", "29": "浮尘", "30": "扬沙", "31": "强沙尘暴", "32": "霾",
  }
  return map[String(code)] || ""
}

function buildModel(data: any, fallbackCity: string, seven: DayInfo[] | null): WeatherModel {
  const sk = data.dataSK || {}
  const dz = (data.cityDZ && data.cityDZ.weatherinfo) || {}
  const fcList = (data.fc && data.fc.f) || []

  let daily: DayInfo[]

  if (seven && seven.length >= 5) {
    daily = seven.slice(0, 7).map((day) => ({ ...day }))
    if (daily[0] && !daily[0].tempMax && fcList[0]) {
      daily[0].tempMax = fcList[0].fc || ""
      daily[0].tempMin = daily[0].tempMin || fcList[0].fd || ""
      if (!daily[0].codeDay && fcList[0].fa) daily[0].codeDay = String(fcList[0].fa)
    }
  } else {
    daily = fcList.slice(0, 5).map((day: any) => ({
      date: day.fi || "",
      week: day.fj || "",
      tempMax: day.fc || "",
      tempMin: day.fd || "",
      codeDay: String(day.fa || ""),
      codeNight: String(day.fb || ""),
      textDay: codeToText(String(day.fa || "")),
      textNight: codeToText(String(day.fb || "")),
      windDay: `${day.fe || ""} ${day.fg || ""}`.trim(),
      windNight: `${day.ff || ""} ${day.fh || ""}`.trim(),
    }))
  }

  const zs = (data.dataZS && data.dataZS.zs) || {}
  const lifeSpecs: Array<[string, string]> = [
    ["ct", "穿衣"],
    ["ys", "雨伞"],
    ["uv", "紫外线"],
    ["yd", "运动"],
    ["xc", "洗车"],
    ["gm", "感冒"],
  ]
  const life: LifeInfo[] = []
  for (const [key, label] of lifeSpecs) {
    const hint = zs[`${key}_hint`]
    if (hint) {
      life.push({
        label,
        hint: String(hint),
        des: String(zs[`${key}_des_s`] || ""),
      })
    }
    if (life.length >= 4) break
  }

  return {
    city: sk.cityname || dz.city || fallbackCity,
    date: sk.date || "",
    time: sk.time || "",
    temp: sk.temp || "",
    weather: sk.weather || dz.weather || "",
    windDir: sk.WD || dz.wd || "",
    windScale: sk.WS || dz.ws || "",
    humidity: sk.SD || "",
    pressure: sk.qy || "",
    rain: sk.rain || "",
    aqi: sk.aqi || "",
    vis: sk.njd || "",
    todayMax: dz.temp || (daily[0] ? daily[0].tempMax : ""),
    todayMin: dz.tempn || (daily[0] ? daily[0].tempMin : ""),
    daily,
    life,
  }
}

/* ------------------------------------------------------------------
 * 图标与文字
 * ------------------------------------------------------------------ */

function iconForText(text: string): { symbol: string; color: string } {
  const value = String(text || "")
  if (value.includes("雷")) return { symbol: "cloud.bolt.rain.fill", color: C.violet }
  if (value.includes("雪")) return { symbol: "cloud.snow.fill", color: "#7DD3FC" }
  if (value.includes("雨")) return { symbol: "cloud.rain.fill", color: C.blue }
  if (value.includes("雾") || value.includes("霾") || value.includes("沙") || value.includes("尘")) {
    return { symbol: "cloud.fog.fill", color: "#94A3B8" }
  }
  if (value.includes("阴")) return { symbol: "cloud.fill", color: "#94A3B8" }
  if (value.includes("多云")) return { symbol: "cloud.sun.fill", color: C.amber }
  if (value.includes("晴")) return { symbol: "sun.max.fill", color: C.amber }
  return { symbol: "cloud.fill", color: "#94A3B8" }
}

function iconForCode(code: string): { symbol: string; color: string } {
  const value = String(code || "")
  if (value === "00") return { symbol: "sun.max.fill", color: C.amber }
  if (value === "01") return { symbol: "cloud.sun.fill", color: C.amber }
  if (value === "02") return { symbol: "cloud.fill", color: "#94A3B8" }
  if (value === "04" || value === "05") return { symbol: "cloud.bolt.rain.fill", color: C.violet }
  if (["06", "13", "14", "15", "16", "17", "26", "27", "28"].includes(value)) {
    return { symbol: "cloud.snow.fill", color: "#7DD3FC" }
  }
  if (["03", "07", "08", "21"].includes(value)) return { symbol: "cloud.rain.fill", color: C.blue }
  if (["09", "10", "11", "12", "22", "23", "24", "25"].includes(value)) {
    return { symbol: "cloud.heavyrain.fill", color: "#2563EB" }
  }
  if (["18", "19", "20", "29", "30", "31", "32"].includes(value)) {
    return { symbol: "cloud.fog.fill", color: "#94A3B8" }
  }
  return { symbol: "cloud.fill", color: "#94A3B8" }
}

function roundTemp(value: string | number): string {
  const number = parseFloat(String(value))
  return Number.isFinite(number) ? String(Math.round(number)) : "--"
}

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 9) return "早晨好"
  if (hour >= 9 && hour < 12) return "上午好"
  if (hour >= 12 && hour < 14) return "中午好"
  if (hour >= 14 && hour < 18) return "下午好"
  if (hour >= 18 && hour < 23) return "晚上好"
  return "夜深了"
}

function windText(model: WeatherModel): string {
  const text = `${model.windDir || ""} ${model.windScale || ""}`.trim()
  return text || "微风"
}

/* ------------------------------------------------------------------
 * 小尺寸
 * ------------------------------------------------------------------ */

function MiniDayRow({ day }: { day: DayInfo }) {
  const icon = iconForCode(day.codeDay)
  return (
    <HStack spacing={5}>
      <Text font={10} foregroundStyle={C.sub} lineLimit={1} frame={{ width: 30 }}>
        {day.week || day.date}
      </Text>
      <Image
        systemName={icon.symbol}
        resizable
        scaleToFit
        frame={{ width: 14, height: 14 }}
        foregroundStyle={icon.color}
      />
      <Text font={10} foregroundStyle={C.text} lineLimit={1}>
        {day.textDay || "—"}
      </Text>
      <Spacer />
      <Text font={10} foregroundStyle={C.sub}>
        {day.tempMin ? `${day.tempMin}°` : ""}
      </Text>
      <Text font={10} fontWeight="semibold" foregroundStyle={C.text}>
        {day.tempMax ? `${day.tempMax}°` : ""}
      </Text>
    </HStack>
  )
}

function SmallWidget({ model }: { model: WeatherModel }) {
  const icon = iconForText(model.weather)
  const today = model.daily[0]
  const nextDays = model.daily.slice(1, 3)

  return (
    <VStack alignment="leading" spacing={0} padding={13}>
      <HStack spacing={6}>
        <Text font={15} fontWeight="semibold" foregroundStyle={C.text} lineLimit={1}>
          {model.city}
        </Text>
        <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
          {model.aqi ? `AQI ${model.aqi}` : ""}
        </Text>
        <Spacer />
        <Image
          systemName={icon.symbol}
          resizable
          scaleToFit
          frame={{ width: 22, height: 22 }}
          foregroundStyle={icon.color}
        />
      </HStack>

      <HStack alignment="bottom" spacing={4}>
        <Text font={40} fontWeight="bold" foregroundStyle={C.text} lineLimit={1}>
          {roundTemp(model.temp)}°
        </Text>
        <Spacer />
        <VStack alignment="trailing" spacing={0}>
          <Text font={10} foregroundStyle={C.sub} lineLimit={1}>
            {today && today.tempMax ? `最高 ${today.tempMax}°` : ""}
          </Text>
          <Text font={10} foregroundStyle={C.sub} lineLimit={1}>
            {today && today.tempMin ? `最低 ${today.tempMin}°` : ""}
          </Text>
        </VStack>
      </HStack>

      <Text font={11} foregroundStyle={C.sub} lineLimit={1}>
        {model.weather || "—"}
      </Text>

      <Spacer />
      <Rectangle fill={C.line} frame={{ height: 1 }} />
      <VStack spacing={2} padding={{ vertical: 3 }}>
        {nextDays.map((day) => (
          <MiniDayRow key={`${day.date}-${day.week}`} day={day} />
        ))}
      </VStack>
    </VStack>
  )
}

/* ------------------------------------------------------------------
 * 中尺寸
 * ------------------------------------------------------------------ */

function DayCell({ day, width }: { day: DayInfo; width: number }) {
  const icon = iconForCode(day.codeDay)
  return (
    <VStack alignment="center" spacing={2} frame={{ width }}>
      <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
        {day.week || day.date}
      </Text>
      <Image
        systemName={icon.symbol}
        resizable
        scaleToFit
        frame={{ width: 16, height: 16 }}
        foregroundStyle={icon.color}
      />
      <Text font={11} fontWeight="semibold" foregroundStyle={C.text} lineLimit={1}>
        {day.tempMax ? `${day.tempMax}°` : "—"}
      </Text>
    </VStack>
  )
}

function MediumWidget({ model }: { model: WeatherModel }) {
  const icon = iconForText(model.weather)
  const today = model.daily[0]
  const slots = [0, 1, 2, 3, 4, 5, 6]
  const widgetWidth = Widget.displaySize && Widget.displaySize.width ? Widget.displaySize.width : 338
  const cellWidth = Math.max(32, Math.min(42, Math.floor((widgetWidth - 24 - 18) / 7)))

  return (
    <VStack alignment="leading" spacing={6} padding={12}>
      <HStack alignment="center" spacing={8}>
        <VStack alignment="leading" spacing={1}>
          <HStack spacing={5}>
            <Text font={16} fontWeight="bold" foregroundStyle={C.text} lineLimit={1}>
              {model.city}
            </Text>
            <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
              {model.aqi ? `AQI ${model.aqi}` : ""}
            </Text>
          </HStack>
          <Text font={10} foregroundStyle={C.sub} lineLimit={1}>
            {model.weather || "—"} · {windText(model)}
          </Text>
          <HStack alignment="bottom" spacing={5}>
            <Text font={30} fontWeight="bold" foregroundStyle={C.text} lineLimit={1}>
              {roundTemp(model.temp)}°
            </Text>
            <Text font={10} foregroundStyle={C.sub} lineLimit={1}>
              {today ? `H ${today.tempMax || "--"}°  L ${today.tempMin || "--"}°` : ""}
            </Text>
          </HStack>
        </VStack>
        <Spacer />
        <Image
          systemName={icon.symbol}
          resizable
          scaleToFit
          frame={{ width: 38, height: 38 }}
          foregroundStyle={icon.color}
        />
      </HStack>

      <Rectangle fill={C.line} frame={{ height: 1 }} />

      <HStack spacing={3}>
        {slots.map((index) =>
          model.daily[index] ? (
            <DayCell
              key={`${index}-${model.daily[index].date}`}
              day={model.daily[index]}
              width={cellWidth}
            />
          ) : (
            <VStack key={`empty-${index}`} frame={{ width: cellWidth }} />
          ),
        )}
      </HStack>

      <HStack spacing={8}>
        <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
          湿度 {model.humidity || "—"}
        </Text>
        <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
          降水 {model.rain || "0"}mm
        </Text>
        <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
          能见度 {model.vis || "—"}
        </Text>
        <Spacer />
        <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
          {model.time ? `${model.time} 更新` : ""}
        </Text>
      </HStack>
    </VStack>
  )
}

/* ------------------------------------------------------------------
 * 大尺寸
 * ------------------------------------------------------------------ */

function LargeDayRow({ day }: { day: DayInfo }) {
  const icon = iconForCode(day.codeDay)
  return (
    <HStack spacing={6} padding={{ vertical: 4 }}>
      <Text font={11} foregroundStyle={C.sub} lineLimit={1} frame={{ width: 32 }}>
        {day.week || day.date}
      </Text>
      <Image
        systemName={icon.symbol}
        resizable
        scaleToFit
        frame={{ width: 15, height: 15 }}
        foregroundStyle={icon.color}
      />
      <Text font={11} foregroundStyle={C.text} lineLimit={1} frame={{ width: 62 }}>
        {day.textDay || "—"}
      </Text>
      <Spacer />
      <Text font={11} foregroundStyle={C.sub} lineLimit={1}>
        {day.tempMin ? `${day.tempMin}°` : "--"}
      </Text>
      <Text font={10} foregroundStyle={C.sub}>
        /
      </Text>
      <Text font={11} fontWeight="semibold" foregroundStyle={C.text} lineLimit={1}>
        {day.tempMax ? `${day.tempMax}°` : "--"}
      </Text>
    </HStack>
  )
}

function LifeChip({ item, width }: { item: LifeInfo; width: number }) {
  return (
    <VStack
      alignment="leading"
      spacing={1}
      padding={8}
      frame={{ width }}
      background={<RoundedRectangle cornerRadius={10} fill={C.chip} />}
    >
      <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
        {item.label}
      </Text>
      <Text font={12} fontWeight="semibold" foregroundStyle={C.text} lineLimit={1}>
        {item.hint}
      </Text>
    </VStack>
  )
}

function LargeWidget({ model, name }: { model: WeatherModel; name: string }) {
  const icon = iconForText(model.weather)
  const today = model.daily[0]
  const now = new Date()
  const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日 · ${WEEKDAYS[now.getDay()]}`
  const greet = greetingFor(now.getHours())
  const widgetWidth = Widget.displaySize && Widget.displaySize.width ? Widget.displaySize.width : 338
  const lifeCount = Math.min(4, model.life.length)
  const lifeWidth = lifeCount
    ? Math.max(56, Math.min(72, Math.floor((widgetWidth - 28 - 6 * (lifeCount - 1)) / lifeCount)))
    : 70
  const tipItem = model.life.find((item) => item.label === "雨伞") || model.life[0]
  const tip = tipItem ? tipItem.des : ""

  return (
    <VStack alignment="leading" spacing={6} padding={14}>
      <HStack alignment="center">
        <VStack alignment="leading" spacing={1}>
          <Text font={17} fontWeight="bold" foregroundStyle={C.text} lineLimit={1}>
            {dateLabel}
          </Text>
          <Text font={10} foregroundStyle={C.sub} lineLimit={1}>
            {name ? `${name}，${greet}` : greet}
          </Text>
        </VStack>
        <Spacer />
        <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
          {model.time ? `${model.time} 更新` : ""}
        </Text>
      </HStack>

      <HStack
        alignment="center"
        spacing={10}
        padding={10}
        background={<RoundedRectangle cornerRadius={14} fill={C.card} />}
      >
        <Image
          systemName={icon.symbol}
          resizable
          scaleToFit
          frame={{ width: 38, height: 38 }}
          foregroundStyle={icon.color}
        />
        <VStack alignment="leading" spacing={1}>
          <HStack alignment="bottom" spacing={5}>
            <Text font={31} fontWeight="bold" foregroundStyle={C.text} lineLimit={1}>
              {roundTemp(model.temp)}°
            </Text>
            <Text font={12} foregroundStyle={C.sub} lineLimit={1}>
              {model.weather || "—"}
            </Text>
          </HStack>
          <Text font={10} foregroundStyle={C.sub} lineLimit={1}>
            {today
              ? `最高 ${today.tempMax || "--"}° · 最低 ${today.tempMin || "--"}°`
              : ""}
          </Text>
        </VStack>
        <Spacer />
        <VStack alignment="trailing" spacing={2}>
          <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
            湿度 {model.humidity || "—"}
          </Text>
          <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
            AQI {model.aqi || "—"}
          </Text>
          <Text font={9} foregroundStyle={C.sub} lineLimit={1}>
            {windText(model)}
          </Text>
        </VStack>
      </HStack>

      <VStack spacing={0}>
        {model.daily.slice(0, 7).map((day) => (
          <LargeDayRow key={`${day.date}-${day.week}`} day={day} />
        ))}
      </VStack>

      <Spacer />
      <Rectangle fill={C.line} frame={{ height: 1 }} />

      {tip ? (
        <Text font={9} foregroundStyle={C.sub} lineLimit={2}>
          今日建议 · {tip}
        </Text>
      ) : null}

      {model.life.length > 0 ? (
        <HStack spacing={6}>
          {model.life.slice(0, 4).map((item) => (
            <LifeChip key={item.label} item={item} width={lifeWidth} />
          ))}
          <Spacer />
        </HStack>
      ) : null}
    </VStack>
  )
}

/* ------------------------------------------------------------------
 * 锁屏组件
 * ------------------------------------------------------------------ */

function AccessoryCircular({ model }: { model: WeatherModel }) {
  const icon = iconForText(model.weather)
  return (
    <VStack spacing={0}>
      <Image
        systemName={icon.symbol}
        resizable
        scaleToFit
        frame={{ width: 16, height: 16 }}
        foregroundStyle={icon.color}
      />
      <Text font={16} fontWeight="bold" lineLimit={1}>
        {roundTemp(model.temp)}°
      </Text>
      <Text font={9} lineLimit={1}>
        {model.city}
      </Text>
    </VStack>
  )
}

function AccessoryRectangular({ model }: { model: WeatherModel }) {
  const icon = iconForText(model.weather)
  const today = model.daily[0]
  return (
    <HStack spacing={8}>
      <Image
        systemName={icon.symbol}
        resizable
        scaleToFit
        frame={{ width: 26, height: 26 }}
        foregroundStyle={icon.color}
      />
      <VStack alignment="leading" spacing={0}>
        <Text font={13} fontWeight="bold" lineLimit={1}>
          {model.city}
        </Text>
        <Text font={12} lineLimit={1}>
          {roundTemp(model.temp)}° {model.weather}
        </Text>
        <Text font={10} lineLimit={1}>
          {today ? `${today.tempMin || "--"}° ~ ${today.tempMax || "--"}°` : ""}
        </Text>
      </VStack>
      <Spacer />
    </HStack>
  )
}

function AccessoryInline({ model }: { model: WeatherModel }) {
  return (
    <Text font={13} lineLimit={1}>
      {model.city} {roundTemp(model.temp)}° {model.weather}
    </Text>
  )
}

/* ------------------------------------------------------------------
 * 外壳与错误页
 * ------------------------------------------------------------------ */

function WidgetShell({ children }: { children?: any }) {
  return (
    <ZStack alignment="topLeading" widgetBackground={C.bg}>
      {children}
    </ZStack>
  )
}

function ErrorWidget({ message }: { message: string }) {
  return (
    <VStack alignment="leading" spacing={6} padding={14} widgetBackground={C.bg}>
      <Text font={14} fontWeight="semibold" foregroundStyle={C.red} lineLimit={1}>
        天气加载失败
      </Text>
      <Text font={10} foregroundStyle={C.sub} lineLimit={3}>
        {message}
      </Text>
      <Spacer />
      <Text font={9} foregroundStyle={C.sub} lineLimit={2}>
        长按小组件 → 编辑小组件 → 检查城市参数
      </Text>
    </VStack>
  )
}

/* ------------------------------------------------------------------
 * 入口
 * ------------------------------------------------------------------ */

async function main() {
  const config = readConfig()

  try {
    const city = await resolveCity(config.city)
    const current = await fetchWeather(city.code)
    const seven = await fetch7Day(city.code)
    const model = buildModel(current, city.city, seven)
    const family = String(Widget.family)

    let view: any
    if (family === "systemSmall") {
      view = <SmallWidget model={model} />
    } else if (
      family === "systemLarge" ||
      family === "systemExtraLarge" ||
      family === "systemExtraLargePortrait"
    ) {
      view = <LargeWidget model={model} name={config.name} />
    } else if (family === "accessoryCircular") {
      view = <AccessoryCircular model={model} />
    } else if (family === "accessoryRectangular") {
      view = <AccessoryRectangular model={model} />
    } else if (family === "accessoryInline") {
      view = <AccessoryInline model={model} />
    } else {
      view = <MediumWidget model={model} />
    }

    if (family.startsWith("accessory")) {
      Widget.present(view, {
        policy: "after",
        date: new Date(Date.now() + REFRESH_MINUTES * 60 * 1000),
      })
    } else {
      Widget.present(<WidgetShell>{view}</WidgetShell>, {
        policy: "after",
        date: new Date(Date.now() + REFRESH_MINUTES * 60 * 1000),
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    Widget.present(<ErrorWidget message={message} />, {
      policy: "after",
      date: new Date(Date.now() + 10 * 60 * 1000),
    })
  }
}

void main()
