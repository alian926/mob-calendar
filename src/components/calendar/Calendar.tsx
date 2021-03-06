/* eslint-disable react/destructuring-assignment */
/**
 * 日视图/列表视图 日历
 */
import React, { FC, useEffect, useRef, useMemo, ReactNode } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import cn from 'classnames';
import { animated, useSpring, useSprings, easings } from '@react-spring/web';
import { useDrag, FullGestureState } from '@use-gesture/react';

import {
    formatMonthDate,
    formatWeekDate,
    formatMonthYear,
    formatDay,
    mergeProps,
} from '../../utils/index';

import arrowSvg from '../../public/arrow.svg';

import { useSetState } from '../../utils/hooks';

export type CalendarProps = {
    // 选中日期
    currentDate?: Date;
    // 展示方式
    showType?: 'week' | 'month';
    // 动画时间
    transitionDuration?: number;
    // 点击选中日期
    onDateClick?: Function;
    // 拖动开始
    onTouchStart?: Function;
    // 拖动过程
    onTouchMove?: Function;
    // 拖动结束
    onTouchEnd?: (start: number, end: number) => void;
    // 更换视图模式
    onToggleShowType?: Function;
    // 标记日期
    markDates?: Date[];
    // 禁用月视图
    disabledMonthView?: boolean;
    // 变化趋势
    easing?: typeof easings;
    // 日期高度
    cellHeight?: number;
    // 日期底部间隔
    cellMarginBottom?: number;
    // 日期容器底部间距
    bottomSpace?: number;
    // 头部年月格式化
    formatMonthYear?: (date: Date) => ReactNode;
    // 格式化日期
    formatDay?: (date: Date) => ReactNode;
};

const defaultFunc = (...rest: any) => {
    // console.log('default function:', rest);
};

const defaultCalendarProps = {
    currentDate: new Date(),
    showType: 'week',
    transitionDuration: 300,
    onDateClick: defaultFunc,
    onTouchStart: defaultFunc,
    onTouchMove: defaultFunc,
    onTouchEnd: defaultFunc,
    onToggleShowType: defaultFunc,
    markDates: [],
    easing: easings.easeInOutCirc,
    cellHeight: 38,
    cellMarginBottom: 4,
    bottomSpace: 12,
    formatMonthYear,
    formatDay,
};

type DragType = Omit<FullGestureState<'drag'>, 'event'> & {
    event: PointerEvent | MouseEvent | globalThis.TouchEvent | KeyboardEvent;
};

type StateValue = {
    currentMonthFirstDay: Dayjs;
    monthDates: Dayjs[][];
    currentWeekFirstDay: Dayjs;
    weekDates: Dayjs[][];
    currentDate: Dayjs;
    touch: { x: number; y: number };
    translateIndex: number;
    calendarY: number;
    showType: CalendarProps['showType'];
    isTouching: boolean;
};

const head = ['日', '一', '二', '三', '四', '五', '六'];

