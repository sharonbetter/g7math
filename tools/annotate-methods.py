#!/usr/bin/env python3
"""
④ 思想方法标注：给全部考评题的 guidance 追加数学思想方法点名。

六大思想方法 + 检测关键词：
  数形结合    — 数轴、画图、图形、图上、坐标、线段图
  分类讨论    — 分类、分情况、两种可能、正负、情况一/二、奇偶
  整体思想    — 整体、一块、不必求出、代入、看成一
  转化与化归  — 转化、化归、变成、转身、统一、化简
  从特殊到一般 — 规律、前几、通项、观察、猜想、第n
  方程思想    — 设未知数、列方程、等量关系、设x

幂等：已有 thinkingMethod 字段的跳过。
"""
import json, os, re, glob

ROOT = os.path.join(os.path.dirname(__file__), '..')
EXAMS = os.path.join(ROOT, 'data', 'exams')

METHODS = [
  ('数形结合',   ['数轴', '画图', '图形', '图上', '坐标', '线段图', '直角坐标系', '几何意义']),
  ('分类讨论',   ['分类', '分情况', '两种可能', '情况一', '情况二', '奇偶', '正负不确定', '符号不确定', '一正一负']),
  ('整体思想',   ['整体', '一块', '不必求出', '看成一个', '当作一个']),
  ('转化与化归', ['转化', '化归', '变成', '转身', '统一成', '化简', '化成']),
  ('从特殊到一般', ['规律', '前几', '通项', '观察', '猜想', '第n', '从小', '先算前']),
  ('方程思想',   ['设未知数', '列方程', '等量关系', '设x', '设为']),
]

METHOD_EXPLAIN = {
  '数形结合': '把数的问题放到图上看，图上的关系用数来算',
  '分类讨论': '条件不确定时，把每种可能都走一遍，答案才完整',
  '整体思想': '不求出每个字母的值，把一块看成一个整体直接代',
  '转化与化归': '把不熟悉的问题变成已经会的问题来解决',
  '从特殊到一般': '先算几个小的找规律，再推广到一般情况',
  '方程思想': '用等量关系设未知数列方程，让未知变已知',
}

def detect_method(guidance, stem=''):
  """从引导文本中检测主要思想方法"""
  text = guidance + ' ' + stem
  best = None
  best_score = 0
  for method, kws in METHODS:
    score = sum(1 for kw in kws if kw in text)
    if score > best_score:
      best_score = score
      best = method
  return best if best_score >= 2 else None  # 至少命中 2 个关键词

def main():
  total = tagged = skipped = no_method = 0
  
  for f in sorted(glob.glob(os.path.join(EXAMS, '*.json'))):
    d = json.load(open(f))
    changed = False
    
    for q in d['questions']:
      # 主卷题 + 变式题都处理
      items = [q] + q.get('variants', [])
      
      for item in items:
        g = item.get('guidance', '')
        if not g:
          continue
        total += 1
        
        # 幂等
        if item.get('thinkingMethod') or '核心思想' in g:
          skipped += 1
          continue
        
        method = detect_method(g, q.get('stem', ''))
        if method:
          item['thinkingMethod'] = method
          # 在 guidance 末尾追加一句
          suffix = f"\n\n—— 这道题的核心思想是「{method}」：{METHOD_EXPLAIN[method]}。"
          item['guidance'] = g.rstrip() + suffix
          tagged += 1
          changed = True
        else:
          no_method += 1
    
    if changed:
      json.dump(d, open(f, 'w'), ensure_ascii=False, indent=2)
      ch = os.path.basename(f)
      print(f'  {ch}: 已更新')
  
  print(f'\n处理 {total} 条 guidance：标注 {tagged} · 已有跳过 {skipped} · 无明显方法 {no_method}')
  print('前端需同步：cd app && node scripts/sync-data.mjs')

if __name__ == '__main__':
  main()
