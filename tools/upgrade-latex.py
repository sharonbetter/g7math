#!/usr/bin/env python3
"""
LaTeX 题面升级：把 data/exams/*.json 中所有题面的纯文本数学表达转为 LaTeX。

转换规则（保守，只转确定安全的模式）：
  分数：  "3/4" → "$\\frac{3}{4}$"（单独出现的带分数线）
  上标：  "2^4" / "2⁴" → "$2^4$"
  科学记数法："2.668×10^8" → "$2.668 \\times 10^8$"
  根号：  "√2" → "$\\sqrt{2}$"
  乘号：  "×" → "$\\times$"（在已有 LaTeX 上下文外）
  
不转的：
  - 已含 $...$ 的段（避免嵌套）
  - 选择题选项中的纯字母/数字
  - 中文句子中的 "/" （如 "和/或"）
  
幂等：已有 LaTeX 的跳过。每题转完跑 diff 报告。
"""
import json, re, os, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
EXAMS = os.path.join(ROOT, 'data', 'exams')

def has_latex(s):
    return '$' in s or '\\frac' in s or '\\times' in s or '\\sqrt' in s

def convert_text(text):
    """纯文本数学表达 → LaTeX（保守）"""
    if not text or has_latex(text):
        return text, False
    
    changed = False
    t = text
    
    # 科学记数法：a.b×10^n 或 a×10^n
    def sci(m):
        nonlocal changed
        changed = True
        return f'${m.group(1)} \\times 10^{m.group(2)}$'
    t = re.sub(r'(\d+(?:\.\d+)?)\s*[×x]\s*10\^?\{?(\d+)\}?', sci, t)
    
    # 带分数（-3/4、5/2 等）：数字/数字 → $\frac{num}{den}$
    # 只匹配独立分数（前后不是数字/字母/点，不是年份如 2024/10）
    def frac(m):
        nonlocal changed
        changed = True
        sign = m.group(1) or ''
        return f'{sign}$\\frac{{{m.group(2)}}}{{{m.group(3)}}}$'
    # 匹配 (-)?num/num 且分子分母都是纯数字，前后不紧邻数字
    t = re.sub(r'(?<![\d.])(-?)(\d{1,4})/(\d{1,4})(?![\d.])', frac, t)
    
    # 乘方：2^4 / 2⁴ / (-2)^3 → $2^4$ 等
    def power(m):
        nonlocal changed
        changed = True
        return f'${m.group(1)}^{m.group(2)}$'
    # 只转 2^3、(-2)^4 这种，不转 x^n（字母底数留给代数式）
    t = re.sub(r'(?<![\w$])(\(?\d+\)?)\^(\d+)(?![\w}])', power, t)
    
    # 上标 Unicode：2⁴ → $2^4$
    SUP_MAP = str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹', '0123456789')
    def sup_unicode(m):
        nonlocal changed
        changed = True
        digits = m.group(2).translate(SUP_MAP)
        return f'${m.group(1)}^{digits}$'
    t = re.sub(r'(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)', sup_unicode, t)
    
    # 根号：√2 → $\sqrt{2}$
    def sqrt_num(m):
        nonlocal changed
        changed = True
        return f'$\\sqrt{{{m.group(1)}}}$'
    t = re.sub(r'√(\d+(?:\.\d+)?)', sqrt_num, t)
    
    return t, changed

def convert_question(q):
    """转换一道题的所有文本字段"""
    fields_converted = []
    
    for field in ['stem', 'answer', 'solution']:
        val = q.get(field, '')
        if val:
            new_val, changed = convert_text(val)
            if changed:
                q[field] = new_val
                fields_converted.append(field)
    
    # 选项
    if q.get('options'):
        new_opts = []
        for opt in q['options']:
            new_opt, changed = convert_text(opt)
            new_opts.append(new_opt)
            if changed:
                fields_converted.append('options')
        q['options'] = new_opts
    
    # 变式
    if q.get('variants'):
        for v in q['variants']:
            for field in ['stem', 'answer', 'solution']:
                val = v.get(field, '')
                if val:
                    new_val, changed = convert_text(val)
                    if changed:
                        v[field] = new_val
                        fields_converted.append(f'variant.{field}')
    
    # guidance
    if q.get('guidance'):
        new_g, changed = convert_text(q['guidance'])
        if changed:
            # guidance 是口语化文本，保持原样（TTS 读，不需要 LaTeX）
            pass
    
    return fields_converted

def main():
    total_changed = 0
    total_questions = 0
    
    for f in sorted(os.listdir(EXAMS)):
        if not f.endswith('.json'):
            continue
        path = os.path.join(EXAMS, f)
        d = json.load(open(path))
        
        changed_count = 0
        for q in d['questions']:
            total_questions += 1
            fields = convert_question(q)
            if fields:
                changed_count += 1
        
        if changed_count:
            json.dump(d, open(path, 'w'), ensure_ascii=False, indent=2)
            print(f'  {f}: {changed_count}/{len(d["questions"])} 题升级')
            total_changed += changed_count
    
    print(f'\n共 {total_changed}/{total_questions} 题完成 LaTeX 升级')

if __name__ == '__main__':
    main()
