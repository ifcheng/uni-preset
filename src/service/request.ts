import { isPlainObject } from 'lodash-es'

export const netErrMsg = '服务异常，请稍候再试'
export const BASE_URL = ''

interface Log {
  (config: RequestConfig, res: UniApp.RequestSuccessCallbackResult): void
  record?(config: RequestConfig): void
}

const needLog =
  uni.getAccountInfoSync().miniProgram.envVersion !== 'release' &&
  uni.getSystemInfoSync().platform !== 'devtools'

const log: Log = !needLog
  ? () => {}
  : (config, res) => {
      const { url, method = 'GET', time } = config
      const { statusCode, data } = res
      const apiPath = url.slice(url.indexOf('/', 8))
      console.info(`${method.toUpperCase()} ${apiPath} ${statusCode}:`, {
        url,
        params: config.data || null,
        response: data,
        time: Date.now() - time!,
      })
    }

log.record = !needLog
  ? () => {}
  : config => {
      config.time = Date.now()
    }

export interface ResponseData<T = any> {
  code: number
  msg: string
  data: T
}

export interface RequestConfig extends UniApp.RequestOptions {
  contentType?: 'json' | 'form'
  toastError?: boolean | string | ((res: ResponseData) => boolean | string)
  showLoading?: boolean
  cancelable?: boolean
  time?: number
}

const requestTasks: Record<string, UniApp.RequestTask> = {}

function requestInterceptor(config: RequestConfig) {
  // config.url = buildURL(BASE_URL, config.url)
  requestTasks[config.url]?.abort()
  delete requestTasks[config.url]
  config.showLoading && uni.showLoading({ title: '请稍候...' })

  const commonParams: any = {}
  config.header = config.header || {}

  // 确保始终带上公共参数参数
  if (!config.data || isPlainObject(config.data)) {
    config.data = { ...commonParams, ...(config.data as any) }
    config.data = Object.fromEntries(
      Object.entries(config.data as any).filter(
        ([k, v]) => v !== void 0 && v !== null
      )
    )
  }
  if (config.contentType === 'form') {
    config.header['content-type'] = 'application/x-www-form-urlencoded'
  }
  // config.timeout = config.timeout ?? 4000

  log.record?.(config)
  return config
}

function buildURL(baseURL: string, requestedURL: string) {
  return requestedURL.startsWith('http')
    ? requestedURL
    : baseURL + requestedURL.replace(/^\//, '')
}

export default function request<T = any>(
  config: RequestConfig
): Promise<ResponseData<T>> {
  config = requestInterceptor(config)
  return new Promise((resolve, reject) => {
    const task = uni.request({
      ...config,
      async success(res) {
        log(config, res)
        if (res.statusCode !== 200) {
          uni.showToast({ title: netErrMsg, icon: 'none' })
          return reject()
        }
        const data = res.data as ResponseData
        if (data.code === 0) {
          config.showLoading && uni.hideLoading()
          return resolve(data)
        }

        try {
          uni.hideLoading()
        } catch {}
        reportError(config, data)
        reject(data)
      },
      fail(err) {
        if (err.errMsg !== 'request:fail abort') {
          uni.showToast({ title: netErrMsg, icon: 'none' })
        }
        reject(err)
      },
    })

    if (config.cancelable) {
      requestTasks[config.url] = task
    }
  })
}

request.get = <T = any>(
  url: string,
  data?: any,
  config?: Omit<RequestConfig, 'url' | 'method'>
) => request<T>({ ...config, url, data })

request.post = <T = any>(
  url: string,
  data?: any,
  config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
) => request<T>({ ...config, method: 'POST', url, data })

request.cancel = (url?: string) => {
  const apis = Object.keys(requestTasks)
  if (!url) {
    apis.forEach(api => {
      requestTasks[api].abort()
      delete requestTasks[api]
    })
  } else if (apis.includes(url)) {
    requestTasks[url].abort()
    delete requestTasks[url]
  }
}

function reportError(config: RequestConfig, res: ResponseData) {
  const ignoreCodes: number[] = []
  let { toastError = !ignoreCodes.includes(res.code) } = config
  if (typeof toastError === 'function') {
    toastError = toastError(res)
  }
  const message =
    typeof toastError === 'string' ? toastError : res.msg || netErrMsg
  toastError && uni.showToast({ title: message, icon: 'none' })
}
