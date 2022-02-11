import React, { useState } from 'react';
import dayjs from 'dayjs';
import Calendar from './components/calendar';
import './App.css';

function App() {
    const [current, setCurrent] = useState(new Date());
    return (
        <div className='App'>
            <Calendar currentDate={current} onDateClick={setCurrent} />
            <div className='block'>选中时间:{ dayjs(current).format('YYYY-MM-DD HH:mm:ss') }</div>
            <div className='block'>
                请在移动模式下打开此页面
            </div>
        </div>
    );
}

export default App;
