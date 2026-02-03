"""
Grocery Price Comparator — Playwright (Python)

What it does
------------
- Looks up ~20 everyday grocery items across QFC, Safeway, Fred Meyer, Target, and Walmart.
- Extracts the first relevant product from each store's search results.
- Normalizes prices to the same unit (e.g., $/lb, $/oz, $/count, $/gal) and compares stores.
- Produces a tidy CSV and console table highlighting the cheapest store per item.

⚠️ Notes & caveats
------------------
- Grocery sites change often and may block bots. This script uses Playwright to act like a browser, but you may still need to tweak selectors or add waits.
- Prices are location-specific. Configure ZIP/store preferences below.
- This is for personal, educational use. Respect each website's Terms of Use.

Setup
-----
1) Python 3.10+
2) Install deps:
   pip install playwright pandas python-dateutil rapidfuzz
   playwright install chromium
3) Run:
   python grocery_price_compare.py

Output
------
- ./grocery_prices.csv  — all raw rows found
- ./grocery_cheapest.csv — normalized, one row per item with the cheapest store
"""

from __future__ import annotations

import asyncio
import contextlib
import csv
import math
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import pandas as pd
from rapidfuzz import process, fuzz
from dateutil import parser as dateparser

from playwright.async_api import async_playwright

# =========================
# Configuration
# =========================

# Location preferences (adjust these for your region)
ZIP_CODE = "98109"  # Seattle default — change to your ZIP
CITY = "Seattle"
STATE = "WA"

# Which stores to scrape (toggle True/False)
ENABLED_STORES = {
    "qfc": True,
    "safeway": True,
    "fredmeyer": True,
    "target": True,
    "walmart": True,
}

# Top ~20 everyday items to compare. Each item defines a target normalization unit.
# normalize_to choices: "per_lb", "per_oz", "per_count", "per_gal", "per_l".
ITEMS: List[Dict] = [
    {"name": "bananas", "normalize_to": "per_lb"},
    {"name": "apples", "normalize_to": "per_lb"},
    {"name": "tomatoes", "normalize_to": "per_lb"},
    {"name": "yellow onions", "normalize_to": "per_lb"},
    {"name": "russet potatoes 5 lb", "normalize_to": "per_lb"},
    {"name": "whole milk 1 gallon", "normalize_to": "per_gal"},
    {"name": "large eggs dozen", "normalize_to": "per_count"},
    {"name": "white sandwich bread loaf", "normalize_to": "per_count"},
    {"name": "unsalted butter 1 lb", "normalize_to": "per_lb"},
    {"name": "cheddar cheese 8 oz", "normalize_to": "per_oz"},
    {"name": "yogurt 32 oz", "normalize_to": "per_oz"},
    {"name": "corn flakes cereal 12 oz", "normalize_to": "per_oz"},
    {"name": "white rice 5 lb", "normalize_to": "per_lb"},
    {"name": "all-purpose flour 5 lb", "normalize_to": "per_lb"},
    {"name": "granulated sugar 4 lb", "normalize_to": "per_lb"},
    {"name": "iodized salt 26 oz", "normalize_to": "per_oz"},
    {"name": "olive oil 48 oz", "normalize_to": "per_oz"},
    {"name": "ground coffee 12 oz", "normalize_to": "per_oz"},
    {"name": "iceberg lettuce", "normalize_to": "per_count"},
    {"name": "boneless skinless chicken breast", "normalize_to": "per_lb"},
]

# Optional: prefer store brands to reduce mismatches
PREFER_BRANDS = [
    # Kroger banners
    "Kroger", "Simple Truth", "Private Selection", "QFC", "Fred Meyer",
    # Safeway banner
    "Signature", "O Organics",
    # National value brands
    "Great Value", "Market Pantry", "Good & Gather",
]

# =========================
# Helpers — units & parsing
# =========================

UNIT_ALIASES = {
    "lb": ["lb", "lbs", "pound", "pounds"],
    "oz": ["oz", "ounce", "ounces"],
    "gal": ["gal", "gallon", "gallons"],
    "l": ["l", "liter", "liters", "litre", "litres"],
    "count": ["ct", "count", "ea", "each"],
}

OZ_PER_LB = 16.0
OZ_PER_GAL = 128.0
L_PER_GAL = 3.78541


def identify_unit(text: str) -> Optional[str]:
    t = text.lower()
    for canon, aliases in UNIT_ALIASES.items():
        for a in aliases:
            if re.search(rf"(?<![a-z]){re.escape(a)}(?![a-z])", t):
                return canon
    # common package hints
    if re.search(r"\bdoz|dozen\b", t):
        return "count"
    return None


