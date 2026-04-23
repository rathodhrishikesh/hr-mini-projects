#!/usr/bin/env python3
"""Dump image metadata for all images in a folder.

Usage:
  python image_metadata_dump.py --path "D:\\Made For Retail\\MFR Product Images\\Comp Shop\\2026\\April\\a"

Optional:
  --output metadata_output.json
  --recursive
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

try:
    from PIL import ExifTags, Image
except ImportError:
    print("Missing dependency: Pillow. Install with: pip install Pillow", file=sys.stderr)
    sys.exit(1)


SUPPORTED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".tif",
    ".tiff",
    ".webp",
    ".avif",
    ".heic",
    ".heif",
}


def to_iso_utc(ts: float) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def rational_to_float(value: Any) -> Any:
    try:
        if hasattr(value, "numerator") and hasattr(value, "denominator"):
            denom = value.denominator
            return None if denom == 0 else value.numerator / denom
        return value
    except Exception:
        return value


def decode_gps(gps_info: Dict[Any, Any]) -> Dict[str, Any]:
    gps_map = {ExifTags.GPSTAGS.get(k, k): v for k, v in gps_info.items()}

    def dms_to_deg(dms: Any, ref: Optional[str]) -> Optional[float]:
        if not dms or len(dms) != 3:
            return None
        d = rational_to_float(dms[0])
        m = rational_to_float(dms[1])
        s = rational_to_float(dms[2])
        if d is None or m is None or s is None:
            return None
        val = float(d) + float(m) / 60.0 + float(s) / 3600.0
        if ref in {"S", "W"}:
            val = -val
        return val

    lat = dms_to_deg(gps_map.get("GPSLatitude"), gps_map.get("GPSLatitudeRef"))
    lon = dms_to_deg(gps_map.get("GPSLongitude"), gps_map.get("GPSLongitudeRef"))

    decoded = {
        "raw": {
            str(k): normalize_value(v)
            for k, v in gps_map.items()
        },
        "latitude": lat,
        "longitude": lon,
    }
    return decoded


def normalize_value(value: Any) -> Any:
    if isinstance(value, bytes):
        try:
            return value.decode("utf-8", errors="replace").rstrip("\x00")
        except Exception:
            return value.hex()
    if isinstance(value, (list, tuple)):
        return [normalize_value(v) for v in value]
    if isinstance(value, dict):
        return {str(k): normalize_value(v) for k, v in value.items()}
    converted = rational_to_float(value)
    if converted is value:
        return value
    return converted


def summarize_binary_blob(value: bytes) -> Dict[str, Any]:
    return {
        "type": "binary",
        "length_bytes": len(value),
        "sha256": hashlib.sha256(value).hexdigest(),
    }


def extract_exif(img: Image.Image) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    try:
        exif = img.getexif()
    except Exception:
        exif = None

    if not exif:
        return out

    for tag_id, value in exif.items():
        tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
        if tag_name == "GPSInfo" and isinstance(value, dict):
            out["GPSInfo"] = decode_gps(value)
        else:
            out[tag_name] = normalize_value(value)

    return out


def collect_file_metadata(path: Path) -> Dict[str, Any]:
    stat = path.stat()
    mime_type, _ = mimetypes.guess_type(path.name)
    return {
        "name": path.name,
        "full_path": str(path.resolve()),
        "extension": path.suffix.lower(),
        "size_bytes": stat.st_size,
        "created_utc": to_iso_utc(stat.st_ctime),
        "modified_utc": to_iso_utc(stat.st_mtime),
        "accessed_utc": to_iso_utc(stat.st_atime),
        "mime_type": mime_type,
        "sha256": sha256_file(path),
    }


def collect_image_metadata(path: Path) -> Dict[str, Any]:
    with Image.open(path) as img:
        meta: Dict[str, Any] = {
            "format": img.format,
            "format_description": img.format_description,
            "mode": img.mode,
            "width": img.width,
            "height": img.height,
            "is_animated": bool(getattr(img, "is_animated", False)),
            "n_frames": int(getattr(img, "n_frames", 1)),
            "palette": "present" if img.palette else None,
            "bands": list(img.getbands()),
        }

        dpi = img.info.get("dpi")
        if dpi:
            meta["dpi"] = normalize_value(dpi)

        # Capture embedded PIL metadata while avoiding giant unreadable blobs.
        info_map: Dict[str, Any] = {}
        for key, value in img.info.items():
            if isinstance(value, (bytes, bytearray)):
                info_map[key] = summarize_binary_blob(bytes(value))
            else:
                info_map[key] = normalize_value(value)
        meta["pil_info"] = info_map

        icc_profile = img.info.get("icc_profile")
        if isinstance(icc_profile, (bytes, bytearray)):
            meta["icc_profile_bytes"] = len(icc_profile)

        exif_data = extract_exif(img)
        meta["exif"] = exif_data
        meta["exif_tag_count"] = len(exif_data)

        return meta


def image_files(root: Path, recursive: bool) -> Iterable[Path]:
    if recursive:
        candidates = root.rglob("*")
    else:
        candidates = root.glob("*")
    for p in candidates:
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS:
            yield p


def gather_metadata(root: Path, recursive: bool) -> Dict[str, Any]:
    files = list(image_files(root, recursive=recursive))
    records: List[Dict[str, Any]] = []

    for p in files:
        file_record: Dict[str, Any] = {
            "file": collect_file_metadata(p),
        }
        try:
            file_record["image"] = collect_image_metadata(p)
            file_record["status"] = "ok"
        except Exception as exc:
            file_record["status"] = "error"
            file_record["error"] = str(exc)
        records.append(file_record)

    return {
        "scan_path": str(root.resolve()),
        "scanned_at_utc": datetime.now(tz=timezone.utc).isoformat(),
        "recursive": recursive,
        "image_count": len(records),
        "images": records,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract metadata from image files.")
    parser.add_argument(
        "--path",
        required=True,
        help="Path to folder containing images.",
    )
    parser.add_argument(
        "--output",
        default="image_metadata.json",
        help="Output JSON file path. Default: image_metadata.json",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Recursively scan subfolders.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.path)

    if not root.exists() or not root.is_dir():
        print(f"Invalid folder path: {root}", file=sys.stderr)
        return 1

    result = gather_metadata(root, recursive=args.recursive)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Metadata written to: {out_path.resolve()}")
    print(f"Images processed: {result['image_count']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
