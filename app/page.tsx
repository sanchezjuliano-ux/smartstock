'use client';

import dynamic from 'next/dynamic';

const ShoppingListView = dynamic(() => import('@/components/ShoppingListView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-[#f8f9ff] text-[#0b1c30]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent"></div>
        <p className="text-sm font-medium opacity-75 font-mono">Carregando Despensa Virtual...</p>
      </div>
    </div>
  ),
});

export default function App() {
  return <ShoppingListView />;
}
