export const INGREDIENT_GROUPS = [
  {
    group: 'Roast',
    items: [
      { id: 'roast', name: 'Rib roast, bone-in or boneless', amount: '4 pounds' },
      { id: 'salt', name: 'Kosher salt', amount: '4 teaspoons' },
      { id: 'pepper', name: 'Black pepper, coarsely ground', amount: '2 teaspoons' },
      { id: 'oil-butter', name: 'Olive oil or softened butter', amount: '1 tablespoon' },
      { id: 'garlic', name: 'Garlic, minced (optional)', amount: '3 cloves' },
      { id: 'herbs', name: 'Fresh rosemary or thyme, chopped (optional)', amount: '1 tablespoon' },
      { id: 'grapeseed', name: 'Grapeseed oil, for the skillet', amount: '1 to 2 teaspoons' },
    ],
  },
  {
    group: 'Gravy',
    items: [
      { id: 'drippings', name: 'Pan drippings (the fat and juices left in the roasting pan)', amount: 'From the roast' },
      { id: 'gravy-butter', name: 'Butter', amount: 'Up to 2 tablespoons' },
      { id: 'flour', name: 'All-purpose flour', amount: '2 tablespoons' },
      { id: 'stock', name: 'Low-sodium beef stock', amount: '2 1/2 cups (extra for thinning at altitude and deglazing)' },
      { id: 'wine', name: 'Dry red wine (optional)', amount: '1/4 cup' },
      { id: 'worcestershire', name: 'Worcestershire sauce', amount: 'A dash' },
      { id: 'salt-pepper', name: 'Salt and black pepper', amount: 'To taste' },
    ],
  },
  {
    group: 'Equipment',
    items: [
      { id: 'rack-pan', name: 'Rack and sheet pan or roasting pan', amount: '' },
      { id: 'probe', name: 'Leave-in probe thermometer', amount: '' },
      { id: 'instant-read', name: 'Instant-read thermometer', amount: '' },
      { id: 'skillet', name: '12 inch cast iron skillet', amount: '' },
      { id: 'saucepan', name: 'Saucepan and whisk', amount: '' },
      { id: 'foil-mitts', name: 'Foil, oven mitts, and a towel for the skillet handle', amount: '' },
      { id: 'board-knife', name: 'Carving board and knife', amount: '' },
    ],
  },
];

export const ALL_INGREDIENT_IDS = INGREDIENT_GROUPS.flatMap((g) => g.items.map((i) => i.id));
