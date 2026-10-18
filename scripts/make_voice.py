"""Makes missing Venkat (male) and Sasi (female) clips for the lines in scripts/voice-lines.json.
Uses the free Microsoft neural voices through edge-tts. Skips lines that already have a clip.
Hash and sentence splitting match js/avatar.js exactly."""
import asyncio, json, os, re, subprocess, sys, tempfile

ROOT = os.environ.get('SITE_ROOT', '.')
VOICES = {'m': 'en-IN-PrabhatNeural', 'f': 'en-IN-NeerjaNeural'}
M32 = 0xFFFFFFFF

def i32(x):
    x &= M32
    return x - (1 << 32) if x & 0x80000000 else x

def imul(a, b):
    return i32((a & M32) * (b & M32))

def b36(n):
    d = '0123456789abcdefghijklmnopqrstuvwxyz'
    s = ''
    while n:
        n, r = divmod(n, 36); s = d[r] + s
    return s or '0'

def vnorm(s):
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]+', ' ', str(s).lower())).strip()

def vhash(s):
    h1, h2 = i32(0xdeadbeef), i32(0x41c6ce57)
    for ch in s:
        c = ord(ch)  # JS charCodeAt (UTF-16); lines are plain ASCII after vnorm
        h1 = imul(h1 ^ c, 2654435761); h2 = imul(h2 ^ c, 1597334677)
    h1 = i32(imul(h1 ^ ((h1 & M32) >> 16), 2246822507) ^ imul(h2 ^ ((h2 & M32) >> 13), 3266489909))
    h2 = i32(imul(h2 ^ ((h2 & M32) >> 16), 2246822507) ^ imul(h1 ^ ((h1 & M32) >> 13), 3266489909))
    return b36(4294967296 * (2097151 & h2) + (h1 & M32))

def vsplit(t):
    t = re.sub(r'\s+', ' ', str(t)).strip()
    return [x.strip() for x in re.findall(r'[^.!?;:\n]+[.!?;:]?', t) if len(vnorm(x.strip())) >= 2]

async def make(text, voice, out):
    import edge_tts
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, 'a.mp3')
        await edge_tts.Communicate(text, voice, rate='-4%').save(raw)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-ar', '24000', '-ac', '1', '-b:a', '40k', out], check=True)

async def main():
    lines = json.load(open(os.path.join(ROOT, 'scripts', 'voice-lines.json')))
    ixp = os.path.join(ROOT, 'voice', 'index.json'); ix = json.load(open(ixp))
    made = 0
    for line in lines:
        for s in vsplit(line):
            h = vhash(vnorm(s))
            for g, voice in VOICES.items():
                if h in ix[g]: continue
                os.makedirs(os.path.join(ROOT, 'voice', g), exist_ok=True)
                out = os.path.join(ROOT, 'voice', g, h + '.mp3')
                for attempt in range(3):
                    try: await make(s, voice, out); break
                    except Exception as e:
                        print('retry', g, s[:40], e); await asyncio.sleep(2)
                else: continue
                ix[g].append(h); made += 1; print('made', g, h, s[:50])
    for g in ix: ix[g] = sorted(set(ix[g]))
    json.dump(ix, open(ixp, 'w'), separators=(',', ':'))
    print('clips made:', made)

if __name__ == '__main__':
    asyncio.run(main())
