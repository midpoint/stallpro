import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { stallInfo, initialOrders, products, statusMap, generateOrderNumber } from './data/mockData';
import './App.css';

// 语音播报函数
const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
};

// 订单卡片组件
const OrderCard = ({ order, onAccept, onComplete, onCallNumber }) => {
  const status = statusMap[order.status];
  const time = new Date(order.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`order-card ${order.status}`}>
      <div className="order-header">
        <div className="order-number">{order.orderNumber}</div>
        <span className={`status-badge ${status.className}`}>{status.text}</span>
      </div>

      <div className="order-items">
        {order.items.map((item, index) => (
          <div key={index} className="order-item">
            <span className="item-name">{item.name} x{item.quantity}</span>
            {item.specs && <span className="item-specs">{item.specs}</span>}
          </div>
        ))}
      </div>

      <div className="order-footer">
        <div className="order-meta">
          <span className="order-time">{time}</span>
          <span className={`payment-status ${order.paymentStatus}`}>
            {order.paymentStatus === 'paid' ? '✓ 已付款' : '◐ 待付款'}
          </span>
        </div>

        <div className="order-amount">¥{order.totalAmount}</div>
      </div>

      <div className="order-actions">
        {order.status === 'pending' && (
          <>
            <button className="btn btn-primary" onClick={() => onAccept(order.id)}>
              接单
            </button>
            <button className="btn btn-outline" onClick={() => {}}>
              取消
            </button>
          </>
        )}
        {order.status === 'cooking' && (
          <button className="btn btn-success btn-large" onClick={() => onComplete(order.id)}>
            完成并叫号
          </button>
        )}
        {order.status === 'completed' && (
          <button className="btn btn-primary btn-large" onClick={() => onCallNumber(order.orderNumber)}>
            叫号
          </button>
        )}
        {order.status === 'taken' && (
          <div className="taken-info">已取餐</div>
        )}
      </div>
    </div>
  );
};

// 统计卡片组件
const StatsCard = ({ orders }) => {
  const todayOrders = orders.length;
  const todayRevenue = orders.reduce((sum, order) => {
    return order.paymentStatus === 'paid' ? sum + order.totalAmount : sum;
  }, 0);

  return (
    <div className="stats-card">
      <div className="stats-item">
        <div className="stats-value">{todayOrders}</div>
        <div className="stats-label">今日订单</div>
      </div>
      <div className="stats-divider"></div>
      <div className="stats-item">
        <div className="stats-value">¥{todayRevenue}</div>
        <div className="stats-label">今日营收</div>
      </div>
    </div>
  );
};

// 叫号大屏组件
const CallNumberScreen = ({ currentNumber, visible }) => {
  if (!visible) return null;

  return (
    <div className="call-screen-overlay">
      <div className="call-screen">
        <div className="call-title">请取餐</div>
        <div className="call-number">{currentNumber}</div>
      </div>
    </div>
  );
};

// 添加订单模拟
const simulateNewOrder = (setOrders) => {
  const productsList = [
    { name: '鸡蛋灌饼', price: 8, specs: '加肠' },
    { name: '手抓饼', price: 10, specs: '加烤肠' },
    { name: '烤冷面', price: 8, specs: '加辣' }
  ];

  const randomProduct = productsList[Math.floor(Math.random() * productsList.length)];
  const newOrder = {
    id: `order_${Date.now()}`,
    orderNumber: generateOrderNumber(),
    items: [{ ...randomProduct, productId: 1, quantity: 1 }],
    totalAmount: randomProduct.price + (randomProduct.specs ? 2 : 0),
    status: 'pending',
    paymentStatus: 'paid',
    paymentMethod: 'wechat',
    remarks: '',
    createdAt: new Date().toISOString(),
    customerId: `customer_${Date.now()}`
  };

  setOrders(prev => [newOrder, ...prev]);
  speak(`新订单，${newOrder.orderNumber}号，${randomProduct.name}`);
};

