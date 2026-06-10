# 卡片系统升级计划：硬阴影 + 新卡片类型 + 灵活网格

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 从 5 种软阴影横条卡片升级为 8 种硬阴影卡片，支持手动覆写布局、封面图选择、灰度显影、照片堆叠、海报卡、编辑卡，网格灵活可变

**Architecture:** 类型系统(DiaryMeta) → 适配器(diaryAdapter 覆写逻辑) → 渲染(TimelinePage 3 种新卡片) → 样式(全部卡片的硬阴影+灰度显影)。所有改动是增量的，不删除现有卡片类型

**Tech Stack:** React + TypeScript + Tailwind CSS

---

### Task 1: 类型系统升级

**Files:** Modify `src/types/diary.ts`

- [ ] **Step 1: 在 DiaryMeta 加 layoutOverride 和 coverImageIndex**

```ts
export interface DiaryMeta {
  date: string;
  title: string;
  location?: string;
  tags?: string[];
  preset?: string;
  layoutOverride?: 'lead' | 'lead_text' | 'quote' | 'wide' | 'standard' | 'poster' | 'editorial' | 'photo_stack';
  coverImageIndex?: number;
}
```

- [ ] **Step 2: 编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/types/diary.ts
git commit -m "feat: DiaryMeta 加 layoutOverride + coverImageIndex"
```

---

### Task 2: diaryAdapter 覆写逻辑

**Files:** Modify `src/utils/diaryAdapter.ts`

- [ ] **Step 1: 扩展 TimelineLayoutType，加覆写+封面图逻辑**

```ts
export type TimelineLayoutType = 'lead' | 'lead_text' | 'quote' | 'wide' | 'standard' | 'poster' | 'editorial' | 'photo_stack';

export interface TimelineData {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  wordCount: number;
  layout: TimelineLayoutType;
  tags?: string[];
  hasImage?: boolean;
  featured?: boolean;
  images?: string[];          // 新增：供 photo_stack 使用
  coverImage?: string;        // 新增：封面图 URL
  layoutOverride?: boolean;   // 新增：标记是否为手动覆写
}

export function mapDiaryEntriesToTimeline(entries: DiaryEntry[]): TimelineData[] {
  return entries.map((entry, index) => {
    const rawBody = entry.body || '';
    const wordCount = rawBody.length;
    let layout: TimelineLayoutType = 'standard';
    let excerpt = rawBody.substring(0, 150).replace(/\n/g, ' ') + (wordCount > 150 ? '...' : '');

    // 自动推算
    if (wordCount > 0 && wordCount < 100) {
      layout = 'quote';
      excerpt = rawBody;
    } else if (wordCount > 1000 || index === 0) {
      layout = entry.images?.length ? 'lead' : 'lead_text';
    } else if (index % 5 === 0 && wordCount > 300) {
      layout = 'wide';
    }

    // 手动覆写优先
    const finalLayout = (entry.meta?.layoutOverride as TimelineLayoutType) || layout;
    const isOverridden = !!entry.meta?.layoutOverride;

    // 封面图切换
    let finalImages = [...(entry.images || [])];
    let coverImage = finalImages[0] || undefined;
    if (
      entry.meta?.coverImageIndex !== undefined &&
      entry.meta.coverImageIndex >= 0 &&
      entry.meta.coverImageIndex < finalImages.length
    ) {
      const chosen = finalImages.splice(entry.meta.coverImageIndex, 1)[0];
      finalImages.unshift(chosen);
      coverImage = chosen;
    }

    return {
      id: entry.filePath || `entry-${index}`,
      title: entry.meta?.title || 'Untitled',
      excerpt,
      date: entry.meta?.date || new Date().toISOString(),
      wordCount,
      layout: finalLayout,
      tags: entry.meta?.tags,
      hasImage: finalImages.length > 0,
      featured: finalLayout === 'lead' || finalLayout === 'lead_text',
      images: finalImages,
      coverImage,
      layoutOverride: isOverridden,
    };
  });
}
```

- [ ] **Step 2: 更新 TimelineData import**

确保 `TimelinePage.tsx` 中的类型引用能拿到新的 `images` 和 `coverImage` 字段。

- [ ] **Step 3: 编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add src/utils/diaryAdapter.ts
git commit -m "feat: diaryAdapter 加 layoutOverride 覆写 + coverImageIndex 封面切换"
```

