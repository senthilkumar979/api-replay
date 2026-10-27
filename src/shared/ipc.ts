export const IpcChannel = {
  browserNavigate: 'browser:navigate',
  browserGoBack: 'browser:goBack',
  browserGoForward: 'browser:goForward',
  browserReload: 'browser:reload',
  browserSetBounds: 'browser:setBounds',
  recordingSetEnabled: 'recording:setEnabled',
  capturesClear: 'captures:clear',
  mocksSetGlobalEnabled: 'mocks:setGlobalEnabled',
  mocksEmergencyDisable: 'mocks:emergencyDisable',
  savedApisSave: 'savedApis:save',
  savedApisUpdate: 'savedApis:update',
  savedApisDelete: 'savedApis:delete',
  rulesUpdate: 'rules:update',
  rulesSetEnabled: 'rules:setEnabled',
  rulesDelete: 'rules:delete',
  rulesDuplicate: 'rules:duplicate',
  rulesSetPriority: 'rules:setPriority',
  rulesTestMatch: 'rules:testMatch',
  appGetSnapshot: 'app:getSnapshot',
  snapshotChanged: 'app:snapshotChanged',
  mockFulfillFailed: 'mocks:fulfillFailed'
} as const

export type IpcChannelName = (typeof IpcChannel)[keyof typeof IpcChannel]
