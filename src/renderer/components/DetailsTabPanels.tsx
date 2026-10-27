import * as Tabs from '@radix-ui/react-tabs'
import type { CaptureGroup, MockRule } from '@shared/types'
import { DetailsOverview } from './DetailsOverview'
import { HeaderTable } from './HeaderTable'
import { JsonViewer } from './JsonViewer'
import { MockRuleEditor } from './MockRuleEditor'

interface DetailsTabPanelsProps {
  group: CaptureGroup
  rule?: MockRule
}

export const DetailsTabPanels = ({ group, rule }: DetailsTabPanelsProps) => {
  const latest = group.latest

  return (
    <>
      <Tabs.Content value="overview">
        <DetailsOverview group={group} latest={latest} />
      </Tabs.Content>
      <Tabs.Content value="request-headers">
        <HeaderTable headers={latest.requestHeaders} />
      </Tabs.Content>
      <Tabs.Content value="query">
        <HeaderTable headers={Object.fromEntries(new URLSearchParams(group.query))} />
      </Tabs.Content>
      <Tabs.Content value="request-body" className="h-full">
        <JsonViewer title="Request body" body={latest.requestBody} />
      </Tabs.Content>
      <Tabs.Content value="response-headers">
        <HeaderTable headers={latest.responseHeaders} />
      </Tabs.Content>
      <Tabs.Content value="response-body" className="h-full">
        <JsonViewer title="Response body" body={latest.responseBody} />
      </Tabs.Content>
      <Tabs.Content value="timing" className="text-sm text-fg">
        Started {new Date(latest.startedAt).toLocaleString()}
      </Tabs.Content>
      <Tabs.Content value="history" className="space-y-2 text-sm">
        {group.history.map((item) => (
              <div key={item.id} className="rounded-md border border-line bg-raised px-3 py-2 text-fg">
            {item.status ?? item.lifecycle} · {item.durationMs ?? '—'}ms · {item.mocked ? 'mocked' : 'live'}
          </div>
        ))}
      </Tabs.Content>
      {rule && (
        <Tabs.Content value="rule">
          <MockRuleEditor rule={rule} identity={group.identity} originalBody={latest.responseBody.text ?? ''} />
        </Tabs.Content>
      )}
    </>
  )
}
