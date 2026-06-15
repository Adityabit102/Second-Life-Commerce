"""
Demo data seeder.  Run directly:  python seed_demo_data.py
Also called automatically by main.py when the DB is empty.
"""

import json
import sys
import os
from datetime import datetime, timedelta, date

sys.path.insert(0, os.path.dirname(__file__))

from models.database import SessionLocal, engine, Base
from models import return_grade, credit_transaction, listing, order  # noqa: F401
from models.return_grade import ReturnGrade
from models.credit_transaction import CreditTransaction
from models.listing import Listing
from models.order import Order

TREE_ABSORPTION_KG = 21.7

# ── Image URLs ────────────────────────────────────────────────────────────────

_IMG = {
    # Electronics
    "sony_headphones":  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&auto=format&fit=crop&q=80",
    "boat_earbuds":     "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&auto=format&fit=crop&q=80",
    "airpods":          "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&auto=format&fit=crop&q=80",
    "samsung_phone":    "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&auto=format&fit=crop&q=80",
    "logitech_mouse":   "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&auto=format&fit=crop&q=80",
    "smart_tv":         "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&h=400&auto=format&fit=crop&q=80",
    "laptop":           "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&auto=format&fit=crop&q=80",
    "jbl_speaker":      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&auto=format&fit=crop&q=80",
    "canon_camera":     "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&auto=format&fit=crop&q=80",
    "smartband":        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&auto=format&fit=crop&q=80",
    "syska_usb":        "https://images.unsplash.com/photo-1588702547919-44ad6b9b1460?w=400&h=400&auto=format&fit=crop&q=80",
    "router":           "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=400&auto=format&fit=crop&q=80",
    # Apparel
    "nike_shoe":        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&auto=format&fit=crop&q=80",
    "levis_jeans":      "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&auto=format&fit=crop&q=80",
    "adidas_hoodie":    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&auto=format&fit=crop&q=80",
    "shirt":            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&auto=format&fit=crop&q=80",
    "puma_shirt":       "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&auto=format&fit=crop&q=80",
    # Home
    "prestige_cooker":  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&auto=format&fit=crop&q=80",
    "air_fryer":        "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&auto=format&fit=crop&q=80",
    "vacuum":           "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&auto=format&fit=crop&q=80",
    "desk_lamp":        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&auto=format&fit=crop&q=80",
    "mixer_grinder":    "https://images.unsplash.com/photo-1556911261-6bd341186b2f?w=400&h=400&auto=format&fit=crop&q=80",
    "water_bottle":     "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&auto=format&fit=crop&q=80",
    # Books (each book gets its own image)
    "atomic_habits":    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=400&auto=format&fit=crop&q=80",
    "rich_dad":         "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=400&auto=format&fit=crop&q=80",
    "ncert_physics":    "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&auto=format&fit=crop&q=80",
    # Sports
    "swim_goggles":     "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=400&auto=format&fit=crop&q=80",
    "football":         "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&auto=format&fit=crop&q=80",
    "badminton":        "https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=400&h=400&auto=format&fit=crop&q=80",
    "gym_gloves":       "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&auto=format&fit=crop&q=80",
}

# ── Scenario Definitions ───────────────────────────────────────────────────────
# grade:      A | B | C | Junk
# action:     resell | refurbish | donate | recycle
# listing:    dict → creates marketplace listing; None → no listing

