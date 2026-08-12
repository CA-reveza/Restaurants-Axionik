// Initial sample data for TRUFFLES POS & Admin System

export const INITIAL_BRANCHES = [
  "Truffles • Koramangala",
  "Truffles • Indiranagar",
  "Truffles • MG Road",
  "Truffles • New BEL Road"
];

export const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "Burgers", icon: "Utensils", sortOrder: 1 },
  { id: "cat-2", name: "Starters", icon: "Flame", sortOrder: 2 },
  { id: "cat-3", name: "Pizza", icon: "Pizza", sortOrder: 3 },
  { id: "cat-4", name: "Pasta", icon: "Utensils", sortOrder: 4 },
  { id: "cat-5", name: "Mains", icon: "Flame", sortOrder: 5 },
  { id: "cat-6", name: "Desserts", icon: "Coffee", sortOrder: 6 },
  { id: "cat-7", name: "Beverages", icon: "Coffee", sortOrder: 7 }
];

export const INITIAL_MENU_ITEMS = [
  {
    id: "b1",
    categoryId: "cat-1",
    name: "Classic Truffles Burger",
    description: "Juicy grilled patty layered with cheese, crisp lettuce, onions, tomato and signature house sauce.",
    price: 295,
    isVeg: false,
    isAvailable: true,
    prepTime: 15,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { id: "c1", name: "Extra Cheese", price: 40 },
      { id: "c2", name: "Extra Patty", price: 90 }
    ]
  },
  {
    id: "b2",
    categoryId: "cat-1",
    name: "Peri Peri Chicken Burger",
    description: "Spicy flame-grilled chicken breast tossed in fiery peri peri glaze, garlic aioli, and cheddar.",
    price: 345,
    isVeg: false,
    isAvailable: true,
    prepTime: 18,
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { id: "c3", name: "Extra Signature Sauce", price: 20 }
    ]
  },
  {
    id: "b3",
    categoryId: "cat-1",
    name: "Paneer Tikka Burger",
    description: "Tandoori spiced grilled paneer slab with mint chutney, crisp veggies and spiced mayo.",
    price: 285,
    isVeg: true,
    isAvailable: true,
    prepTime: 15,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "b4",
    categoryId: "cat-1",
    name: "All-American Lamb Burger",
    description: "Double seasoned lamb patty with caramelised onions, smoked bacon, aged cheddar and BBQ glaze.",
    price: 420,
    isVeg: false,
    isAvailable: true,
    prepTime: 20,
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "s1",
    categoryId: "cat-2",
    name: "Loaded Cheese Fries",
    description: "Crispy skin-on fries drowned in warm cheddar sauce, jalapeños, scallions and sour cream.",
    price: 225,
    isVeg: true,
    isAvailable: true,
    prepTime: 12,
    image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { id: "c4", name: "Melted Cheese Dip", price: 50 }
    ]
  },
  {
    id: "s2",
    categoryId: "cat-2",
    name: "Fiery Chicken Wings",
    description: "Jumbo wings glazed in hot Buffalo chilli sauce, served with cool ranch dip.",
    price: 320,
    isVeg: false,
    isAvailable: true,
    prepTime: 15,
    image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "s3",
    categoryId: "cat-2",
    name: "Crispy Garlic Mushroom Bites",
    description: "Herb-crusted fresh button mushrooms flash-fried, served with roasted garlic aioli dip.",
    price: 245,
    isVeg: true,
    isAvailable: true,
    prepTime: 12,
    image: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "p1",
    categoryId: "cat-3",
    name: "Truffles Special Meat Overload Pizza",
    description: "Loaded with pepperoni, grilled chicken, spicy lamb sausage, mozzarella and herb tomato base.",
    price: 495,
    isVeg: false,
    isAvailable: true,
    prepTime: 20,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "p2",
    categoryId: "cat-3",
    name: "Classic Margherita Supreme",
    description: "San Marzano plum tomato sauce, fresh buffalo mozzarella, fragrant basil leaves and olive oil drizzle.",
    price: 385,
    isVeg: true,
    isAvailable: true,
    prepTime: 15,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "pa1",
    categoryId: "cat-4",
    name: "Creamy Alfredo Penne",
    description: "Rich parmesan cream sauce, roasted garlic, sautéed mushrooms and herbs.",
    price: 365,
    isVeg: true,
    isAvailable: true,
    prepTime: 18,
    image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "pa2",
    categoryId: "cat-4",
    name: "Spicy Arrabbiata Spaghetti",
    description: "Spaghetti tossed in fiery crushed tomato & garlic marinara sauce with fresh basil.",
    price: 345,
    isVeg: true,
    isAvailable: true,
    prepTime: 15,
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "m1",
    categoryId: "cat-5",
    name: "Sizzling Chicken Steak",
    description: "Grilled chicken breast topped with rich brown pepper sauce, mash, sautéed veggies and garlic butter.",
    price: 460,
    isVeg: false,
    isAvailable: true,
    prepTime: 20,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "m2",
    categoryId: "cat-5",
    name: "Cottage Cheese Sizzler",
    description: "Marinated cottage cheese steaks served over herb rice, french fries, and rich mushroom gravy.",
    price: 410,
    isVeg: true,
    isAvailable: true,
    prepTime: 18,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "d1",
    categoryId: "cat-6",
    name: "Chocolate Brownie Sundae",
    description: "Warm fudge brownie topped with rich vanilla ice cream, hot chocolate fudge sauce and toasted nuts.",
    price: 195,
    isVeg: true,
    isAvailable: true,
    prepTime: 10,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "d2",
    categoryId: "cat-6",
    name: "Signature Truffles Mud Pie",
    description: "Decadent dark chocolate ganache pie with oreo crust, salted caramel drizzled atop whipped cream.",
    price: 240,
    isVeg: true,
    isAvailable: true,
    prepTime: 10,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "bev1",
    categoryId: "cat-7",
    name: "Ferrero Rocher Thick Shake",
    description: "Thick hazelnut chocolate shake blended with crunchy Ferrero Rocher pralines.",
    price: 220,
    isVeg: true,
    isAvailable: true,
    prepTime: 5,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "bev2",
    categoryId: "cat-7",
    name: "Fresh Mint Lime Cooler",
    description: "Refreshing sparkling cooler with freshly muddled mint leaves, lime juice and sea salt.",
    price: 135,
    isVeg: true,
    isAvailable: true,
    prepTime: 5,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "bev3",
    categoryId: "cat-7",
    name: "Iced Caramel Macchiato",
    description: "Espresso poured over chilled milk, ice and rich buttery caramel drizzle.",
    price: 180,
    isVeg: true,
    isAvailable: true,
    prepTime: 5,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80",
    customizations: []
  }
];

