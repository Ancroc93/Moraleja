#!/usr/bin/env python3
"""Genera los recursos para compartir del Autodiagnóstico Moraleja.

Regenerar todo (páginas, imágenes OG por personaje y og-clara):

    tools/.venv/bin/python generate-social-assets.py

Primera vez (crea el entorno con Pillow, que solo se usa para comprimir los PNG):

    python3 -m venv tools/.venv && tools/.venv/bin/pip install pillow

Fuentes de verdad:
  - Textos de cada personaje: window.CLARA.archetypes en quiz-engine.js (se lee con Node).
  - Colores y slugs: ARCH_THEMES y ARCH_SLUGS en autodiagnostico-clara-emprendedoras.html.
  - Personajes: images/characters/<slug>.jpg.

Las imágenes se renderizan con Chrome headless a partir de plantillas HTML que usan
las mismas fuentes de la web (Raleway, Montserrat, Cormorant Garamond) desde tools/fonts/.
Opciones: --only-pages (no renderiza imágenes). Variable CHROME para otra ruta de Chrome.

Salida:
  resultados/<slug>.html        landing que se abre al compartir un resultado
  images/og-<slug>.png          1200x630 por personaje
  images/og-clara.png           1200x630 general del cuestionario
"""
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "resultados"
IMAGES = ROOT / "images"
CHARACTERS = IMAGES / "characters"
FONTS = ROOT / "tools" / "fonts"
QUESTIONNAIRE = ROOT / "autodiagnostico-clara-emprendedoras.html"
SITE = "https://www.moraleja.co"
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
OG_W, OG_H = 1200, 630
MAX_OG_BYTES = 400_000

INK, INK2 = "#2B0E17", "#5C2A38"

DEFAULT_SLUGS = {
    "chispa": "la-chispa", "artesana": "la-artesana", "conectora": "la-conectora",
    "voz": "la-voz-valiosa", "capitana": "la-capitana", "exploradora": "la-exploradora",
    "brujula": "la-brujula",
}
DEFAULT_THEMES = {
    "chispa": ("#F7C4BA", "#FCF1EA", "#A3203F"),
    "artesana": ("#F5CDB6", "#FCF2EA", "#9C4524"),
    "conectora": ("#F6E3A8", "#FCF7EA", "#7E5A0E"),
    "voz": ("#DCCDEE", "#F7F2F8", "#5B3D8C"),
    "capitana": ("#F5C6D2", "#FCF1F3", "#A3385C"),
    "exploradora": ("#CDE4D4", "#F3F7F1", "#2E6A4E"),
    "brujula": ("#CCDDEF", "#F3F5F9", "#2C4B77"),
}
# Orden del abanico en og-clara: alterna fríos y cálidos, con La Chispa al centro.
FAN_ORDER = ["brujula", "voz", "capitana", "chispa", "artesana", "conectora", "exploradora"]

GOOGLE_FONTS = ("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500"
                "&family=Montserrat:wght@500;600&family=Raleway:wght@300;400;500&display=swap")


# ── Datos ────────────────────────────────────────────────────────────────────