SCENARIOS = [

    # ══════════════════════════════════════════════════════════
    # CATEGORY: ELECTRONICS
    # ══════════════════════════════════════════════════════════

    {
        "product_name": "Sony WH-1000XM4 Headphones",
        "image_url": _IMG["sony_headphones"],
        "grade": "A", "confidence": 94,
        "action": "resell",
        "damage": "No visible damage — all controls, ANC, mic, and cushions are perfect",
        "reason": "Customer ordered wrong model (XM4 instead of XM5)",
        "resale_value": 8500, "co2_saved": 8.0, "credits": 50,
        "listing": {
            "title": "Sony WH-1000XM4 — Grade A, Like New",
            "description": (
                "Returned unopened — customer ordered wrong model. "
                "Grade A: zero scratches, full ANC performance, all original accessories and warranty card included."
            ),
            "highlights": [
                "No visible damage on headband, ear cups, or controls",
                "ANC and Transparency mode: fully functional",
                "All buttons (Power, NC/Ambient, Custom) work perfectly",
                "Original box, cable, carry case, and adapter included",
                "Grade A — AI certified like-new condition",
            ],
            "trust_score": 96.4, "price": 8075,
        },
    },

    {
        "product_name": "Boat Airdopes 141 TWS Earbuds",
        "image_url": _IMG["boat_earbuds"],
        "grade": "B", "confidence": 78,
        "action": "refurbish",
        "damage": "Left earbud has minor crackling at high volumes; right earbud, mic, charging case, and Bluetooth pairing all work flawlessly",
        "reason": "Audio distortion in left earbud at above 70% volume",
        "resale_value": 650, "co2_saved": 5.2, "credits": 30,
        "listing": {
            "title": "Boat Airdopes 141 — Grade B, Refurbished",
            "description": (
                "Left earbud shows minor crackling at high volumes only; "
                "professionally cleaned and tested. Right side, mic, case, and connectivity are perfect."
            ),
            "highlights": [
                "Right earbud: crystal clear audio — no issues",
                "Left earbud: slight crackling above 70% volume only",
                "Charging case: fully functional, 150-hr total battery tested",
                "Bluetooth 5.0 pairing: connects instantly",
                "Mic: clear call quality verified",
            ],
            "trust_score": 76.8, "price": 585,
        },
    },

    {
        "product_name": "Samsung Galaxy S23 Ultra 5G (256GB, Phantom Black)",
        "image_url": _IMG["samsung_phone"],
        "grade": "A", "confidence": 96,
        "action": "resell",
        "damage": "Pristine — screen, all cameras, S Pen, buttons, and chassis show zero wear",
        "reason": "Customer ordered Phantom Black; wanted Green colour variant",
        "resale_value": 89000, "co2_saved": 12.5, "credits": 75,
        "listing": {
            "title": "Samsung Galaxy S23 Ultra — Grade A, Phantom Black, 256GB",
            "description": (
                "Returned due to wrong colour selection. "
                "Grade A: all 4 cameras, S Pen, Display, and 5000mAh battery verified at 100% capacity."
            ),
            "highlights": [
                "All 4 cameras (200MP+12MP+10MP+10MP): fully functional",
                "S Pen: no nib wear, Bluetooth working",
                "6.8\" QHD+ 120Hz screen: no dead pixels, scratch-free",
                "All physical buttons (power, volume) work perfectly",
                "Original box, S Pen, charger, and docs included",
            ],
            "trust_score": 97.2, "price": 85999,
        },
    },

    {
        "product_name": "Apple AirPods Pro (2nd Gen) with MagSafe Case",
        "image_url": _IMG["airpods"],
        "grade": "B", "confidence": 82,
        "action": "refurbish",
        "damage": "Left earbud ANC occasionally drops for 1–2 seconds; right earbud, Transparency mode, Spatial Audio, and charging case are all perfect",
        "reason": "Intermittent ANC drop on left side — unacceptable for daily use",
        "resale_value": 16500, "co2_saved": 4.5, "credits": 30,
        "listing": {
            "title": "Apple AirPods Pro 2nd Gen — Grade B, ANC Repaired",
            "description": (
                "Left earbud ANC occasionally drops; right earbud and all other features work flawlessly. "
                "Professionally inspected — ideal for budget-conscious Apple users."
            ),
            "highlights": [
                "Right earbud: perfect ANC, audio, and mic",
                "Left earbud: ANC may drop 1–2 sec intermittently (rest is fine)",
                "Transparency mode: works on both earbuds",
                "MagSafe charging case: full charge, USB-C port intact",
                "Spatial Audio and Adaptive EQ: functioning",
            ],
            "trust_score": 82.5, "price": 15899,
        },
    },

    {
        "product_name": "Logitech MX Master 3S Wireless Mouse",
        "image_url": _IMG["logitech_mouse"],
        "grade": "A", "confidence": 98,
        "action": "resell",
        "damage": "Pristine — opened only to verify contents; all 7 buttons, MagSpeed scroll, and USB-C receiver intact",
        "reason": "Ordered duplicate by mistake — already owns one at the office",
        "resale_value": 7800, "co2_saved": 2.1, "credits": 20,
        "listing": {
            "title": "Logitech MX Master 3S — Grade A, Opened Unused",
            "description": (
                "Duplicate purchase — box opened to verify contents, never actually used. "
                "All 7 programmable buttons and silent clicking mechanism in perfect order."
            ),
            "highlights": [
                "All 7 buttons (incl. thumb wheel): perfect click response",
                "MagSpeed electromagnetic scroll: silky smooth",
                "USB-C Logi Bolt receiver: included and working",
                "8,000 DPI sensor: no drift or jitter",
                "Original packaging with all accessories",
            ],
            "trust_score": 98.8, "price": 7499,
        },
    },

    {
        "product_name": "Realme 55-inch 4K QLED Smart TV",
        "image_url": _IMG["smart_tv"],
        "grade": "B", "confidence": 75,
        "action": "refurbish",
        "damage": "Single dead pixel in extreme bottom-left corner (~2cm from edge); all other 8.29 million pixels, speakers, HDMI ports, WiFi, and Android TV OS are perfect",
        "reason": "Dead pixel noticed on day 3 — unacceptable for a new TV",
        "resale_value": 24000, "co2_saved": 18.0, "credits": 90,
        "listing": {
            "title": "Realme 55\" 4K QLED Smart TV — Grade B, 1 Dead Pixel",
            "description": (
                "One dead pixel in the bottom-left corner (barely visible at normal viewing distance); "
                "every other aspect of this TV is perfect — 4K panel, Dolby Audio, and all ports verified."
            ),
            "highlights": [
                "1 dead pixel — extreme bottom-left corner, barely visible",
                "4K QLED panel: all other 8.29M pixels perfect",
                "3× HDMI 2.1, 2× USB ports: all functional",
                "Dolby Vision + Dolby Atmos: verified working",
                "Android TV 11 with Google Assistant: fully operational",
            ],
            "trust_score": 80.1, "price": 23499,
        },
    },

    {
        "product_name": "HP Pavilion 15 Laptop (Core i5, 16GB RAM, 512GB SSD)",
        "image_url": _IMG["laptop"],
        "grade": "C", "confidence": 68,
        "action": "donate",
        "damage": "'G' key requires extra pressure to register; all other 103 keys, 15.6\" FHD display, battery (4.5 hrs), speakers, ports, and internals work perfectly",
        "reason": "Sticky 'G' key makes typing uncomfortable — not suitable for resale",
        "resale_value": 0, "co2_saved": 14.0, "credits": 25,
        "listing": None,
    },

    {
        "product_name": "JBL Charge 5 Portable Bluetooth Speaker",
        "image_url": _IMG["jbl_speaker"],
        "grade": "A", "confidence": 95,
        "action": "resell",
        "damage": "None — IPX7 waterproofing intact, all buttons working, battery holds full 20-hour charge",
        "reason": "Bought as backup; customer already owns the same model",
        "resale_value": 12500, "co2_saved": 3.8, "credits": 35,
        "listing": {
            "title": "JBL Charge 5 Portable Speaker — Grade A, Like New",
            "description": (
                "Bought as a spare but never needed — kept in original packaging. "
                "20-hour battery, IPX7 waterproofing, and PartyBoost all verified."
            ),
            "highlights": [
                "IPX7 waterproofing: tested and confirmed intact",
                "All buttons (Power, Bluetooth, PartyBoost, Volume +/−): perfect",
                "20-hour battery: tested at full capacity",
                "Passive radiators: clean, no distortion at any volume",
                "Original box, USB-C cable, and docs included",
            ],
            "trust_score": 95.6, "price": 12199,
        },
    },

    {
        "product_name": "Canon EOS R50 Mirrorless Camera (Body Only)",
        "image_url": _IMG["canon_camera"],
        "grade": "B", "confidence": 80,
        "action": "refurbish",
        "damage": "Shutter button requires slightly more pressure than normal; all AF modes, 24MP sensor, touchscreen LCD, viewfinder, video (4K), and all other buttons are perfect",
        "reason": "Stiff shutter button feel — unsuitable for professional event photography",
        "resale_value": 52000, "co2_saved": 7.5, "credits": 55,
        "listing": {
            "title": "Canon EOS R50 Mirrorless — Grade B, Stiff Shutter Button",
            "description": (
                "Shutter release needs slightly more pressure than stock; "
                "every other feature — sensor, AF, LCD, video — works flawlessly. "
                "Perfect for hobbyist photographers."
            ),
            "highlights": [
                "Shutter button: slightly stiff — needs extra pressure (all else perfect)",
                "24.2MP APS-C CMOS sensor: pristine, no dust or dead pixels",
                "Dual Pixel CMOS AF II: fast, accurate — fully working",
                "4K video (uncropped): tested and recording perfectly",
                "Vari-angle touchscreen LCD: fully responsive",
            ],
            "trust_score": 83.4, "price": 50499,
        },
    },

    {
        "product_name": "Xiaomi Smart Band 8 (Black Strap)",
        "image_url": _IMG["smartband"],
        "grade": "A", "confidence": 97,
        "action": "resell",
        "damage": "Factory sealed — never opened",
        "reason": "Received as a festival gift; customer already owns a smartwatch",
        "resale_value": 2400, "co2_saved": 1.5, "credits": 15,
        "listing": {
            "title": "Xiaomi Smart Band 8 — Grade A, Factory Sealed",
            "description": (
                "Gifted but unwanted — box still factory sealed with original shrink wrap. "
                "All features, warranty, and accessories are completely intact."
            ),
            "highlights": [
                "Factory sealed — never opened",
                "1.62\" AMOLED display: pristine",
                "Blood oxygen + heart rate + sleep tracking: all sensors intact",
                "16-day battery life: verified by manufacturer",
                "Original gift box with all accessories",
            ],
            "trust_score": 99.1, "price": 2299,
        },
    },

    {
        "product_name": "Syska USB Hub 4-Port USB 3.0",
        "image_url": _IMG["syska_usb"],
        "grade": "Junk", "confidence": 92,
        "action": "recycle",
        "damage": "USB port 3 has physically snapped off the casing, creating a sharp exposed edge; ports 1, 2, and 4 still function but device is unsafe to use",
        "reason": "Physical breakage — unrepairable and unsafe",
        "resale_value": 0, "co2_saved": 1.5, "credits": 10,
        "listing": None,
    },

    {
        "product_name": "TP-Link Archer AX73 WiFi 6 Router",
        "image_url": _IMG["router"],
        "grade": "C", "confidence": 72,
        "action": "donate",
        "damage": "WPS push-button has snapped off the housing; all 4 LAN ports, WAN port, 2 USB ports, and WiFi (2.4 GHz + 5 GHz bands) work perfectly — WPS can still be triggered via web interface",
        "reason": "Missing physical WPS button violates office IT security policy",
        "resale_value": 0, "co2_saved": 3.0, "credits": 15,
        "listing": None,
    },

    # ══════════════════════════════════════════════════════════
    # CATEGORY: APPAREL & FOOTWEAR
    # ══════════════════════════════════════════════════════════

    {
        "product_name": "Puma Men's Essential Logo T-Shirt (Size L)",
        "image_url": _IMG["puma_shirt"],
        "grade": "C", "confidence": 65,
        "action": "donate",
        "damage": "Noticeable colour fading on front chest logo after 2 washes; collar and stitching are intact",
        "reason": "Colour faded significantly — product quality issue",
        "resale_value": 120, "co2_saved": 3.0, "credits": 15,
        "listing": None,
    },

    {
        "product_name": "Nike Air Force 1 Low Sneakers (White, UK Size 9)",
        "image_url": _IMG["nike_shoe"],
        "grade": "A", "confidence": 94,
        "action": "resell",
        "damage": "Tried on indoors once — no sole wear, all lace aglets intact, original tissue paper still inside",
        "reason": "Ordered UK 9; customer wears UK 10",
        "resale_value": 6200, "co2_saved": 3.5, "credits": 25,
        "listing": {
            "title": "Nike Air Force 1 Low — Grade A, Worn Once Indoors (UK 9)",
            "description": (
                "Tried on once on carpet to check fit — wrong size ordered. "
                "Soles show zero wear, both shoes retain original stuffing and tags."
            ),
            "highlights": [
                "Tried on once indoors — soles are completely clean",
                "Original laces, aglets, and tissue paper intact",
                "Nike Air cushioning: uncompressed, factory-fresh feel",
                "Both shoes: no creasing, scuffs, or stains",
                "Original Nike box included",
            ],
            "trust_score": 94.3, "price": 5999,
        },
    },

    {
        "product_name": "Levi's 511 Slim Fit Jeans (32W × 30L, Dark Blue)",
        "image_url": _IMG["levis_jeans"],
        "grade": "B", "confidence": 77,
        "action": "refurbish",
        "damage": "Small ink stain (~2 cm) near right front pocket; all stitching, rivets, zipper, and denim quality fully intact — stain partially removed by professional cleaning",
        "reason": "Ballpoint pen leaked in pocket — stain remains despite washing",
        "resale_value": 2200, "co2_saved": 2.2, "credits": 20,
        "listing": {
            "title": "Levi's 511 Slim Jeans 32×30 — Grade B, Minor Ink Stain",
            "description": (
                "Pen leaked in right pocket leaving a ~2 cm mark; professionally cleaned and dried. "
                "All stitching, rivet, and denim quality is perfect — great value buy."
            ),
            "highlights": [
                "Ink stain (~2 cm) near right front pocket — partially faded",
                "All stitching and copper rivets: fully intact",
                "YKK zipper and button: work perfectly",
                "No fading, thinning, or fraying anywhere else",
                "Grade B — professionally cleaned and pressed",
            ],
            "trust_score": 78.5, "price": 1999,
        },
    },

    {
        "product_name": "Adidas Essentials Fleece Hoodie (Size L, Legend Earth)",
        "image_url": _IMG["adidas_hoodie"],
        "grade": "A", "confidence": 93,
        "action": "resell",
        "damage": "Washed once — no pilling, fading, or stretching; drawstrings, kangaroo pocket, and stitching remain perfect",
        "reason": "Legend Earth colour does not match customer's wardrobe",
        "resale_value": 4100, "co2_saved": 2.8, "credits": 22,
        "listing": {
            "title": "Adidas Fleece Hoodie Size L — Grade A, Like New",
            "description": (
                "Washed once on delicate cycle — zero pilling, colour loss, or stretching. "
                "Front kangaroo pocket, drawstrings, and hem all in factory-fresh condition."
            ),
            "highlights": [
                "Washed once — no pilling or colour fading",
                "Drawstrings: full length, no fraying",
                "Kangaroo pocket: no stretching or stain",
                "Adidas tri-stripe: fully intact",
                "Grade A — excellent as-new condition",
            ],
            "trust_score": 93.1, "price": 3899,
        },
    },

    {
        "product_name": "Allen Solly Slim Fit Formal Shirt (Size 40, White)",
        "image_url": _IMG["shirt"],
        "grade": "C", "confidence": 62,
        "action": "donate",
        "damage": "Collar has a permanent press crease from incorrect storage during shipping — cannot be removed by ironing; all buttons, stitching, and fabric are fine",
        "reason": "Collar crease is permanent — unsuitable for professional wear",
        "resale_value": 0, "co2_saved": 1.8, "credits": 12,
        "listing": None,
    },

    # ══════════════════════════════════════════════════════════
    # CATEGORY: HOME & KITCHEN
    # ══════════════════════════════════════════════════════════

    {
        "product_name": "Prestige Pressure Cooker Deluxe Alpha 5L",
        "image_url": _IMG["prestige_cooker"],
        "grade": "A", "confidence": 89,
        "action": "resell",
        "damage": "No visible marks — unused, handles, lid, gasket, and safety valve all perfect",
        "reason": "Customer bought 5L; needed 3L for a smaller family",
        "resale_value": 1200, "co2_saved": 8.0, "credits": 50,
        "listing": {
            "title": "Prestige Pressure Cooker 5L — Grade A, Unused",
            "description": (
                "Returned because customer needed a smaller size. "
                "Never placed on heat — lid, gasket, valve, and body are completely unmarked."
            ),
            "highlights": [
                "Never placed on heat — base is spotless",
                "Safety valve: factory condition",
                "Gasket: no compression marks",
                "Lid and handles: zero dents or scratches",
                "Original box and recipe booklet included",
            ],
            "trust_score": 93.4, "price": 1140,
        },
    },

    {
        "product_name": "Philips HD9252 Digital Air Fryer (4.1L, Black)",
        "image_url": _IMG["air_fryer"],
        "grade": "A", "confidence": 96,
        "action": "resell",
        "damage": "Used twice for testing — basket and coated pan are scratch-free, heating element and digital panel fully functional",
        "reason": "Received as corporate gift; customer already owns the same model",
        "resale_value": 7200, "co2_saved": 5.0, "credits": 40,
        "listing": {
            "title": "Philips Air Fryer HD9252 4.1L — Grade A, Used Twice",
            "description": (
                "Corporate gift — used twice to test. "
                "Non-stick basket shows no scratches, digital controls are fully responsive."
            ),
            "highlights": [
                "Used twice only — basket and pan: scratch-free",
                "Digital touchscreen: all buttons respond correctly",
                "Heating element: clean, no residue",
                "Timer and temperature (80–200°C) settings: work perfectly",
                "All accessories and original box included",
            ],
            "trust_score": 96.0, "price": 6999,
        },
    },

    {
        "product_name": "Eureka Forbes Vac Cordless Vacuum Cleaner (950W)",
        "image_url": _IMG["vacuum"],
        "grade": "B", "confidence": 79,
        "action": "refurbish",
        "damage": "Charging indicator LED flickers on and off when battery is at full charge; suction motor (950W), all 4 attachments, dustbin, and HEPA filter work perfectly",
        "reason": "Flickering charge light causes anxiety about battery health — motor unaffected",
        "resale_value": 9800, "co2_saved": 6.5, "credits": 45,
        "listing": {
            "title": "Eureka Forbes Cordless Vacuum 950W — Grade B, LED Flicker",
            "description": (
                "Charge indicator LED flickers at 100% battery — a known cosmetic firmware issue; "
                "950W suction, filter, and all attachments work with full power."
            ),
            "highlights": [
                "Charge LED flickers at full battery (cosmetic only — motor unaffected)",
                "950W suction: tested at full power, no reduction",
                "HEPA filter: clean, no clogging",
                "All 4 attachments (floor, crevice, brush, upholstery): included and working",
                "Dustbin: clean and intact",
            ],
            "trust_score": 81.8, "price": 9299,
        },
    },

    {
        "product_name": "Wipro Garnet 9W LED Study Lamp with USB Charging",
        "image_url": _IMG["desk_lamp"],
        "grade": "A", "confidence": 98,
        "action": "resell",
        "damage": "Sealed box — never switched on",
        "reason": "Bought 2 units by mistake; returning the second unopened one",
        "resale_value": 1050, "co2_saved": 0.8, "credits": 10,
        "listing": {
            "title": "Wipro LED Study Lamp 9W — Grade A, Sealed Box",
            "description": (
                "Second unit purchased by mistake — still factory sealed. "
                "USB charging port, adjustable neck, and warm/cool light modes completely unused."
            ),
            "highlights": [
                "Factory sealed — never plugged in",
                "USB 5V charging port: untouched",
                "Adjustable gooseneck: full flexibility retained",
                "Warm/Cool/Daylight 3 colour modes: all intact",
                "Original packaging with warranty card",
            ],
            "trust_score": 99.5, "price": 999,
        },
    },

    {
        "product_name": "Havells Bolt 500W Mixer Grinder (3 Jars)",
        "image_url": _IMG["mixer_grinder"],
        "grade": "C", "confidence": 65,
        "action": "donate",
        "damage": "Liquid jar (1.5L) has a hairline crack near the base — risk of leaking; dry grinding jar, chutney jar, motor (500W), speed controls, and all blades work perfectly",
        "reason": "Liquid jar crack makes the set unsafe to use for soups or juices",
        "resale_value": 0, "co2_saved": 4.2, "credits": 18,
        "listing": None,
    },

    {
        "product_name": "Cello Ozone BPA-Free Water Bottle Set (1L × 3)",
        "image_url": _IMG["water_bottle"],
        "grade": "Junk", "confidence": 88,
        "action": "recycle",
        "damage": "All 3 flip-lid hinge mechanisms have fractured — lids cannot lock shut; bottles themselves (BPA-free plastic body) are structurally intact but unusable without working lids",
        "reason": "All lid hinges failed within 4 months — manufacturing defect",
        "resale_value": 0, "co2_saved": 0.5, "credits": 8,
        "listing": None,
    },

    # ══════════════════════════════════════════════════════════
    # CATEGORY: BOOKS & STATIONERY
    # ══════════════════════════════════════════════════════════

    {
        "product_name": "Atomic Habits by James Clear (Hardcover)",
        "image_url": _IMG["atomic_habits"],
        "grade": "A", "confidence": 97,
        "action": "resell",
        "damage": "Read once — spine uncracked, zero annotations or dog-ears, cover has no scratches",
        "reason": "Customer ordered hardcover version but prefers paperback",
        "resale_value": 380, "co2_saved": 0.4, "credits": 8,
        "listing": {
            "title": "Atomic Habits (Hardcover) — Grade A, Read Once",
            "description": (
                "Read once end-to-end — spine shows no cracking, pages are clean with zero highlights. "
                "Hardcover jacket has no tears or fading."
            ),
            "highlights": [
                "Read once — spine: completely uncracked",
                "Zero annotations, highlights, or dog-ears",
                "Cover jacket: no tears, scratches, or fading",
                "All 306 pages present and clean",
                "Grade A — as-new reading condition",
            ],
            "trust_score": 97.8, "price": 349,
        },
    },

    {
        "product_name": "Rich Dad Poor Dad by Robert Kiyosaki (Paperback)",
        "image_url": _IMG["rich_dad"],
        "grade": "B", "confidence": 74,
        "action": "refurbish",
        "damage": "Approximately 30 pages have yellow highlighter marks; all 207 pages present, binding tight, cover and spine undamaged",
        "reason": "Highlighted copy from a previous reader — seller prefers clean books",
        "resale_value": 180, "co2_saved": 0.3, "credits": 6,
        "listing": {
            "title": "Rich Dad Poor Dad (Paperback) — Grade B, Highlighted",
            "description": (
                "Previous reader highlighted ~30 key pages in yellow; "
                "all 207 pages are present, binding is tight, and cover is undamaged. "
                "Great for study groups who appreciate annotated copies."
            ),
            "highlights": [
                "~30 pages highlighted in yellow only",
                "All 207 pages present — none torn or missing",
                "Binding: tight, no loose pages",
                "Cover and spine: no tears or water damage",
                "Grade B — fully readable condition",
            ],
            "trust_score": 73.2, "price": 149,
        },
    },

    {
        "product_name": "NCERT Physics Part 2 Textbook — Class 12",
        "image_url": _IMG["ncert_physics"],
        "grade": "A", "confidence": 91,
        "action": "resell",
        "damage": "Student's name written on first page; all content pages are clean, diagrams intact, no highlighting",
        "reason": "Board exams completed — passing to next academic year student",
        "resale_value": 95, "co2_saved": 0.3, "credits": 6,
        "listing": {
            "title": "NCERT Physics Part 2 Class 12 — Grade A, Name on First Page",
            "description": (
                "Used for one academic year — student's name on page 1 only. "
                "All diagrams, derivations, and exercise sections are completely clean."
            ),
            "highlights": [
                "Name written on page 1 only — rest is clean",
                "Zero highlighting or annotations in content pages",
                "All diagrams and figures: intact and clear",
                "Exercise solutions section: unmarked",
                "Grade A — exam-ready condition",
            ],
            "trust_score": 91.5, "price": 85,
        },
    },

    # ══════════════════════════════════════════════════════════
    # CATEGORY: SPORTS & FITNESS
    # ══════════════════════════════════════════════════════════

    {
        "product_name": "Decathlon Nabaiji Swimming Goggles (Clear Lens)",
        "image_url": _IMG["swim_goggles"],
        "grade": "A", "confidence": 95,
        "action": "resell",
        "damage": "Worn once in indoor pool — lenses scratch-free, UV coating intact, silicone seals have no tears",
        "reason": "Ordered Clear lens; needed Tinted lens for outdoor pool use",
        "resale_value": 480, "co2_saved": 0.6, "credits": 8,
        "listing": {
            "title": "Decathlon Swim Goggles (Clear) — Grade A, Used Once",
            "description": (
                "Worn one session in an indoor pool — wrong tint ordered. "
                "Silicone seals are intact with no tears, lenses are scratch-free."
            ),
            "highlights": [
                "Worn once only — lenses: scratch-free",
                "Silicone nose bridge and seals: no tears or deformation",
                "UV protection coating: verified intact",
                "Adjustable strap: full elasticity retained",
                "Grade A — near-new condition",
            ],
            "trust_score": 95.2, "price": 449,
        },
    },

    {
        "product_name": "Nivia Carbonite Football (Size 5, Thermally Bonded)",
        "image_url": _IMG["football"],
        "grade": "B", "confidence": 76,
        "action": "refurbish",
        "damage": "One surface panel has a 4 cm scuff from concrete court; bladder holds air for 72+ hours, all 32 panels intact, and round shape verified",
        "reason": "Surface scuff from accidental concrete-surface play",
        "resale_value": 850, "co2_saved": 1.2, "credits": 12,
        "listing": {
            "title": "Nivia Carbonite Football Size 5 — Grade B, Surface Scuff",
            "description": (
                "One panel has a 4 cm scuff from concrete — cosmetic only. "
                "Bladder tested at 72+ hours air retention; all 32 panels are structurally perfect."
            ),
            "highlights": [
                "Scuff mark on 1 panel (~4 cm) — cosmetic only",
                "Bladder: holds air 72+ hours with no deflation",
                "All 32 thermally bonded panels: intact",
                "Round shape: verified with spin test",
                "Grade B — match-ready quality",
            ],
            "trust_score": 76.9, "price": 799,
        },
    },

    {
        "product_name": "Cosco CB-90 Badminton Racket Set (2 Rackets + Cover Bag)",
        "image_url": _IMG["badminton"],
        "grade": "A", "confidence": 93,
        "action": "resell",
        "damage": "Played 2 casual sessions — grips are clean, strings at full tension (24 lbs), frames show zero dents",
        "reason": "Recipient already owns badminton equipment — duplicate gift",
        "resale_value": 1300, "co2_saved": 1.0, "credits": 12,
        "listing": {
            "title": "Cosco CB-90 Badminton Set (2 Rackets) — Grade A, Used Twice",
            "description": (
                "Gifted but duplicate — played 2 casual games. "
                "Strings remain at full factory tension, grips show no sweat or wear marks."
            ),
            "highlights": [
                "Played 2 sessions only — grips: clean, no wear",
                "Strings: full tension at 24 lbs, no broken strings",
                "Both aluminium frames: no dents or cracks",
                "Cover bag: intact with functioning zip",
                "Grade A — near-new condition",
            ],
            "trust_score": 93.8, "price": 1249,
        },
    },

    {
        "product_name": "Boldfit Pro Gym Training Gloves with Wrist Support (Size M)",
        "image_url": _IMG["gym_gloves"],
        "grade": "C", "confidence": 65,
        "action": "donate",
        "damage": "Left glove wrist velcro strap has reduced adhesion (holds at ~60% normal strength); right glove and all padding on both gloves are in perfect condition",
        "reason": "Left wrist strap unreliable during heavy compound lifts — safety concern",
        "resale_value": 0, "co2_saved": 0.7, "credits": 8,
        "listing": None,
    },

]


