"use client";

import { useState, useEffect } from 'react';
import KanbanBoard from '@/components/KanbanBoard';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0079bf]">
      <KanbanBoard />
    </div>
  );
}