def extract_size(text: str) -> Tuple[Optional[float], Optional[str]]:
    """Extract package size like '32 oz', '1 lb', '5 lb', '1 gal', '2 ct'."""
    t = text.lower()
    # patterns like '32 oz', '1 lb', '12 fl oz', '5 lb', '2 ct'
    m = re.search(r"([0-9]*\.?[0-9]+)\s*(fl\s*)?(oz|ounce|ounces|lb|lbs|pound|pounds|gal|gallon|gallons|l|liter|litre|liters|litres|ct|count|ea|each)\b",
                  t)
    if m:
        qty = float(m.group(1))
        unit = m.group(3)
        # normalize unit alias
        unit_id = identify_unit(unit) or unit
        return qty, unit_id
    # catch 'dozen'
    if "dozen" in t:
        return 12.0, "count"
    return None, None


def normalize_price(price_total: float, name: str, unit_price_text: Optional[str], target: str) -> Optional[float]:
    """Return normalized price per target unit using either unit_price_text (preferred) or derived from package size."""
    # Try unit price text first, e.g., "$0.25/oz" or "$1.49/lb"
    if unit_price_text:
        m = re.search(r"\$\s*([0-9]*\.?[0-9]+)\s*/\s*([a-zA-Z]+)", unit_price_text)
        if m:
            val = float(m.group(1))
            unit = identify_unit(m.group(2) or "")
            if unit:
                return convert_unit_price(val, unit, target)

    # Else derive from size in product title
    qty, unit = extract_size(name)
    if qty and unit:
        unit_price = price_total / qty
        return convert_unit_price(unit_price, unit, target)

    return None


def convert_unit_price(value: float, src_unit: str, target_unit: str) -> Optional[float]:
    src = src_unit
    tgt = target_unit
    if src == tgt:
        return value

    # Weight conversions (oz <-> lb)
    if src == "oz" and tgt == "per_lb":
        return value * OZ_PER_LB
    if src == "lb" and tgt == "per_oz":
        return value / OZ_PER_LB

    # Volume conversions (oz <-> gal, l <-> gal)
    if src == "oz" and tgt == "per_gal":
        return value * OZ_PER_GAL
    if src == "gal" and tgt == "per_oz":
        return value / OZ_PER_GAL
    if src == "l" and tgt == "per_gal":
        return value * L_PER_GAL
    if src == "gal" and tgt == "per_l":
        return value / L_PER_GAL

    # Map canonical naming for targets
    # Convert targets like "per_lb" -> canonical unit strings
    target_map = {
        "per_lb": "lb",
        "per_oz": "oz",
        "per_gal": "gal",
        "per_l": "l",
        "per_count": "count",
    }
    tgt_canon = target_map.get(tgt, tgt)

    # Simple same-dimension conversions
    if src == "count" and tgt_canon == "count":
        return value
    if src == "lb" and tgt_canon == "lb":
        return value
    if src == "oz" and tgt_canon == "oz":
        return value
    if src == "gal" and tgt_canon == "gal":
        return value
    if src == "l" and tgt_canon == "l":
        return value

    # Fallback: unsupported conversion
    return None


# =========================
# Scraper implementations
# =========================

@dataclass
class ProductHit:
    store: str
    query: str
    name: str
    price_total: Optional[float]
    unit_price_text: Optional[str]
    normalized_price: Optional[float]
    normalized_to: str
    url: str


async def search_target(page, query: str) -> Optional[ProductHit]:
    # Target web search (RedSky API exists but can rate limit; use web page)
    url = f"https://www.target.com/s?searchTerm={query.replace(' ', '+')}"
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)

    # First tile
    with contextlib.suppress(Exception):
        # Try to click location dismiss if appears
        mod_close = page.locator('button:has-text("Not now")')
        if await mod_close.count():
            await mod_close.first.click()

    product_card = page.locator('[data-test="@web/ProductCard/Container"]').first
    if not await product_card.count():
        return None

    name = await product_card.locator('a h3, a[data-test="product-title"]').first.text_content()
    price_text = await product_card.locator('[data-test="current-price"]').first.text_content()
    unit_price_text = await product_card.locator('[data-test="unit-price"]').first.text_content().catch(lambda _: None)

    price_total = parse_price(price_text)
    href = await product_card.locator('a').first.get_attribute('href')
    prod_url = f"https://www.target.com{href}" if href and href.startswith('/') else (href or url)

    return ProductHit(
        store="Target",
        query=query,
        name=(name or "").strip(),
        price_total=price_total,
        unit_price_text=(unit_price_text or "").strip() if unit_price_text else None,
        normalized_price=None,
        normalized_to="",
        url=prod_url,
    )


