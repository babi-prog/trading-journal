import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CloudUpload,
  Database,
  Download,
  FileBraces,
  HardDrive,
  Keyboard,
  RotateCcw,
  Sparkles,
  Trash,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input } from '@/components/ui/Input'
import { Meter } from '@/components/ui/Meter'
import { Select } from '@/components/ui/Select'
import {
  downloadJournalBackup,
  parseJournalBackup,
} from '@/lib/backup'
import { storageEstimate } from '@/lib/db'
import { ACCENT_OPTIONS, CURRENCIES } from '@/lib/constants'
import {
  cn,
  formatBytes,
  formatPercent,
  formatSignedCurrency,
  initials,
} from '@/lib/utils'
import type { JournalBackup } from '@/types/trade'
import { useJournalStore } from '@/store/useJournalStore'

type ConfirmAction = 'demo' | 'clear' | 'import' | null

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Open search & command palette' },
  { keys: ['N'], label: 'Log a new trade' },
  { keys: ['/'], label: 'Search the journal' },
  { keys: ['Esc'], label: 'Close a dialog or drawer' },
]

export function SettingsPage() {
  const settings = useJournalStore((state) => state.settings)
  const trades = useJournalStore((state) => state.trades)
  const updateSettings = useJournalStore((state) => state.updateSettings)
  const loadDemo = useJournalStore((state) => state.loadDemo)
  const clearAll = useJournalStore((state) => state.clearAll)
  const importTrades = useJournalStore((state) => state.importTrades)

  const [draft, setDraft] = useState({
    displayName: settings.displayName,
    accountName: settings.accountName,
    startingBalance: String(settings.startingBalance),
    defaultRisk: String(settings.defaultRisk),
    currency: settings.currency,
    weekStartsOn: settings.weekStartsOn,
  })
  const [saving, setSaving] = useState(false)
  const [storage, setStorage] = useState({ usage: 0, quota: 0 })
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
  const [pendingBackup, setPendingBackup] = useState<JournalBackup | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft({
      displayName: settings.displayName,
      accountName: settings.accountName,
      startingBalance: String(settings.startingBalance),
      defaultRisk: String(settings.defaultRisk),
      currency: settings.currency,
      weekStartsOn: settings.weekStartsOn,
    })
  }, [settings])

  useEffect(() => {
    let mounted = true
    void storageEstimate().then((estimate) => {
      if (mounted) setStorage(estimate)
    })
    return () => {
      mounted = false
    }
  }, [trades.length])

  const totalPnl = useMemo(
    () => trades.reduce((sum, trade) => sum + trade.realizedPnL, 0),
    [trades],
  )
  const usagePct = storage.quota > 0 ? (storage.usage / storage.quota) * 100 : 0
  const averageRisk = settings.startingBalance
    ? (settings.defaultRisk / settings.startingBalance) * 100
    : 0

  async function saveProfile() {
    try {
      setSaving(true)
      await updateSettings({
        displayName: draft.displayName.trim() || 'Trader',
        accountName: draft.accountName.trim() || 'Personal Account',
        startingBalance: Math.max(0, Number(draft.startingBalance) || 0),
        defaultRisk: Math.max(0, Number(draft.defaultRisk) || 0),
        currency: draft.currency,
        weekStartsOn: draft.weekStartsOn,
      })
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Could not save settings', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function setAccent(accent: typeof settings.accent) {
    await updateSettings({ accent })
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    try {
      const text = await file.text()
      const backup = parseJournalBackup(text)
      setPendingBackup(backup)
      setConfirmAction('import')
    } catch (error) {
      toast.error('Could not read that backup', {
        description: error instanceof Error ? error.message : 'Please try another file.',
      })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function runConfirm() {
    try {
      if (confirmAction === 'demo') {
        const count = await loadDemo()
        toast.success('Demo journal loaded', {
          description: `${count} sample trades restored.`,
        })
        setDraft((state) => ({ ...state }))
      } else if (confirmAction === 'clear') {
        await clearAll()
        toast.success('Journal cleared', {
          description: 'All trades were removed from this device.',
        })
      } else if (confirmAction === 'import' && pendingBackup) {
        const count = await importTrades(pendingBackup.trades, importMode)
        await updateSettings({
          displayName: pendingBackup.settings.displayName,
          accountName: pendingBackup.settings.accountName,
          startingBalance: pendingBackup.settings.startingBalance,
          defaultRisk: pendingBackup.settings.defaultRisk,
          currency: pendingBackup.settings.currency,
          accent: pendingBackup.settings.accent,
          weekStartsOn: pendingBackup.settings.weekStartsOn,
        })
        toast.success('Backup imported', {
          description: `${count} trades ${importMode === 'replace' ? 'restored' : 'merged'}.`,
        })
        setPendingBackup(null)
      }
    } catch (error) {
      toast.error('That action failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setConfirmAction(null)
    }
    const estimate = await storageEstimate()
    setStorage(estimate)
  }

  const confirmCopy: Record<
    Exclude<ConfirmAction, null>,
    { title: string; description: string; label: string }
  > = {
    demo: {
      title: 'Replace with demo data?',
      description:
        'This clears the current journal and loads a fresh set of ~90 sample trades. Export a backup first if you want to keep anything.',
      label: 'Load demo',
    },
    clear: {
      title: 'Clear the entire journal?',
      description:
        'Every trade will be permanently deleted from this device. Your settings will reset to defaults. This cannot be undone.',
      label: 'Clear journal',
    },
    import: {
      title: importMode === 'replace' ? 'Replace the journal?' : 'Merge this backup?',
      description: pendingBackup
        ? `${pendingBackup.trades.length} trades will be ${importMode === 'replace' ? 'restored, replacing your current journal' : 'merged into your current journal'}.`
        : 'This will update your journal.',
      label: importMode === 'replace' ? 'Replace journal' : 'Merge trades',
    },
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Settings"
        title="Make the journal yours."
        description="Profile, appearance and data — everything stays local to this device."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader
              title="Profile & account"
              subtitle="Used across your dashboard and reports"
              icon={<User className="h-4 w-4" />}
              action={
                <Badge variant="outline">
                  {trades.length} trades · {formatSignedCurrency(totalPnl, settings.currency)}
                </Badge>
              }
            />
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line-strong bg-gradient-to-br from-brand/30 via-brand/5 to-info/20 font-display text-lg font-semibold text-ink">
                  {initials(draft.displayName) || 'TC'}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-ink">
                    {draft.displayName || 'Your name'}
                  </p>
                  <p className="text-[10.5px] text-faint">
                    {draft.accountName || 'Account name'} ·{' '}
                    {formatPercent(averageRisk, 2)} default risk
                  </p>
                </div>
                <Badge variant="positive" dot className="ml-auto">
                  Local account
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Display name" htmlFor="settings-name" required>
                  <Input
                    id="settings-name"
                    value={draft.displayName}
                    onChange={(event) =>
                      setDraft((state) => ({ ...state, displayName: event.target.value }))
                    }
                    placeholder="Your name"
                  />
                </Field>
                <Field label="Account name" htmlFor="settings-account">
                  <Input
                    id="settings-account"
                    value={draft.accountName}
                    onChange={(event) =>
                      setDraft((state) => ({ ...state, accountName: event.target.value }))
                    }
                    placeholder="Personal Account"
                  />
                </Field>
                <Field
                  label="Starting balance"
                  htmlFor="settings-balance"
                  hint={draft.currency}
                >
                  <Input
                    id="settings-balance"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={draft.startingBalance}
                    onChange={(event) =>
                      setDraft((state) => ({
                        ...state,
                        startingBalance: event.target.value,
                      }))
                    }
                    prefix="$"
                  />
                </Field>
                <Field
                  label="Default risk per trade"
                  htmlFor="settings-risk"
                  hint={`${formatPercent(averageRisk, 2)} of balance`}
                >
                  <Input
                    id="settings-risk"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    value={draft.defaultRisk}
                    onChange={(event) =>
                      setDraft((state) => ({ ...state, defaultRisk: event.target.value }))
                    }
                    prefix="$"
                  />
                </Field>
                <Field label="Currency" htmlFor="settings-currency">
                  <Select
                    id="settings-currency"
                    value={draft.currency}
                    onValueChange={(value) =>
                      setDraft((state) => ({
                        ...state,
                        currency: value as typeof draft.currency,
                      }))
                    }
                    options={CURRENCIES}
                  />
                </Field>
                <Field label="Week starts on" htmlFor="settings-week">
                  <Select
                    id="settings-week"
                    value={draft.weekStartsOn}
                    onValueChange={(value) =>
                      setDraft((state) => ({
                        ...state,
                        weekStartsOn: value as typeof draft.weekStartsOn,
                      }))
                    }
                    options={[
                      { value: 'monday', label: 'Monday' },
                      { value: 'sunday', label: 'Sunday' },
                    ]}
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                <p className="text-[10px] text-faint">
                  Changes are saved on this device only.
                </p>
                <Button
                  variant="primary"
                  loading={saving}
                  icon={saving ? undefined : <Check className="h-4 w-4" />}
                  onClick={saveProfile}
                >
                  Save changes
                </Button>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Appearance"
              subtitle="Accent color across the app"
              icon={<Sparkles className="h-4 w-4" />}
            />
            <div className="grid grid-cols-2 gap-2 p-5 sm:grid-cols-4">
              {ACCENT_OPTIONS.map((accent) => {
                const active = settings.accent === accent.value
                return (
                  <button
                    key={accent.value}
                    type="button"
                    onClick={() => void setAccent(accent.value)}
                    className={cn(
                      'focus-ring flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition',
                      active
                        ? 'border-brand/40 bg-brand/[0.06]'
                        : 'border-line/80 bg-white/[0.012] hover:border-line-strong',
                    )}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span
                        className="h-6 w-6 rounded-full border border-white/10"
                        style={{ background: accent.swatch }}
                      />
                      {active ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-brand-ink">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      ) : null}
                    </span>
                    <span>
                      <span className="block text-[11px] font-medium text-ink">
                        {accent.label}
                      </span>
                      <span className="mt-0.5 block text-[9.5px] text-faint">
                        {accent.value}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Data & backups"
              subtitle="Export, restore or reset the journal"
              icon={<Database className="h-4 w-4" />}
            />
            <div className="space-y-3 p-5">
              <div className="flex flex-col gap-2 rounded-xl border border-line/80 bg-white/[0.015] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.025] text-muted">
                    <Download className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11.5px] font-medium text-ink">Export backup</p>
                    <p className="text-[10px] text-faint">
                      Full JSON with settings, trades and screenshots.
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    downloadJournalBackup(settings, trades)
                    toast.success('Backup exported', {
                      description: `${trades.length} trades saved.`,
                    })
                  }}
                >
                  Export JSON
                </Button>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-line/80 bg-white/[0.015] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.025] text-muted">
                    <CloudUpload className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11.5px] font-medium text-ink">Import backup</p>
                    <p className="text-[10px] text-faint">
                      Merge or replace using a TraderCasa JSON file.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    size="sm"
                    value={importMode}
                    onValueChange={(value) =>
                      setImportMode(value as 'merge' | 'replace')
                    }
                    options={[
                      { value: 'merge', label: 'Merge' },
                      { value: 'replace', label: 'Replace' },
                    ]}
                    ariaLabel="Import mode"
                    className="w-[104px]"
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    onChange={(event) =>
                      void handleFile(event.target.files?.[0])
                    }
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<FileBraces className="h-3.5 w-3.5" />}
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose file
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-line/80 bg-white/[0.015] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.025] text-muted">
                    <RotateCcw className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11.5px] font-medium text-ink">Load demo journal</p>
                    <p className="text-[10px] text-faint">
                      Replace current trades with sample data.
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmAction('demo')}
                >
                  Load demo
                </Button>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-negative/20 bg-negative/[0.035] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-negative/20 bg-negative/10 text-negative">
                    <Trash className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11.5px] font-medium text-ink">Clear everything</p>
                    <p className="text-[10px] text-faint">
                      Delete all trades and reset settings.
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmAction('clear')}
                >
                  Clear journal
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader
              title="Local storage"
              subtitle="IndexedDB usage on this device"
              icon={<HardDrive className="h-4 w-4" />}
            />
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-muted">Used</span>
                <span className="num text-ink">
                  {formatBytes(storage.usage)}
                  {storage.quota > 0 ? ` / ${formatBytes(storage.quota)}` : ''}
                </span>
              </div>
              <Meter
                value={usagePct}
                color={usagePct > 80 ? 'negative' : 'brand'}
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg border border-line/80 bg-white/[0.015] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-faint">Trades</p>
                  <p className="num mt-1 text-[13px] font-semibold text-ink">
                    {trades.length}
                  </p>
                </div>
                <div className="rounded-lg border border-line/80 bg-white/[0.015] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-faint">Screenshots</p>
                  <p className="num mt-1 text-[13px] font-semibold text-ink">
                    {trades.filter((trade) => trade.preTradeImage || trade.postTradeImage).length}
                  </p>
                </div>
              </div>
              <p className="text-[9.5px] leading-relaxed text-faint">
                Your journal never leaves this device. Clearing app data will
                delete it — export a backup regularly.
              </p>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Keyboard shortcuts"
              subtitle="Move faster"
              icon={<Keyboard className="h-4 w-4" />}
            />
            <div className="space-y-1 p-4 pt-2">
              {SHORTCUTS.map((shortcut) => (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5"
                >
                  <span className="text-[10.5px] text-muted">{shortcut.label}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <span key={key} className="kbd">
                        {key}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="font-display text-[12.5px] font-semibold text-ink">
                  TraderCasa Journal
                </p>
                <p className="text-[10px] text-faint">v1.0 · Local-first</p>
              </div>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-faint">
              Built for deliberate traders. Every trade is a data point; every
              review is an edge. Keep the process boring and the results interesting.
            </p>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null)
            setPendingBackup(null)
          }
        }}
        title={confirmAction ? confirmCopy[confirmAction].title : 'Confirm'}
        description={
          confirmAction ? confirmCopy[confirmAction].description : ''
        }
        confirmLabel={
          confirmAction ? confirmCopy[confirmAction].label : 'Confirm'
        }
        onConfirm={runConfirm}
      />
    </div>
  )
}
