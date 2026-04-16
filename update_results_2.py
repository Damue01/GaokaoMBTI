import json

with open('web/public/results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

u = data['universities']

u[0]['name'] = '鸽伦比亚大学'
u[0]['english_name'] = 'Coo-lumbia University (CU)'

u[1]['name'] = '皇家戏精学院'
u[1]['english_name'] = 'Royal Academy of Drama-queen Art (RADA)'

u[2]['name'] = '吗喽理工大学'
u[2]['english_name'] = 'Malou Institute of Technology (MIT)'

u[3]['name'] = '斯坦佛大学'
u[3]['english_name'] = 'Stan-Fo University (SFU)'

u[4]['name'] = '加州大学波及你分校'
u[4]['english_name'] = 'University of California, Bojini (UCB)'

for i in range(len(u)):
    if 'short_name' in u[i]:
        del u[i]['short_name']

with open('web/public/results.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
