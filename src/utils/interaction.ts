function Toast(title: string) {
  uni.showToast({ title, icon: 'none' })
}

Toast.success = (title: string) => {
  uni.showToast({ title, icon: 'success' })
}

Toast.loading = (title = '请稍后') => {
  uni.showLoading({ title, mask: true })
}

Toast.hideLoading = () => {
  try {
    uni.hideLoading()
  } catch {}
}

type DialogOption = Omit<
  UniApp.ShowModalOptions,
  'success' | 'fail' | 'complete'
>

const Dialog = {
  alert(option: DialogOption) {
    return new Promise((resolve, reject) => {
      uni.showModal({
        ...option,
        showCancel: false,
        success(res) {
          res.confirm ? resolve(1) : reject()
        },
        fail: reject,
      })
    })
  },

  confirm(option: DialogOption) {
    return new Promise((resolve, reject) => {
      uni.showModal({
        ...option,
        showCancel: true,
        success(res) {
          res.confirm ? resolve(1) : reject()
        },
        fail: reject,
      })
    })
  },
}

export { Toast, Dialog }