---

### Task 3: 硬阴影替换全部卡片

**Files:** Modify `src/views/TimelinePage.tsx`

- [ ] **Step 1: 替换所有 5 种卡片的 hover/active 阴影为硬阴影**

**lead:**
```tsx
// hover: shadow-[10px_10px_0px_0px_#1A1A1A] (保持不变——lead 本身就是硬阴影)
// 只需确保 blur 值为 0
```

**lead_text:**
```tsx
// 已有：border-y-2，hover 反色黑底
// 保持现有样式，因为反色卡片不使用阴影
```

**wide:**
```tsx
className={`md:col-span-2 py-4 md:py-6 border-b border-[#D1CEC7] cursor-pointer text-left focus:outline-none transition-all duration-[400ms] ease-out flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 group ${
  isActive ? 'bg-[#1A1A1A] text-[#F9F7F2] px-4 -mx-4 shadow-[8px_8px_0_0_#1A1A1A] scale-[1.01] z-20 rounded-sm' : 'hover:bg-[#E8E4DB]/50 px-2 -mx-2 hover:px-4 hover:-mx-4 hover:shadow-[6px_6px_0_0_#1A1A1A]'
}`}
```

**quote:**
```tsx
className={`md:col-span-2 my-8 px-10 py-10 border-l-[4px] cursor-pointer text-left focus:outline-none transition-all duration-[400ms] ease-out group ${
  isActive ? 'bg-[#1A1A1A] border-[#8C7E6A] shadow-[8px_8px_0_0_#1A1A1A] text-[#F9F7F2] scale-[1.01] z-20' : 'bg-[#E8E4DB]/20 border-[#D1CEC7] text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#E8E4DB]/50 hover:shadow-[6px_6px_0_0_#1A1A1A] hover:-translate-y-1'
}`}
```

**standard:**
```tsx
className={`py-5 border-b border-[#D1CEC7] cursor-pointer text-left focus:outline-none transition-all duration-[400ms] ease-out group shrink-0 relative ${
  isActive ? 'bg-[#1A1A1A] text-[#F9F7F2] px-5 -mx-5 shadow-[8px_8px_0_0_#1A1A1A] scale-[1.03] z-30 rounded-sm ring-1 ring-[#1A1A1A]/10' : 'hover:bg-[#E8E4DB]/40 px-3 -mx-3 md:px-4 md:-mx-4 z-0 hover:z-10 hover:shadow-[6px_6px_0_0_#1A1A1A]'
}`}
```

所有卡片的 `transition-all duration-*` 统一改为 `duration-[400ms] ease-out`。

- [ ] **Step 2: 添加灰度显影到含图卡片**

在 lead 卡片的图片区域（如果存在）加：
```tsx
{item.hasImage && item.coverImage && (
  <div className="relative overflow-hidden group/img">
    <img src={item.coverImage}
      className="w-full h-full object-cover grayscale opacity-90 group-hover/img:grayscale-0 group-hover/img:opacity-100 group-hover/img:scale-105 transition-all duration-700" />
  </div>
)}
```

- [ ] **Step 3: 编译检查 + 构建**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: 提交**

```bash
git add src/views/TimelinePage.tsx
git commit -m "feat: 全部卡片换硬阴影(blur=0) + 灰度显影(700ms)"
```

---

### Task 4: 新增 photo_stack 卡片

**Files:** Modify `src/views/TimelinePage.tsx`

在 `renderCard` 函数中，`standard` 之前插入：

- [ ] **Step 1: 添加 photo_stack 渲染**

