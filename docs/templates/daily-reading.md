# 日报阅读版模板

## 使用说明

这是编辑模板，不是可发布正文。先阅读 `docs/editorial-style.md`，删除提示并填写真实来源。不要为通过校验编造哈希、研究块、试用经历或实验结果。

文件目标：`docs/reading/YYYY-MM-DD.md`。每个元数据字段保持一行 JSON；事件数组顺序与正文 H2 一致。可复制的结构如下，所有占位值必须替换。

```markdown
---
version: 2
report: "gsd-YYYY-MM-DD"
sourceHash: "规范研究文件完整字节的 SHA-256"
headline: "对象与具体变化"
summary: "补充影响和另一条主线，不重复标题"
disclosure: "说明编辑辅助、实际核验范围及未执行的验证"
events: [{"id":"既有稳定身份或固定来源身份","anchor":"真实稳定锚点","group":"main","kind":"tool","source":"https://真实一手来源","sourceRefs":["从规范研究 AST 读取的真实块 key"],"tags":{"techniques":["3dgs"],"projects":[],"content":["release"],"sources":["official"]},"judgment":"速览中的一句核心判断"}]
paperTitles: {}
paperOriginalTitles: {}
---

## 对象与具体变化

首段写清可核验的变化和用途。

接着解释必要背景、具体影响及发布状态。关键前提、许可和未复现范围保持可见。

:::details[参数与验证方法]

只放需要深入阅读的技术说明，明确哪些步骤已实际执行。

:::

[来源](https://真实一手来源)
```

简讯仍各占一个事件和 H2，group=brief；研究简讯用 group=paper、kind=paper，并保留规范原文中的 arXiv marker 和首次归档身份。图片可增加到事件的 images，需遵循本地媒体清单，afterParagraph 从 1 开始。