// All tables start vacant — customer check-ins from Captive Portal drive status
export const INITIAL_TABLES = [
  { id: "T1",  number: 1,  status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T2",  number: 2,  status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T3",  number: 3,  status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T4",  number: 4,  status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T5",  number: 5,  status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T6",  number: 6,  status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T7",  number: 7,  status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T8",  number: 8,  status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T9",  number: 9,  status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T10", number: 10, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T11", number: 11, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T12", number: 12, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T13", number: 13, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T14", number: 14, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T15", number: 15, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T16", number: 16, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T17", number: 17, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T18", number: 18, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T19", number: 19, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null },
  { id: "T20", number: 20, status: "vacant", guests: 0, seatedTime: null, orderId: null, activeOrderTotal: 0, customerName: null, customerPhone: null }
];


// Active orders start empty — real orders come from Captive Portal via localStorage sync
export const INITIAL_ACTIVE_ORDERS = [];


// Historical Transactions for Analytics
export const INITIAL_PAID_TRANSACTIONS = [
  { id: "TX-901", orderId: "ORD-090", tableId: "T2", amount: 2400, paidAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), paymentMethod: "UPI", itemsCount: 4 },
  { id: "TX-902", orderId: "ORD-091", tableId: "T4", amount: 1850, paidAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), paymentMethod: "Card", itemsCount: 3 },
  { id: "TX-903", orderId: "ORD-092", tableId: "T7", amount: 3200, paidAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), paymentMethod: "Cash", itemsCount: 5 }
];
