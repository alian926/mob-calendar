import dayjs, { Dayjs } from 'dayjs';
import assign from 'lodash/assign'
import assignWith from 'lodash/assignWith'
import isUndefined from 'lodash/isUndefined'

export function mergeProps<A, B>(a: A, b: B): B & A
export function mergeProps<A, B, C>(a: A, b: B, c: C): C & B & A
export function mergeProps(...items: any[]) {
  function customizer(objValue: any, srcValue: any) {
    return isUndefined(srcValue) ? objValue : srcValue
  }

  let ret = assign({}, items[0])
  for (let i = 1; i < items.length; i++) {
    ret = assignWith(ret, items[i], customizer)
  }
  return ret
}

/**
 *
 * @param {*} dayjsDate dayjs对象
 */
export const getStartDay = (dayjsDate: Dayjs) => {
    // 由于周日属于上一个周的, 如果第一天不是周日,需要减去一天进行调整
    // console.log(dayjsDate.format('YYYY/MM/DD d ddd'), dayjsDate.format('d'));
    if (Number(dayjsDate.format('d')) !== 0) {
        return dayjsDate.startOf('week');
    }
    return dayjsDate;
};

/**
 *
 * @param {*} dayjsDate dayjs对象
 */
export const formatMonthDate = (dayjsDate: Dayjs) => {
    // 选中日期的当月第一天 即 某月1日
    const currentMonthFirstDay = dayjsDate.startOf('month');
    // NOTE: 周日属于上一天的结束,需要再减去一天
    // 当月第一天所在周的 上周日,
    const currentMonthStartDay = getStartDay(currentMonthFirstDay);
    // 上个月的第一天
    const prevMonthFirstDay = currentMonthFirstDay.subtract(1, 'month');
    // 上个月第一天所在周的开始
    const prevMonthStartDay = getStartDay(prevMonthFirstDay);
    // 下个月的第一天
    const nextMonthFirstDay = currentMonthFirstDay.add(1, 'month');
    // 下个月第一天所在周的开始
    const nextMonthStartDay = getStartDay(nextMonthFirstDay);

    /**
     * dayjsDate             2022-01-05 周三
     * currentMonthFirstDay  2022-01-01 周六
     * currentMonthStartDay  2021-12-26 周日
     * prevMonthFirstDay     2021-12-01 周六
     * prevMonthStartDay     2021-11-28 周日
     * nextMonthFirstDay     2022-02-01 周二
     * nextMonthStartDay     2022-01-30 周日
     */

    // 日期 6 * 7 即 42个数据
    return {
        currentMonthFirstDay,
        monthDates: [
            new Array(42)
                .fill('')
                .map((_, index) => prevMonthStartDay.add(index, 'day')),
            new Array(42)
                .fill('')
                .map((_, index) => currentMonthStartDay.add(index, 'day')),
            new Array(42)
                .fill('')
                .map((_, index) => nextMonthStartDay.add(index, 'day')),
        ],
    };
};

/**
 *
 * @param {*} dayjsDate dayjs对象
 */
export const formatWeekDate = (dayjsDate: Dayjs) => {
    const currentWeekStartDay = dayjsDate.startOf('week');
    const prevWeekStartDay = currentWeekStartDay.subtract(1, 'week');
    const nextWeekStartDay = currentWeekStartDay.add(1, 'week');
    return {
        currentWeekFirstDay: currentWeekStartDay.add(1, 'day'),
        weekDates: [
            new Array(7)
                .fill('')
                .map((_, index) => prevWeekStartDay.add(index, 'day')),
            new Array(7)
                .fill('')
                .map((_, index) => currentWeekStartDay.add(index, 'day')),
            new Array(7)
                .fill('')
                .map((_, index) => nextWeekStartDay.add(index, 'day')),
        ],
    };
};

// 格式化年月显示
export const formatMonthYear = (date: Date | Dayjs): string => {
    if (dayjs().isSame(date, 'year')) {
        return dayjs(date).format('M月');
    }
    return dayjs(date).format('YYYY年MM月');
};
