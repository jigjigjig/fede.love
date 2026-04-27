import { HashRouter, Routes, Route } from "react-router-dom";
import Portfolio from "./pages/Portfolio";
import AsciiLab from "./pages/Index";
import ThoughtPost from "./pages/ThoughtPost";
import { useAnimatedFavicon } from "./lib/useAnimatedFavicon";

const App = () => {
  useAnimatedFavicon();

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/ascii-lab" element={<AsciiLab />} />
        <Route path="/thoughts/:slug" element={<ThoughtPost />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
