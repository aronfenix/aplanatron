"""Rebuild the self-contained game script without needing the original font files.

The supplied index.html keeps its embedded fonts and artwork. This script only
replaces its JavaScript with the editable files in codigo/src, then refreshes
the static copies used by Cloudflare and GitHub Pages.
"""

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'codigo' / 'src'
ORDER = ('engine audio art art2 maps world data ui menus game_base globos '
         'g_banderas g_carrera g_rios g_agencia g_puzle play chapters hub '
         'intro endcine videos main').split()
STATIC = ('index.html', 'accounts.css', 'accounts.js', 'icon-192.png',
          'icon-512.png', 'manifest.webmanifest')

html_path = ROOT / 'index.html'
html = html_path.read_text(encoding='utf-8')
start = html.index('<script>') + len('<script>')
end = html.index('</script>', start)
parts = ['const GEO=' + (SOURCE / 'geo.json').read_text(encoding='utf-8') + ';']
parts += [(SOURCE / (name + '.js')).read_text(encoding='utf-8') for name in ORDER]
html = html[:start] + '\n' + '\n'.join(parts) + '\n' + html[end:]
html_path.write_text(html, encoding='utf-8')

for dirname in ('public', 'docs'):
    target = ROOT / dirname
    target.mkdir(exist_ok=True)
    for name in STATIC:
        shutil.copyfile(ROOT / name, target / name)
print('Juego actualizado en index.html, public/ y docs/.')