async def search_walmart(page, query: str) -> Optional[ProductHit]:
    url = f"https://www.walmart.com/search?q={query.replace(' ', '+')}"
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)

    product = page.locator('[data-item-id]').first
    if not await product.count():
        return None

    name = await product.locator('a[aria-label]').first.get_attribute('aria-label')
    price_text = await product.locator('[data-automation-id="product-price"]').first.text_content()
    unit_price_text = await product.locator('[data-automation-id="unit-price"]').first.text_content().catch(lambda _: None)

    href = await product.locator('a').first.get_attribute('href')
    prod_url = f"https://www.walmart.com{href}" if href and href.startswith('/') else (href or url)

    return ProductHit(
        store="Walmart",
        query=query,
        name=(name or "").strip(),
        price_total=parse_price(price_text),
        unit_price_text=(unit_price_text or "").strip() if unit_price_text else None,
        normalized_price=None,
        normalized_to="",
        url=prod_url,
    )


async def search_safeway(page, query: str) -> Optional[ProductHit]:
    # Safeway (Albertsons) — location modal appears; try to set ZIP via store selector
    search_url = f"https://www.safeway.com/shop/search-results.html?q={query.replace(' ', '+')}"
    await page.goto(search_url, wait_until="domcontentloaded")
    await page.wait_for_timeout(2000)

    # Dismiss cookie/zip modals when present
    with contextlib.suppress(Exception):
        accept = page.locator('button:has-text("Accept")')
        if await accept.count():
            await accept.first.click()
    with contextlib.suppress(Exception):
        # sometimes asks for location — try any close/continue
        cont = page.locator('button:has-text("Continue")')
        if await cont.count():
            await cont.first.click()

    card = page.locator('[data-auto-id="product-card"]').first
    if not await card.count():
        return None

    name = await card.locator('[data-auto-id="product-title"]').first.text_content()
    price_text = await card.locator('[data-auto-id="regular-price"]').first.text_content()
    unit_price_text = await card.locator('[data-auto-id="uom-price"]').first.text_content().catch(lambda _: None)

    href = await card.locator('a').first.get_attribute('href')
    prod_url = f"https://www.safeway.com{href}" if href and href.startswith('/') else (href or search_url)

    return ProductHit(
        store="Safeway",
        query=query,
        name=(name or "").strip(),
        price_total=parse_price(price_text),
        unit_price_text=(unit_price_text or "").strip() if unit_price_text else None,
        normalized_price=None,
        normalized_to="",
        url=prod_url,
    )


async def search_kroger_banner(page, query: str, banner: str) -> Optional[ProductHit]:
    # banner in {"qfc", "fredmeyer"}
    base = "https://www.qfc.com" if banner == "qfc" else "https://www.fredmeyer.com"
    url = f"{base}/search?query={query.replace(' ', '+')}"
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_timeout(2000)

    # cookie & location modals
    with contextlib.suppress(Exception):
        accept = page.locator('button:has-text("Accept All")')
        if await accept.count():
            await accept.first.click()
    with contextlib.suppress(Exception):
        close = page.locator('button:has-text("Close")')
        if await close.count():
            await close.first.click()

    product = page.locator('[data-qa="product-card"]').first
    if not await product.count():
        # alternate selector
        product = page.locator('div[class*="ProductCard"]').first
        if not await product.count():
            return None

    name = await product.locator('[data-qa="product-name"]').first.text_content()
    price_text = await product.locator('[data-qa="pricing"] [data-qa="item-price"]').first.text_content()
    unit_price_text = await product.locator('[data-qa="unit-price"]').first.text_content().catch(lambda _: None)

    href = await product.locator('a').first.get_attribute('href')
    prod_url = f"{base}{href}" if href and href.startswith('/') else (href or url)

    store_label = "QFC" if banner == "qfc" else "Fred Meyer"
    return ProductHit(
        store=store_label,
        query=query,
        name=(name or "").strip(),
        price_total=parse_price(price_text),
        unit_price_text=(unit_price_text or "").strip() if unit_price_text else None,
        normalized_price=None,
        normalized_to="",
        url=prod_url,
    )


