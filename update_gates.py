import json
with open('web/public/results.json', 'r', encoding='utf-8') as f:
    res = json.load(f)

res['gate_results'] = {
    "阿卡姆学术重症疗养院": {
        "name": "阿卡姆学术重症疗养院",
        "english_name": "Arkham Academic Asylum",
        "summary": "警告！本院的学术精神力监测雷达发现，你在考场上出现了严重的幻觉，甚至企图用量子力学和多维空间理论来掩盖你考砸了的事实。别挣扎了，由于你极具精神污染的考场作风，防暴救护车和清道夫小队已经停在楼下。",
        "social_tag": "#确诊重度备考综合征"
    },
    "宇宙因果律防卫局": {
        "name": "宇宙因果律防卫局",
        "english_name": "Universal Causality Defense Bureau",
        "summary": "探针截获了你应对亲戚查分危机时的降维打击波。你已经完全看破了“分数”这种低维生物的社交陷阱，展现出了神级别的糊弄学与社交阻断术。地球的学历已经无法衡量你，我们已为你安排好穿梭机，请准备登舰。",
        "social_tag": "#已脱离三维考试的低级趣味"
    }
}
with open('web/public/results.json', 'w', encoding='utf-8') as f:
    json.dump(res, f, ensure_ascii=False, indent=2)

with open('web/public/questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for q in data.get('gate_questions', []):
    if q.get('id') == 'G1':
        for opt in q['options']:
            if opt['label'] in ['C', 'D']:
                opt['gate_result'] = "阿卡姆学术重症疗养院"
    if q.get('id') == 'G2':
        for opt in q['options']:
            if opt['label'] in ['B', 'C', 'D']:
                opt['gate_result'] = "宇宙因果律防卫局"

with open('web/public/questions.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("OK")
