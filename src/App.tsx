import React from 'react';
import Calendar from './components/calendar'
import './App.css';

function App() {
  return (
    <div className="App">
      <Calendar />
      <div style={{marginTop: '20px', textAlign: 'center'}}>
          请在移动模式下打开此页面
      </div>
    </div>
  );
}

export default App;
