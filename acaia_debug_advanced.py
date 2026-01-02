import asyncio
import logging
import sys
from bleak import BleakScanner
from pyacaia_async import AcaiaScale

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

async def main():
    print("--- Acaia Advanced Debugger ---")
    devices = await BleakScanner.discover(timeout=5.0)
    print([d.name for d in devices])
    acaia_devices = [d for d in devices if d.name and "PEARL" in d.name.upper()]
    
    if not acaia_devices:
        print("No Acaia scales found.")
        return

    target = acaia_devices[0]
    
    # Try NEW STYLE first
    print(f"\n--- Testing NEW STYLE Connection to {target.name} ---")
    scale = AcaiaScale(target, is_new_style_scale=True)
    await scale.connect()
    
    print("Sending START TIMER command...")
    # await scale.start_stop_timer() 
    
    for i in range(5):
        await asyncio.sleep(1) # Wait 5 seconds to see if timer updates arrive
        print(f"Scale: {scale.timer}s")
    
    print(f"Current Timer Value: {scale.timer}s")
    print(f"Timer Running State: {scale.timer_running}")
    
    if scale.timer == 0:
        print("\n--- NEW STYLE failed to get timer. Testing OLD STYLE ---")
        await scale.disconnect()
        scale = AcaiaScale(target, is_new_style_scale=False)
        await scale.connect()
        await scale.start_stop_timer()
        await asyncio.sleep(5)
        print(f"Current Timer Value (Old Style): {scale.timer}s")

    await scale.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