// 主应用组件
function App() {
  const [orders, setOrders] = useState(initialOrders);
  const [currentView, setCurrentView] = useState('orders');
  const [callNumber, setCallNumber] = useState(null);
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [productsList, setProductsList] = useState(products);

  // 商品弹窗状态
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '主食',
    image: '🥚',
    stock: 999,
    status: 'active',
    specs: []
  });

  // 设置状态
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    screenOffEnabled: true,
    soundType: 'default', // default, gentle, strong
    orderPrefix: 'A',
    autoCall: true,
    vibration: true,
    nightMode: false,
    language: 'zh-CN',
    // 收款账户
    paymentMethod: 'wechat', // wechat, alipay, both
    wechatAccount: '',
    alipayAccount: '',
    qrcodeGenerated: false,
    // 点餐二维码
    orderQrcodeUrl: '', // 点餐链接
    orderQrcodeGenerated: false
  });

  const [showSettingsModal, setShowSettingsModal] = useState(null); // 当前打开的设置弹窗

  // 更新设置
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // 打开添加商品弹窗
  const openAddProduct = () => {
    setEditingProduct(null);
    setNewProduct({
      name: '',
      price: '',
      category: '主食',
      image: '🥚',
      stock: 999,
      status: 'active',
      specs: []
    });
    setShowProductModal(true);
  };

  // 打开编辑商品弹窗
  const openEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({ ...product });
    setShowProductModal(true);
  };

  // 保存商品
  const saveProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      alert('请填写商品名称和价格');
      return;
    }

    if (editingProduct) {
      // 编辑商品
      setProductsList(prev => prev.map(p =>
        p.id === editingProduct.id ? { ...newProduct, id: editingProduct.id, price: parseFloat(newProduct.price) } : p
      ));
    } else {
      // 添加商品
      const maxId = Math.max(...productsList.map(p => p.id), 0);
      setProductsList(prev => [...prev, { ...newProduct, id: maxId + 1, price: parseFloat(newProduct.price) }]);
    }
    setShowProductModal(false);
  };

  // 删除商品
  const deleteProduct = (productId) => {
    if (confirm('确定要删除这个商品吗？')) {
      setProductsList(prev => prev.filter(p => p.id !== productId));
    }
  };

  // 切换商品状态（上架/下架）
  const toggleProductStatus = (productId) => {
    setProductsList(prev => prev.map(p =>
      p.id === productId ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
  };

  // 处理接单
  const handleAccept = (orderId) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: 'cooking' } : order
    ));
  };

  // 处理完成
  const handleComplete = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: 'completed' } : o
      ));
      // 自动叫号
      handleCallNumber(order.orderNumber);
    }
  };

  // 处理叫号
  const handleCallNumber = (number) => {
    setCallNumber(number);
    setShowCallScreen(true);
    speak(`${number}号，请取餐`);

    // 5秒后隐藏叫号屏
    setTimeout(() => {
      setShowCallScreen(false);
    }, 5000);
  };

  // 模拟新订单（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        simulateNewOrder(setOrders);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 待处理订单数量
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const cookingCount = orders.filter(o => o.status === 'cooking').length;

  return (
    <div className="app">
      {/* 叫号大屏 */}
      <CallNumberScreen
        currentNumber={callNumber}
        visible={showCallScreen}
      />

      {/* 顶部栏 */}
      <header className="header">
        <div className="stall-info">
          <h1>{stallInfo.name}</h1>
          <p>{stallInfo.notice}</p>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="container">
        {/* 订单页面 */}
        {currentView === 'orders' && (
          <>
            <StatsCard orders={orders} />

            {/* 快捷操作 */}
            <div className="quick-actions">
              <button
                className="btn btn-outline"
                onClick={() => simulateNewOrder(setOrders)}
              >
                + 测试新订单
              </button>
            </div>

            {/* 订单列表 */}
            <div className="orders-section">
              <div className="section-header">
                <h2>订单列表</h2>
                <div className="order-counts">
                  {pendingCount > 0 && <span className="count-badge">{pendingCount} 待接单</span>}
                  {cookingCount > 0 && <span className="count-badge cooking">{cookingCount} 制作中</span>}
                </div>
              </div>

              <div className="orders-list">
                {orders
                  .sort((a, b) => {
                    // 排序：制作中 > 待接单 > 已完成 > 已取餐
                    const statusOrder = { cooking: 0, pending: 1, completed: 2, taken: 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                  })
                  .map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAccept={handleAccept}
                      onComplete={handleComplete}
                      onCallNumber={handleCallNumber}
                    />
                  ))}
              </div>

              {orders.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>暂无订单</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* 商品管理页面 */}
        {currentView === 'products' && (
          <div className="products-page">
            <div className="section-header">
              <h2>商品管理</h2>
              <button className="btn btn-primary" style={{padding: '8px 16px', fontSize: '14px'}} onClick={openAddProduct}>
                + 添加商品
              </button>
            </div>

            <div className="products-list">
              {productsList.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-icon">{product.image}</div>
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">¥{product.price}</div>
                    <div className="product-category">{product.category}</div>
                  </div>
                  <div className="product-actions">
                    <span className={`status-badge ${product.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {product.status === 'active' ? '上架中' : '已下架'}
                    </span>
                    <div className="product-btns">
                      <button className="btn-icon" onClick={() => openEditProduct(product)} title="编辑">✏️</button>
                      <button className="btn-icon" onClick={() => toggleProductStatus(product.id)} title={product.status === 'active' ? '下架' : '上架'}>
                        {product.status === 'active' ? '⬇️' : '⬆️'}
                      </button>
                      <button className="btn-icon" onClick={() => deleteProduct(product.id)} title="删除">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 商品统计 */}
            <div className="product-stats">
              <div className="product-stat-item">
                <span className="stat-num">{productsList.filter(p => p.status === 'active').length}</span>
                <span className="stat-label">在售商品</span>
              </div>
              <div className="product-stat-item">
                <span className="stat-num">{productsList.length}</span>
                <span className="stat-label">全部商品</span>
              </div>
              <div className="product-stat-item">
                <span className="stat-num">{productsList.filter(p => p.category === '主食').length}</span>
                <span className="stat-label">主食</span>
              </div>
              <div className="product-stat-item">
                <span className="stat-num">{productsList.filter(p => p.category === '小吃' || p.category === '饮品').length}</span>
                <span className="stat-label">小食饮品</span>
              </div>
            </div>
          </div>
        )}

        {/* 统计页面 */}
        {currentView === 'stats' && (
          <div className="stats-page">
            <div className="page-title">数据统计</div>

            {/* 今日数据 */}
            <div className="stats-card" style={{marginBottom: '16px'}}>
              <div className="stats-item">
                <div className="stats-value">{orders.length}</div>
                <div className="stats-label">今日订单</div>
              </div>
              <div className="stats-divider"></div>
              <div className="stats-item">
                <div className="stats-value">¥{orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0)}</div>
                <div className="stats-label">今日营收</div>
              </div>
            </div>

            {/* 详细数据 */}
            <div className="stats-detail-grid">
              <div className="stats-detail-card">
                <div className="detail-icon">⏱️</div>
                <div className="detail-num">{orders.filter(o => o.status === 'completed' || o.status === 'taken').length}</div>
                <div className="detail-label">已完成</div>
              </div>
              <div className="stats-detail-card">
                <div className="detail-icon">🔥</div>
                <div className="detail-num">{orders.filter(o => o.status === 'cooking').length}</div>
                <div className="detail-label">制作中</div>
              </div>
              <div className="stats-detail-card">
                <div className="detail-icon">💰</div>
                <div className="detail-num">¥{orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0) / orders.length).toFixed(1) : 0}</div>
                <div className="detail-label">客单价</div>
              </div>
              <div className="stats-detail-card">
                <div className="detail-icon">📱</div>
                <div className="detail-num">100%</div>
                <div className="detail-label">支付率</div>
              </div>
            </div>

            {/* 热销商品 */}
            <div className="stats-section">
              <div className="stats-section-title">热销商品</div>
              {(() => {
                // 统计商品销量
                const productSales = {};
                orders.forEach(order => {
                  order.items.forEach(item => {
                    if (productSales[item.name]) {
                      productSales[item.name] += item.quantity;
                    } else {
                      productSales[item.name] = item.quantity;
                    }
                  });
                });
                const sortedProducts = Object.entries(productSales)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                return sortedProducts.length > 0 ? sortedProducts.map((item, idx) => (
                  <div key={idx} className="stats-item-row">
                    <span>{idx + 1}. {item[0]}</span>
                    <span style={{color: 'var(--primary-color)', fontWeight: '600'}}>x{item[1]}</span>
                  </div>
                )) : <div className="stats-item-row"><span>暂无数据</span></div>;
              })()}
            </div>

            {/* 支付方式 */}
            <div className="stats-section">
              <div className="stats-section-title">支付方式</div>
              {(() => {
                const paymentStats = {};
                orders.forEach(order => {
                  const method = order.paymentMethod || 'wechat';
                  if (paymentStats[method]) {
                    paymentStats[method]++;
                  } else {
                    paymentStats[method] = 1;
                  }
                });
                const methodMap = { wechat: '微信支付', alipay: '支付宝' };
                return Object.entries(paymentStats).map(([method, count], idx) => (
                  <div key={idx} className="stats-item-row">
                    <span>{methodMap[method] || method}</span>
                    <span style={{color: 'var(--primary-color)'}}>{count}单</span>
                  </div>
                ));
              })()}
            </div>

            {/* 订单高峰 */}
            <div className="stats-section">
              <div className="stats-section-title">订单高峰</div>
              <div className="stats-item-row">
                <span>12:00-13:00</span>
                <span style={{color: 'var(--primary-color)'}}>15单</span>
              </div>
              <div className="stats-item-row">
                <span>18:00-19:00</span>
                <span style={{color: 'var(--primary-color)'}}>8单</span>
              </div>
            </div>

            {/* 时间段分布 */}
            <div className="stats-section">
              <div className="stats-section-title">订单时间分布</div>
              <div className="time-bars">
                {['6-9', '9-12', '12-15', '15-18', '18-21', '21-24'].map((time, idx) => (
                  <div key={idx} className="time-bar-item">
                    <div className="time-bar-label">{time}时</div>
                    <div className="time-bar">
                      <div className="time-bar-fill" style={{width: `${Math.random() * 80 + 20}%`}}></div>
                    </div>
                    <div className="time-bar-value">{Math.floor(Math.random() * 10) + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 设置页面 */}
        {currentView === 'settings' && (
          <div className="settings-page">
            <div className="page-title">设置</div>

            {/* 店铺信息 */}
            <div className="settings-section">
              <div className="settings-title">店铺管理</div>
              <div className="settings-item" onClick={() => setShowSettingsModal('shop')}>
                <span className="settings-icon">🏪</span>
                <span>店铺信息</span>
                <div className="settings-value">{stallInfo.name}</div>
              </div>
              <div className="settings-item" onClick={() => setShowSettingsModal('notice')}>
                <span className="settings-icon">📢</span>
                <span>店铺公告</span>
                <span className="settings-arrow">></span>
              </div>
              <div className="settings-item" onClick={() => setShowSettingsModal('orderQrcode')}>
                <span className="settings-icon">📲</span>
                <span>点餐二维码</span>
                <span className="settings-arrow">></span>
              </div>
              <div className="settings-item" onClick={() => setShowSettingsModal('qrcode')}>
                <span className="settings-icon">💳</span>
                <span>收款二维码</span>
                <span className="settings-arrow">></span>
              </div>
            </div>

            {/* 订单提醒 */}
            <div className="settings-section">
              <div className="settings-title">订单提醒</div>
              <div className="settings-item">
                <span className="settings-icon">🔊</span>
                <span>语音播报</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.voiceEnabled}
                    onChange={(e) => updateSetting('voiceEnabled', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="settings-item">
                <span className="settings-icon">📱</span>
                <span>息屏播报</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.screenOffEnabled}
                    onChange={(e) => updateSetting('screenOffEnabled', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="settings-item">
                <span className="settings-icon">📳</span>
                <span>震动提醒</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.vibration}
                    onChange={(e) => updateSetting('vibration', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="settings-item" onClick={() => setShowSettingsModal('sound')}>
                <span className="settings-icon">🎵</span>
                <span>播报声音</span>
                <div className="settings-value">
                  {settings.soundType === 'default' ? '默认' : settings.soundType === 'gentle' ? '温柔' : '响亮'}
                </div>
              </div>
            </div>

            {/* 取餐设置 */}
            <div className="settings-section">
              <div className="settings-title">取餐设置</div>
              <div className="settings-item" onClick={() => setShowSettingsModal('prefix')}>
                <span className="settings-icon">🔤</span>
                <span>取餐号前缀</span>
                <div className="settings-value">{settings.orderPrefix}</div>
              </div>
              <div className="settings-item">
                <span className="settings-icon">📢</span>
                <span>自动叫号</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.autoCall}
                    onChange={(e) => updateSetting('autoCall', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="settings-item" onClick={() => setShowSettingsModal('callScreen')}>
                <span className="settings-icon">📺</span>
                <span>叫号大屏</span>
                <span className="settings-arrow">></span>
              </div>
            </div>

            {/* 通用设置 */}
            <div className="settings-section">
              <div className="settings-title">通用</div>
              <div className="settings-item">
                <span className="settings-icon">🌙</span>
                <span>夜间模式</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.nightMode}
                    onChange={(e) => updateSetting('nightMode', e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="settings-item" onClick={() => setShowSettingsModal('about')}>
                <span className="settings-icon">ℹ️</span>
                <span>关于</span>
                <span className="settings-arrow">></span>
              </div>
            </div>

            {/* 测试功能 */}
            <div className="settings-section">
              <div className="settings-title">测试</div>
              <div className="settings-item" onClick={() => simulateNewOrder(setOrders)}>
                <span className="settings-icon">🧪</span>
                <span>测试新订单</span>
                <span className="settings-arrow">></span>
              </div>
              <div className="settings-item" onClick={() => handleCallNumber('A99')}>
                <span className="settings-icon">🔔</span>
                <span>测试叫号</span>
                <span className="settings-arrow">></span>
              </div>
            </div>

            <div className="version-info">摆摊666 v1.0.0</div>

            {/* 商品弹窗 */}
            {showProductModal && (
              <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div className="modal-title">{editingProduct ? '编辑商品' : '添加商品'}</div>
                    <div className="modal-close" onClick={() => setShowProductModal(false)}>✕</div>
                  </div>

                  <div className="modal-content">
                    <div className="form-group">
                      <label>商品名称 *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="如：鸡蛋灌饼"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>价格（元） *</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="如：8"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>分类</label>
                      <select
                        className="form-input"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      >
                        <option value="主食">主食</option>
                        <option value="小吃">小吃</option>
                        <option value="饮品">饮品</option>
                        <option value="配料">配料</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>图标</label>
                      <div className="emoji-selector">
                        {['🥚', '🌭', '🍜', '🌮', '🥙', '🥛', '🧃', '🍟', '🍡', '🥗'].map(emoji => (
                          <span
                            key={emoji}
                            className={`emoji-option ${newProduct.image === emoji ? 'active' : ''}`}
                            onClick={() => setNewProduct({...newProduct, image: emoji})}
                          >
                            {emoji}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>库存</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="数量"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                      />
                    </div>

                    <div className="form-group">
                      <label>状态</label>
                      <div className="status-selector">
                        <div
                          className={`status-option ${newProduct.status === 'active' ? 'active' : ''}`}
                          onClick={() => setNewProduct({...newProduct, status: 'active'})}
                        >
                          上架
                        </div>
                        <div
                          className={`status-option ${newProduct.status === 'inactive' ? 'active' : ''}`}
                          onClick={() => setNewProduct({...newProduct, status: 'inactive'})}
                        >
                          下架
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button className="btn btn-outline" onClick={() => setShowProductModal(false)}>取消</button>
                    <button className="btn btn-primary" onClick={saveProduct}>保存</button>
                  </div>
                </div>
              </div>
            )}

            {/* 设置弹窗 */}
            {showSettingsModal && (
              <div className="modal-overlay" onClick={() => setShowSettingsModal(null)}>
                <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div className="modal-title">
                      {showSettingsModal === 'shop' && '店铺信息'}
                      {showSettingsModal === 'notice' && '店铺公告'}
                      {showSettingsModal === 'orderQrcode' && '点餐二维码'}
                      {showSettingsModal === 'qrcode' && '收款二维码'}
                      {showSettingsModal === 'sound' && '播报声音'}
                      {showSettingsModal === 'prefix' && '取餐号前缀'}
                      {showSettingsModal === 'callScreen' && '叫号大屏'}
                      {showSettingsModal === 'about' && '关于'}
                    </div>
                    <div className="modal-close" onClick={() => setShowSettingsModal(null)}>✕</div>
                  </div>

                  <div className="modal-content">
                    {showSettingsModal === 'orderQrcode' && (
                      <div className="qrcode-section">
                        {!settings.orderQrcodeGenerated ? (
                          <>
                            <div className="order-qrcode-intro">
                              <p>生成您的专属点餐二维码，顾客扫码即可浏览菜单下单</p>
                            </div>

                            <div className="form-group">
                              <label>摊位ID</label>
                              <input
                                type="text"
                                className="form-input"
                                defaultValue="stall1"
                                placeholder="请输入摊位ID"
                              />
                            </div>

                            <button
                              className="btn btn-primary btn-block"
                              onClick={() => {
                                const stallId = 'stall1';
                                const orderUrl = `https://stallpro.vercel.app/menu?stallId=${stallId}`;
                                setSettings(prev => ({...prev, orderQrcodeUrl: orderUrl, orderQrcodeGenerated: true}));
                              }}
                            >
                              生成点餐二维码
                            </button>

                            <div className="qrcode-tips">
                              <h4>使用说明：</h4>
                              <ul>
                                <li>将二维码打印出来贴在摊位显眼位置</li>
                                <li>顾客扫码后直接进入点餐页面</li>
                                <li>无需下载小程序，微信扫一扫即可</li>
                                <li>订单会实时推送到您的管理后台</li>
                              </ul>
                            </div>
                          </>
                        ) : (
                          <div className="qrcode-generated">
                            <div className="qrcode-display">
                              <QRCodeSVG
                                value={settings.orderQrcodeUrl}
                                size={180}
                                level="H"
                              />
                            </div>
                            <p className="qrcode-title">扫码点餐</p>
                            <p className="qrcode-tip">顾客微信扫一扫直接点餐</p>

                            <div className="qrcode-link">
                              <label>点餐链接：</label>
                              <input
                                type="text"
                                className="form-input"
                                value={settings.orderQrcodeUrl}
                                readOnly
                              />
                              <button
                                className="btn btn-outline btn-small"
                                onClick={() => {
                                  navigator.clipboard.writeText(settings.orderQrcodeUrl);
                                  alert('链接已复制');
                                }}
                              >
                                复制链接
                              </button>
                            </div>

                            <button
                              className="btn btn-outline"
                              style={{marginTop: '12px'}}
                              onClick={() => setSettings(prev => ({...prev, orderQrcodeGenerated: false}))}
                            >
                              重新生成
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {showSettingsModal === 'shop' && (
                      <div className="form-group">
                        <label>店铺名称</label>
                        <input type="text" defaultValue={stallInfo.name} className="form-input" />
                        <label>店主姓名</label>
                        <input type="text" defaultValue={stallInfo.ownerName} className="form-input" />
                        <label>联系电话</label>
                        <input type="tel" placeholder="请输入手机号" className="form-input" />
                      </div>
                    )}

                    {showSettingsModal === 'notice' && (
                      <div className="form-group">
                        <label>公告内容</label>
                        <textarea
                          defaultValue={stallInfo.notice}
                          className="form-input"
                          rows={3}
                          placeholder="输入店铺公告内容"
                        />
                      </div>
                    )}

                    {showSettingsModal === 'qrcode' && (
                      <div className="qrcode-section">
                        {!settings.qrcodeGenerated ? (
                          <>
                            <div className="payment-methods">
                              <div
                                className={`payment-option ${settings.paymentMethod === 'wechat' ? 'active' : ''}`}
                                onClick={() => updateSetting('paymentMethod', 'wechat')}
                              >
                                💚 微信支付
                              </div>
                              <div
                                className={`payment-option ${settings.paymentMethod === 'alipay' ? 'active' : ''}`}
                                onClick={() => updateSetting('paymentMethod', 'alipay')}
                              >
                                💙 支付宝
                              </div>
                              <div
                                className={`payment-option ${settings.paymentMethod === 'both' ? 'active' : ''}`}
                                onClick={() => updateSetting('paymentMethod', 'both')}
                              >
                                💚💙 两者都要
                              </div>
                            </div>

                            <div className="form-group">
                              <label>
                                {settings.paymentMethod === 'wechat' ? '微信收款账户' :
                                 settings.paymentMethod === 'alipay' ? '支付宝账户' : '收款账户'}
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder={settings.paymentMethod === 'wechat' ? '请输入微信收款码上的账户名' : '请输入支付宝账户'}
                                value={settings.paymentMethod === 'wechat' ? settings.wechatAccount : settings.alipayAccount}
                                onChange={(e) => updateSetting(
                                  settings.paymentMethod === 'wechat' ? 'wechatAccount' : 'alipayAccount',
                                  e.target.value
                                )}
                              />
                            </div>

                            <div className="payment-notice">
                              <p>⚠️ <strong>重要提示：</strong></p>
                              <ul>
                                <li>微信支付需开通<strong>微信支付商户号</strong></li>
                                <li>支付宝需开通<strong>支付宝商家服务</strong></li>
                                <li>也可使用第三方<strong>聚合收款码</strong></li>
                              </ul>
                            </div>

                            <button
                              className="btn btn-primary btn-block"
                              onClick={() => updateSetting('qrcodeGenerated', true)}
                            >
                              生成收款二维码
                            </button>
                          </>
                        ) : (
                          <div className="qrcode-generated">
                            <div className="qrcode-display">
                              <QRCodeSVG
                                value={`stallpro://pay?stall=${stallInfo.name}&method=${settings.paymentMethod}`}
                                size={180}
                                level="H"
                              />
                            </div>
                            <p className="qrcode-title">
                              {settings.paymentMethod === 'wechat' && '微信扫码付款'}
                              {settings.paymentMethod === 'alipay' && '支付宝扫码付款'}
                              {settings.paymentMethod === 'both' && '微信/支付宝通用'}
                            </p>
                            <p className="qrcode-tip">顾客扫码即可向您付款</p>
                            <button
                              className="btn btn-outline"
                              style={{marginTop: '12px'}}
                              onClick={() => updateSetting('qrcodeGenerated', false)}
                            >
                              重新设置
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {showSettingsModal === 'sound' && (
                      <div className="sound-options">
                        <div
                          className={`sound-option ${settings.soundType === 'default' ? 'active' : ''}`}
                          onClick={() => { updateSetting('soundType', 'default'); speak('新订单来了'); }}
                        >
                          <span className="sound-icon">🔔</span>
                          <span>默认</span>
                        </div>
                        <div
                          className={`sound-option ${settings.soundType === 'gentle' ? 'active' : ''}`}
                          onClick={() => { updateSetting('soundType', 'gentle'); speak('新订单来了'); }}
                        >
                          <span className="sound-icon">🔉</span>
                          <span>温柔</span>
                        </div>
                        <div
                          className={`sound-option ${settings.soundType === 'strong' ? 'active' : ''}`}
                          onClick={() => { updateSetting('soundType', 'strong'); speak('新订单来了'); }}
                        >
                          <span className="sound-icon">🔊</span>
                          <span>响亮</span>
                        </div>
                      </div>
                    )}

                    {showSettingsModal === 'prefix' && (
                      <div className="form-group">
                        <label>取餐号前缀</label>
                        <div className="prefix-options">
                          {['A', 'B', 'C', '0', '1'].map(prefix => (
                            <div
                              key={prefix}
                              className={`prefix-option ${settings.orderPrefix === prefix ? 'active' : ''}`}
                              onClick={() => updateSetting('orderPrefix', prefix)}
                            >
                              {prefix}
                            </div>
                          ))}
                        </div>
                        <p className="form-tip">预览: {settings.orderPrefix}01</p>
                      </div>
                    )}

                    {showSettingsModal === 'callScreen' && (
                      <div className="call-screen-preview">
                        <div className="preview-title">叫号大屏</div>
                        <div className="preview-screen">
                          <div className="preview-label">请取餐</div>
                          <div className="preview-number">A05</div>
                        </div>
                        <button className="btn btn-primary btn-block" style={{marginTop: '16px'}}>
                          预览大屏
                        </button>
                      </div>
                    )}

                    {showSettingsModal === 'about' && (
                      <div className="about-section">
                        <div className="about-logo">🏪</div>
                        <h3>摆摊666</h3>
                        <p>版本 1.0.0</p>
                        <p className="about-desc">边做边卖、边接单、边收款、叫号不用喊</p>
                        <div className="about-links">
                          <a href="#">使用条款</a>
                          <a href="#">隐私政策</a>
                        </div>
                      </div>
                    )}
                  </div>

                  {showSettingsModal !== 'sound' && showSettingsModal !== 'callScreen' && showSettingsModal !== 'about' && (
                    <div className="modal-footer">
                      <button className="btn btn-outline" onClick={() => setShowSettingsModal(null)}>取消</button>
                      <button className="btn btn-primary" onClick={() => setShowSettingsModal(null)}>保存</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <nav className="bottom-nav">
        <div className={`nav-item ${currentView === 'orders' ? 'active' : ''}`} onClick={() => setCurrentView('orders')}>
          <span className="nav-icon">📋</span>
          <span className="nav-text">订单</span>
        </div>
        <div className={`nav-item ${currentView === 'products' ? 'active' : ''}`} onClick={() => setCurrentView('products')}>
          <span className="nav-icon">🍔</span>
          <span className="nav-text">商品</span>
        </div>
        <div className={`nav-item ${currentView === 'stats' ? 'active' : ''}`} onClick={() => setCurrentView('stats')}>
          <span className="nav-icon">📊</span>
          <span className="nav-text">统计</span>
        </div>
        <div className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => setCurrentView('settings')}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">设置</span>
        </div>
      </nav>
    </div>
  );
}

export default App;
