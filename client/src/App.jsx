import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import SeasonDashboard from './pages/Seasons/SeasonDashboard';
import ChapterGrid from './pages/Seasons/ChapterGrid';
import TaskManager from './pages/Seasons/TaskManager';
import Album from './pages/Album';
import Pets from './pages/Pets';
import Generations from './pages/Generations';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="seasons">
            <Route index element={<SeasonDashboard />} />
            <Route path=":seasonId" element={<ChapterGrid />} />
            <Route path=":seasonId/chapter/:chapterId" element={<TaskManager />} />
          </Route>
          <Route path="album" element={<Album />} />
          <Route path="pets" element={<Pets />} />
          <Route path="generations" element={<Generations />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
