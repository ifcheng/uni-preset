export function rpx2px(value: number, designWidth = 750) {
  const { screenWidth } = uni.getSystemInfoSync()
  return Math.floor((screenWidth / designWidth) * value)
}

export function getCurrentPage() {
  const pages = getCurrentPages()
  return pages[pages.length - 1]
}

export function getEnvVersion() {
  return (
    uni.getAccountInfoSync?.().miniProgram?.envVersion ||
    (import.meta.env.PROD ? 'release' : 'develop')
  )
}

/** 是否是单页模式 */
export function isSinglePage() {
  return uni.getLaunchOptionsSync().scene === 1154
}
