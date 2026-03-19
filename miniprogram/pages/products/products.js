// pages/products/products.js
const app = getApp();
const API_BASE = 'https://stallpro.vercel.app/api';

Page({
  data: {
    products: [],
    activeCount: 0,
    inactiveCount: 0,
    showModal: false,
    isEdit: false,
    editId: null,
    categories: ['主食', '小吃', '饮品', '配料'],
    categoryIndex: 0,
    icons: ['🥚', '🌭', '🍜', '🌮', '🥙', '🥛', '🧃', '🍟', '🍡', '🥗'],
    formData: {
      name: '',
      price: '',
      category: '主食',
      icon: '🥚'
    }
  },

  onLoad() {
    this.loadProducts();
  },

  onShow() {
    this.loadProducts();
  },

  loadProducts() {
    let stallId = app.globalData.stallId || 'stall1';
    stallId = stallId.toString().trim();
    const that = this;

    wx.request({
      url: `${API_BASE}/product/stall/${stallId}`,
      success(res) {
        if (res.data.success) {
          const products = res.data.data.map((p, idx) => ({
            id: p._id || `p${idx}`,
            name: p.name,
            price: p.price,
            category: p.category || '主食',
            icon: '🥚',
            status: p.status || 'active'
          }));

          const activeCount = products.filter(p => p.status === 'active').length;
          const inactiveCount = products.filter(p => p.status === 'inactive').length;

          that.setData({ products, activeCount, inactiveCount });
        }
      }
    });
  },

  // 显示添加弹窗
  showAddModal() {
    this.setData({
      showModal: true,
      isEdit: false,
      editId: null,
      formData: { name: '', price: '', category: '主食', icon: '🥚' },
      categoryIndex: 0
    });
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({ showModal: false });
  },

  // 阻止冒泡
  stopPropagation() {},

  // 输入名称
  inputName(e) {
    this.setData({ 'formData.name': e.detail.value });
  },

  // 输入价格
  inputPrice(e) {
    this.setData({ 'formData.price': e.detail.value });
  },

  // 选择分类
  selectCategory(e) {
    const index = e.detail.value;
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categories[index]
    });
  },

  // 选择图标
  selectIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({ 'formData.icon': icon });
  },

  // 编辑商品
  editProduct(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === id);
    if (product) {
      const categoryIndex = this.data.categories.indexOf(product.category);
      this.setData({
        showModal: true,
        isEdit: true,
        editId: id,
        formData: { ...product },
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0
      });
    }
  },

  // 保存商品
  saveProduct() {
    const { name, price, category, icon } = this.data.formData;

    if (!name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }
    if (!price || price <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }

    let stallId = app.globalData.stallId || 'stall1';
    stallId = stallId.toString().trim();

    // 这里简化处理，实际应该调用后端API
    wx.showLoading({ title: '保存中...' });

    // 模拟保存成功
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.hideModal();
      this.loadProducts();
    }, 500);
  },

  // 切换状态
  toggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const products = this.data.products.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === 'active' ? 'inactive' : 'active' };
      }
      return p;
    });

    const activeCount = products.filter(p => p.status === 'active').length;
    const inactiveCount = products.filter(p => p.status === 'inactive').length;

    this.setData({ products, activeCount, inactiveCount });
    wx.showToast({ title: '已更新', icon: 'success' });
  },

  // 删除商品
  deleteProduct(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: (res) => {
        if (res.confirm) {
          const products = this.data.products.filter(p => p.id !== id);
          const activeCount = products.filter(p => p.status === 'active').length;
          const inactiveCount = products.filter(p => p.status === 'inactive').length;

          this.setData({ products, activeCount, inactiveCount });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
});
