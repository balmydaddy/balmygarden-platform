exec(open('gen.py').read().split('# 1) 감소대책')[0])

RED = (198, 110, 102)

# 7) TBM 형식형 vs 작동형
im, d = canvas(1240, 960)
title(d, 1240, "형식형 TBM과 작동형 TBM", "같은 5분인데 남는 게 다르다 — 차이는 오늘 작업의 이름이 들어갔느냐")
rows = [("오늘 작업", "\"오늘도 안전하게\"", "3층 외벽 앵커 타공 — 개구부 옆"),
        ("위험", "\"조심합시다\"", "개구부 추락 · 분진 · 공구 반발"),
        ("대책", "\"보호구 착용\"", "개구부 덮개 고정 확인 후 착수"),
        ("담당", "없음", "덮개: 반장 / 안전대: 작업자 본인"),
        ("어제 지적", "없음", "연장코드 정리 — 완료 확인")]
hy = 210
d.rounded_rectangle((60, hy, 330, hy+60), radius=10, fill=(238,240,242), outline=LINE, width=2)
center(d, (60, hy, 330, hy+60), "항목", f(26), SUB)
d.rounded_rectangle((340, hy, 690, hy+60), radius=10, fill=(250,238,236), outline=RED, width=2)
center(d, (340, hy, 690, hy+60), "형식형", f(28), RED)
d.rounded_rectangle((700, hy, 1180, hy+60), radius=10, fill=(236,243,251), outline=BLUE, width=2)
center(d, (700, hy, 1180, hy+60), "작동형", f(28), BLUE)
y = hy + 78
for name, bad, good in rows:
    d.rounded_rectangle((60, y, 330, y+104), radius=10, fill=(255,255,255), outline=LINE, width=2)
    center(d, (60, y, 330, y+104), name, f(27), INK)
    d.rounded_rectangle((340, y, 690, y+104), radius=10, fill=(255,255,255), outline=LINE, width=2)
    center(d, (350, y, 680, y+104), bad, f(24), SUB)
    d.rounded_rectangle((700, y, 1180, y+104), radius=10, fill=(255,255,255), outline=BLUE, width=2)
    center(d, (712, y, 1168, y+104), good, f(24), INK)
    y += 118
d.text((60, y+16), "오른쪽이 더 길지 않다. 같은 5분이다.", font=f(26), fill=WARM)
im.save("07-TBM-형식-작동.png")

# 8) 요청 경로 3구간
im, d = canvas(1240, 820)
title(d, 1240, "404가 어디서 나왔는가", "응답을 만들 수 있는 주체가 둘이다 — 터널 엣지와 집 PC 서버")
boxes = [("브라우저", "대시보드 화면", 60), ("배포 서버", "대신 호출해주는 곳", 360), ("터널 엣지", "주소는 살아 있다", 660), ("집 PC 서버", "실제 프로그램", 960)]
by = 230
for i, (t, s, x) in enumerate(boxes):
    col = BLUE if i in (0,1) else (RED if i == 2 else (92, 140, 108))
    card(d, (x, by, x+220, by+130), outline=col, w=3)
    center(d, (x, by+22, x+220, by+62), t, f(28), col)
    center(d, (x+10, by+70, x+210, by+112), s, f(21), SUB)
    if i < 3:
        d.line([(x+228, by+65), (x+292, by+65)], fill=GRAY, width=4)
        d.polygon([(x+292, by+55), (x+292, by+75), (x+310, by+65)], fill=GRAY)
cy = 430
card(d, (60, cy, 1180, cy+150), outline=RED, w=3, fill=(252,244,243))
d.text((92, cy+26), "터널에 프로그램이 안 붙어 있으면", font=f(30), fill=RED)
d.text((92, cy+78), "엣지가 대신 404를 만들어 보낸다 — 서버는 아무 잘못이 없다", font=f(26), fill=INK)
ty = 620
d.text((60, ty), "구분 방법", font=f(30), fill=INK)
d.text((60, ty+52), "터널이 만든 오류 응답에는 전용 헤더가 붙는다.", font=f(25), fill=SUB)
d.text((60, ty+94), "헤더가 있으면 엣지, 없으면 뒤쪽 서버. 추측할 필요가 없다.", font=f(25), fill=SUB)
im.save("08-404-응답주체.png")

# 9) 업로드 비중 vs 청취 비중
im, d = canvas(1240, 850)
title(d, 1240, "올라오는 양과 실제 듣는 양", "공급은 폭증했고 수요는 그대로다 (Deezer 발표, 2026-04)")
base_y = 660
def bar(x, pct, label, val, col):
    h = int((base_y - 250) * (pct / 100.0))
    h = max(h, 14)
    d.rounded_rectangle((x, base_y - h, x + 230, base_y), radius=8, fill=col)
    center(d, (x, base_y - h - 60, x + 230, base_y - h - 10), val, f(36), col)
    center(d, (x, base_y + 16, x + 230, base_y + 60), label, f(26), INK)
d.line([(60, base_y), (1180, base_y)], fill=GRAY, width=3)
bar(180, 44, "신규 업로드 중 AI", "44%", BLUE)
bar(760, 3, "실제 청취 중 AI", "1~3%", RED)
d.text((60, 762), "만드는 쪽은 막히지 않았고, 들리는 쪽이 좁아졌다.", font=f(27), fill=WARM)
im.save("09-업로드-청취-격차.png")

# 10) 곡 하나 단계별 비중
im, d = canvas(1240, 700)
title(d, 1240, "곡 하나에 들어간 단계", "생성 자체는 마지막 30분이고 나머지가 전부 앞단이다")
steps = [("스토리", 28, BLUE), ("시나리오", 22, BLUE), ("장면", 18, BLUE), ("가사", 27, WARM), ("생성", 5, (92,140,108))]
x = 60
total_w = 1120
for name, pct, col in steps:
    w = int(total_w * pct / 100.0)
    d.rounded_rectangle((x, 240, x + w - 8, 380), radius=10, fill=col)
    center(d, (x, 270, x + w - 8, 310), name, f(26), (255,255,255))
    center(d, (x, 314, x + w - 8, 352), f"{pct}%", f(24), (255,255,255))
    x += w
d.text((60, 430), "순서를 바꾸지 않는다 — 스토리를 세우고 장면을 정한 뒤에 가사를 쓴다.", font=f(27), fill=INK)
d.text((60, 486), "AI 도구를 쓰는데 7주가 걸린 이유는 생성이 느려서가 아니다.", font=f(25), fill=SUB)
d.text((60, 530), "비중은 실제 작업 기록 기준의 대략값이다 — 정밀 계측치가 아니다.", font=f(23), fill=WARM)
im.save("10-곡-단계-비중.png")
print("done")