def load_archetypes():
    script = (
        "const vm=require('vm'),fs=require('fs');const ctx={window:{}};"
        "vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),ctx);"
        "process.stdout.write(JSON.stringify(ctx.window.CLARA.archetypes));"
    )
    out = subprocess.run(["node", "-e", script, str(ROOT / "quiz-engine.js")],
                         check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def load_themes_and_slugs():
    source = QUESTIONNAIRE.read_text(encoding="utf-8")
    slugs, themes = dict(DEFAULT_SLUGS), dict(DEFAULT_THEMES)
    m = re.search(r"const ARCH_SLUGS=\{(.*?)\};", source, re.S)
    if m:
        slugs.update(dict(re.findall(r"(\w+):'([\w-]+)'", m.group(1))))
    else:
        print("Aviso: no encontré ARCH_SLUGS; uso los valores por defecto.", file=sys.stderr)
    m = re.search(r"const ARCH_THEMES=\{(.*?)\};", source, re.S)
    if m:
        for key, bg, bg2, deep in re.findall(
                r"(\w+):\{bg:'(#\w+)',bg2:'(#\w+)',deep:'(#\w+)'\}", m.group(1)):
            themes[key] = (bg, bg2, deep)
    else:
        print("Aviso: no encontré ARCH_THEMES; uso los valores por defecto.", file=sys.stderr)
    return themes, slugs


def first_sentence(text):
    m = re.match(r"(.+?[.!?])(\s|$)", text.strip())
    return m.group(1) if m else text


def esc(text):
    return html.escape(text, quote=True)


# ── Landing de resultado compartido ──────────────────────────────────────────

PAGE_CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:'Raleway',sans-serif;font-weight:400;color:var(--ink);background:var(--bg2);-webkit-font-smoothing:antialiased}
a{color:inherit}
.hero{position:relative;min-height:100vh;min-height:100svh;display:flex;flex-direction:column;background:radial-gradient(120% 80% at 80% 10%,rgba(255,255,255,.55) 0%,transparent 55%),linear-gradient(180deg,var(--bg) 0%,var(--bg2) 100%);overflow:hidden}
.top{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:26px 52px;position:relative;z-index:2}
.brand{display:flex;flex-direction:column;gap:3px;text-decoration:none;line-height:1.1;white-space:nowrap}
.brand-name{font:600 17px 'Montserrat',sans-serif;letter-spacing:-.5px;color:var(--ink)}
.brand-tag{font:italic 400 12px 'Cormorant Garamond',serif;letter-spacing:1.5px;color:var(--deep)}
.top-tag{font:600 10px 'Montserrat',sans-serif;letter-spacing:3px;text-transform:uppercase;color:var(--deep);opacity:.75;text-decoration:none}
.top-tag:hover{opacity:1}
.inner{flex:1;max-width:1180px;width:100%;margin:0 auto;padding:4px 52px 64px;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:64px;align-items:center;position:relative;z-index:1}
.reveal{animation:reveal .9s var(--d,0s) cubic-bezier(.2,.8,.2,1) both}
@keyframes reveal{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.eyebrow{display:inline-flex;align-items:center;gap:12px;font:600 11px 'Montserrat',sans-serif;letter-spacing:4px;text-transform:uppercase;color:var(--deep);margin-bottom:22px}
.eyebrow::before{content:'';width:30px;height:1.5px;background:currentColor;flex-shrink:0}
.ella{font:300 clamp(22px,2.4vw,30px)/1 'Raleway',sans-serif;letter-spacing:-.01em;color:var(--ink2)}
h1{font:400 clamp(52px,7.4vw,104px)/.98 'Raleway',sans-serif;letter-spacing:-.03em;color:var(--deep);margin:10px 0 20px}
.subtitle{font-size:clamp(16px,1.5vw,19px);line-height:1.6;color:var(--ink2);max-width:500px;margin-bottom:30px}
.voice{position:relative;max-width:540px;margin-bottom:46px;padding:22px 28px 24px;background:rgba(255,255,255,.62);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.9);border-radius:26px;font:italic 400 clamp(24px,2.5vw,32px)/1.22 'Cormorant Garamond',serif;color:var(--ink);box-shadow:0 24px 48px -30px var(--shadow)}
.voice::before,.voice::after{content:'';position:absolute;border-radius:50%;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.9)}
.voice::before{width:18px;height:18px;left:42px;bottom:-24px}
.voice::after{width:10px;height:10px;left:30px;bottom:-40px}
.voice-label{display:block;font:600 10px 'Montserrat',sans-serif;font-style:normal;letter-spacing:3px;text-transform:uppercase;color:var(--deep);margin-bottom:10px}
.desc{font-size:15.5px;line-height:1.75;color:var(--muted);max-width:500px;margin-bottom:30px}
.desc strong{font-weight:500;color:var(--ink)}
.cta{display:inline-flex;align-items:center;gap:12px;padding:19px 32px;border-radius:999px;background:var(--deep);color:#fff;text-decoration:none;font:600 12px 'Montserrat',sans-serif;letter-spacing:2.5px;text-transform:uppercase;box-shadow:0 18px 36px -16px var(--deep);transition:transform .25s ease,box-shadow .25s ease}
.cta span{font-size:16px;letter-spacing:0;transition:transform .25s ease}
.cta:hover{transform:translateY(-2px);box-shadow:0 24px 40px -16px var(--deep)}
.cta:hover span{transform:translateX(4px)}
.cta:focus-visible,.cast li a:focus-visible,.top a:focus-visible{outline:2px solid var(--deep);outline-offset:4px}
.cta-note{font-size:12.5px;color:var(--muted);margin-top:16px}
.stage{position:relative;display:flex;justify-content:center;align-items:center}
.stage::before{content:'';position:absolute;top:0;left:50%;width:min(100%,440px);aspect-ratio:3/4;border:1.5px solid var(--deep);opacity:.22;border-radius:999px 999px 34px 34px;transform:translate(calc(-50% + 24px),-24px);animation:ring 1.4s .5s cubic-bezier(.2,.8,.2,1) both}
@keyframes ring{from{opacity:0;transform:translate(-50%,0)}to{opacity:.22;transform:translate(calc(-50% + 24px),-24px)}}
.arch{position:relative;width:min(100%,440px);aspect-ratio:3/4;border-radius:999px 999px 34px 34px;overflow:hidden;background:var(--bg);box-shadow:0 0 0 10px rgba(255,255,255,.5),0 50px 90px -40px var(--shadow);animation:arch 1.1s cubic-bezier(.2,.8,.2,1) both}
@keyframes arch{from{opacity:0;transform:translateY(48px) scale(.94)}to{opacity:1;transform:none}}
.arch img{width:100%;height:100%;object-fit:cover;display:block;animation:char 1.5s .2s cubic-bezier(.2,.8,.2,1) both,float-img 7s 1.8s ease-in-out infinite}
@keyframes char{from{opacity:0;transform:scale(1.18) translateY(30px)}to{opacity:1;transform:scale(1.06)}}
@keyframes float-img{0%,100%{transform:scale(1.06) translateY(0)}50%{transform:scale(1.06) translateY(-2.5%)}}
.arch-tag{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);white-space:nowrap;background:rgba(255,255,255,.78);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);padding:10px 20px;border-radius:999px;font:600 10px 'Montserrat',sans-serif;letter-spacing:3px;text-transform:uppercase;color:var(--deep)}
.dot{position:absolute;border-radius:50%;background:var(--deep);opacity:.16;animation:float 6s ease-in-out infinite}
.dot.d1{width:14px;height:14px;top:8%;left:4%}
.dot.d2{width:8px;height:8px;top:30%;right:2%;animation-delay:1.2s}
.dot.d3{width:22px;height:22px;bottom:10%;left:0;opacity:.1;animation-delay:2.4s}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.cast{background:var(--bg2);padding:72px 52px 40px}
.cast-inner{max-width:1180px;margin:0 auto}
.cast-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:34px}
.cast-title{font:400 clamp(26px,3vw,38px)/1.15 'Raleway',sans-serif;letter-spacing:-.015em;color:var(--ink)}
.cast-title em{font-style:normal;color:var(--deep)}
.cast-link{font:600 11px 'Montserrat',sans-serif;letter-spacing:2.5px;text-transform:uppercase;color:var(--deep);text-underline-offset:6px}
.cast ul{list-style:none;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:22px}
.cast li a{display:block;text-decoration:none;text-align:center}
.thumb{display:block;aspect-ratio:3/4;border-radius:999px 999px 18px 18px;overflow:hidden;background:var(--t-bg);box-shadow:0 0 0 5px #fff,0 22px 40px -26px var(--t-deep);transition:transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s ease}
.thumb img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.06)}
.cast li a:hover .thumb{transform:translateY(-6px) rotate(-1.5deg);box-shadow:0 0 0 5px #fff,0 30px 46px -24px var(--t-deep)}
.cast-name{display:block;margin-top:16px;font:400 16px/1.25 'Raleway',sans-serif;color:var(--ink)}
.cast-voice{display:block;margin-top:4px;font:italic 400 15px/1.3 'Cormorant Garamond',serif;color:var(--t-deep)}
.foot{max-width:1180px;margin:56px auto 0;padding-top:24px;border-top:1px solid rgba(43,14,23,.08);display:flex;justify-content:space-between;gap:8px 24px;flex-wrap:wrap;font-size:12px;line-height:1.7;color:var(--muted)}
.foot a{color:var(--deep)}
@media(min-width:901px) and (max-height:880px){
  .top{padding:20px 52px}
  .eyebrow{margin-bottom:16px}
  .ella{font-size:24px}
  h1{font-size:clamp(52px,6.2vw,84px);margin:6px 0 16px}
  .subtitle{margin-bottom:22px}
  .voice{font-size:27px;padding:18px 26px 20px;margin-bottom:38px}
  .desc{margin-bottom:22px}
  .cta{padding:17px 30px}
  .cta-note{margin-top:12px}
  .arch,.stage::before{width:min(100%,400px)}
}
@media(max-width:900px){
  .top{padding:20px 24px}
  .inner{grid-template-columns:1fr;gap:40px;padding:0 24px 64px;text-align:center}
  .stage{order:-1}
  .arch,.stage::before{width:min(68vw,320px)}
  .arch{box-shadow:0 0 0 8px rgba(255,255,255,.5),0 40px 70px -36px var(--shadow)}
  .eyebrow{justify-content:center;letter-spacing:3px;font-size:10px}
  .eyebrow::before{display:none}
  .subtitle,.voice,.desc{margin-left:auto;margin-right:auto}
  .voice{text-align:left}
  .cta{padding:18px 26px;font-size:11px;letter-spacing:1.8px}
  .cast{padding:56px 24px 32px}
  .cast-head{flex-direction:column;align-items:flex-start;gap:14px}
  .foot{flex-direction:column}
  .cast ul{grid-template-columns:repeat(3,minmax(0,1fr));gap:26px 16px}
  .cast-voice{display:none}
  .cast-name{font-size:14px;margin-top:12px}
}
@media(max-width:420px){.top-tag{display:none}.cta{width:100%;justify-content:center}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
"""


def page_html(key, arch, archetypes, themes, slugs):
    slug = slugs[key]
    bg, bg2, deep = themes[key]
    name = arch["name"]
    url = f"{SITE}/resultados/{slug}.html"
    og_image = f"{SITE}/images/og-{slug}.png"
    title = f"{name} · Personaje Moraleja"
    og_title = f"Soy {name} · ¿Y tú, qué personaje Moraleja eres?"
    subtitle = arch["subtitle"]
    description = (f"{name}, personaje del Autodiagnóstico Moraleja: {subtitle[:1].lower()}{subtitle[1:]} "
                   "Descubre cómo tu voz interna influye en tu forma de comunicar y decidir.")
    og_description = (f"Mi voz interna dice: “{arch['innerVoice']}” "
                      "¿Y la tuya? Descubre tu personaje Moraleja, gratis, con Moraleja.")
    og_alt = f"{name}, personaje Moraleja. Su voz interna dice: “{arch['innerVoice']}”"

    cast = []
    for other_key, other in archetypes.items():
        if other_key == key:
            continue
        o_bg, _, o_deep = themes[other_key]
        o_slug = slugs[other_key]
        cast.append(
            f'<li><a href="{o_slug}.html" style="--t-bg:{o_bg};--t-deep:{o_deep}">'
            f'<span class="thumb"><img src="../images/characters/{o_slug}.jpg" alt="" '
            f'width="864" height="1152" loading="lazy" decoding="async"></span>'
            f'<span class="cast-name">{esc(other["name"])}</span>'
            f'<span class="cast-voice">“{esc(other["innerVoice"])}”</span></a></li>'
        )

    return f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="theme-color" content="{bg}">
  <link rel="canonical" href="{url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Moraleja">
  <meta property="og:locale" content="es_CO">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{esc(og_title)}">
  <meta property="og:description" content="{esc(og_description)}">
  <meta property="og:image" content="{og_image}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="{OG_W}">
  <meta property="og:image:height" content="{OG_H}">
  <meta property="og:image:alt" content="{esc(og_alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(og_title)}">
  <meta name="twitter:description" content="{esc(og_description)}">
  <meta name="twitter:image" content="{og_image}">
  <meta name="twitter:image:alt" content="{esc(og_alt)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="{GOOGLE_FONTS}" rel="stylesheet">
  <link rel="preload" as="image" href="../images/characters/{slug}.jpg">
  <style>
:root{{--bg:{bg};--bg2:{bg2};--deep:{deep};--shadow:{deep}55;--ink:{INK};--ink2:{INK2};--muted:rgba(43,14,23,.68)}}{PAGE_CSS}  </style>
</head>
<body>
<main>
  <section class="hero">
    <header class="top">
      <a class="brand" href="../index.html" aria-label="Moraleja, Comunicación Consciente"><span class="brand-name">Moraleja</span><span class="brand-tag">Comunicación Consciente</span></a>
      <a class="top-tag" href="../autodiagnostico-clara-emprendedoras.html">Autodiagnóstico Moraleja</a>
    </header>
    <div class="inner">
      <div class="copy">
        <p class="eyebrow reveal" style="--d:.1s">Te compartieron su personaje Moraleja</p>
        <p class="ella reveal" style="--d:.2s">Ella es</p>
        <h1 class="reveal" style="--d:.28s">{esc(name)}</h1>
        <p class="subtitle reveal" style="--d:.38s">{esc(arch['subtitle'])}</p>
        <blockquote class="voice reveal" style="--d:.5s"><span class="voice-label">Su voz interna dice</span>“{esc(arch['innerVoice'])}”</blockquote>
        <p class="desc reveal" style="--d:.6s"><strong>¿Te suena familiar?</strong> {esc(first_sentence(arch['desc']))}</p>
        <div class="reveal" style="--d:.7s">
          <a class="cta" href="../autodiagnostico-clara-emprendedoras.html">¿Y tú? Descubre tu personaje <span aria-hidden="true">→</span></a>
          <p class="cta-note">Autodiagnóstico gratuito para emprendedoras · 20 preguntas</p>
        </div>
      </div>
      <div class="stage">
        <span class="dot d1" aria-hidden="true"></span><span class="dot d2" aria-hidden="true"></span><span class="dot d3" aria-hidden="true"></span>
        <div class="arch"><img src="../images/characters/{slug}.jpg" alt="Personaje de {esc(name)}" width="864" height="1152" fetchpriority="high"><span class="arch-tag">Personaje Moraleja</span></div>
      </div>
    </div>
  </section>
  <section class="cast" aria-labelledby="cast-title">
    <div class="cast-inner">
      <div class="cast-head">
        <h2 class="cast-title" id="cast-title">Hay siete personajes. <em>¿Cuál habla en ti?</em></h2>
        <a class="cast-link" href="../autodiagnostico-clara-emprendedoras.html">Hacer el test →</a>
      </div>
      <ul>
        {chr(10).join('        ' + item for item in cast).lstrip()}
      </ul>
      <footer class="foot">
        <span>Cada personaje describe un momento actual y puede cambiar con la práctica.</span>
        <span><a href="../index.html">Moraleja</a> · Comunicación Consciente · <a href="../politica-datos.html">Tratamiento de datos</a></span>
      </footer>
    </div>
  </section>
</main>
</body>
</html>
"""


# ── Plantillas de imágenes OG ────────────────────────────────────────────────

def font_faces():
    fonts = FONTS.as_uri()
    return f"""
@font-face{{font-family:'Raleway';src:url('{fonts}/Raleway.ttf') format('truetype');font-weight:100 900;font-style:normal}}
@font-face{{font-family:'Montserrat';src:url('{fonts}/Montserrat.ttf') format('truetype');font-weight:100 900;font-style:normal}}
@font-face{{font-family:'Cormorant Garamond';src:url('{fonts}/CormorantGaramond-Italic.ttf') format('truetype');font-weight:300 700;font-style:italic}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{OG_W}px;height:{OG_H}px;overflow:hidden}}
body{{position:relative;font-family:'Raleway',sans-serif;color:{INK};-webkit-font-smoothing:antialiased}}
.wordmark{{display:flex;flex-direction:column;gap:2px;line-height:1.05}}
.wordmark b{{font:600 27px 'Montserrat',sans-serif;letter-spacing:-.6px;color:{INK}}}
.wordmark i{{font:italic 500 20px 'Cormorant Garamond',serif;letter-spacing:.3px}}
.site{{font:600 15px 'Montserrat',sans-serif;letter-spacing:2.5px;text-transform:uppercase}}
"""


FIT_SCRIPT = """
<script>
document.fonts.ready.then(function(){
  document.querySelectorAll('[data-fit]').forEach(function(el){
    var max=parseFloat(el.dataset.fit),size=parseFloat(getComputedStyle(el).fontSize);
    while(el.scrollWidth>max&&size>40){size-=2;el.style.fontSize=size+'px';}
  });
  document.body.dataset.ready='1';
});
</script>
"""


def og_archetype_html(key, arch, themes, slugs):
    bg, bg2, deep = themes[key]
    img = (CHARACTERS / f"{slugs[key]}.jpg").as_uri()
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><style>{font_faces()}
body{{background:radial-gradient(90% 90% at 78% 0%,rgba(255,255,255,.6) 0%,transparent 60%),linear-gradient(160deg,{bg} 0%,{bg} 30%,{bg2} 100%)}}
.copy{{position:absolute;left:76px;top:64px;bottom:56px;width:620px;display:flex;flex-direction:column}}
.label{{display:flex;align-items:center;gap:14px;font:600 16px 'Montserrat',sans-serif;letter-spacing:5px;text-transform:uppercase;color:{deep}}}
.label::before{{content:'';width:36px;height:2px;background:currentColor}}
.main{{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:6px}}
.soy{{font:300 42px/1 'Raleway',sans-serif;letter-spacing:-.01em;color:{INK2}}}
.name{{align-self:flex-start;font:400 104px/1 'Raleway',sans-serif;letter-spacing:-.035em;color:{deep};white-space:nowrap;margin:6px 0 26px;padding-bottom:6px}}
.voice{{position:relative;align-self:flex-start;max-width:600px;padding:18px 28px 21px;background:rgba(255,255,255,.66);border:1.5px solid rgba(255,255,255,.95);border-radius:26px;box-shadow:0 24px 44px -30px {deep}66}}
.voice::before,.voice::after{{content:'';position:absolute;border-radius:50%;background:rgba(255,255,255,.66);border:1.5px solid rgba(255,255,255,.95)}}
.voice::before{{width:18px;height:18px;left:42px;bottom:-25px}}
.voice::after{{width:10px;height:10px;left:30px;bottom:-41px}}
.voice small{{display:block;font:600 13px 'Montserrat',sans-serif;letter-spacing:3.5px;text-transform:uppercase;color:{deep};margin-bottom:6px}}
.voice q{{display:block;quotes:'“' '”';font:italic 500 37px/1.14 'Cormorant Garamond',serif;color:{INK}}}
.foot{{display:flex;align-items:center;gap:22px}}
.foot .wordmark i{{color:{deep}}}
.foot .sep{{width:1.5px;height:40px;background:{deep};opacity:.3}}
.foot .site{{color:{deep}}}
.ring{{position:absolute;right:76px;top:58px;width:384px;height:512px;border:2px solid {deep};opacity:.22;border-radius:999px 999px 34px 34px;transform:translate(20px,-20px)}}
.arch{{position:absolute;right:96px;top:78px;width:384px;height:512px;border-radius:999px 999px 34px 34px;overflow:hidden;background:{bg};box-shadow:0 0 0 10px rgba(255,255,255,.55),0 44px 70px -34px {deep}77}}
.arch img{{width:100%;height:100%;object-fit:cover;transform:scale(1.06);transform-origin:50% 60%}}
.dot{{position:absolute;border-radius:50%;background:{deep}}}
</style></head><body>
<div class="copy">
  <div class="label">Mi personaje Moraleja</div>
  <div class="main">
    <div class="soy">Soy</div>
    <div class="name" data-fit="610">{esc(arch['name'])}</div>
    <div class="voice"><small>Mi voz interna dice</small><q>{esc(arch['innerVoice'])}</q></div>
  </div>
  <div class="foot"><div class="wordmark"><b>Moraleja</b><i>Comunicación Consciente</i></div><span class="sep"></span><span class="site">moraleja.co</span></div>
</div>
<span class="dot" style="width:14px;height:14px;right:520px;top:96px;opacity:.16"></span>
<span class="dot" style="width:9px;height:9px;right:56px;top:300px;opacity:.18"></span>
<span class="dot" style="width:22px;height:22px;right:500px;bottom:70px;opacity:.1"></span>
<div class="ring"></div>
<div class="arch"><img src="{img}" alt=""></div>
{FIT_SCRIPT}</body></html>"""


def og_general_html(archetypes, themes, slugs):
    order = [k for k in FAN_ORDER if k in archetypes] + [k for k in archetypes if k not in FAN_ORDER]
    n = len(order)
    mid = (n - 1) / 2
    w, h, step = 212, 284, 150
    arches = []
    for i, key in enumerate(order):
        bg, _, deep = themes[key]
        off = i - mid
        left = OG_W / 2 - w / 2 + off * step
        drop = abs(off) * 18
        rot = off * 5.5
        z = 10 - int(abs(off) * 2)
        img = (CHARACTERS / f"{slugs[key]}.jpg").as_uri()
        arches.append(
            f'<div class="fan" style="left:{left:.0f}px;bottom:{-26 - drop:.0f}px;'
            f'transform:rotate({rot:.1f}deg);z-index:{z};background:{bg};'
            f'box-shadow:0 0 0 7px #fff,0 30px 50px -26px {deep}88">'
            f'<img src="{img}" alt=""></div>'
        )
    blobs = "".join(
        f'<span class="blob" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;background:{themes[k][0]}"></span>'
        for k, x, y, s in [("voz", -120, 120, 420), ("conectora", 880, -140, 420),
                           ("exploradora", 940, 260, 380), ("chispa", 60, -200, 380)]
        if k in themes
    )
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><style>{font_faces()}
body{{background:linear-gradient(180deg,#FCF1EA 0%,#FBE6E4 100%)}}
.blob{{position:absolute;border-radius:50%;filter:blur(70px);opacity:.75}}
.top{{position:absolute;left:56px;right:56px;top:40px;display:flex;justify-content:space-between;align-items:center;z-index:20}}
.top .wordmark i{{color:#A3203F}}
.top .site{{color:#A3203F}}
.head{{position:absolute;left:0;right:0;top:118px;text-align:center;z-index:20}}
.label{{display:inline-flex;align-items:center;gap:14px;font:600 14px 'Montserrat',sans-serif;letter-spacing:5px;text-transform:uppercase;color:#A3203F;margin-bottom:16px}}
.label::before,.label::after{{content:'';width:30px;height:1.5px;background:currentColor}}
h1{{font:400 64px/1.04 'Raleway',sans-serif;letter-spacing:-.03em;color:{INK}}}
p{{margin-top:10px;font:italic 500 38px/1.1 'Cormorant Garamond',serif;color:#A3203F}}
.fan{{position:absolute;width:{w}px;height:{h}px;border-radius:999px 999px 22px 22px;overflow:hidden;transform-origin:50% 100%}}
.fan img{{width:100%;height:100%;object-fit:cover;transform:scale(1.08);transform-origin:50% 40%}}
</style></head><body>
{blobs}
<div class="top"><div class="wordmark"><b>Moraleja</b><i>Comunicación Consciente</i></div><span class="site">moraleja.co</span></div>
<div class="head"><div class="label">Autodiagnóstico Moraleja</div><h1>¿Qué te dice tu voz interna?</h1><p>Descubre tu personaje Moraleja</p></div>
{''.join(arches)}
{FIT_SCRIPT}</body></html>"""


# ── Render ───────────────────────────────────────────────────────────────────

def render_png(html_text, out_path, workdir):
    page = workdir / f"{out_path.stem}.html"
    page.write_text(html_text, encoding="utf-8")
    shot = workdir / f"{out_path.stem}.png"
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
        "--no-default-browser-check", "--allow-file-access-from-files",
        f"--user-data-dir={workdir / 'chrome-profile'}", "--force-device-scale-factor=1",
        f"--window-size={OG_W},{OG_H}", "--virtual-time-budget=4000",
        f"--screenshot={shot}", page.as_uri(),
    ], check=True, capture_output=True)
    optimize_png(shot, out_path)


