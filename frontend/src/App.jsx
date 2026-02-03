import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import axios from 'axios'
import React from 'react'
import SpeechAnalyzerPage from './components/SpeechAnalyzerPage.jsx'
import Navbar from './components/Navbar.jsx'
import LandingPage from './components/LandingPage.jsx'
import Dashboard from './components/Dashboard.jsx'
import ProjectView from './components/ProjectView.jsx'

function App() {
  return (
    <>
      <Routes>
        <Route path='/analyze' element={<SpeechAnalyzerPage />} />
        <Route path='/' element={<LandingPage />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/project/:projectId' element={<ProjectView />} />
      </Routes>
    </>
  )
}

export default App
