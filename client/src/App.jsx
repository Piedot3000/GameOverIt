import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import BacklogPage from "./pages/BacklogPage.jsx";
import AddGamePage from "./pages/AddGamePage.jsx";
import GameDetailPage from "./pages/GameDetailPage.jsx";
import SteamPage from "./pages/SteamPage.jsx";

// The four paths are fixed here and nowhere else, so the header links, the
// browser URL and any later `navigate()` call all agree. Every route is a child
// of AppLayout, which is what keeps the navigation on screen no matter where you land
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<BacklogPage />} />
        <Route path="/games/new" element={<AddGamePage />} />
        <Route path="/games/:id" element={<GameDetailPage />} />
        <Route path="/steam" element={<SteamPage />} />
        {/* Any unknown path goes home instead of a blank screen. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}