PRICE_RE = re.compile(r"\$\s*([0-9]*\.?[0-9]+)")


def parse_price(text: Optional[str]) -> Optional[float]:
    if not text:
        return None
    m = PRICE_RE.search(text.replace(",", ""))
    return float(m.group(1)) if m else None


# =========================
# Orchestration
# =========================

async def fetch_all() -> pd.DataFrame:
    rows: List[Dict] = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            locale="en-US",
            geolocation={"longitude": -122.339, "latitude": 47.620},
            permissions=["geolocation"],
        )
        page = await context.new_page()

        for item in ITEMS:
            query = item["name"]

            if ENABLED_STORES.get("target"):
                with contextlib.suppress(Exception):
                    hit = await search_target(page, query)
                    if hit:
                        hit.normalized_to = item["normalize_to"]
                        hit.normalized_price = normalize_price(hit.price_total or math.nan, hit.name, hit.unit_price_text, item["normalize_to"]) if hit.price_total else None
                        rows.append(hit.__dict__)

            if ENABLED_STORES.get("walmart"):
                with contextlib.suppress(Exception):
                    hit = await search_walmart(page, query)
                    if hit:
                        hit.normalized_to = item["normalize_to"]
                        hit.normalized_price = normalize_price(hit.price_total or math.nan, hit.name, hit.unit_price_text, item["normalize_to"]) if hit.price_total else None
                        rows.append(hit.__dict__)

            if ENABLED_STORES.get("safeway"):
                with contextlib.suppress(Exception):
                    hit = await search_safeway(page, query)
                    if hit:
                        hit.normalized_to = item["normalize_to"]
                        hit.normalized_price = normalize_price(hit.price_total or math.nan, hit.name, hit.unit_price_text, item["normalize_to"]) if hit.price_total else None
                        rows.append(hit.__dict__)

            if ENABLED_STORES.get("qfc"):
                with contextlib.suppress(Exception):
                    hit = await search_kroger_banner(page, query, banner="qfc")
                    if hit:
                        hit.normalized_to = item["normalize_to"]
                        hit.normalized_price = normalize_price(hit.price_total or math.nan, hit.name, hit.unit_price_text, item["normalize_to"]) if hit.price_total else None
                        rows.append(hit.__dict__)

            if ENABLED_STORES.get("fredmeyer"):
                with contextlib.suppress(Exception):
                    hit = await search_kroger_banner(page, query, banner="fredmeyer")
                    if hit:
                        hit.normalized_to = item["normalize_to"]
                        hit.normalized_price = normalize_price(hit.price_total or math.nan, hit.name, hit.unit_price_text, item["normalize_to"]) if hit.price_total else None
                        rows.append(hit.__dict__)

        await context.close()
        await browser.close()

    return pd.DataFrame(rows)


def pick_cheapest(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    # Compute cheapest per (query, normalized_to)
    def _pick(group: pd.DataFrame) -> pd.Series:
        g = group.dropna(subset=["normalized_price"]).sort_values("normalized_price")
        if g.empty:
            return pd.Series({
                "cheapest_store": None,
                "cheapest_name": None,
                "cheapest_price": None,
                "cheapest_url": None,
            })
        row = g.iloc[0]
        return pd.Series({
            "cheapest_store": row["store"],
            "cheapest_name": row["name"],
            "cheapest_price": row["normalized_price"],
            "cheapest_url": row["url"],
        })

    summary = (
        df.groupby(["query", "normalized_to"])  # one item per row
          .apply(_pick, include_groups=False)
          .reset_index()
    )

    # Pivot to show each store's price side-by-side too
    pivot = df.pivot_table(index=["query", "normalized_to"],
                           columns="store",
                           values="normalized_price",
                           aggfunc="min")
    out = summary.merge(pivot, on=["query", "normalized_to"], how="left")
    return out.sort_values("query").reset_index(drop=True)


def main():
    df = asyncio.run(fetch_all())
    if df.empty:
        print("No results collected — sites may have blocked the session or selectors need updates.")
        return

    df.to_csv("grocery_prices.csv", index=False)
    cheap = pick_cheapest(df)
    cheap.to_csv("grocery_cheapest.csv", index=False)

    # Pretty print
    cols = ["query", "normalized_to", "cheapest_store", "cheapest_price"]
    print("\nCheapest per item (normalized):")
    print(cheap[cols].to_string(index=False))
    print("\nSaved: grocery_prices.csv, grocery_cheapest.csv")


if __name__ == "__main__":
    main()
