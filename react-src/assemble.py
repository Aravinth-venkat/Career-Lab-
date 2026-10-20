import re,subprocess
subprocess.run(['node','build.mjs','/tmp/live-out'],check=True,cwd='/home/claude/cl-react')
R='/home/claude/career-lab-/'
src=open('/tmp/live-out/index.html').read()
open(R+'app/app.css','w').write(re.search(r'<style>(.*?)</style>',src,re.S).group(1))
open(R+'app/app.js','w').write(re.findall(r'<script>(.*?)</script>',src,re.S)[-1])
