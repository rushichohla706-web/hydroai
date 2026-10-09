"""HydroAI prototype risk engine (pure Python, no Flask here).

NOTE: This is a rule-based PROTOTYPE, not a trained ML model.
Terrain / drainage / elevation factors are simulated (seeded by lat/lon).
"""
import math
import time
import requests

GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"
WX_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_TTL = 300  # seconds
TIMEOUT = 10

_cache = {}


class UpstreamError(Exception):
    """Open-Meteo unreachable or returned an error."""


def _get(url, params):
    key = (url, tuple(sorted(params.items())))
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_TTL:
        return hit[1]
    try:
        r = requests.get(url, params=params, timeout=TIMEOUT)
        r.raise_for_status()
        data = r.json()
    except (requests.RequestException, ValueError) as e:
        raise UpstreamError(str(e)) from e
    _cache[key] = (time.time(), data)
    return data


def geocode(name, count=1):
    return _get(GEO_URL, {"name": name, "count": count, "language": "en", "format": "json"})


def forecast(lat, lon):
    return _get(WX_URL, {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,rain,weather_code",
        "hourly": "precipitation_probability,precipitation",
        "forecast_days": 2,
        "timezone": "auto",
    })


# ---------- risk logic ----------
def seeded(lat, lon, k):
    """Deterministic pseudo-random 0..1 (same maths as the old JS version)."""
    x = math.sin(lat * 12.9898 + lon * 78.233 + k) * 43758.5453
    return x - math.floor(x)


def level(score):
    if score >= 65:
        return "red"
    if score >= 35:
        return "amber"
    return "green"


def quick_verdict(mm_hr, max_prob):
    """Weather-Lab verdict from live rain + probability."""
    if mm_hr > 75 or (mm_hr > 35 and max_prob > 80):
        return "red"
    if mm_hr > 35 or max_prob > 60:
        return "amber"
    return "green"


def risk_score(now, probs, precip, lat, lon):
    """Command-dashboard score out of 100 with factor breakdown."""
    max_p = max(probs, default=0)
    peak = max([*precip, 0, now])
    fv = {k: seeded(lat, lon, k) for k in (1, 2, 3)}
    factors = [
        ["Rainfall", min(40, max(now, peak) / 75 * 40), 40],
        ["Rain prob.", max_p * 0.2, 20],
        ["Terrain*", fv[1] * 15, 15],
        ["Drainage*", fv[2] * 15, 15],
        ["Elevation*", fv[3] * 10, 10],
    ]
    score = round(sum(f[1] for f in factors))
    return {
        "score": score,
        "level": level(score),
        "factors": factors,
        "max_prob": max_p,
        "peak": peak,
        "fv": fv,
    }


def current_rain(cur):
    rain = cur.get("rain")
    return rain if rain is not None else (cur.get("precipitation") or 0)
