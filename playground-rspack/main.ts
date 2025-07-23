import style from './index.scss?raw'

document.getElementById('app')!.innerHTML = `
<p>index.scss to CSS Result</p>
<pre>
  <code>
${style}
  </code>
</pre>
`
