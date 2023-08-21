import { useEffect, useState } from 'react';
import { isNavigator, off, on } from './misc/util';
import isDeepEqual from './misc/isDeepEqual';

export interface BatteryState {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

interface BatteryManager extends Readonly<BatteryState>, EventTarget {
  onchargingchange: () => void;
  onchargingtimechange: () => void;
  ondischargingtimechange: () => void;
  onlevelchange: () => void;
}

// ブラウザによって「getBattery」が利用できるか異なるため、オプショナル型で宣言する
interface NavigatorWithPossibleBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

type UseBatteryState =
  | { isSupported: false } // Battery API is not supported
  | { isSupported: true; fetched: false } // battery API supported but not fetched yet
  | (BatteryState & { isSupported: true; fetched: true }); // battery API supported and fetched

// BatteryAPIをサポートしているかどうか
const nav: NavigatorWithPossibleBattery | undefined = isNavigator ? navigator : undefined;
const isBatteryApiSupported = nav && typeof nav.getBattery === 'function';

function useBatteryMock(): UseBatteryState {
  return { isSupported: false };
}

function useBattery(): UseBatteryState {
  const [state, setState] = useState<UseBatteryState>({ isSupported: true, fetched: false });

  useEffect(() => {
    let isMounted = true;
    let battery: BatteryManager | null = null;

    const handleChange = () => {
			// アンマウントされていた場合 or BatteryManagerが利用できない場合
      if (!isMounted || !battery) {
        return;
      }
      const newState: UseBatteryState = {
        isSupported: true,
        fetched: true,
        level: battery.level,
        charging: battery.charging,
        dischargingTime: battery.dischargingTime,
        chargingTime: battery.chargingTime,
      };
      !isDeepEqual(state, newState) && setState(newState);
    };

    nav!.getBattery!().then((battery: BatteryManager) => {
      if (!isMounted) {
        return;
      }
      battery = battery;
			// battery.onchargingchange = handleChange;
      // battery.onchargingtimechange = handleChange;
      // battery.ondischargingtimechange = handleChange;
      // battery.onlevelchange = handleChange;
			// battery.addEventListener('chargingchange',handleChange);
			// battery.addEventListener('chargingtimechange', handleChange);
			// battery.addEventListener('dischargingtimechange', handleChange);
			// battery.addEventListener('levelchange', handleChange);
      on(battery, 'chargingchange', handleChange);
      on(battery, 'chargingtimechange', handleChange);
      on(battery, 'dischargingtimechange', handleChange);
      on(battery, 'levelchange', handleChange);
      handleChange();
    });

    return () => {
      isMounted = false;
      if (battery) {
				// battery.removeEventListener('chargingchange', handleChange);
			  // battery.removeEventListener('chargingtimechange', handleChange);
			  // battery.removeEventListener('dischargingtimechange', handleChange);
			  // battery.removeEventListener('levelchange', handleChange);
        off(battery, 'chargingchange', handleChange);
        off(battery, 'chargingtimechange', handleChange);
        off(battery, 'dischargingtimechange', handleChange);
        off(battery, 'levelchange', handleChange);
      }
    };
  }, []);

  return state;
}

export default isBatteryApiSupported ? useBattery : useBatteryMock;
