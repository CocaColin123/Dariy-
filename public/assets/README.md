# Assets 目录

## 预期的素材文件

将处理好的视频素材放在此目录下：

| 文件名 | 来源 | 用途 |
|--------|------|------|
| `cockpit_frame.png` | 坐上飞船.mp4 截帧 + 舷窗抠绿 | 驾驶舱全貌底图（操控台模式） |
| `portal_close.webm` | 进入/退出.mp4 导出 | 折跃门正放（闭眼） |
| `portal_open.webm` | 进入/退出.mp4 倒放导出 | 折跃门倒放（睁眼） |

## 暂时未到位的处理

在素材到位之前，代码使用 CSS 占位：
- cockpit_frame.png → 深棕色 div + CSS 绘制的简易窗框
- portal_close.webm / portal_open.webm → CSS radial-gradient 收缩动画

## 视频处理方式

1. 从 DaVinci Resolve/AE 导出一帧高清 PNG（1920×1080）
2. PS 抠除舷窗区域的绿幕，导出透明 PNG
3. 折跃门视频抠绿后导出 WebM（VP9 编码，带 Alpha 通道）
