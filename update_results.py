import json

with open('web/public/results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

u = data['universities']

u[0]['name'] = '鸽伦比亚大学 (Coo-lumbia University)'
u[0]['short_name'] = '鸽伦比亚大学'
u[0]['department'] = '物理失联与薛定谔成绩管理系'
u[0]['summary'] = '你深谙量子力学的终极奥义：观测即坍缩，不查即永生。只要你彻底断网、拉黑班主任、逃离人类社会，你的成绩就永远处于满分和零分的叠加态中。本校表彰你凭一己之力对抗宇宙因果律的勇气，现特招你入校，准备好和薛定谔的那只猫做室友了吗？'
u[0]['social_tag'] = '#只要我不查分挂科的就不是我'

u[1]['name'] = '皇家戏精学院 (Royal Academy of Drama-queen Art)'
u[1]['short_name'] = '皇家戏精学院'
u[1]['department'] = '紧绷松弛感表演专系'
u[1]['summary'] = '你精湛的演技不仅骗过了监考老师，甚至差点骗过了你自己。不管是风轻云淡的冷笑，还是交卷后那句“昨天根本没看书”的凄凉，你都能一秒切入奥斯卡级防御状态。本系急需你这种泰山崩于前而嘴梆硬、心里慌成狗表面稳如老狗的特级演员。'
u[1]['social_tag'] = '#嘴比答题卡还要硬'

u[2]['name'] = '吗喽理工大学 (Malou Institute of Technology)'
u[2]['short_name'] = '吗喽理工大学'
u[2]['department'] = '亚太区高压灵长类行为学'
u[2]['summary'] = '阅卷老师在你的答题卡上发现了严重的返祖现象。你展现出了惊人的野生解题直觉——过程毫无逻辑，步骤全是废话，但你硬是用三根香蕉的智力，试图推导航天飞机的轨道数据。本校急需你这种“遇事不决量子力学，算不出来就地发疯”的学术猛猴。'
u[2]['social_tag'] = '#确诊为学术型吗喽'

u[3]['name'] = '斯坦佛大学 (Stan-Fo University)'
u[3]['short_name'] = '斯坦佛大学'
u[3]['department'] = '电子木鱼声学与就地圆寂系'
u[3]['summary'] = '你的脑电波里写满了普度众生的慈悲。当周围的凡人还在为了一分两分互相倾轧、抓耳挠腮时，你已经完成了三维世界的精神脱壳，甚至在草稿纸上敲起了电子木鱼。本校决定免试录取，毕竟你对分数的无视，已经达到了物理意义上的立地成佛。'
u[3]['social_tag'] = '#卷王都在流泪而我已经睡着'

u[4]['name'] = '加州大学波及你分校 (UC Bojini)'
u[4]['short_name'] = 'UC波及你'
u[4]['department'] = '考后创伤同化与拉人下水工程'
u[4]['summary'] = '既然自己淋了考场的暴雨，你就要把全班同学的伞都撕烂！你极度擅长在死局中发动同归于尽式的连环追问：“你大题选什么？你居然选A？完了你肯定算错了！”直到所有人被你波及，开始集体怀疑人生。反人类心理学急需你这种擅长战损共沉沦的顶尖人才。'
u[4]['social_tag'] = '#我考砸了但这必须波及你'

with open('web/public/results.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