const Calendar: FC<CalendarProps> = p => {
    const props = mergeProps(defaultCalendarProps, p);

    const [state, setState] = useSetState<StateValue>({
        currentMonthFirstDay: dayjs().startOf('month'),
        monthDates: [], // 月日历需要展示的日期 包括前一月 当月 下一月
        currentWeekFirstDay: dayjs().startOf('week'),
        weekDates: [], // 周日历需要展示的日期  包括前一周 当周 下一周
        currentDate: dayjs(),
        touch: { x: 0, y: 0 },
        translateIndex: 0,
        calendarY: 0, // 于Y轴的位置
        showType: props.showType,
        isTouching: false,
    });

    // 日历dom
    const calendarRef = useRef<HTMLDivElement>(null);

    // 收起为周视图, 展开为月视图
    const isMonthView = state.showType === 'month';

    // 周视图高度
    const shortLength =
        props.cellHeight + props.cellMarginBottom + props.bottomSpace;

    // 月视图高度
    const longLength =
        (props.cellHeight + props.cellMarginBottom) * 6 + props.bottomSpace;

    // 更新日期. 模拟 getDerivedStateFromProps
    useEffect(() => {
        const dayjsDate = dayjs(props.currentDate);
        setState({
            ...formatMonthDate(dayjsDate),
            ...formatWeekDate(dayjsDate),
            currentDate: dayjsDate,
        });
    }, [props.currentDate, setState]);

    // 点击选中日期
    const handleDayClick = (dayjsDate: Dayjs) => {
        if (dayjs(state.currentDate).isSame(dayjsDate, 'day')) {
            return;
        }
        setState({
            ...formatMonthDate(dayjsDate),
            ...formatWeekDate(dayjsDate),
            currentDate: dayjsDate,
        });
        props.onDateClick(dayjsDate.toDate());
    };

    // 父容器常规显示指定选中内容y轴高度
    const pos = useMemo(() => {
        const index = state.monthDates[1]?.findIndex(item =>
            item.isSame(state.currentDate, 'day')
        );
        const pos = Math.floor(index / 7) || 0;
        return -pos * (props.cellHeight + props.cellMarginBottom);
    }, [
        state.currentDate,
        state.monthDates,
        props.cellHeight,
        props.cellMarginBottom,
    ]);

    // 父容器位移变化
    const [containerStyle, containerApi] = useSpring(() => ({
        from: {
            transform: `translate3d(${-state.translateIndex * 100}%, 0, 0)`,
        },
        config: {
            clamp: true,
            duration: props.transitionDuration,
            easing: props.easing,
        },
    }));

    // 最外层容器高度
    const [heightStyle, heightApi] = useSpring(() => ({
        from: {
            height: shortLength,
        },
        config: {
            clamp: true,
            duration: props.transitionDuration,
            easing: props.easing,
        },
    }));

    // 子容器横向位移
    const [springStyles, springApi] = useSprings(3, i => ({
        from: {
            transform: `translate3d(${(i - 1 + state.translateIndex) * 100}%, ${
                state.calendarY
            }px, 0)`,
        },
        config: {
            clamp: true,
            duration: props.transitionDuration,
            easing: props.easing,
        },
    }));

    // 父容器位移数字初始化
    useEffect(() => {
        containerApi.start({
            to: async next => {
                await next({
                    transform: `translate3d(${-state.translateIndex * 100}%, ${
                        isMonthView ? 0 : pos
                    }px, 0)`,
                    immediate: true,
                });
            },
        });
    }, [state.translateIndex, containerApi, pos, isMonthView]);

    useEffect(() => {
        if (!state.isTouching) return;
        containerApi.start({
            to: async next => {
                await next({
                    transform: `translate3d(${
                        -state.translateIndex * 100
                    }%, 0px, 0)`,
                    immediate: true,
                });
            },
        });
    }, [state.isTouching, containerApi, state.translateIndex]);

    const changeHorizontal = (add: number) => {
        springApi.start(i => ({
            to: async next => {
                await next({
                    transform: `translate3d(${
                        (i - 1 + state.translateIndex + add) * 100
                    }%, ${state.calendarY}px, 0)`,
                });
            },
        }));
        setState({
            translateIndex: state.translateIndex + add,
            isTouching: false,
        });
        if (isMonthView) {
            const nextMonthFirstDay = state.currentMonthFirstDay[
                add > 0 ? 'subtract' : 'add'
            ](1, 'month');
            handleDayClick(nextMonthFirstDay);
        } else {
            const nextWeekFirstDay = state.currentWeekFirstDay[
                add > 0 ? 'subtract' : 'add'
            ](1, 'week');
            handleDayClick(nextWeekFirstDay);
        }
    };

    // 横向移动计算
    const runHorizontal = (dragState: DragType) => {
        const [x] = dragState.movement;
        if (dragState.last) {
            if (Math.abs(x) > 80) {
                const add = x > 0 ? 1 : -1;
                changeHorizontal(add);
            } else {
                springApi.start(i => ({
                    to: async next => {
                        await next({
                            transform: `translate3d(${
                                (i - 1 + state.translateIndex) * 100
                            }%, ${state.calendarY}px, 0)`,
                        });
                    },
                }));
            }
            return;
        }
        const width = calendarRef.current?.offsetWidth || 1;
        const xPersent = x / width;
        springApi.start(i => ({
            transform: `translate3d(${
                (i - 1 + state.translateIndex + xPersent) * 100
            }%, ${state.calendarY}px, 0)`,
            immediate: true,
        }));
    };

    const verticalMove = (height: number, y: number, immediate: boolean) => {
        if (height + y > longLength || height + y < shortLength) {
            return;
        }
        let targetHeight = Math.max(height + y, shortLength);
        let targetY = Math.min(pos + y * 0.6, 0);
        if (isMonthView) {
            targetHeight = Math.min(height + y, longLength);
            targetY = Math.max(pos, y * 0.6);
        }
        heightApi.start({
            to: async next => {
                await next({
                    height: targetHeight,
                    immediate,
                });
            },
        });
        containerApi.start({
            to: async next => {
                await next({
                    transform: `translate3d(${
                        -state.translateIndex * 100
                    }%, ${targetY}px, 0)`,
                    immediate,
                });
            },
        });
    }

    // 纵向移动计算
    const runVertical = (dragState: DragType) => {
        const [, y] = dragState.movement;
        const height = isMonthView ? longLength : shortLength;
        if (dragState.last) {
            if (Math.abs(y) > 50) {
                if (y > 0) {
                    handleShowTypeToggle('month');
                } else {
                    handleShowTypeToggle('week');
                }
            } else {
                verticalMove(height, 0, false);
            }
            return;
        }
        verticalMove(height, y, true);
    };

    // 拖动, 周末式切换的时候, 需要用星期来展示列表
    useDrag(
        dragState => {
            dragState.event.stopPropagation();
            if (dragState.first) {
                setState({ isTouching: false });
            }

            if (dragState.axis === 'x') {
                if (!isMonthView && !state.isTouching) {
                    setState({ isTouching: true });
                }
                runHorizontal(dragState);
            }

            if (dragState.axis === 'y') {
                runVertical(dragState);
            }
        },
        {
            pointer: { touch: true },
            target: calendarRef,
            eventOptions: { passive: false },
        }
    );

    // 切换模式
    const handleShowTypeToggle = (type?: 'week' | 'month') => {
        const targetType = type ? type : isMonthView ? 'week' : 'month';
        let p1 = new Promise((resolve, reject) => {
            containerApi.start({
                to: async next => {
                    await next({
                        transform: `translate3d(${
                            -state.translateIndex * 100
                        }%, ${targetType === 'week' ? pos : 0}px, 0)`,
                        immediate: false,
                    });
                    resolve('success');
                },
            });
        });
        let p2 = new Promise((resolve, reject) => {
            heightApi.start({
                to: async next => {
                    await next({
                        height:
                            targetType === 'week' ? shortLength : longLength,
                        immediate: false,
                    });
                    resolve('success');
                },
            });
        });
        Promise.all([p1, p2]).then(() => {
            setState({
                showType: targetType,
            });
        });
    };

    const dayCellRender = (date: Dayjs, index: number, showGray = false) => {
        // 选中日期
        const isCurrentDay = date.isSame(state.currentDate, 'day');
        // 其它月的日期, 在星期的模式下不显示置灰
        const isOtherMonthDay =
            showGray && !date.isSame(state.currentMonthFirstDay, 'month');
        // 是否为标志过的日期
        const isMarkDate = props.markDates.find(d => date.isSame(d, 'day'));
        return (
            <div
                key={index}
                className={cn('day-cell', {
                    'is-other-month-day': isOtherMonthDay,
                    'current-day': isCurrentDay,
                })}
                style={{
                    height: `${props.cellHeight}px`,
                    marginBottom: `${props.cellMarginBottom}px`,
                }}
                onClick={() => handleDayClick(date)}>
                <div className='day-text'>{props.formatDay(date)}</div>
                {isMarkDate && <div className='dot-mark' />}
            </div>
        );
    };

    return (
        <div className='react-mob-calendar'>
            {/* 年月 */}
            <div className='calendar-operate'>
                <div
                    className='arrow-container'
                    role='presentation'
                    onClick={() => {
                        changeHorizontal(1);
                    }}>
                    <img className="hor-image reverse" alt='' src={arrowSvg} />
                </div>
                <div>{props.formatMonthYear(state.currentDate)}</div>
                <div
                    className='arrow-container'
                    role='presentation'
                    onClick={() => {
                        changeHorizontal(-1);
                    }}>
                    <img className="hor-image" alt='' src={arrowSvg} />
                </div>
            </div>

            {/* 星期 */}
            <div className='calendar-head'>
                {head.map(i => (
                    <div className='head-cell' key={i}>
                        {i}
                    </div>
                ))}
            </div>

            {/* 日期表格 */}
            <animated.div
                className={cn('calendar-body', { 'week-mode': isMonthView })}
                style={heightStyle}
                ref={calendarRef}>
                <animated.div style={containerStyle}>
                    {/* 月视图 */}
                    {springStyles.map((style, i) => {
                        return (
                            <animated.div
                                className={cn('month-cell', {
                                    'is-hidden':
                                        !isMonthView && state.isTouching,
                                })}
                                key={i}
                                style={style}>
                                {state.monthDates[i]?.map((day, index) =>
                                    dayCellRender(day, index, i === 1)
                                )}
                            </animated.div>
                        );
                    })}
                    {/* 周视图 */}
                    {springStyles.map((style, i) => {
                        return (
                            <animated.div
                                className={cn('month-cell', {
                                    'is-hidden': !(
                                        !isMonthView && state.isTouching
                                    ),
                                })}
                                key={i}
                                style={style}>
                                {state.weekDates[i]?.map((day, index) =>
                                    dayCellRender(day, index)
                                )}
                            </animated.div>
                        );
                    })}
                </animated.div>
                <div className='bottom-operate'>
                    {!props.disabledMonthView && (
                        <div
                            role='presentation'
                            onClick={e => {
                                e.stopPropagation();
                                handleShowTypeToggle();
                            }}
                            className='bottom-operate-btn'
                        />
                    )}
                </div>
            </animated.div>
        </div>
    );
};

export default Calendar;
