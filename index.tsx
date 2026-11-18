import {
  Button,
  List,
  Navigation,
  NavigationStack,
  Script,
  Text,
  Widget,
} from "scripting"

function Page() {
  const dismiss = Navigation.useDismiss()

  return (
    <NavigationStack>
      <List
        navigationTitle="中国天气小组件"
        navigationBarTitleDisplayMode="inline"
        toolbar={{
          cancellationAction: (
            <Button title="关闭" action={() => dismiss()} />
          ),
        }}
      >
        <Text font="headline">已经可以使用了</Text>
        <Text font="footnote" foregroundStyle="secondaryLabel">
          数据来自中国天气网（weather.com.cn），不需要 API Key。下面可以先预览三种桌面尺寸。
        </Text>

        <Button
          title="预览小号组件"
          action={() => void Widget.preview({ family: "systemSmall" })}
        />
        <Button
          title="预览中号组件"
          action={() => void Widget.preview({ family: "systemMedium" })}
        />
        <Button
          title="预览大号组件"
          action={() => void Widget.preview({ family: "systemLarge" })}
        />
        <Button
          title="刷新桌面组件"
          action={() => Widget.reloadAll()}
        />

        <Text font="headline">添加到桌面</Text>
        <Text font="footnote">
          长按桌面空白处 → 左上角“+” → 搜索 Scripting → 选择合适尺寸 → 添加后长按组件 → 编辑小组件 → 选择“中国天气小组件”。
        </Text>
        <Text font="footnote" foregroundStyle="secondaryLabel">
          改完 widget.tsx 后先保存，再运行本页并点“刷新桌面组件”，桌面上的组件会立即重建。
        </Text>

        <Text font="headline">设置城市</Text>
        <Text font="footnote">
          在“编辑小组件”的参数里填：海口
        </Text>
        <Text font="footnote">
          也可以填 JSON：{"{"}"city":"海口","name":"小明"{"}"}
        </Text>
        <Text font="footnote" foregroundStyle="secondaryLabel">
          不填参数时使用 widget.tsx 顶部 DEFAULT_CITY 的值，默认是海口。
        </Text>

        <Text font="headline">隐私</Text>
        <Text font="footnote" foregroundStyle="secondaryLabel">
          不读取定位、不读取通讯录/照片/文件、不上报设备信息；只向中国天气网请求天气数据。
        </Text>
      </List>
    </NavigationStack>
  )
}

async function run() {
  await Navigation.present(<Page />)
  Script.exit()
}

run()
