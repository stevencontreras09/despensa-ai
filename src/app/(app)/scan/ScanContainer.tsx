'use client';

import { useState } from 'react';
import { Camera, Mic } from 'lucide-react';
import { TicketUploader } from '@/components/scan/TicketUploader';
import { VoiceDictation } from '@/components/scan/VoiceDictation';
import { ExpressValidationModal } from '@/components/scan/ExpressValidationModal';
import { StorageLocationRow } from '@/types/inventory';

interface ScanContainerProps {
  householdId: string;
  storageLocations: StorageLocationRow[];
}

export function ScanContainer({ householdId, storageLocations }: ScanContainerProps) {
  const [tab, setTab] = useState<'ticket' | 'voice'>('ticket');
  const [extractionData, setExtractionData] = useState<any | null>(null);

  const handleExtractionComplete = (data: any) => {
    setExtractionData(data);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="grid grid-cols-2 p-1.5 bg-stone-100 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700/60">
        <button
          type="button"
          onClick={() => setTab('ticket')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            tab === 'ticket'
              ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          Foto de Ticket / Recibo
        </button>
        <button
          type="button"
          onClick={() => setTab('voice')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            tab === 'voice'
              ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <Mic className="w-4 h-4" />
          Dictado por Voz
        </button>
      </div>

      {/* Active Tab View */}
      {tab === 'ticket' ? (
        <TicketUploader
          householdId={householdId}
          onExtractionComplete={handleExtractionComplete}
        />
      ) : (
        <VoiceDictation
          householdId={householdId}
          onExtractionComplete={handleExtractionComplete}
        />
      )}

      {/* Express Validation Modal */}
      {extractionData && (
        <ExpressValidationModal
          householdId={householdId}
          initialItems={extractionData.items || []}
          storeName={extractionData.store_name}
          purchaseDate={extractionData.purchase_date}
          storageLocations={storageLocations}
          onClose={() => setExtractionData(null)}
        />
      )}
    </div>
  );
}
