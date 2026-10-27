import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { CaptureGroup } from '@shared/types'

interface SaveApiDialogProps {
  group: CaptureGroup
}

export const SaveApiDialog = ({ group }: SaveApiDialogProps) => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(`${group.method} ${group.path}`)
  const [activateRule, setActivateRule] = useState(false)
  const [error, setError] = useState('')
  const [duplicates, setDuplicates] = useState<Array<{ id: string; name: string }>>([])

  const save = async (replaceExistingId?: string) => {
    setError('')
    try {
    const result = (await window.apireplay.saveApi({
      name,
      identity: group.identity,
      activateRule,
      replaceExistingId,
      saveAsNew: replaceExistingId === undefined && duplicates.length > 0 ? true : undefined
    })) as { duplicates: Array<{ id: string; name: string }> }
    if (result.duplicates.length > 0 && !replaceExistingId) {
      setDuplicates(result.duplicates)
      return
    }
    setOpen(false)
    setDuplicates([])
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed')
    }
  }

  if (group.saved) {
    return (
      <div className="flex items-center gap-2">
        <span data-testid="saved-badge" className="rounded-md bg-accent/15 px-2 py-1 text-xs text-accent">
          Saved
        </span>
        {group.savedApiId ? (
          <button
            className="btn-ghost px-2 py-1 text-xs"
            onClick={() => {
              const savedApiId = group.savedApiId
              if (savedApiId) void window.apireplay.deleteSavedApi(savedApiId)
            }}
          >
            Delete saved
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button data-testid="save-api" className="btn-primary py-1">
          Save this API
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/80" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-line bg-surface p-4 shadow-2xl">
          <Dialog.Title className="mb-3 text-base font-semibold text-fg">Save API</Dialog.Title>
          <label className="mb-2 block text-xs text-fg-muted">Name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field-input mb-3"
          />
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activateRule}
              onChange={(event) => setActivateRule(event.target.checked)}
            />
            Enable mock rule immediately
          </label>
          {duplicates.length > 0 && (
            <div className="mb-3 rounded-md border border-mock/40 bg-mock/10 p-2 text-sm text-mock">
              An API with this identity already exists. Update it or save a new scenario.
              <div className="mt-2 flex gap-2">
                <button className="rounded-md bg-mock px-2 py-1 text-accent-fg" onClick={() => void save(duplicates[0].id)}>
                  Update existing
                </button>
                <button
                  className="btn-ghost px-2 py-1"
                  onClick={() => void save()}
                >
                  Save separately
                </button>
              </div>
            </div>
          )}
          {error && <p className="mb-2 text-sm text-status-5xx">{error}</p>}
          <div className="flex justify-end gap-2">
            <Dialog.Close className="btn-ghost">Cancel</Dialog.Close>
            <button data-testid="confirm-save-api" className="btn-primary" onClick={() => void save()}>
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
