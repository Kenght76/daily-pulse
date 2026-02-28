# crop-avatars.py
# Run: python crop-avatars.py
# Expects: public/icons/avatars/1.png through 15.png (3x3 grids)
# Creates: public/icons/avatars/avatar-1.png through avatar-135.png

from PIL import Image
import os

src_dir = os.path.join('public', 'icons', 'avatars')

for i in range(1, 16):
    f = os.path.join(src_dir, f'{i}.png')
    if not os.path.exists(f):
        print(f'Skipping {i}.png (not found)')
        continue

    img = Image.open(f)
    w, h = img.size
    cell_w = w / 3
    cell_h = h / 3

    # Crop size = ~82% of cell to avoid neighbor circles
    crop = int(min(cell_w, cell_h) * 0.82)
    half = crop // 2

    # Centers of each cell
    centers_x = [cell_w * 0.5, cell_w * 1.5, cell_w * 2.5]
    centers_y = [cell_h * 0.5, cell_h * 1.5, cell_h * 2.5]

    for r in range(3):
        for c in range(3):
            num = (i - 1) * 9 + r * 3 + c + 1
            cx = int(centers_x[c])
            cy = int(centers_y[r])
            left = max(0, cx - half)
            top = max(0, cy - half)
            right = min(w, left + crop)
            bottom = min(h, top + crop)

            avatar = img.crop((left, top, right, bottom)).resize((128, 128), Image.LANCZOS)
            out = os.path.join(src_dir, f'avatar-{num}.png')
            avatar.save(out)
            print(f'  avatar-{num}.png')

    print(f'Grid {i} done')

print(f'\nAll done!')
