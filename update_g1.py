import json

# 修改 results.json
with open('web/public/results.json', 'r', encoding='utf-8') as f:
    res = json.load(f)

if "阿卡姆学术重症疗养院" in res.get("gate_results", {}):
    del res['gate_results']["阿卡姆学术重症疗养院"]

res['gate_results']["地球Online·BUG修复局"] = {
    "name": "地球Online·BUG修复局",
    "english_name": "Earth Online Bug Fix Bureau (EOBFB)",
    "summary": "警告！检测到玩家在【2026高考副本】中出现严重的数据溢出。你企图用量子力学和多维空间理论来解释分数的逻辑错误，导致当前考场区域的NPC算力严重过载。你的异常发疯行为已被主系统拦截，请原地待命，修复补丁即将通过天基轨道物理植入你的大脑。",
    "social_tag": "#卡了高考的BUG被封号了"
}

with open('web/public/results.json', 'w', encoding='utf-8') as f:
    json.dump(res, f, ensure_ascii=False, indent=2)

# 修改 questions.json
with open('web/public/questions.json', 'r', encoding='utf-8') as f:
    qs = json.load(f)

for q in qs.get('gate_questions', []):
    for opt in q['options']:
        if opt.get('gate_result') == "阿卡姆学术重症疗养院":
            opt['gate_result'] = "地球Online·BUG修复局"

with open('web/public/questions.json', 'w', encoding='utf-8') as f:
    json.dump(qs, f, ensure_ascii=False, indent=2)

print("G1 updated successfully!")
