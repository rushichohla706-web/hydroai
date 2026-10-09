# HydroAI – Python (Flask) project

```
hydroai/
├── app.py            # Flask server + API routes
├── engine.py         # Python risk engine + Open-Meteo client (cached)
├── requirements.txt
├── templates/index.html
└── static/
    ├── css/  style.css, command-center.css
    └── js/   scene.js, command-center.js
```

## Run
```bash
pip install -r requirements.txt
python app.py
# open http://127.0.0.1:5000
```

## API
| Route | Purpose |
|---|---|
| `GET /api/risk?q=Mumbai` | Weather Lab: geocode + live weather + RED/ORANGE/GREEN verdict |
| `GET /api/weather?lat=..&lon=..` | Dashboard: live weather + risk score (0-100) and factor breakdown |
| `GET /api/geocode?name=..` | Open-Meteo geocoding proxy |
| `GET /api/health` | Backend / geocoding status |

Risk logic lives in `engine.py` (prototype rule-based; terrain/drainage/elevation are simulated).
