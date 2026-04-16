import json

# 修改 results.json
with open('web/public/results.json', 'r', encoding='utf-8') as f:
    res = json.load(f)

if "宇宙因果律防卫局" in res.get("gate_results", {}):
    del res['gate_results']["宇宙因果律防卫局"]

res['gate_results']["亚太区水豚行为模式研究所"] = {
    "name": "亚太区水豚行为模式研究所",
    "english_name": "Asia-Pacific Capybara Behavior Institute (APCBI)",
    "summary": "恭喜，您的精神内核已经彻底退化为一只水豚。在面临“高考多少分”这种能让普通人类汗流浃背的精神折磨时，您的内心不仅毫无波澜，甚至还能淡定地塞出一块红烧肉并试图普度众生。您的情绪稳定程度已超过全人类99.9%的哺乳动物，本基地现收编您为您分配合法发呆位。",
    "social_tag": "#确诊为人类变异水豚"
}

with open('web/public/results.json', 'w', encoding='utf-8') as f:
    json.dump(res, f, ensure_ascii=False, indent=2)

# 修改 questions.json
with open('web/public/questions.json', 'r', encoding='utf-8') as f:
    qs = json.load(f)

for q in qs.get('gate_questions', []):
    for opt in q['options']:
        if opt.get('gate_result') == "宇宙因果律防卫局":
            opt['gate_result'] = "亚太区水豚行为模式研究所"

with open('web/public/questions.json', 'w', encoding='utf-8') as f:
    json.dump(qs, f, ensure_ascii=False, indent=2)

print("G2 updated successfully!")