```tsx
// --- photo_stack (新增) ---
if (item.layout === 'photo_stack' && item.images && item.images.length >= 2) {
  return (
    <button key={item.id} onClick={() => handleSelect(item)}
      className={`md:col-span-2 my-10 relative group cursor-pointer transition-all duration-[400ms] ease-out focus:outline-none ${isActive ? 'z-20' : 'z-0 hover:z-10'}`}>
      {/* 标题区 */}
      <div className="mb-4 flex items-baseline gap-2">
        <span className="font-mono text-[15px] font-bold text-[#8C7E6A]">{item.dayStr}</span>
        <h4 className="font-bold text-[18px] group-hover:italic">{item.title}</h4>
      </div>
      {/* 照片堆叠 */}
      <div className="relative h-[280px] w-full">
        {item.images.slice(0, 4).map((img, i) => (
          <div key={i} className="absolute inset-x-4 top-0 bottom-8 bg-[#F9F7F2] border border-[#D1CEC7] p-2 pb-6 shadow-sm transition-all duration-500 ease-out origin-bottom"
            style={{
              zIndex: i,
              transform: `rotate(${i === 0 ? '-6deg' : i === 1 ? '4deg' : '-2deg'})`,
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
        ))}
      </div>
      {/* 激活阴影 */}
      {isActive && <div className="absolute inset-0 shadow-[8px_8px_0_0_#1A1A1A] pointer-events-none" />}
    </button>
  );
}
```

- [ ] **Step 2: 编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/views/TimelinePage.tsx
git commit -m "feat: 新增 photo_stack 卡片——多图散落倾斜+封面显影"
```

---

### Task 5: 新增 poster 卡片

**Files:** Modify `src/views/TimelinePage.tsx`

- [ ] **Step 1: 添加 poster 渲染**

```tsx
// --- poster (新增) ---
if (item.layout === 'poster') {
  return (
    <button key={item.id} onClick={() => handleSelect(item)}
      className={`col-span-1 my-8 relative group cursor-pointer transition-all duration-[400ms] ease-out focus:outline-none flex flex-col ${
        isActive ? 'shadow-[8px_8px_0_0_#1A1A1A] scale-[1.01] z-20' : 'hover:shadow-[6px_6px_0_0_#1A1A1A] hover:-translate-y-1'
      }`}>
      {/* 竖版图片区 */}
      <div className="relative overflow-hidden aspect-[3/4] border border-[#D1CEC7] bg-[#E8E4DB] group-hover:border-[#1A1A1A] transition-colors">
        {item.coverImage ? (
          <img src={item.coverImage} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
        ) : (
          <div className="flex items-center justify-center h-full text-[#8C7E6A] font-mono text-[10px] uppercase tracking-widest">No Cover</div>
        )}
        {/* 标题叠加 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1A1A]/80 to-transparent p-6 pt-12">
          <h4 className="font-bold text-[20px] text-white leading-snug">{item.title}</h4>
          <span className="font-mono text-[10px] text-[#D1CEC7] uppercase tracking-widest mt-2 block">Poster / Day {item.dayStr}</span>
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: 编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/views/TimelinePage.tsx
git commit -m "feat: 新增 poster 卡片——竖版画报+灰度显影+底部标题叠加"
```

---

### Task 6: 新增 editorial 卡片

**Files:** Modify `src/views/TimelinePage.tsx`

- [ ] **Step 1: 添加 editorial 渲染**

```tsx
// --- editorial (新增) ---
if (item.layout === 'editorial') {
  return (
    <button key={item.id} onClick={() => handleSelect(item)}
      className={`md:col-span-2 my-10 flex flex-col md:flex-row gap-0 cursor-pointer text-left focus:outline-none transition-all duration-[400ms] ease-out group ${
        isActive ? 'shadow-[8px_8px_0_0_#1A1A1A] scale-[1.01] z-20' : 'hover:shadow-[6px_6px_0_0_#1A1A1A] hover:-translate-y-1'
      }`}>
      {/* 左：大号排版 */}
      <div className={`flex-1 p-10 lg:p-14 flex flex-col justify-center border border-[#D1CEC7] group-hover:border-[#1A1A1A] transition-colors ${
        isActive ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]' : 'bg-white'
      }`}>
        <span className={`font-mono text-[10px] uppercase tracking-widest mb-4 ${isActive ? 'text-[#8C7E6A]' : 'text-[#8C7E6A]'}`}>Editorial / Day {item.dayStr}</span>
        <h4 className="font-bold text-[28px] lg:text-[36px] leading-snug group-hover:italic mb-6">{item.title}</h4>
        {item.excerpt && (
          <p className={`text-[15px] leading-[2] line-clamp-4 ${isActive ? 'text-[#D1CEC7]' : 'text-[#4A4A4A]'}`}>{item.excerpt}</p>
        )}
      </div>
      {/* 右：图片 */}
      <div className="w-full md:w-[45%] aspect-[4/3] md:aspect-auto relative overflow-hidden border border-l-0 border-[#D1CEC7] group-hover:border-[#1A1A1A] transition-colors bg-[#E8E4DB]">
        {item.coverImage ? (
          <img src={item.coverImage} className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
        ) : (
          <div className="flex items-center justify-center h-full text-[#8C7E6A] font-mono text-[10px] uppercase tracking-widest">Figure</div>
        )}
      </div>
    </button>
  );
}
```

- [ ] **Step 2: 编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/views/TimelinePage.tsx
git commit -m "feat: 新增 editorial 卡片——非对称左右分栏+大号排版"
```

