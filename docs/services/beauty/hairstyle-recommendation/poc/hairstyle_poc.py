#!/usr/bin/env python3
"""hairstyle-recommendation PoC — SPEC의 3단계 플로우를 로컬에서 검증한다.

  1) analyze  : 얼굴 사진 → qwen3-vl (Ollama, 로컬) → FaceAnalysis JSON
  2) recommend: 얼굴형+속성 → qwen3.5 (Ollama, 로컬) → Recommendation[] JSON
  3) preview  : 추천별 스타일 프리뷰 → z-image-turbo (image.jurepi.kr 스택, :8080)

프라이버시(SPEC 하드 규칙): 사진 바이트는 1단계 로컬 비전 호출에만 사용하고
디스크/로그에 남기지 않는다. 3단계 프롬프트는 카탈로그성 텍스트만 사용 — 사용자
얼굴은 절대 생성에 쓰지 않는다.

사용법: python3 hairstyle_poc.py [사진경로]
"""

import base64
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

OLLAMA = "http://localhost:11434/api/chat"
IMAGE_GATEWAY = "http://localhost:8080/v1/images/generations"
VISION_MODEL = "qwen3-vl:8b"
TEXT_MODEL = "qwen3.5:9b"
PREVIEW_SIZE = "512x512"
N_RECOMMENDATIONS = 4

FACE_SHAPES = ["oval", "round", "square", "heart", "oblong", "diamond", "triangle"]
DEFAULT_ATTRS = {"vibe": "neutral", "length": "medium", "texture": "straight", "occasion": "daily"}

OUT_DIR = Path(__file__).parent / "output"


def post_json(url: str, payload: dict, timeout: int = 300) -> dict:
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def extract_json(text: str) -> dict:
    """모델 응답에서 JSON 본문만 추출 (코드펜스/서두 제거)."""
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        raise ValueError(f"JSON 없음: {text[:200]}")
    return json.loads(m.group())


def to_jpeg_b64(photo: Path) -> str:
    """SPEC의 클라이언트 전처리를 모사: JPEG 변환(비전 모델 입력 호환) 후 즉시 삭제."""
    if photo.suffix.lower() in (".jpg", ".jpeg", ".png"):
        return base64.b64encode(photo.read_bytes()).decode()
    fd, tmp = tempfile.mkstemp(suffix=".jpg")
    os.close(fd)
    try:
        subprocess.run(
            ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "85",
             str(photo), "--out", tmp],
            check=True, capture_output=True,
        )
        return base64.b64encode(Path(tmp).read_bytes()).decode()
    finally:
        os.unlink(tmp)


def step1_analyze(photo: Path) -> dict:
    print(f"[1/3] 얼굴형 분석 — {VISION_MODEL} (로컬, 사진은 이 호출에만 사용)")
    img_b64 = to_jpeg_b64(photo)
    t = time.time()
    resp = post_json(OLLAMA, {
        "model": VISION_MODEL,
        "stream": False,
        "format": "json",
        "messages": [{
            "role": "user",
            "images": [img_b64],
            "content": (
                "Analyze the face in this photo for a hairstyle recommendation service. "
                f"Respond ONLY with JSON: {{\"faceShape\": one of {FACE_SHAPES}, "
                "\"confidence\": 0..1, \"features\": [2-4 short English phrases about "
                "notable facial features], \"notes\": one short sentence}}"
            ),
        }],
    })
    analysis = extract_json(resp["message"]["content"])
    assert analysis.get("faceShape") in FACE_SHAPES, f"잘못된 faceShape: {analysis}"
    print(f"      → {analysis['faceShape']} (confidence {analysis.get('confidence')}) "
          f"[{time.time()-t:.1f}s]")
    return analysis


RECOMMEND_PROMPT = """You are a hairstyle advisor for Korean men.
Face analysis: {analysis}
User attributes: {attrs}

Return a JSON object with a "recommendations" array containing EXACTLY {n} items.
Counting rule: the array MUST have {n} elements — not fewer, not more.
Each of the {n} hairstyles must be clearly different from the others
(e.g. different lengths, partings, or textures).

Each item must have EXACTLY these 5 keys and nothing else:
- "nameKo": Korean hairstyle name (string)
- "nameEn": English hairstyle name (string)
- "why": ONE Korean sentence explaining why it suits this face shape
- "tips": array of EXACTLY 2 short Korean styling tips
- "imagePrompt": English text-to-image prompt describing a GENERIC Korean male
  model wearing this exact hairstyle, front-facing studio portrait on white
  background. Do NOT reference the analyzed person.

Output shape (fill all {n} slots):
{{"recommendations": [{{...item 1...}}, {{...item 2...}}, {{...item 3...}}, {{...item 4...}}]}}"""


def valid_recs(recs: list) -> bool:
    required = {"nameKo", "nameEn", "why", "tips", "imagePrompt"}
    return (len(recs) == N_RECOMMENDATIONS
            and all(required <= set(r) and isinstance(r.get("tips"), list) for r in recs))


