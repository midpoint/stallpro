// components/paymentQrcode/paymentQrcode.js
Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '收款二维码'
    },
    wechatQrcode: {
      type: String,
      value: ''
    },
    alipayQrcode: {
      type: String,
      value: ''
    },
    wechatAccount: {
      type: Object,
      value: { name: '', account: '' }
    },
    alipayAccount: {
      type: Object,
      value: { name: '', account: '' }
    }
  },

  data: {
    activeTab: 'wechat'
  },

  methods: {
    hide() {
      this.triggerEvent('hide');
    },

    stopPropagation() {},

    switchTab(e) {
      const tab = e.currentTarget.dataset.tab;
      this.setData({ activeTab: tab });
    }
  }
});
