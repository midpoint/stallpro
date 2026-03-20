// pages/products/products.js
const app = getApp();

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

  async loadProducts() {
    const stallId = app.globalData.stallId;
    if (!stallId) return;

    try {
      const db = wx.cloud.database();
      const result = await db.collection('products').where({
        stallId: stallId
      }).get();

      const products = result.data || [];
      const activeCount = products.filter(p => p.status === 'active').length;
      const inactiveCount = products.filter(p => p.status === 'inactive').length;

      this.setData({ products, activeCount, inactiveCount });
    } catch (e) {
      console.log('loadProducts error:', e);
    }
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
    const product = this.data.products.find(p => p._id === id);
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
  async saveProduct() {
    const { name, price, category, icon } = this.data.formData;

    if (!name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }
    if (!price || price <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }

    const stallId = app.globalData.stallId;
    if (!stallId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      const db = wx.cloud.database();

      if (this.data.isEdit) {
        // 更新商品
        await db.collection('products').doc(this.data.editId).update({
          data: { name, price: parseFloat(price), category, icon }
        });
      } else {
        // 添加商品
        await db.collection('products').add({
          data: {
            stallId,
            name,
            price: parseFloat(price),
            category,
            icon,
            status: 'active',
            createdAt: new Date()
          }
        });
      }

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.hideModal();
      this.loadProducts();
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
      console.log('saveProduct error:', e);
    }
  },

  // 切换状态
  async toggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p._id === id);
    if (!product) return;

    const newStatus = product.status === 'active' ? 'inactive' : 'active';

    try {
      const db = wx.cloud.database();
      await db.collection('products').doc(id).update({
        data: { status: newStatus }
      });
      this.loadProducts();
      wx.showToast({ title: '已更新', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: '更新失败', icon: 'none' });
    }
  },

  // 删除商品
  async deleteProduct(e) {
    const id = e.currentTarget.dataset.id;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const db = wx.cloud.database();
            await db.collection('products').doc(id).remove();
            this.loadProducts();
            wx.showToast({ title: '已删除', icon: 'success' });
          } catch (e) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
