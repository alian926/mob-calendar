import React, { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Calendar from './components/calendar';
import './App.css';

function App() {
    const [current, setCurrent] = useState(new Date());
    const formatDay = (date: Dayjs | Date) => {
        if (dayjs().isSame(date, 'day')) {
            return <span style={{ color: '#3388FF' }}>今</span>;
        }
        // 'YYYY-MM-DD HH:mm:ss'
        return dayjs(date).format('D');
    };
    return (
        <div className='App'>
            <Calendar currentDate={current} onDateClick={setCurrent} formatDay={formatDay}/>
            <div className='block'>选中时间:{ dayjs(current).format('YYYY-MM-DD HH:mm:ss') }</div>
            <div className='block'>
                请在移动模式下打开此页面
            </div>
        </div>
    );
}

export default App;