# ── Seed function ─────────────────────────────────────────────────────────────

def seed(db):
    listing_count = 0
    for s in SCENARIOS:
        rg = ReturnGrade(
            product_name=s["product_name"],
            description=None,
            image_url=s.get("image_url"),
            grade=s["grade"],
            confidence=s["confidence"],
            damage_detected=s["damage"],
            recommended_action=s["action"],
            reason=s["reason"],
            estimated_resale_value_inr=s["resale_value"],
            co2_saved_kg=s["co2_saved"],
            credits_earned=s["credits"],
            is_mock=1,
        )
        db.add(rg)
        db.flush()

        trees = round(s["co2_saved"] / TREE_ABSORPTION_KG, 4)
        ct = CreditTransaction(
            product_name=s["product_name"],
            grade=s["grade"],
            action=s["action"],
            credits_earned=s["credits"],
            co2_saved_kg=s["co2_saved"],
            trees_equivalent=trees,
            return_id=rg.id,
        )
        db.add(ct)

        if s["listing"]:
            li_data = s["listing"]
            li = Listing(
                return_id=rg.id,
                product_name=s["product_name"],
                title=li_data["title"],
                description=li_data["description"],
                image_url=s.get("image_url"),
                grade=s["grade"],
                trust_score=li_data["trust_score"],
                suggested_price_inr=li_data["price"],
                highlights_json=json.dumps(li_data["highlights"]),
                status="active",
            )
            db.add(li)
            listing_count += 1

    db.commit()
    return listing_count


