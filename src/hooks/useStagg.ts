import { useState, useCallback, useRef } from 'react';

// Service UUIDs
const MAIN_CONFIG_UUID = '2291c4b5-5d7f-4477-a88b-b266edb97142';
const OPTIONAL_SERVICES = [
    '7aebf330-6cb1-46e4-b23b-7cc2262c605e',
    'b4df5a1c-3f6b-f4bf-ea4a-820304901a02', 
    '00001820-0000-1000-8000-00805f9b34fb',
    MAIN_CONFIG_UUID 
];

// Payload Offsets
const Payload = {
    STATUS_FLAGS: 0,
    CONTROL_FLAGS: 1,
    ALTITUDE_LOW: 2,
    ALTITUDE_HIGH: 3,
    TARGET_TEMP: 4,
    SCHEDULE_TEMP: 6,
    SCHEDULE_MINUTES: 8,
    SCHEDULE_HOURS: 9,
    CLOCK_MINUTES: 10,
    CLOCK_HOURS: 11,
    CLOCK_MODE: 12,
    HOLD_TIME: 13,
    CHIME_VOLUME: 14,
    LANGUAGE: 15,
    COUNTER: 16
};

const Flags = {
    UNITS: 0x02,
    PRE_BOIL: 0x08,
    SCHEDULE_ENABLED: 0x08,
    SCHEDULE_MODE: 0x08
};

export interface StaggState {
    target_temperature: number;
    units: 'celsius' | 'fahrenheit';
    pre_boil_enabled: boolean;
    altitude_meters: number;
    hold_time_minutes: number;
    schedule: {
        mode: 'off' | 'once' | 'daily';
        temperature_celsius: number;
        hour: number;
        minute: number;
    };
    language: number;
    clock: {
        hour: number;
        minute: number;
    };
    connected: boolean;
}

export interface StaggLog {
    timestamp: string;
    method: string;
    args: string;
}

