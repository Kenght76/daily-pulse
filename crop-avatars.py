# crop-avatars.py — Run from project root: python crop-avatars.py
from PIL import Image
import os

src_dir = os.path.join('public', 'icons', 'avatars')
pad = 45

total = 0
for i in range(1, 16):
    f = os.path.join(src_dir, f'{i}.png')
    if not os.path.exists(f):
        print(f'Skipping {i}.png (not found)')
        continue
    img = Image.open(f)
    w, h = img.size
    cell_w = w // 3
    cell_h = h // 3
    for r in range(3):
        for c in range(3):
            num = (i - 1) * 9 + r * 3 + c + 1
            left = c * cell_w + pad
            top = r * cell_h + pad
            right = (c + 1) * cell_w - pad
            bottom = (r + 1) * cell_h - pad
            avatar = img.crop((left, top, right, bottom)).resize((128, 128))
            avatar.save(os.path.join(src_dir, f'avatar-{num}.png'))
            print(f'avatar-{num}.png')
            total += 1
    print(f'Grid {i} done')
print(f'\nDone! {total} avatars created.')