def step2_recommend(analysis: dict) -> list:
    print(f"[2/3] 스타일 추천 — {TEXT_MODEL}")
    t = time.time()
    messages = [{
        "role": "user",
        "content": RECOMMEND_PROMPT.format(
            analysis=json.dumps(analysis), attrs=json.dumps(DEFAULT_ATTRS),
            n=N_RECOMMENDATIONS),
    }]
    for attempt in range(3):
        resp = post_json(OLLAMA, {
            "model": TEXT_MODEL,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.3},
            "messages": messages,
        })
        content = resp["message"]["content"]
        recs = extract_json(content).get("recommendations", [])
        if valid_recs(recs):
            break
        # 소형 로컬 모델이 개수/스키마를 어기는 경우가 흔해 교정 재시도가 필수다
        print(f"      ⚠ 검증 실패 (개수 {len(recs)}) — 교정 재시도 {attempt + 1}/2")
        messages += [
            {"role": "assistant", "content": content},
            {"role": "user", "content":
                f"Your response was invalid: it must contain EXACTLY {N_RECOMMENDATIONS} "
                "recommendations, each with exactly the 5 required keys and exactly 2 tips. "
                "Return the corrected complete JSON now."},
        ]
    else:
        sys.exit(f"추천 생성 실패: {N_RECOMMENDATIONS}개 스키마 충족 불가")

    for r in recs:
        print(f"      → {r['nameKo']} ({r['nameEn']})")
    print(f"      [{time.time()-t:.1f}s]")
    return recs


def step3_previews(recs: list) -> list:
    print(f"[3/3] 스타일 프리뷰 생성 — z-image-turbo via {IMAGE_GATEWAY}")
    OUT_DIR.mkdir(exist_ok=True)
    saved = []
    for i, r in enumerate(recs, 1):
        prompt = (f"{r['imagePrompt']}, photorealistic, clean studio background, "
                  "hairstyle catalog reference photo")
        t = time.time()
        resp = post_json(IMAGE_GATEWAY, {
            "prompt": prompt, "n": 1, "size": PREVIEW_SIZE, "response_format": "b64_json"
        })
        out = OUT_DIR / f"preview_{i}_{r['nameEn'].lower().replace(' ', '_')}.png"
        out.write_bytes(base64.b64decode(resp["data"][0]["b64_json"]))
        kb = out.stat().st_size // 1024
        print(f"      → {out.name} ({kb} KB) [{time.time()-t:.1f}s]")
        saved.append(out)
    return saved


def step4_fourcut(recs: list, previews: list, analysis: dict) -> Path:
    """프리뷰 4장을 인생네컷 스타일 세로 스트립으로 합성한다."""
    from PIL import Image, ImageDraw, ImageFont

    print("[4/4] 네컷 합성")
    FRAME_W, MARGIN, GAP, FOOTER_H = 600, 44, 24, 150
    photo_w = FRAME_W - MARGIN * 2  # 512
    strip_h = MARGIN + (photo_w + GAP) * len(previews) - GAP + FOOTER_H
    strip = Image.new("RGB", (FRAME_W, strip_h), "#101010")
    draw = ImageDraw.Draw(strip)

    font_path = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
    caption_font = ImageFont.truetype(font_path, 22)
    brand_font = ImageFont.truetype(font_path, 30)
    small_font = ImageFont.truetype(font_path, 18)

    y = MARGIN
    for rec, path in zip(recs, previews):
        img = Image.open(path).convert("RGB").resize((photo_w, photo_w))
        strip.paste(img, (MARGIN, y))
        # 프레임 하단에 스타일명 캡션 (반투명 바)
        bar = Image.new("RGBA", (photo_w, 36), (16, 16, 16, 170))
        strip.paste(Image.alpha_composite(
            img.crop((0, photo_w - 36, photo_w, photo_w)).convert("RGBA"), bar
        ).convert("RGB"), (MARGIN, y + photo_w - 36))
        draw.text((MARGIN + 12, y + photo_w - 31), rec["nameKo"],
                  font=caption_font, fill="#f5f5f5")
        y += photo_w + GAP

    # 푸터: 브랜드 + 얼굴형 + 날짜
    footer_y = strip_h - FOOTER_H + 28
    draw.text((MARGIN, footer_y), "HAIRSTYLE 네컷", font=brand_font, fill="#ffffff")
    draw.text((MARGIN, footer_y + 44),
              f"얼굴형 {analysis['faceShape']} · ai.jurepi.kr · {time.strftime('%Y.%m.%d')}",
              font=small_font, fill="#9a9a9a")

    out = OUT_DIR / "fourcut.png"
    strip.save(out)
    print(f"      → {out.name} ({FRAME_W}×{strip_h})")
    return out


def load_previous_result() -> tuple:
    """--fourcut-only 모드: 기존 result.json에서 추천·프리뷰를 읽는다."""
    summary = OUT_DIR / "result.json"
    if not summary.exists():
        sys.exit("기존 결과 없음 — 전체 파이프라인을 먼저 실행하라")
    prev = json.loads(summary.read_text())
    return prev["analysis"], prev["recommendations"], [Path(p) for p in prev["previews"]]


def main() -> None:
    if "--fourcut-only" in sys.argv:
        analysis, recs, previews = load_previous_result()
        step4_fourcut(recs, previews, analysis)
        return

    photo = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent.parent / "data" / "이재현.webp"
    if not photo.exists():
        sys.exit(f"사진 없음: {photo}")

    analysis = step1_analyze(photo)
    recs = step2_recommend(analysis)
    previews = step3_previews(recs)
    fourcut = step4_fourcut(recs, previews, analysis)

    result = {"analysis": analysis, "recommendations": recs,
              "previews": [str(p) for p in previews], "fourcut": str(fourcut)}
    summary = OUT_DIR / "result.json"
    summary.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(f"\n완료 — 요약: {summary}")
    for r, p in zip(recs, previews):
        print(f"  • {r['nameKo']}: {r['why']}  → {p.name}")


if __name__ == "__main__":
    main()
