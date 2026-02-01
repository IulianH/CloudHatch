# file: parcel_from_point_smallest_auto_roi.py
"""
Detect the smallest parcel (region) that contains a required inside point.
Automatically derives an ROI around the point (expands if needed).

Inputs (required):
- input image path
- output image path
- inside point: PX PY (image pixel coordinates)

Outputs:
- Output image with selected parcel contour drawn in red
- JSON printed to stdout
- Optional polygon JSON file if --polygon-out is provided

Install:
  pip install opencv-python numpy

Example:
  python parcel_from_point_smallest_auto_roi.py input.png output.png --point 780 1050 --polygon-out parcel.json
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np


@dataclass(frozen=True)
class Params:
    # Edge/line extraction
    blur_ksize: int = 5
    canny_low: int = 50
    canny_high: int = 150

    # Morphology to connect small gaps in lines
    close_ksize: int = 5  # odd
    dilate_px: int = 1

    # Candidate filtering
    min_region_area_frac_in_roi: float = 0.0008  # reject tiny noise regions

    # If the provided point lands on a line, snap to nearest free pixel within this radius
    snap_radius_px: int = 6

    # Contour simplification (for polygon output)
    approx_eps_frac: float = 0.003

    # Drawing
    contour_color_bgr: Tuple[int, int, int] = (0, 0, 255)  # red
    contour_thickness: int = 3


@dataclass(frozen=True)
class AutoRoiParams:
    """
    ROI starts as a square centered at the point. If detection fails, it expands.
    """
    initial_half_size_px: int = 450  # ROI size = 2*half_size
    max_half_size_px: int = 2500
    grow_factor: float = 1.6
    max_attempts: int = 6


def _ensure_odd(k: int) -> int:
    return k if k % 2 == 1 else k + 1


def _clamp_roi(x: int, y: int, w: int, h: int, img_w: int, img_h: int) -> Tuple[int, int, int, int]:
    x = max(0, min(x, img_w - 1))
    y = max(0, min(y, img_h - 1))
    w = max(1, min(w, img_w - x))
    h = max(1, min(h, img_h - y))
    return x, y, w, h


def _point_in_rect(px: int, py: int, x: int, y: int, w: int, h: int) -> bool:
    return x <= px < x + w and y <= py < y + h


def roi_from_point(px: int, py: int, half: int, img_w: int, img_h: int) -> Tuple[int, int, int, int]:
    x = px - half
    y = py - half
    w = 2 * half
    h = 2 * half
    return _clamp_roi(x, y, w, h, img_w, img_h)


def extract_walls_mask(roi_bgr: np.ndarray, p: Params) -> np.ndarray:
    """
    Returns uint8 mask of walls (1=wall, 0=free) in ROI.
    """
    gray = cv2.cvtColor(roi_bgr, cv2.COLOR_BGR2GRAY)

    k = _ensure_odd(p.blur_ksize)
    if k > 1:
        gray = cv2.GaussianBlur(gray, (k, k), 0)

    edges = cv2.Canny(gray, p.canny_low, p.canny_high)

    if p.dilate_px > 0:
        dk = 2 * p.dilate_px + 1
        edges = cv2.dilate(edges, np.ones((dk, dk), np.uint8), iterations=1)

    ck = _ensure_odd(p.close_ksize)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (ck, ck))
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)

    return (edges > 0).astype(np.uint8)


def label_regions_from_walls(walls01: np.ndarray) -> Tuple[np.ndarray, int]:
    """
    Regions are connected components of free space (not walls).
    Returns (labels int32, outside_label).
    """
    free01 = (walls01 == 0).astype(np.uint8)
    _, labels = cv2.connectedComponents(free01, connectivity=8)

    h, w = labels.shape
    corners = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    votes: Dict[int, int] = {}
    for yy, xx in corners:
        lab = int(labels[yy, xx])
        votes[lab] = votes.get(lab, 0) + 1
    outside_label = max(votes.items(), key=lambda kv: kv[1])[0]
    return labels.astype(np.int32), outside_label


def snap_point_to_free(labels: np.ndarray, walls01: np.ndarray, outside_label: int, x: int, y: int, r: int) -> Optional[Tuple[int, int]]:
    """
    If point hits outside or wall, search for nearest free pixel belonging to a non-outside region.
    Returns snapped (x,y) in ROI coords or None.
    """
    h, w = labels.shape
    x = int(np.clip(x, 0, w - 1))
    y = int(np.clip(y, 0, h - 1))

    def is_valid_free(xx: int, yy: int) -> bool:
        if walls01[yy, xx] != 0:
            return False
        lab = int(labels[yy, xx])
        return lab != 0 and lab != outside_label

    if is_valid_free(x, y):
        return (x, y)

    for rad in range(1, r + 1):
        for dy in range(-rad, rad + 1):
            yy = y + dy
            if yy < 0 or yy >= h:
                continue
            for dx in range(-rad, rad + 1):
                xx = x + dx
                if xx < 0 or xx >= w:
                    continue
                if is_valid_free(xx, yy):
                    return (xx, yy)

    return None


def contour_for_label(labels: np.ndarray, label_id: int, eps_frac: float) -> Optional[np.ndarray]:
    """
    Returns simplified contour for a region label in ROI coords.
    """
    region_mask = (labels == label_id).astype(np.uint8) * 255
    cnts, _ = cv2.findContours(region_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return None
    cnt = max(cnts, key=cv2.contourArea)

    peri = cv2.arcLength(cnt, True)
    eps = max(1.0, eps_frac * peri)
    approx = cv2.approxPolyDP(cnt, eps, True)

    if approx.shape[0] < 3:
        return None
    return approx


def contour_contains_point(cnt: np.ndarray, pt_xy: Tuple[int, int]) -> bool:
    x, y = pt_xy
    return cv2.pointPolygonTest(cnt, (float(x), float(y)), False) >= 0


def polygon_points_global(cnt_roi: np.ndarray, roi_x: int, roi_y: int) -> List[Dict[str, int]]:
    pts = cnt_roi.reshape(-1, 2)
    return [{"x": int(x + roi_x), "y": int(y + roi_y)} for x, y in pts]


def draw_contour_global(
    img_bgr: np.ndarray,
    cnt_roi: np.ndarray,
    roi_x: int,
    roi_y: int,
    color_bgr: Tuple[int, int, int],
    thickness: int,
) -> np.ndarray:
    out = img_bgr.copy()
    cnt = cnt_roi.copy()
    cnt[:, 0, 0] += roi_x
    cnt[:, 0, 1] += roi_y
    cv2.drawContours(out, [cnt], -1, color_bgr, thickness=thickness, lineType=cv2.LINE_AA)
    return out


def detect_smallest_parcel_in_roi_containing_point(
    img_bgr: np.ndarray,
    roi: Tuple[int, int, int, int],
    point: Tuple[int, int],
    p: Params,
) -> Tuple[Optional[np.ndarray], Dict]:
    """
    Returns (selected_contour_in_roi_coords or None, debug_info).
    """
    H, W = img_bgr.shape[:2]
    rx, ry, rw, rh = _clamp_roi(*roi, W, H)

    px, py = point
    if not _point_in_rect(px, py, rx, ry, rw, rh):
        return None, {"reason": "point_outside_roi", "roi": [rx, ry, rw, rh], "point": [px, py]}

    roi_bgr = img_bgr[ry : ry + rh, rx : rx + rw]
    walls01 = extract_walls_mask(roi_bgr, p)
    labels, outside_label = label_regions_from_walls(walls01)

    prx = px - rx
    pry = py - ry
    snapped = snap_point_to_free(labels, walls01, outside_label, prx, pry, p.snap_radius_px)
    if snapped is None:
        return None, {"reason": "no_valid_region_near_point", "snap_radius_px": p.snap_radius_px}

    sx, sy = snapped

    roi_area = rw * rh
    min_area = max(200, int(p.min_region_area_frac_in_roi * roi_area))

    max_label = int(labels.max())
    best_cnt = None
    best_area = None

    for lab in range(1, max_label + 1):
        if lab == outside_label:
            continue
        region_area = int((labels == lab).sum())
        if region_area < min_area:
            continue

        cnt = contour_for_label(labels, lab, p.approx_eps_frac)
        if cnt is None:
            continue

        if not contour_contains_point(cnt, (sx, sy)):
            continue

        if best_area is None or region_area < best_area:
            best_area = region_area
            best_cnt = cnt

    if best_cnt is None:
        return None, {
            "reason": "no_parcel_containing_point_after_filtering",
            "min_area": min_area,
            "snapped_point_in_roi": [sx, sy],
        }

    return best_cnt, {
        "reason": "ok",
        "snapped_point_in_roi": [sx, sy],
        "min_area": min_area,
        "selected_area_px": int(best_area),
        "roi": [rx, ry, rw, rh],
    }


def detect_smallest_parcel_auto_roi(
    img_bgr: np.ndarray,
    point: Tuple[int, int],
    p: Params,
    ar: AutoRoiParams,
) -> Tuple[Optional[np.ndarray], Optional[Tuple[int, int, int, int]], Dict]:
    """
    Try multiple expanding ROIs centered at point until parcel is found or attempts exhausted.
    Returns (contour_in_roi_coords, roi, debug).
    """
    H, W = img_bgr.shape[:2]
    px, py = point
    if not (0 <= px < W and 0 <= py < H):
        return None, None, {"reason": "point_outside_image", "point": [px, py], "image": [W, H]}

    half = ar.initial_half_size_px
    attempts = 0
    history: List[Dict] = []

    while attempts < ar.max_attempts and half <= ar.max_half_size_px:
        roi = roi_from_point(px, py, half, W, H)
        cnt, dbg = detect_smallest_parcel_in_roi_containing_point(img_bgr, roi, point, p)
        history.append({"half": half, "result": dbg.get("reason", "unknown"), "roi": list(roi)})
        if cnt is not None:
            dbg2 = {"reason": "ok", "auto_roi": {"half": half, "attempts": attempts + 1, "history": history}, **dbg}
            return cnt, roi, dbg2

        half = int(round(half * ar.grow_factor))
        attempts += 1

    return None, None, {"reason": "not_found_after_auto_roi", "auto_roi": {"history": history}}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="Input image path")
    ap.add_argument("output", help="Output image path (will contain red contour overlay)")
    ap.add_argument(
        "--point",
        nargs=2,
        type=int,
        required=True,
        metavar=("PX", "PY"),
        help="Inside point in image pixel coordinates (required)",
    )
    ap.add_argument(
        "--polygon-out",
        type=str,
        default="",
        help="Optional JSON file path to save polygon points",
    )

    # Tunables (kept from previous script)
    ap.add_argument("--blur", type=int, default=5)
    ap.add_argument("--canny-low", type=int, default=50)
    ap.add_argument("--canny-high", type=int, default=150)
    ap.add_argument("--close", type=int, default=5)
    ap.add_argument("--dilate", type=int, default=1)
    ap.add_argument("--snap", type=int, default=6)
    ap.add_argument("--min-area-frac", type=float, default=0.0008)
    ap.add_argument("--eps-frac", type=float, default=0.003)

    # Auto-ROI params (NOT required; ROI input removed)
    ap.add_argument("--roi-half", type=int, default=450, help="Initial ROI half-size (px) around point")
    ap.add_argument("--roi-max-half", type=int, default=2500, help="Max ROI half-size (px)")
    ap.add_argument("--roi-grow", type=float, default=1.6, help="ROI growth factor per attempt")
    ap.add_argument("--roi-attempts", type=int, default=6, help="Max auto-ROI attempts")

    args = ap.parse_args()

    img = cv2.imread(args.input, cv2.IMREAD_COLOR)
    if img is None:
        print(json.dumps({"found": False, "reason": "failed_to_read_input"}))
        raise SystemExit(2)

    p = Params(
        blur_ksize=args.blur,
        canny_low=args.canny_low,
        canny_high=args.canny_high,
        close_ksize=args.close,
        dilate_px=args.dilate,
        snap_radius_px=args.snap,
        min_region_area_frac_in_roi=args.min_area_frac,
        approx_eps_frac=args.eps_frac,
    )
    ar = AutoRoiParams(
        initial_half_size_px=args.roi_half,
        max_half_size_px=args.roi_max_half,
        grow_factor=args.roi-grow if hasattr(args, "roi-grow") else args.roi_grow,  # safety
        max_attempts=args.roi_attempts,
    )

    point = (int(args.point[0]), int(args.point[1]))
    cnt_roi, roi, dbg = detect_smallest_parcel_auto_roi(img, point, p, ar)

    if cnt_roi is None or roi is None:
        print(json.dumps({"found": False, **dbg}))
        return

    H, W = img.shape[:2]
    rx, ry, rw, rh = _clamp_roi(*roi, W, H)

    out_img = draw_contour_global(img, cnt_roi, rx, ry, p.contour_color_bgr, p.contour_thickness)
    if not cv2.imwrite(args.output, out_img):
        print(json.dumps({"found": False, "reason": "failed_to_write_output"}))
        return

    poly = polygon_points_global(cnt_roi, rx, ry)
    result = {
        "found": True,
        "output_image": args.output,
        "point": [point[0], point[1]],
        "roi": [rx, ry, rw, rh],
        "polygon": poly,
        "debug": dbg,
    }

    if args.polygon_out:
        Path(args.polygon_out).parent.mkdir(parents=True, exist_ok=True)
        with open(args.polygon_out, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)
        result["polygon_out"] = args.polygon_out

    print(json.dumps(result))


if __name__ == "__main__":
    main()
