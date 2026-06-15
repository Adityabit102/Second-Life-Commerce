const KEYWORD_IMAGES = [
  // ── Electronics ──────────────────────────────────────────────────────────
  {
    keys: ['wh-1000', 'wh1000', 'sony wh', 'sony headphone', 'headphone', 'over-ear'],
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['airdopes', 'tws', 'boat air', 'wireless ear', 'airpods', 'earbud', 'earphone', 'in-ear'],
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['samsung galaxy', 'galaxy s', 'galaxy a', 'galaxy m', 'iphone', 'redmi', 'oneplus', 'realme phone', 'smartphone', 'mobile phone'],
    url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['mx master', 'logitech mouse', 'gaming mouse', 'wireless mouse', 'optical mouse'],
    url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['smart tv', '4k tv', 'qled', 'oled tv', 'led tv', 'television', 'realme tv', 'samsung tv', 'lg tv'],
    url: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['laptop', 'macbook', 'notebook', 'pavilion', 'inspiron', 'thinkpad', 'chromebook', 'vivobook'],
    url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['jbl', 'speaker', 'bluetooth speaker', 'bose', 'marshall', 'soundbar', 'portable speaker'],
    url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['eos', 'mirrorless', 'dslr', 'canon', 'nikon', 'sony camera', 'fujifilm', 'camera body', 'lens'],
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['smart band', 'smartband', 'xiaomi band', 'mi band', 'fitbit', 'garmin', 'fossil watch', 'smartwatch', 'watch'],
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['usb hub', 'syska usb', 'usb 3.0', 'usb-c hub', 'dongle', 'adapter hub'],
    url: 'https://images.unsplash.com/photo-1588702547919-44ad6b9b1460?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['router', 'tp-link', 'wifi 6', 'archer', 'netgear', 'asus router', 'networking', 'modem'],
    url: 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['ipad', 'tablet', 'kindle fire', 'galaxy tab', 'lenovo tab', 'realme pad'],
    url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&auto=format&fit=crop&q=80',
  },

  // ── Apparel & Footwear ────────────────────────────────────────────────────
  {
    keys: ['air force', 'nike', 'adidas shoe', 'sneaker', 'puma shoe', 'reebok', 'new balance', 'converse', 'vans', 'footwear', 'boot'],
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ["levi's", 'levis', 'jeans', 'denim', 'slim fit jeans', 'skinny jeans', 'trousers', 'pants'],
    url: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['hoodie', 'sweatshirt', 'fleece', 'adidas essentials', 'pullover', 'sweater'],
    url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['t-shirt', 'tshirt', 'puma shirt', 'polo', 'tee', 'top', 'crew neck'],
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['formal shirt', 'allen solly', 'arrow shirt', 'van heusen', 'peter england', 'dress shirt', 'office shirt'],
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&auto=format&fit=crop&q=80',
  },

  // ── Home & Kitchen ────────────────────────────────────────────────────────
  {
    keys: ['pressure cooker', 'prestige cooker', 'hawkins', 'cooker'],
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['air fryer', 'philips air', 'airfryer', 'air-fryer'],
    url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['vacuum', 'eureka forbes', 'dyson', 'hoover', 'vacuum cleaner'],
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['study lamp', 'desk lamp', 'wipro lamp', 'table lamp', 'led lamp', 'reading lamp'],
    url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['mixer grinder', 'havells', 'mixer', 'grinder', 'blender', 'juicer mixer'],
    url: 'https://images.unsplash.com/photo-1556911261-6bd341186b2f?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['water bottle', 'cello bottle', 'milton bottle', 'sipper', 'tumbler', 'flask'],
    url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&auto=format&fit=crop&q=80',
  },

  // ── Books & Stationery (each type gets its own image) ────────────────────
  {
    keys: ['atomic habits', 'james clear', 'habit book', 'self-help', 'productivity book'],
    url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['rich dad', 'kiyosaki', 'finance book', 'money book', 'investing book'],
    url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['ncert', 'physics', 'chemistry', 'biology textbook', 'class 12', 'class 11', 'class 10', 'cbse textbook', 'academic book'],
    url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['novel', 'fiction', 'paperback', 'hardcover', 'kindle', 'book'],
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&auto=format&fit=crop&q=80',
  },

  // ── Sports & Fitness ──────────────────────────────────────────────────────
  {
    keys: ['swimming goggle', 'swim goggle', 'nabaiji', 'pool goggle', 'diving mask'],
    url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['football', 'soccer', 'nivia', 'cricket ball', 'basketball', 'rugby ball'],
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['badminton', 'racket', 'cosco', 'yonex', 'squash racket', 'tennis racket'],
    url: 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['gym gloves', 'workout gloves', 'boldfit', 'training gloves', 'lifting gloves', 'gym', 'dumbbell', 'barbell'],
    url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&auto=format&fit=crop&q=80',
  },
  {
    keys: ['yoga mat', 'exercise mat', 'foam roller', 'resistance band', 'jump rope', 'skipping rope'],
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&auto=format&fit=crop&q=80',
  },
]

export function getProductImage(productName) {
  if (!productName) return null
  const lower = productName.toLowerCase()
  for (const { keys, url } of KEYWORD_IMAGES) {
    if (keys.some(k => lower.includes(k))) return url
  }
  return null
}

export function getProductCategory(productName) {
  if (!productName) return 'Other'
  const lower = productName.toLowerCase()
  const electronics = ['headphone', 'earbud', 'earphone', 'phone', 'mobile', 'laptop', 'tablet', 'ipad',
    'camera', 'speaker', 'watch', 'band', 'tv', 'television', 'mouse', 'router', 'wifi', 'usb', 'hub',
    'airpods', 'galaxy', 'iphone', 'macbook', 'kindle']
  const apparel = ['shirt', 'tshirt', 't-shirt', 'jeans', 'denim', 'hoodie', 'shoe', 'sneaker',
    'boot', 'footwear', 'top', 'pant', 'trouser', 'sweatshirt', 'jacket', 'sweater', 'tee']
  const home = ['cooker', 'fryer', 'vacuum', 'lamp', 'mixer', 'grinder', 'bottle', 'blender',
    'juicer', 'microwave', 'kettle', 'iron', 'fan', 'heater', 'cookware', 'pan', 'pot']
  const books = ['book', 'novel', 'ncert', 'textbook', 'paperback', 'hardcover', 'habits', 'dad']
  const sports = ['football', 'badminton', 'racket', 'goggle', 'gym', 'gloves', 'cricket', 'basketball',
    'yoga', 'dumbbell', 'barbell', 'mat', 'rope', 'soccer', 'swim']

  if (electronics.some(k => lower.includes(k))) return 'Electronics'
  if (apparel.some(k => lower.includes(k))) return 'Apparel'
  if (home.some(k => lower.includes(k))) return 'Home'
  if (books.some(k => lower.includes(k))) return 'Books'
  if (sports.some(k => lower.includes(k))) return 'Sports'
  return 'Other'
}
