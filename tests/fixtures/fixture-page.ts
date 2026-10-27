export function fixturePage(): string {
  return `<!doctype html>
<html>
  <body>
    <h1>ApiReplay fixture</h1>
    <button id="load-products">Load products</button>
    <button id="create-product">Create product</button>
    <button id="load-failure">Load failure</button>
    <button id="load-empty">Load empty</button>
    <button id="side-effect">Side effect</button>
    <pre id="out"></pre>
    <script>
      async function call(url, options) {
        const res = await fetch(url, options)
        const text = await res.text()
        document.getElementById('out').textContent = res.status + ' ' + text
      }
      call('/api/products')
      document.getElementById('load-products').onclick = () => call('/api/products')
      document.getElementById('create-product').onclick = () =>
        call('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Nub' }) })
      document.getElementById('load-failure').onclick = () => call('/api/failure')
      document.getElementById('load-empty').onclick = () => call('/api/empty')
      document.getElementById('side-effect').onclick = () => call('/api/side-effect', { method: 'POST' })
    </script>
  </body>
</html>`
}
