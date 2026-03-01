# crop-avatars.py — Run from project root: python crop-avatars.py
# Expects: public/icons/avatars/1.png through 15.png (3x3 grids on white bg)
# Creates: public/icons/avatars/avatar-1.png through avatar-135.png

from PIL import Image
import numpy as np
import os

src_dir = os.path.join('public', 'icons', 'avatars')

def find_centers(img):
    """Find the center of each avatar circle in a 3x3 grid."""
    arr = np.array(img.convert('RGB'))
    h, w = arr.shape[:2]
    # Mask: non-white pixels
    mask = ~((arr[:,:,0] > 240) & (arr[:,:,1] > 240) & (arr[:,:,2] > 240))
    
    cell_w = w // 3
    cell_h = h // 3
    centers = []
    
    for r in range(3):
        for c in range(3):
            y1, y2 = r * cell_h, (r+1) * cell_h
            x1, x2 = c * cell_w, (c+1) * cell_w
            cell_mask = mask[y1:y2, x1:x2]
            
            rows = np.any(cell_mask, axis=1)
            cols = np.any(cell_mask, axis=0)
            
            if rows.any() and cols.any():
                rmin, rmax = np.where(rows)[0][[0, -1]]
                cmin, cmax = np.where(cols)[0][[0, -1]]
                cx = x1 + (cmin + cmax) // 2
                cy = y1 + (rmin + rmax) // 2
            else:
                cx = x1 + cell_w // 2
                cy = y1 + cell_h // 2
            
            centers.append((cx, cy))
    
    return centers

total = 0
for i in range(1, 16):
    f = os.path.join(src_dir, f'{i}.png')
    if not os.path.exists(f):
        print(f'Skipping {i}.png (not found)')
        continue
    
    img = Image.open(f)
    w, h = img.size
    centers = find_centers(img)
    
    # Crop size: use ~75% of cell size to avoid any neighbor bleed
    crop_size = int(min(w, h) / 3 * 0.76)
    half = crop_size // 2
    
    for j, (cx, cy) in enumerate(centers):
        num = (i - 1) * 9 + j + 1
        left = max(0, cx - half)
        top = max(0, cy - half)
        right = min(w, left + crop_size)
        bottom = min(h, top + crop_size)
        
        avatar = img.crop((left, top, right, bottom)).resize((128, 128), Image.LANCZOS)
        out = os.path.join(src_dir, f'avatar-{num}.png')
        avatar.save(out)
        print(f'avatar-{num}.png')
        total += 1
    
    print(f'Grid {i} done')

print(f'\nDone! {total} avatars created.')
