import { useState } from 'react';
import A4Paper from '../components/A4Paper';
import type { PageParams } from '../types/diary';

const DEFAULT_PARAMS: PageParams = {
  aspectRatio: 0.707, marginTop: 20, marginBottom: 20,
  marginLeft: 22, marginRight: 22, shadow: 'light',
  fontFamily: 'Noto Serif SC', fontSize: 24, lineHeight: 1.9,
  letterSpacing: 0.02, paragraphSpacing: 0.8, textColor: '#2a2a2a',
  textIndent: 0, bgColor: '#fdfaf5', bgTexture: null, bgTextureOpacity: 0,
  imageMode: 'embed', floatPadding: 12,
};

const TEST_CASES = [
  {
    label: 'Case 1: Empty',
    body: '',
  },
  {
    label: 'Case 2: Short single paragraph',
    body: '今天天气很好。',
  },
  {
    label: 'Case 3: Long text (~3000 chars, should fill 2+ pages at 15px)',
    body: '海边最安静的时候，不是浪声停下，而是人群散开以后。木桩还留在水里，像一排没有说完的话，潮水从它们之间退开，又在下一次浪里回来。\n\n我站在岸边拍了很久。取景器里的世界被压成一条很平的线，天空在上，海在下，中间那些细小的红点和远处的风车提醒我，画面里仍然有人生活。\n\n'.repeat(30),
  },
  {
    label: 'Case 4: Very long single Chinese paragraph (no breaks → should flow to page 2)',
    body: '其实很多事情都像一场远行你准备了很久看了看天气预报带上了足够的水和干粮然后你在一个普通的清晨上路走了很久很久久到你开始怀疑这条路到底有没有尽头久到你忘了自己为什么要出发久到路过的人渐渐少了风景也重复了可你还是在走因为停下来似乎比继续走下去更需要勇气你终于明白有些决定不是一瞬间做出来的而是在无数个不起眼的岔路口一点一点累积成形等你回过头想找那个当初做决定的时刻你已经找不到它了它像一片雪花融化在了你的体温里你的呼吸里你的不肯停下的脚步里。',
  },
  {
    label: 'Case 5: LaTeX math formulas (mixed Chinese + math)',
    body: '今天我们学习了概率论的基本概念。\n\n$P(A|B) = \\frac{P(A \\cap B)}{P(B)}$\n\n这个公式描述了条件概率的计算方法。\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n\n高斯积分在概率统计中有广泛应用。\n\n那么能提高的点就是：①降低创造所需的时间成本，②提升创造的价值，③提高变现金额。\n\n简单分类：$\\underbrace{a_1, a_2}_{效率速度}, \\underbrace{b_1, b_3}_{时间杠杆}$',
  },
  {
    label: 'Case 6: Extra large font (28px)',
    body: '这个测试使用很大的字号。\n\n'.repeat(8) + '海边最安静的时候，不是浪声停下，而是人群散开以后。木桩还留在水里，像一排没有说完的话。\n\n'.repeat(5),
    fontSize: 28,
    lineHeight: 1.6,
  },
  {
    label: 'Case 7: Mixed Chinese + English + emoji',
    body: '今天和Alice去了咖啡店☕️。\n\nShe said "I really like this place!"\n\n我们聊了很多关于life和work的事情。\n\n回家的路上看到了很美的日落🌅。\n\n'.repeat(15),
  },
  {
    label: 'Case 8: Very long English word (break-word test)',
    body: 'pneumonoultramicroscopicsilicovolcanoconiosis is a very long word.\n\nThisSuperLongWordWithoutAnySpacesShouldStillBreakAndNotOverflowThePageContainerBecauseWeHaveWordBreakSetToBreakWord in CSS.\n\n正常中文段落会换行。\n\n'.repeat(10),
  },
  {
    label: 'Case 9: Minimal margins (max content area)',
    body: '窄边距测试。\n\n'.repeat(8) + '页边距设置为5mm，内容区域最大化。\n\n'.repeat(5) + '海边最安静的时候不是浪声停下。\n\n'.repeat(10),
    marginTop: 5, marginBottom: 5, marginLeft: 5, marginRight: 5,
  },
  {
    label: 'Case 10: Zero paragraph spacing + zero letter spacing',
    body: '紧凑排版测试没有段间距没有字间距文字紧密排列。\n\n'.repeat(30),
    letterSpacing: 0, paragraphSpacing: 0,
  },
];

export default function TestPage() {
  const [results, setResults] = useState<Record<number, { pages: number }>>({});

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0f] p-6">
      <h1 className="font-serif text-2xl text-white/80 mb-8">A4Paper 分页测试</h1>
      {TEST_CASES.map((tc, i) => {
        const p: PageParams = {
          ...DEFAULT_PARAMS,
          fontSize: tc.fontSize ?? DEFAULT_PARAMS.fontSize,
          lineHeight: tc.lineHeight ?? DEFAULT_PARAMS.lineHeight,
          letterSpacing: tc.letterSpacing ?? DEFAULT_PARAMS.letterSpacing,
          paragraphSpacing: tc.paragraphSpacing ?? DEFAULT_PARAMS.paragraphSpacing,
          marginTop: tc.marginTop ?? DEFAULT_PARAMS.marginTop,
          marginBottom: tc.marginBottom ?? DEFAULT_PARAMS.marginBottom,
          marginLeft: tc.marginLeft ?? DEFAULT_PARAMS.marginLeft,
          marginRight: tc.marginRight ?? DEFAULT_PARAMS.marginRight,
        };
        return (
          <div key={i} className="mb-10 border border-white/10 rounded p-4">
            <h2 className="text-sm text-white/60 mb-2">{tc.label}</h2>
            <div className="text-[10px] text-white/30 mb-2">
              fontSize={p.fontSize} lh={p.lineHeight} ls={p.letterSpacing} ps={p.paragraphSpacing}
              margins=({p.marginTop},{p.marginBottom},{p.marginLeft},{p.marginRight})
            </div>
            <div className="bg-neutral-800/20 rounded overflow-x-auto">
              <A4Paper params={p} body={tc.body} images={[]} showPageNum />
            </div>
          </div>
        );
      })}
    </div>
  );
}
