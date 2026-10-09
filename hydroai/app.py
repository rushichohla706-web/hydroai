"""HydroAI – Flask backend.

Run:  python app.py      ->  http://127.0.0.1:5000
"""
from flask import Flask, jsonify, render_template, request

import engine

app = Flask(__name__)


@app.get("/")
def index():
    return render_template("index.html")


@app.errorhandler(engine.UpstreamError)
def upstream_error(e):
    return jsonify(error="Live weather service unreachable. Check your internet connection."), 502


@app.get("/api/health")
def health():
    status = {"risk_engine": True, "weather_api": None, "geocoding_api": None}
    try:
        engine.geocode("Delhi")
        status["geocoding_api"] = True
    except engine.UpstreamError:
        status["geocoding_api"] = False
    return jsonify(status)


@app.get("/api/geocode")
def geocode():
    """Proxy for Open-Meteo geocoding (same JSON shape)."""
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify(error="Missing 'name'"), 400
    return jsonify(engine.geocode(name, request.args.get("count", 1, type=int)))


@app.get("/api/weather")
def weather():
    """Live weather for lat/lon + prototype risk score (dashboard)."""
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)
    if lat is None or lon is None or not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return jsonify(error="Valid 'lat' and 'lon' are required"), 400
    wx = engine.forecast(lat, lon)
    cur = wx["current"]
    probs = (wx["hourly"].get("precipitation_probability") or [])[:24]
    precip = (wx["hourly"].get("precipitation") or [])[:24]
    now = engine.current_rain(cur)
    return jsonify(
        current=cur,
        hourly={"precipitation_probability": probs, "precipitation": precip},
        risk=engine.risk_score(now, probs, precip, lat, lon),
    )


@app.get("/api/risk")
def risk():
    """Weather Lab: city name -> location + live weather + verdict."""
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify(error="Please enter a location first."), 400
    geo = engine.geocode(q)
    if not geo.get("results"):
        return jsonify(error="Location not found. Try a nearby city name."), 404
    g = geo["results"][0]
    wx = engine.forecast(g["latitude"], g["longitude"])
    cur = wx["current"]
    probs = (wx["hourly"].get("precipitation_probability") or [])[:24]
    mm_hr = engine.current_rain(cur)
    max_p = max(probs, default=0)
    return jsonify(
        location=g,
        current=cur,
        mm_hr=mm_hr,
        probs=probs,
        max_p=max_p,
        verdict=engine.quick_verdict(mm_hr, max_p),
    )


if __name__ == "__main__":
    app.run(debug=True)
