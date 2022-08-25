import { debounce } from 'lodash-es'

function createDebounced(method: string) {
  const fn = (uni as any)[method]
  ;(uni as any)[method] = debounce(fn, 800, { leading: true, trailing: false })
}

createDebounced('navigateTo')
createDebounced('redirectTo')
