// 模拟数据

export const stallInfo = {
  name: '老王鸡蛋灌饼',
  notice: '今日特惠：加肠免费！',
  ownerName: '王师傅'
};

export const products = [
  {
    id: 1,
    name: '鸡蛋灌饼',
    price: 8,
    image: '🥚',
    category: '主食',
    specs: [
      { name: '大小', options: [
        { label: '小份', price: 0 },
        { label: '大份', price: 2 }
      ]},
      { name: '加料', options: [
        { label: '加肠', price: 2 },
        { label: '加烤肠', price: 3 },
        { label: '加辣条', price: 2 },
        { label: '加卫龙', price: 3 }
      ]},
      { name: '口味', options: [
        { label: '不要香菜', price: 0 },
        { label: '不要辣', price: 0 }
      ]}
    ],
    stock: 999,
    status: 'active'
  },
  {
    id: 2,
    name: '手抓饼',
    price: 10,
    image: '🌭',
    category: '主食',
    specs: [
      { name: '加料', options: [
        { label: '加肠', price: 2 },
        { label: '加烤肠', price: 3 },
        { label: '加鸡蛋', price: 2 },
        { label: '加辣条', price: 2 }
      ]}
    ],
    stock: 999,
    status: 'active'
  },
  {
    id: 3,
    name: '烤冷面',
    price: 8,
    image: '🍜',
    category: '主食',
    specs: [
      { name: '加料', options: [
        { label: '加肠', price: 2 },
        { label: '加卫龙', price: 3 },
        { label: '加烤肠', price: 3 }
      ]},
      { name: '口味', options: [
        { label: '加辣', price: 0 },
        { label: '加醋', price: 0 }
      ]}
    ],
    stock: 999,
    status: 'active'
  },
  {
    id: 4,
    name: '烤肠',
    price: 2,
    image: '🌭',
    category: '小吃',
    specs: [],
    stock: 50,
    status: 'active'
  },
  {
    id: 5,
    name: '冰豆浆',
    price: 3,
    image: '🥛',
    category: '饮品',
    specs: [],
    stock: 20,
    status: 'active'
  }
];

export const initialOrders = [
  {
    id: 'order_001',
    orderNumber: 'A05',
    items: [
      { productId: 1, name: '鸡蛋灌饼', price: 8, specs: '大份,加肠,不要香菜', quantity: 1 },
      { productId: 4, name: '烤肠', price: 2, specs: '', quantity: 1 }
    ],
    totalAmount: 12,
    status: 'pending',
    paymentStatus: 'paid',
    paymentMethod: 'wechat',
    remarks: '',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    customerId: 'customer_001'
  },
  {
    id: 'order_002',
    orderNumber: 'A04',
    items: [
      { productId: 2, name: '手抓饼', price: 10, specs: '加烤肠,加辣条', quantity: 1 }
    ],
    totalAmount: 15,
    status: 'cooking',
    paymentStatus: 'paid',
    paymentMethod: 'alipay',
    remarks: '打包',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    customerId: 'customer_002'
  },
  {
    id: 'order_003',
    orderNumber: 'A03',
    items: [
      { productId: 3, name: '烤冷面', price: 8, specs: '加肠,加辣', quantity: 2 }
    ],
    totalAmount: 20,
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'wechat',
    remarks: '',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    customerId: 'customer_003'
  }
];

// 订单状态映射
export const statusMap = {
  pending: { text: '待接单', className: 'status-pending' },
  cooking: { text: '制作中', className: 'status-cooking' },
  completed: { text: '已完成', className: 'status-completed' },
  taken: { text: '已取餐', className: 'status-taken' }
};

// 生成取餐号
let orderCounter = 5;
export const generateOrderNumber = () => {
  orderCounter++;
  return `A${orderCounter.toString().padStart(2, '0')}`;
};