def _ev(status, note, ts=None):
    labels = {
        "pending": "Listed — Awaiting Purchase", "confirmed": "Purchase Confirmed",
        "agent_assigned": "Agent Assigned", "agent_en_route": "Agent En Route",
        "agent_arrived": "Agent Arrived at Pickup", "agent_analyzed": "Item Analyzed by Agent",
        "item_picked_up": "Item Picked Up", "out_for_delivery": "Out for Delivery",
        "dispatched": "Dispatched", "delivered": "Delivered ✓",
    }
    return {"status": status, "label": labels.get(status, status), "note": note,
            "ts": ts or datetime.now().strftime("%d %b %Y, %I:%M %p")}


def seed_demo_orders(db):
    tomorrow = (date.today() + timedelta(days=1)).strftime("%a, %d %b")

    DEMO_ORDERS = [
        # ── Seller orders ──────────────────────────────────────────────────────
        Order(
            product_name="Sony WH-1000XM4 Headphones",
            image_url=_IMG["sony_headphones"],
            grade="A", original_price=8075, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Arjun M.", delivery_city="Bengaluru",
            agent_name="Ravi Kumar", agent_phone="+91 98765 43210",
            agent_eta_date=tomorrow, agent_eta_time="10:00 AM – 1:00 PM",
            status="agent_assigned",
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",        "Your listing is live — waiting for a buyer"),
                _ev("confirmed",      "🎉 Arjun M. (Bengaluru) bought your item! Pickup being arranged"),
                _ev("agent_assigned", f"Agent Ravi Kumar assigned — arrives {tomorrow} · 10:00 AM – 1:00 PM"),
            ]),
        ),
        Order(
            product_name="Nike Air Force 1 Low Sneakers (White, UK Size 9)",
            image_url=_IMG["nike_shoe"],
            grade="A", original_price=5999, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Sneha R.", delivery_city="Pune",
            agent_name="Priya Nair", agent_phone="+91 65432 10987",
            agent_eta_date=tomorrow, agent_eta_time="12:00 PM – 3:00 PM",
            agent_photo_url=_IMG["nike_shoe"],
            agent_analysis_json=json.dumps({
                "grade": "A",
                "notes": "Grade A confirmed — soles are spotless, laces and aglets intact. No additional wear detected on closer inspection.",
                "price_change": False, "price": 5999,
            }),
            status="agent_analyzed",
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",        "Your listing is live — waiting for a buyer"),
                _ev("confirmed",      "🎉 Sneha R. (Pune) bought your item!"),
                _ev("agent_assigned", f"Agent Priya Nair assigned — arrives {tomorrow} · 12:00 PM – 3:00 PM"),
                _ev("agent_en_route", "Agent Priya Nair is on the way to your address"),
                _ev("agent_arrived",  "Agent has arrived and is inspecting your item"),
                _ev("agent_analyzed", "Agent photographed & graded your item — buyer notified"),
            ]),
        ),
        Order(
            product_name="JBL Charge 5 Portable Bluetooth Speaker",
            image_url=_IMG["jbl_speaker"],
            grade="A", original_price=12199, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Rahul K.", delivery_city="Mumbai",
            agent_name="Suresh Patel", agent_phone="+91 87654 32109",
            agent_eta_date=(date.today() - timedelta(days=1)).strftime("%a, %d %b"),
            agent_eta_time="3:00 PM – 6:00 PM",
            status="out_for_delivery",
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",          "Your listing is live — waiting for a buyer"),
                _ev("confirmed",        "🎉 Rahul K. (Mumbai) bought your item!"),
                _ev("agent_assigned",   "Agent Suresh Patel assigned"),
                _ev("agent_en_route",   "Agent Suresh Patel is on the way to your address"),
                _ev("agent_arrived",    "Agent has arrived and is inspecting your item"),
                _ev("agent_analyzed",   "Agent photographed & graded your item — buyer notified"),
                _ev("item_picked_up",   "Item picked up — heading to dispatch center"),
                _ev("out_for_delivery", "Item is out for delivery to Rahul K., Mumbai"),
            ]),
        ),
        Order(
            product_name="Xiaomi Smart Band 8 (Black Strap)",
            image_url=_IMG["smartband"],
            grade="A", original_price=2299, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Deepa V.", delivery_city="Chennai",
            agent_name="Amit Singh", agent_phone="+91 76543 21098",
            status="delivered",
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",          "Your listing is live — waiting for a buyer"),
                _ev("confirmed",        "🎉 Deepa V. (Chennai) bought your item!"),
                _ev("agent_assigned",   "Agent Amit Singh assigned"),
                _ev("agent_en_route",   "Agent Amit Singh is on the way to your address"),
                _ev("agent_arrived",    "Agent has arrived and is inspecting your item"),
                _ev("agent_analyzed",   "Agent photographed & graded your item — buyer notified"),
                _ev("item_picked_up",   "Item picked up — heading to dispatch center"),
                _ev("out_for_delivery", "Item is out for delivery to Deepa V., Chennai"),
                _ev("dispatched",       "Item dispatched from Jaipur fulfillment center"),
                _ev("delivered",        "✅ Item delivered! Green Credits added to your wallet"),
            ]),
        ),
        # ── Buyer orders ───────────────────────────────────────────────────────
        Order(
            product_name="Samsung Galaxy S23 Ultra 5G (256GB, Phantom Black)",
            image_url=_IMG["samsung_phone"],
            grade="A", original_price=85999, user_role="buyer",
            seller_name="Vikas S.",
            buyer_name="Adrika S.", delivery_city="Jaipur",
            status="confirmed",
            events_json=json.dumps([
                _ev("pending",   "Seller has listed this item"),
                _ev("confirmed", "Your order is confirmed — seller has been notified"),
            ]),
        ),
        Order(
            product_name="Adidas Essentials Fleece Hoodie (Size L, Legend Earth)",
            image_url=_IMG["adidas_hoodie"],
            grade="A", original_price=3899, user_role="buyer",
            seller_name="Pooja K.",
            buyer_name="Adrika S.", delivery_city="Jaipur",
            agent_name="Amit Singh", agent_phone="+91 76543 21098",
            agent_eta_date=tomorrow, agent_eta_time="9:00 AM – 12:00 PM",
            status="agent_en_route",
            events_json=json.dumps([
                _ev("pending",        "Seller has listed this item"),
                _ev("confirmed",      "Your order is confirmed — seller has been notified"),
                _ev("agent_assigned", f"Agent Amit Singh will collect your item from seller on {tomorrow}"),
                _ev("agent_en_route", "Agent is en route to collect your item from the seller"),
            ]),
        ),

        # ── Additional seller orders (more pipeline stages) ────────────────────
        Order(
            product_name="Philips HD9252 Digital Air Fryer (4.1L, Black)",
            image_url=_IMG["air_fryer"],
            grade="A", original_price=6999, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Karthik R.", delivery_city="Hyderabad",
            agent_name="Meena Verma", agent_phone="+91 91234 56789",
            agent_eta_date=tomorrow, agent_eta_time="11:00 AM – 2:00 PM",
            status="agent_en_route",
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",        "Your listing is live — waiting for a buyer"),
                _ev("confirmed",      "🎉 Karthik R. (Hyderabad) bought your item!"),
                _ev("agent_assigned", f"Agent Meena Verma assigned — arrives {tomorrow} · 11:00 AM – 2:00 PM"),
                _ev("agent_en_route", "Agent Meena Verma is on the way to your address"),
            ]),
        ),
        Order(
            product_name="Logitech MX Master 3S Wireless Mouse",
            image_url=_IMG["logitech_mouse"],
            grade="A", original_price=7499, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Sanjay T.", delivery_city="Delhi",
            agent_name="Rohan Das", agent_phone="+91 88765 43210",
            status="item_picked_up",
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",        "Your listing is live — waiting for a buyer"),
                _ev("confirmed",      "🎉 Sanjay T. (Delhi) bought your item!"),
                _ev("agent_assigned", "Agent Rohan Das assigned"),
                _ev("agent_en_route", "Agent Rohan Das is on the way to your address"),
                _ev("agent_arrived",  "Agent has arrived and is inspecting your item"),
                _ev("agent_analyzed", "Agent photographed & graded your item — buyer notified"),
                _ev("item_picked_up", "Item picked up — heading to dispatch center"),
            ]),
        ),
        Order(
            product_name="Canon EOS R50 Mirrorless Camera (Body Only)",
            image_url=_IMG["canon_camera"],
            grade="B", original_price=50499, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Nisha P.", delivery_city="Kolkata",
            agent_name="Suresh Patel", agent_phone="+91 87654 32109",
            status="dispatched",
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",          "Your listing is live — waiting for a buyer"),
                _ev("confirmed",        "🎉 Nisha P. (Kolkata) bought your item!"),
                _ev("agent_assigned",   "Agent Suresh Patel assigned"),
                _ev("agent_en_route",   "Agent Suresh Patel is on the way to your address"),
                _ev("agent_arrived",    "Agent has arrived and is inspecting your item"),
                _ev("agent_analyzed",   "Agent photographed & graded your item — buyer notified"),
                _ev("item_picked_up",   "Item picked up — heading to dispatch center"),
                _ev("out_for_delivery", "Item is out for delivery to Nisha P., Kolkata"),
                _ev("dispatched",       "Item dispatched from Jaipur fulfillment center"),
            ]),
        ),

        # ── Additional buyer orders (more pipeline stages) ─────────────────────
        Order(
            product_name="Apple AirPods Pro (2nd Gen) with MagSafe Case",
            image_url=_IMG["airpods"],
            grade="B", original_price=15899, user_role="buyer",
            seller_name="Ravi M.",
            buyer_name="Adrika S.", delivery_city="Jaipur",
            agent_name="Priya Nair", agent_phone="+91 65432 10987",
            agent_photo_url=_IMG["airpods"],
            agent_analysis_json=json.dumps({
                "grade": "B",
                "notes": "Grade B confirmed — left ANC drops intermittently as described. Right earbud and case are in excellent shape. Price adjusted slightly.",
                "price_change": True, "price": 14999,
            }),
            status="agent_analyzed",
            events_json=json.dumps([
                _ev("pending",        "Seller has listed this item"),
                _ev("confirmed",      "Your order is confirmed — seller Ravi M. has been notified"),
                _ev("agent_assigned", "Agent Priya Nair will collect your item from seller"),
                _ev("agent_en_route", "Agent is en route to collect your item"),
                _ev("agent_arrived",  "Agent has arrived and is inspecting the item"),
                _ev("agent_analyzed", "Agent sent you an updated photo & grade — please review"),
            ]),
        ),
        Order(
            product_name="Prestige Pressure Cooker Deluxe Alpha 5L",
            image_url=_IMG["prestige_cooker"],
            grade="A", original_price=1140, user_role="buyer",
            seller_name="Anita K.",
            buyer_name="Adrika S.", delivery_city="Jaipur",
            agent_name="Meena Verma", agent_phone="+91 91234 56789",
            status="out_for_delivery",
            events_json=json.dumps([
                _ev("pending",          "Seller has listed this item"),
                _ev("confirmed",        "Your order is confirmed — seller Anita K. has been notified"),
                _ev("agent_assigned",   "Agent Meena Verma will collect your item from seller"),
                _ev("agent_en_route",   "Agent is en route to collect your item"),
                _ev("agent_arrived",    "Agent has arrived and is inspecting the item"),
                _ev("agent_analyzed",   "Item verified Grade A — condition matches listing. Shipping now"),
                _ev("item_picked_up",   "Item picked up from seller — on its way to you"),
                _ev("out_for_delivery", "Out for delivery to your address in Jaipur"),
            ]),
        ),
        Order(
            product_name="Levi's 511 Slim Fit Jeans (32W × 30L, Dark Blue)",
            image_url=_IMG["levis_jeans"],
            grade="B", original_price=1999, user_role="buyer",
            seller_name="Mohan S.",
            buyer_name="Adrika S.", delivery_city="Jaipur",
            agent_name="Rohan Das", agent_phone="+91 88765 43210",
            status="delivered",
            events_json=json.dumps([
                _ev("pending",          "Seller has listed this item"),
                _ev("confirmed",        "Your order is confirmed — seller Mohan S. has been notified"),
                _ev("agent_assigned",   "Agent Rohan Das will collect your item from seller"),
                _ev("agent_en_route",   "Agent is en route to collect your item"),
                _ev("agent_arrived",    "Agent has arrived and is inspecting the item"),
                _ev("agent_analyzed",   "Item verified Grade B — minor ink stain as described. Proceeding"),
                _ev("item_picked_up",   "Item picked up from seller — on its way to you"),
                _ev("out_for_delivery", "Out for delivery to your address in Jaipur"),
                _ev("dispatched",       "Item dispatched from fulfillment center"),
                _ev("delivered",        "✅ Delivered to your address! Enjoy your purchase"),
            ]),
        ),
        # ── Price-change decision scenarios ────────────────────────────────────
        # 1. PENDING — agent lowered price, seller hasn't responded yet
        Order(
            product_name="Realme 55-inch 4K QLED Smart TV",
            image_url=_IMG["smart_tv"],
            grade="B", original_price=23499, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Mohit G.", delivery_city="Lucknow",
            agent_name="Deepak Rao", agent_phone="+91 93456 78901",
            agent_eta_date=(date.today()).strftime("%a, %d %b"),
            agent_eta_time="2:00 PM – 5:00 PM",
            agent_photo_url=_IMG["smart_tv"],
            agent_analysis_json=json.dumps({
                "grade": "B",
                "notes": "Dead pixel visible at 60 cm viewing distance (not just extreme corner). Grade revised to B. Recommend price drop to ₹21,000 to remain competitive.",
                "price_change": True, "price": 21000,
            }),
            status="agent_analyzed",
            seller_decision=None,
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",        "Your listing is live — waiting for a buyer"),
                _ev("confirmed",      "🎉 Mohit G. (Lucknow) bought your item!"),
                _ev("agent_assigned", "Agent Deepak Rao assigned — arriving today · 2:00 PM – 5:00 PM"),
                _ev("agent_en_route", "Agent Deepak Rao is on the way to your address"),
                _ev("agent_arrived",  "Agent has arrived and is inspecting your item"),
                _ev("agent_analyzed", "⚠️ Agent updated price to ₹21,000 — your response required"),
            ]),
        ),

        # 2. ACCEPTED — seller agreed to the lower price, sale proceeding
        Order(
            product_name="Boat Airdopes 141 TWS Earbuds",
            image_url=_IMG["boat_earbuds"],
            grade="B", original_price=585, final_price=450, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Tanya M.", delivery_city="Pune",
            agent_name="Meena Verma", agent_phone="+91 91234 56789",
            agent_photo_url=_IMG["boat_earbuds"],
            agent_analysis_json=json.dumps({
                "grade": "B",
                "notes": "Left earbud crackling is more noticeable than listing described. Grade B confirmed but price revised down to ₹450.",
                "price_change": True, "price": 450,
            }),
            status="item_picked_up",
            seller_decision="accepted",
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",        "Your listing is live — waiting for a buyer"),
                _ev("confirmed",      "🎉 Tanya M. (Pune) bought your item!"),
                _ev("agent_assigned", "Agent Meena Verma assigned"),
                _ev("agent_en_route", "Agent Meena Verma is on the way to your address"),
                _ev("agent_arrived",  "Agent has arrived and is inspecting your item"),
                _ev("agent_analyzed", "⚠️ Agent updated price to ₹450 — waiting for your response"),
                _ev("item_picked_up", "✅ You accepted ₹450 — agent picked up your item"),
            ]),
        ),

        # 3. CANCELLED — seller declined the agent's updated price
        Order(
            product_name="Nivia Carbonite Football (Size 5)",
            image_url=_IMG["football"],
            grade="B", original_price=799, user_role="seller",
            seller_name="Adrika S.",
            buyer_name="Farhan K.", delivery_city="Ahmedabad",
            agent_name="Rohan Das", agent_phone="+91 88765 43210",
            agent_photo_url=_IMG["football"],
            agent_analysis_json=json.dumps({
                "grade": "B",
                "notes": "Scuff is larger than described — approx 7 cm. Bladder holds air fine. Revised price ₹600.",
                "price_change": True, "price": 600,
            }),
            status="cancelled",
            seller_decision="declined",
            pickup_address_json=json.dumps({
                "name": "Adrika Sarawat", "phone": "+91 99887 76655",
                "line1": "42 Green Park Colony", "city": "Jaipur", "state": "Rajasthan", "pincode": "302001",
            }),
            events_json=json.dumps([
                _ev("pending",        "Your listing is live — waiting for a buyer"),
                _ev("confirmed",      "🎉 Farhan K. (Ahmedabad) bought your item!"),
                _ev("agent_assigned", "Agent Rohan Das assigned"),
                _ev("agent_en_route", "Agent Rohan Das is on the way to your address"),
                _ev("agent_arrived",  "Agent has arrived and is inspecting your item"),
                _ev("agent_analyzed", "⚠️ Agent updated price to ₹600 — waiting for your response"),
                _ev("cancelled",      "❌ You declined the updated price — sale cancelled, item stays with you"),
            ]),
        ),
    ]

    for o in DEMO_ORDERS:
        db.add(o)
    db.commit()


