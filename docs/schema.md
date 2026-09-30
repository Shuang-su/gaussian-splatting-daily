# Daily Content Schema

Schema version: **1**

## Canonical path

`docs/daily/YYYY/MM/YYYY-MM-DD.md`

The path date and the frontmatter `date` must match.

## Required frontmatter

| Field | Type | Meaning |
|---|---|---|
| `schema_version` | integer | Content contract version; currently `1` |
| `id` | string | Stable ID: `gsd-YYYY-MM-DD` |
| `date` | date string | Logical Daily date |
| `timezone` | string | Must be `Asia/Tokyo` in v1 |
| `generated_at` | ISO-8601 string | Generation timestamp |
| `status` | enum-like string | `draft`, `published`, `no-data`, or `corrected` |
| `title` | string | Human-readable title |
| `source_count` | integer | Number of canonical arXiv markers in this file; other primary links are not counted |
| `ai_enrichment` | boolean | Whether AI editorial enrichment succeeded |
| `ai_model` | string | Model ID, or empty when AI was not used |

## Paper markers

A paper has one canonical marker on its first archive date. Later versions or updates link to that paper without adding another cross-day marker:

```html
<!-- arxiv:2609.12345 -->
```

The version suffix is stripped before the marker is written so later revisions do not create duplicate papers.

## Required body sections

```markdown
# 今日概览

## 论文与研究

## 自动化说明
```

A deep research Daily may instead start with `# 3DGS / 4DGS / Gaussian Splatting 深度情报日报` and contain its topic sections. A `no-data` Daily is valid and intentionally distinguishes “the automation ran and found nothing new” from “the automation failed”.

## Corrections

After a Daily is merged, factual corrections should:

1. open a Correction Issue;
2. update the original Daily through a PR;
3. add an entry to `docs/corrections.md`;
4. preserve the original source/provenance context.


## Optional image fields

A paper entry may include a remote Markdown image discovered from the paper source:

```markdown
![Figure caption](https://arxiv.org/html/YYMM.NNNNN/...)
> 图片来源：arXiv HTML，论文 YYMM.NNNNN 的首个 figure。
```

Rules:

- image discovery is best-effort and must never block the Daily;
- prefer the paper/project's own image over third-party screenshots;
- keep the source attribution adjacent to the image;
- do not copy large paper assets into Git merely to render a thumbnail;
- the website must tolerate missing or broken remote images and fall back to a text card/poster.

## 可选门户元数据（兼容 schema v1）

旧文无需修改即可构建；新日报建议在同一份 frontmatter 中填写 portal。正文仍是唯一分析文本，不维护第二份内容库。

```yaml
portal:
  headline: "当天具体事件标题"
  summary: "用两三句话说明变化、影响和证据边界。"
  topics: [3dgs, webgpu]
  issue: 29
  prs: [30, 31]
  image:
    url: "https://官方来源/cover.png"
    alt: "图片中实际可见内容"
    source: "https://官方项目/"
    credit: "项目名 / 官方示意（非当日版本截图）"
    position: "60% 40%"
    fit: "cover"
  highlights:
    - id: "github.com/owner/repo/pull/123"
      kind: "tool"
      title: "具体变化"
      source: "https://github.com/owner/repo/pull/123"
      summary: "改了什么、证据是什么、为何值得关注。"
      section: "2. SuperSplat / PlayCanvas 工具链"
      topics: [webgpu]
      priority: "P1"
      evidence: "B"
```

- headline / summary 为可选字符串；topics 为已知 slug 数组：3dgs、4dgs、webgpu、lod、streaming、slam、avatar、formats。缺省主题由正文推导。
- highlights 的 id、kind（paper / tool / news）、title、source、summary 必填；section 必须匹配真实正文标题，构建时解析为锚点。可选 anchor 可直接指定已生成锚点；不可用一个不存在的栏目。
- 论文稳定标识为 arxiv:无版本ID；工具以仓库 + Release tag / PR number / commit SHA 为标识，同事件跨日报不制造新日期 ID。论文 marker 是首次归档计数的权威。
- 图片可附在封面或重点条目；url、alt、source、credit 必填。position 控制裁切位置，fit 为 cover / contain。官方旧版示意不得称当日版本截图。自绘编辑示意必须注明不表示实测。
- 封面不自动取论文首图；论文图可作为论文条目缩略图。失败显示文字回退并保留来源。
- issue / prs 为当日已存在的追踪入口；复用当日身份。生成的 data/portal-index.json 与 public/content-index.json 不作为正文源。

## 完整日报与无新增

09-30 起保留原 13 类栏目与有序编号 1–13。某栏没有新增时写明检查的项目、窗口和结论；检索失败写清无法访问的源和缺口。真实说明允许短于一般正文的字数门槛，但仅写“无新增”或编辑占位不能通过。published / corrected 才进入网站；draft / no-data 研究底稿保留在 GitHub，不能冒充完整日报。