def optimize_png(src, dest):
    try:
        from PIL import Image
    except ImportError:
        shutil.copyfile(src, dest)
        print(f"  Aviso: sin Pillow, {dest.name} queda sin comprimir.", file=sys.stderr)
        return
    with Image.open(src) as im:
        im = im.convert("RGB")
        if im.size != (OG_W, OG_H):
            im = im.crop((0, 0, OG_W, OG_H))
        im.save(dest, optimize=True)
        if dest.stat().st_size > MAX_OG_BYTES:
            im.quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                        dither=Image.Dither.FLOYDSTEINBERG).save(dest, optimize=True)


def main():
    archetypes = load_archetypes()
    themes, slugs = load_themes_and_slugs()
    missing = [k for k in archetypes if k not in themes or k not in slugs]
    if missing:
        sys.exit(f"Faltan tema o slug para: {', '.join(missing)}")

    RESULTS.mkdir(exist_ok=True)
    for key, arch in archetypes.items():
        (RESULTS / f"{slugs[key]}.html").write_text(
            page_html(key, arch, archetypes, themes, slugs), encoding="utf-8")
    print(f"Páginas: {len(archetypes)} en resultados/")

    if "--only-pages" in sys.argv:
        return
    if not Path(CHROME).exists():
        sys.exit(f"No encontré Chrome en {CHROME}. Define la variable CHROME.")

    with tempfile.TemporaryDirectory(prefix="clara-og-") as tmp:
        workdir = Path(tmp)
        for key, arch in archetypes.items():
            out = IMAGES / f"og-{slugs[key]}.png"
            render_png(og_archetype_html(key, arch, themes, slugs), out, workdir)
            print(f"  {out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")
        out = IMAGES / "og-clara.png"
        render_png(og_general_html(archetypes, themes, slugs), out, workdir)
        print(f"  {out.relative_to(ROOT)}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
