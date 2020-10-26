// https://dev.to/flexdinesh/cache-busting-a-react-app-22lk
// https://github.com/flexdinesh/cache-busting-example/blob/master/src/App.js

// version from response - first param, local version second param
const semverGreaterThan = (latest, current) => {
  if (!latest || !current) return false
  const versionsA = latest.split(/\./g)
  const versionsB = current.split(/\./g)
  while (versionsA.length || versionsB.length) {
    const a = Number(versionsA.shift())
    const b = Number(versionsB.shift())
    // eslint-disable-next-line no-continue
    if (a === b) continue
    // eslint-disable-next-line no-restricted-globals
    return a > b || isNaN(b)
  }
  return false
}

export const maybeRefreshVersion = (open) => {
  fetch('/meta.json', { cache: 'no-store' })
    .then((response) => response.json())
    .then((meta) => {
      const latest = meta.version
      const current = global.appVersion
      // console.log(latest, current)
      const shouldForceRefresh = semverGreaterThan(latest, current)
      if (shouldForceRefresh) {
        open({ type: 'version', args: { latest, current, preventClose: true } })
      }
    })
    .catch((err) => console.log(err))
}
