"use client";

import { useState, useEffect } from 'react';
import KanbanBoard from '@/components/KanbanBoard';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <KanbanBoard />
    </main>
  );
}