import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router';

import Home from "./pages/Home";
import Lobby from "./pages/eyefold/Lobby";
import Game from "./pages/eyefold/Room";
import Vote from "./pages/eyefold/Vote";
import NightLobby from "./pages/nightfall/Lobby";
import NightGame from "./pages/nightfall/Room";
import DayBreak from "./pages/nightfall/DayBreak";
import NotFound from './404';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='eyefold'>
          <Route path=":id" element={<Lobby />} />
          <Route path="room/:id" element={<Game />} />
          <Route path=":id/vote" element={<Vote />} />
        </Route>
        <Route path='nightfall'>
          <Route path=":id" element={<NightLobby />} />
          <Route path="room/:id" element={<NightGame />} />
          <Route path="daybreak/:id" element={<DayBreak />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
