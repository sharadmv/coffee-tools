import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from bleak import BleakScanner
from stagg_ekg_pro import StaggEKGPro, ScheduleMode, Units, ClockMode

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# Global State
kettle: Optional[StaggEKGPro] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    if kettle:
        await kettle.disconnect()

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Models
class ConnectRequest(BaseModel):
    address: str

class TargetTempRequest(BaseModel):
    temperature: float

class ScheduleRequest(BaseModel):
    mode: str # "off", "once", "daily"
    hour: int = 0
    minute: int = 0
    temperature: float = 85

class HoldRequest(BaseModel):
    minutes: int

# Routes

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/scan")
async def scan_devices():
    """Scan for BLE devices and return potential Stagg EKG Pro kettles."""
    logger.info("Scanning for devices...")
    devices = await BleakScanner.discover(return_adv=True)
    results = []
    for d, a in devices.values():
        # Simple filter: check name or if it looks like a Fellow device
        # The name usually contains "Stagg" or "Fellow"
        name = d.name or ""
        if "Stagg" in name or "Fellow" in name or "EKG" in name:
            results.append({"name": name, "address": d.address, "rssi": a.rssi})
        # If no specific name, maybe we list everything or let user filter? 
        # For now, let's just return everything if list is short, 
        # but to be safe, let's return all, frontend can filter.
        # Actually, returning all might be noisy. Let's return all for now.
    
    # Sort by RSSI
    results = sorted(results, key=lambda x: x['rssi'], reverse=True)
    
    # If we found nothing specific, return top 5 strongest signals
    if not results:
         top_devices = sorted(devices.values(), key=lambda x: x[1].rssi, reverse=True)[:5]
         for d, a in top_devices:
             results.append({"name": d.name or "Unknown", "address": d.address, "rssi": a.rssi})

    return results

@app.post("/api/connect")
async def connect_device(req: ConnectRequest):
    global kettle
    if kettle:
        await kettle.disconnect()
    
    kettle = StaggEKGPro(req.address)
    connected = await kettle.connect()
    
    if not connected:
        kettle = None
        raise HTTPException(status_code=400, detail="Failed to connect to device")
    
    return {"status": "connected", "address": req.address}

@app.post("/api/disconnect")
async def disconnect_device():
    global kettle
    if kettle:
        await kettle.disconnect()
        kettle = None
    return {"status": "disconnected"}

@app.get("/api/state")
async def get_state():
    global kettle
    if not kettle or not kettle.client or not kettle.client.is_connected:
        return {"connected": False}
    
    try:
        # Refresh state to ensure we have latest
        await kettle.refresh_state()
        state = kettle.get_all_states()
        state["connected"] = True
        return state
    except Exception as e:
        logger.error(f"Error getting state: {e}")
        return {"connected": False, "error": str(e)}

@app.post("/api/temperature")
async def set_temperature(req: TargetTempRequest):
    global kettle
    if not kettle:
        raise HTTPException(status_code=400, detail="Not connected")
    await kettle.set_target_temperature(req.temperature)
    return {"status": "ok", "target": req.temperature}

@app.post("/api/schedule")
async def set_schedule(req: ScheduleRequest):
    global kettle
    if not kettle:
        raise HTTPException(status_code=400, detail="Not connected")
    
    mode_map = {
        "off": ScheduleMode.OFF,
        "once": ScheduleMode.ONCE,
        "daily": ScheduleMode.DAILY
    }
    
    if req.mode not in mode_map:
        raise HTTPException(status_code=400, detail="Invalid schedule mode")
        
    await kettle.set_schedule(
        mode=mode_map[req.mode],
        hour=req.hour,
        minute=req.minute,
        temp_celsius=req.temperature
    )
    return {"status": "ok", "schedule": req.dict()}

@app.post("/api/hold")
async def set_hold(req: HoldRequest):
    global kettle
    if not kettle:
        raise HTTPException(status_code=400, detail="Not connected")
    await kettle.set_hold_time(req.minutes)
    return {"status": "ok", "hold_minutes": req.minutes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