---

### Task 7: 灵活网格 + 卡片尺寸变量

**Files:** Modify `src/views/TimelinePage.tsx`

- [ ] **Step 1: CSS 变量定义卡片尺寸主题**

在 TimelinePage 组件顶部添加内联 `<style>`：

```css
:root {
  --card-poster-min-h: 420px;
  --card-editorial-min-h: 320px;
  --card-photo-stack-h: 280px;
  --card-standard-h: auto;
}
```

- [ ] **Step 2: 网格支持混合列宽**

确认现有网格 `grid-cols-1 md:grid-cols-2` + `gridAutoFlow: 'row dense'` 能正确容纳：
- poster → `col-span-1`（竖版，1 列）
- editorial → `md:col-span-2`（横跨 2 列）
- photo_stack → `md:col-span-2`（横跨 2 列）
- lead → `md:col-span-2`
- lead_text → `md:col-span-2`
- wide → `md:col-span-2`
- quote → `md:col-span-2`
- standard → `col-span-1`

无需额外改网格代码——当前网格已经支持这些跨度。

- [ ] **Step 3: 编译检查 + 构建**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: 提交**

```bash
git add src/views/TimelinePage.tsx
git commit -m "feat: CSS变量卡片尺寸主题 + 网格混合列宽验证"
```

---

### Task 8: 卡片 hover gear 占位（未来控制面板入口）

**Files:** Modify `src/views/TimelinePage.tsx`

- [ ] **Step 1: 在 lead 和 standard 卡片的右上角添加 gear 图标**

```tsx
{/* 卡片右上 gear 占位 */}
<div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); /* 未来：打开卡片控制面板 */ }}
    className="w-7 h-7 flex items-center justify-center border border-[#D1CEC7] bg-white/90 hover:bg-white hover:border-[#1A1A1A] transition-colors rounded-sm cursor-pointer"
    title="卡片设置"
  >
    <span className="font-mono text-[10px] text-[#8C7E6A]">⚙</span>
  </button>
</div>
```

放在 lead、poster、editorial 卡片的顶层容器内。

- [ ] **Step 2: 编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/views/TimelinePage.tsx
git commit -m "feat: 卡片 hover gear 占位——预留布局/封面控制面板入口"
```

---

## 验证清单

- [ ] `npx tsc --noEmit` 零错误
- [ ] `npm run build` 构建成功
- [ ] 8 种卡片类型都在类型系统中定义
- [ ] 所有卡片 hover 有硬阴影（blur=0）
- [ ] 含图卡片 hover 灰度→彩色（700ms）
- [ ] photo_stack 渲染正确（倾斜散落）
- [ ] poster 竖版画报渲染正确
- [ ] editorial 左右分栏渲染正确
- [ ] diaryAdapter 覆写逻辑：layoutOverride 优先于自动推算
- [ ] diaryAdapter 封面切换：coverImageIndex 正确
- [ ] gear 图标 hover 出现，click 不触发卡片导航（stopPropagation）
- [ ] 旧测试仍然通过
