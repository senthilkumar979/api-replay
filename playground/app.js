const out = document.getElementById('out')

function writeLog(via, method, url, status, text) {
  out.textContent = `${via} ${method} ${url}\n${status}\n${text || '(empty)'}`
}

async function callFetch(url, method) {
  const options = { method }
  if (method === 'POST') {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify({ name: 'Nub' })
  }
  const res = await fetch(url, options)
  writeLog('Fetch', method, url, res.status, await res.text())
}

function callXhr(url, method) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open(method, url)
    req.onload = () => {
      writeLog('XHR', method, url, req.status, req.responseText)
      resolve()
    }
    req.onerror = () => reject(new Error('XHR failed'))
    if (method === 'POST') {
      req.setRequestHeader('Content-Type', 'application/json')
      req.send(JSON.stringify({ name: 'Nub' }))
      return
    }
    req.send()
  })
}

document.querySelectorAll('button[data-url]').forEach((button) => {
  button.addEventListener('click', () => {
    const url = button.getAttribute('data-url')
    const via = button.getAttribute('data-via')
    const method = button.getAttribute('data-method') ?? 'GET'
    const run = via === 'xhr' ? callXhr(url, method) : callFetch(url, method)
    void run.catch((error) => {
      out.textContent = String(error)
    })
  })
})
