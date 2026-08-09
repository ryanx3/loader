import { getDay, getHours, isWithinInterval, set } from "date-fns";

export class MinisomGetPriorityService {
  static calculate(date = new Date()) {
    const day = getDay(date);
    const hour = getHours(date);

    const isWeekendClosed =
      (day === 6 && hour >= 20) || (day === 0 && hour < 20);

    if (isWeekendClosed) {
      return 0;
    }

    const startLabor = set(date, {
      hours: 9,
      minutes: 0,
      seconds: 0,
    });

    const endLabor = set(date, {
      hours: 19,
      minutes: 59,
      seconds: 59,
    });

    const isLaborTime = isWithinInterval(date, {
      start: startLabor,
      end: endLabor,
    });

    if (isLaborTime) {
      return 14;
    }

    // 20h–23h => 1–4
    if (hour >= 20) {
      return hour - 19;
    }

    // 00h–08h => 5–13
    return hour + 5;
  }
}