export function useStagg() {
    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
    const [state, setState] = useState<StaggState | null>(null);
    const [logs, setLogs] = useState<StaggLog[]>([]);
    const [isDebugMode, setIsDebugMode] = useState(false);
    
    const stateDataRef = useRef<Uint8Array | null>(null);
    const counterRef = useRef(0);

    const addLog = useCallback((method: string, ...args: any[]) => {
        if (!isDebugMode) return;
        const log: StaggLog = {
            timestamp: new Date().toISOString().split('T')[1].split('.')[0],
            method,
            args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(', ')
        };
        setLogs(prev => [...prev, log]);
    }, [isDebugMode]);

    const parseState = (data: Uint8Array): StaggState => {
        const altLow = data[Payload.ALTITUDE_LOW];
        const altHigh = data[Payload.ALTITUDE_HIGH];
        const altRaw = ((altHigh & 0x7F) << 8) | altLow;
        const altitude = Math.round((Math.round(altRaw / 30) * 30));

        const scheduleEnabled = !!(data[Payload.STATUS_FLAGS] & Flags.SCHEDULE_ENABLED);
        const scheduleModeRaw = data[Payload.COUNTER] & Flags.SCHEDULE_MODE;
        let scheduleMode: 'off' | 'once' | 'daily' = 'off';
        if (scheduleEnabled) {
            scheduleMode = scheduleModeRaw ? 'once' : 'daily';
        }

        return {
            target_temperature: data[Payload.TARGET_TEMP] / 2.0,
            units: (data[Payload.CONTROL_FLAGS] & Flags.UNITS) ? 'celsius' : 'fahrenheit',
            pre_boil_enabled: !!(data[Payload.CONTROL_FLAGS] & Flags.PRE_BOIL),
            altitude_meters: altitude,
            hold_time_minutes: data[Payload.HOLD_TIME],
            schedule: {
                mode: scheduleMode,
                temperature_celsius: data[Payload.SCHEDULE_TEMP] / 2.0,
                hour: data[Payload.SCHEDULE_HOURS],
                minute: data[Payload.SCHEDULE_MINUTES]
            },
            language: data[Payload.LANGUAGE],
            clock: {
                hour: data[Payload.CLOCK_HOURS],
                minute: data[Payload.CLOCK_MINUTES]
            },
            connected: true
        };
    };

    const updateState = useCallback((dataView: DataView) => {
        const data = new Uint8Array(dataView.buffer);
        stateDataRef.current = data;
        counterRef.current = data[Payload.COUNTER];
        setState(parseState(data));
    }, []);

    const handleNotification = useCallback((event: Event) => {
        const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
        if (characteristic.value) {
            updateState(characteristic.value);
        }
    }, [updateState]);

    const connect = useCallback(async () => {
        addLog('connect');
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'Stagg' },
                    { namePrefix: 'Fellow' },
                    { namePrefix: 'EKG' }
                ],
                optionalServices: OPTIONAL_SERVICES,
                acceptAllDevices: false 
            });

            setDevice(device);
            const server = await device.gatt?.connect();
            if (!server) throw new Error("Could not connect to GATT server");

            let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
            for (const uuid of OPTIONAL_SERVICES) {
                try {
                    const service = await server.getPrimaryService(uuid);
                    characteristic = await service.getCharacteristic(MAIN_CONFIG_UUID);
                    if (characteristic) break;
                } catch (e) {
                    // Continue to next service
                }
            }

            if (!characteristic) throw new Error("Could not find Main Config Characteristic");

            setCharacteristic(characteristic);
            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', handleNotification);

            const initialValue = await characteristic.readValue();
            updateState(initialValue);

            device.addEventListener('gattserverdisconnected', () => {
                setState(prev => prev ? { ...prev, connected: false } : null);
                setCharacteristic(null);
            });

        } catch (error) {
            console.error(error);
            throw error;
        }
    }, [addLog, handleNotification, updateState]);

    const disconnect = useCallback(() => {
        addLog('disconnect');
        if (device?.gatt?.connected) {
            device.gatt.disconnect();
        }
        setDevice(null);
        setCharacteristic(null);
        setState(null);
    }, [device, addLog]);

    const writeState = useCallback(async (newData: Uint8Array) => {
        if (!characteristic) return;
        
        counterRef.current = (counterRef.current + 1) & 0xFF;
        newData[Payload.COUNTER] = counterRef.current;

        addLog('writeState', [...newData].map(b => b.toString(16).padStart(2,'0')).join(' '));

        try {
            await characteristic.writeValueWithResponse(newData as any);
            stateDataRef.current = newData;
            setState(parseState(newData));
        } catch (e) {
            console.error("Write failed", e);
            throw e;
        }
    }, [characteristic, addLog]);

    const setTemperature = useCallback(async (tempC: number) => {
        if (!stateDataRef.current) return;
        addLog('setTemperature', tempC);
        const newData = new Uint8Array(stateDataRef.current);
        newData[Payload.TARGET_TEMP] = Math.round(Math.max(0, Math.min(100, tempC)) * 2);
        await writeState(newData);
    }, [writeState, addLog]);

    const setHoldTime = useCallback(async (minutes: number) => {
        if (!stateDataRef.current) return;
        addLog('setHoldTime', minutes);
        const newData = new Uint8Array(stateDataRef.current);
        newData[Payload.HOLD_TIME] = Math.max(0, Math.min(60, minutes));
        await writeState(newData);
    }, [writeState, addLog]);

    const setSchedule = useCallback(async (mode: 'off' | 'once' | 'daily', hour: number, minute: number, tempC: number) => {
        if (!stateDataRef.current) return;
        addLog('setSchedule', { mode, hour, minute, tempC });
        
        const newData = new Uint8Array(stateDataRef.current);
        if (mode === 'off') {
            newData[Payload.STATUS_FLAGS] &= ~Flags.SCHEDULE_ENABLED;
            newData[Payload.SCHEDULE_TEMP] = 0xC0;
            newData[Payload.SCHEDULE_HOURS] = 0;
            newData[Payload.SCHEDULE_MINUTES] = 0;
        } else {
            newData[Payload.STATUS_FLAGS] |= Flags.SCHEDULE_ENABLED;
            newData[Payload.SCHEDULE_TEMP] = Math.round(tempC * 2);
            newData[Payload.SCHEDULE_HOURS] = hour;
            newData[Payload.SCHEDULE_MINUTES] = minute;
            
            if (mode === 'once') {
                newData[Payload.COUNTER] |= Flags.SCHEDULE_MODE;
            } else {
                newData[Payload.COUNTER] &= ~Flags.SCHEDULE_MODE;
            }
        }

        await writeState(newData);
    }, [writeState, addLog]);

    const clearLogs = useCallback(() => setLogs([]), []);

    return {
        state,
        connect,
        disconnect,
        setTemperature,
        setHoldTime,
        setSchedule,
        logs,
        isDebugMode,
        setIsDebugMode,
        clearLogs
    };
}
