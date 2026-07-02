// src/components/ReferenceDataSeeder.tsx

import { useState } from 'react';
import { Database, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useReferenceDataSeeder } from '../hooks/useReferenceDataSeeder';

interface ReferenceDataSeederProps {
  isGoogleConnected: boolean;
}

export function ReferenceDataSeeder({ isGoogleConnected }: ReferenceDataSeederProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState<string>('');
  const seeder = useReferenceDataSeeder();

  const handleSeed = async () => {
    if (!isGoogleConnected) {
      toast.error('Google Sheets Connection Required', {
        description: 'Please connect to Google Sheets in the connection settings first.',
      });
      return;
    }

    setStatus('loading');
    setProgress('Reading spreadsheet metadata...');

    try {
      // Step 1: Fetch spreadsheet metadata to check for existing tabs
      const metadata = await seeder.fetchSpreadsheetMetadata();
      const existingSheets: string[] = (metadata.sheets || []).map(
        (s: { properties: { title: string } }) => s.properties.title
      );

      // --- Conditions ---
      setProgress('Checking Conditions sheet tab...');
      const conditionsExists = existingSheets.includes('Conditions');
      if (!conditionsExists) {
        setProgress('Creating Conditions sheet tab...');
        try {
          await seeder.batchUpdateSpreadsheet([
            { addSheet: { properties: { title: 'Conditions' } } },
          ]);
        } catch (err: any) {
          if (err?.message?.includes('already exists')) {
            console.warn('Conditions tab already exists.');
          } else {
            throw err;
          }
        }
      }

      setProgress('Writing Conditions headers...');
      const conditionsHeaders = ['name', 'description', 'source'];
      await seeder.updateSheetData('Conditions!A1:C1', [conditionsHeaders]);

      let conditionsSkipped = false;
      let spellsSkipped = false;

      setProgress('Checking existing Conditions data...');
      // NOTE TO USER: Since we only check if the tab is populated (length > 1),
      // re-running the seeder will NOT overwrite contaminated data.
      // If your 'Conditions' or 'Spells' tabs have duplicate/contaminated entries,
      // you must manually clear those tabs' rows in Google Sheets before re-running
      // this seeder to fetch clean, correctly filtered 2014 SRD data.
      const existingConditionsData = await seeder.fetchSheetData('Conditions!A:C');
      if (existingConditionsData?.values && existingConditionsData.values.length > 1) {
        setProgress('Conditions already seeded — skipped');
        conditionsSkipped = true;
      } else {
        setProgress('Fetching conditions from Open5e API...');
        const condResponse = await fetch('https://api.open5e.com/v1/conditions/?document__slug=wotc-srd&limit=100');
        if (!condResponse.ok) {
          throw new Error(`Open5e API error fetching conditions: ${condResponse.statusText}`);
        }
        const condData = await condResponse.json();
        const rawConditions = condData.results || [];

        setProgress(`Processing ${rawConditions.length} conditions...`);
        const conditionRows = rawConditions.map((c: any) => [
          c.name || '',
          c.desc || '',
          c.document__title || 'SRD',
        ]);

        setProgress('Saving conditions to spreadsheet...');
        const chunkSize = 50;
        for (let i = 0; i < conditionRows.length; i += chunkSize) {
          const chunk = conditionRows.slice(i, i + chunkSize);
          await seeder.appendSheetData('Conditions!A:C', chunk);
        }
      }

      // --- Spells ---
      setProgress('Checking Spells sheet tab...');
      const spellsExists = existingSheets.includes('Spells');
      if (!spellsExists) {
        setProgress('Creating Spells sheet tab...');
        try {
          await seeder.batchUpdateSpreadsheet([
            { addSheet: { properties: { title: 'Spells' } } },
          ]);
        } catch (err: any) {
          if (err?.message?.includes('already exists')) {
            console.warn('Spells tab already exists.');
          } else {
            throw err;
          }
        }
      }

      setProgress('Writing Spells headers...');
      const spellsHeaders = [
        'name',
        'level',
        'school',
        'castingTime',
        'range',
        'components',
        'materials',
        'duration',
        'concentration',
        'ritual',
        'classes',
        'description',
        'higherLevel',
        'source',
      ];
      await seeder.updateSheetData('Spells!A1:N1', [spellsHeaders]);

      setProgress('Checking existing Spells data...');
      // NOTE TO USER: Since we only check if the tab is populated (length > 1),
      // re-running the seeder will NOT overwrite contaminated data.
      // If your 'Conditions' or 'Spells' tabs have duplicate/contaminated entries,
      // you must manually clear those tabs' rows in Google Sheets before re-running
      // this seeder to fetch clean, correctly filtered 2014 SRD data.
      const existingSpellsData = await seeder.fetchSheetData('Spells!A:N');
      if (existingSpellsData?.values && existingSpellsData.values.length > 1) {
        setProgress('Spells already seeded — skipped');
        spellsSkipped = true;
      } else {
        setProgress('Fetching spells from Open5e API...');
        let spellsUrl: string | null = 'https://api.open5e.com/v1/spells/?document__slug=wotc-srd&limit=400';
        const allSpells: any[] = [];
        let page = 1;

        while (spellsUrl) {
          setProgress(`Fetching spells (page ${page})...`);
          const spellResponse = await fetch(spellsUrl);
          if (!spellResponse.ok) {
            throw new Error(`Open5e API error fetching spells: ${spellResponse.statusText}`);
          }
          const spellData = await spellResponse.json();
          const results = spellData.results || [];
          allSpells.push(...results);
          spellsUrl = spellData.next;
          page++;
        }

        setProgress(`Processing ${allSpells.length} spells...`);
        const spellRows = allSpells.map((s: any) => [
          s.name || '',
          s.level_int ?? '',
          s.school || '',
          s.casting_time || '',
          s.range || '',
          s.components || '',
          s.material || '',
          s.duration || '',
          s.requires_concentration ? 'true' : 'false',
          s.can_be_cast_as_ritual ? 'true' : 'false',
          (s.classes || []).join(', '),
          s.desc || '',
          s.higher_level || '',
          s.document__title || 'SRD',
        ]);

        setProgress('Saving spells to spreadsheet...');
        const chunkSize = 50;
        for (let i = 0; i < spellRows.length; i += chunkSize) {
          setProgress(`Saving spells chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(spellRows.length / chunkSize)}...`);
          const chunk = spellRows.slice(i, i + chunkSize);
          await seeder.appendSheetData('Spells!A:N', chunk);
        }
      }

      setStatus('done');
      setProgress('');
      
      if (conditionsSkipped && spellsSkipped) {
        toast.success('Reference data already seeded', {
          description: 'Both Conditions and Spells tabs already contain data. Skipped.',
          duration: 5000,
        });
      } else {
        toast.success('Reference data seeded', {
          description: `Seeding complete. ${conditionsSkipped ? 'Conditions skipped.' : 'Conditions added.'} ${spellsSkipped ? 'Spells skipped.' : 'Spells added.'}`,
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error('[ReferenceDataSeeder] error:', err);
      setStatus('error');
      setProgress('');
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      toast.error('Failed to seed reference data', {
        description: errorMsg,
      });
    }
  };


  return (
    <div
      className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-sm space-y-4"
      id="reference-data-seeder-section"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#0f172a] font-serif pb-1">Reference Data</h3>
          <p className="text-xs text-[#8d8db9]">
            One-time setup to add D&D 5e SRD spell and condition reference data to your campaign
            spreadsheet, sourced from the open5e public API (open game content).
          </p>
        </div>
        <Database className="w-5 h-5 text-stone-400 shrink-0" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          id="seed-reference-data-btn"
          type="button"
          disabled={status === 'loading'}
          onClick={handleSeed}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2 ${
            status === 'loading'
              ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
              : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] border border-transparent shadow-sm'
          }`}
        >
          {status === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {status === 'loading' ? 'Seeding...' : 'Seed SRD Reference Data'}
        </button>

        {progress && (
          <p className="text-xs font-mono text-[#8d8db9] animate-pulse">
            {progress}
          </p>
        )}
      </div>
    </div>
  );
}
