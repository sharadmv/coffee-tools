import asyncio
import logging
import sys
from bleak import BleakScanner
from pyacaia_async import AcaiaScale

# Set logging to DEBUG to see raw packets
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger("acaia_debug")

async def main():
    print("--- Acaia Python Debugger ---")
    print("Scanning for Acaia scales...")
    
    devices = await BleakScanner.discover(timeout=5.0)
    acaia_devices = [d for d in devices if d.name and ("ACAIA" in d.name.upper() or "PEARL" in d.name.upper() or "LUNAR" in d.name.upper())]
    
    if not acaia_devices:
        print("No Acaia scales found. Make sure it's turned on and not connected to another device.")
        return

    print("\nFound scales:")
    for i, d in enumerate(acaia_devices):
        print(f"{i}: {d.name} ({d.address})")
    
    idx = 0
    if len(acaia_devices) > 1:
        val = input("\nSelect device index (default 0): ")
        if val.strip():
            idx = int(val)
            
    target = acaia_devices[idx]
    print(f"\nConnecting to {target.name}...")

    # is_new_style_scale=True is default for most modern Acaia scales
    scale = AcaiaScale(target, is_new_style_scale=True)
    
    try:
        await scale.connect()
        print("\n✅ Connected!")
        print("Listening for weight and timer updates. Press Ctrl+C to stop.")
        print("Try pressing the physical TARE or START buttons on the scale.")
        
        last_weight = None
        last_timer = None

        while True:
            # Check for updates every 100ms
            if scale.weight != last_weight or scale.timer != last_timer:
                print(f"Update -> Weight: {scale.weight}g | Timer: {scale.timer}s | Running: {scale.timer_running}")
                last_weight = scale.weight
                last_timer = scale.timer
            
            await asyncio.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\nStopping...")
    except Exception as e:
        print(f"\nError: {e}")
    finally:
        await scale.disconnect()
        print("Disconnected.")

if __name__ == "__main__":
    asyncio.run(main())