def seed_if_empty():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(ReturnGrade).count() == 0:
            listing_count = seed(db)
            _print_summary(listing_count)
        if db.query(Order).count() == 0:
            seed_demo_orders(db)
    finally:
        db.close()


def _print_summary(listing_count: int):
    total_credits = sum(s["credits"] for s in SCENARIOS)
    total_co2 = sum(s["co2_saved"] for s in SCENARIOS)
    grade_counts = {}
    for s in SCENARIOS:
        grade_counts[s["grade"]] = grade_counts.get(s["grade"], 0) + 1
    print()
    print("=== DEMO DATA SEEDED ===")
    print(f"Total returns        : {len(SCENARIOS)}")
    for g, n in sorted(grade_counts.items()):
        print(f"  Grade {g:<6}       : {n}")
    print(f"Active listings      : {listing_count}")
    print(f"Total credits issued : {total_credits}")
    print(f"Total CO₂ saved      : {total_co2} kg")
    print()


if __name__ == "__main__":
    from sqlalchemy import text as _sql_text
    try:
        with engine.begin() as _c:
            _c.execute(_sql_text("ALTER TABLE orders ADD COLUMN seller_decision VARCHAR"))
    except Exception:
        pass

    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--full-reset", action="store_true",
                        help="Wipe ALL tables (returns, listings, transactions, orders) before reseeding")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if args.full_reset:
            db.query(Order).delete()
            db.query(CreditTransaction).delete()
            db.query(Listing).delete()
            db.query(ReturnGrade).delete()
            db.commit()
            listing_count = seed(db)
            seed_demo_orders(db)
            _print_summary(listing_count)
        else:
            # Only wipe and reseed orders — keeps manually created returns/listings/transactions intact
            db.query(Order).delete()
            db.commit()
            seed_demo_orders(db)
            listing_count = db.query(Listing).count()
            print(f"\n=== ORDERS RESEEDED (returns/listings preserved) ===")
            print(f"Active listings : {listing_count}  (untouched)")
            print(f"Demo orders     : {db.query(Order).count()}")
            print()
    finally:
        db.close()
