"use client"

import { ModeToggle } from '@/components/header/ModeToggle'
import { SwitchToggle } from '@/components/header/ViewToggle'
import BuildTime from '@/components/views/BuildTime'
import RunTime from '@/components/views/RunTime'
import React, { useState } from 'react'
import { Toaster } from 'sonner'

const Home = () => {

  const [view, setView] = useState(true)

  return (
    <>
      <Toaster position="top-right" />
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 font-bold text-lg">
        <div>Application Environment Variables</div>
        <div className="flex items-center gap-2">
          <SwitchToggle view={view} setView={setView} />
          <ModeToggle />
        </div>
      </header>
      {view ? <BuildTime/> : <RunTime/>} 
    </>      
  )
}

export default Home
