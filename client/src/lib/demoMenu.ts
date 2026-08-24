export type PublicMenuItem = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

export type PublicMenuCategory = {
  id: number;
  name: string;
  description: string | null;
  items: PublicMenuItem[];
};

export type PublicMenuData = {
  restaurant: {
    name: string;
    slug: string;
    location: string;
    description: string | null;
    logoUrl: string | null;
  };
  categories: PublicMenuCategory[];
};

const menuImage = {
  butterChicken:
    "https://images.unsplash.com/photo-1742599361498-79824d24e355?auto=format&fit=crop&w=1200&q=85",
  paneerTikka:
    "https://images.unsplash.com/photo-1781332143834-19a40f746cd9?auto=format&fit=crop&w=1200&q=85",
  chickenTikka:
    "https://images.unsplash.com/photo-1772730064951-89b427965dbc?auto=format&fit=crop&w=1200&q=85",
  chickenBiryani:
    "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=1200&q=85",
  dalMakhani:
    "https://images.unsplash.com/photo-1697155406121-85aac6236000?auto=format&fit=crop&w=1200&q=85",
  mangoLassi:
    "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=85",
  masalaChai:
    "https://images.unsplash.com/photo-1561336526-2914f13ceb36?auto=format&fit=crop&w=1200&q=85",
  roseCooler:
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=85",
  dessert:
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=85",
} as const;

/**
 * A clearly labelled, browser-only restaurant menu intended for QRServe sales
 * demos. It is deliberately not persisted as a client restaurant or included
 * in owner analytics; visitors can still use the same private order-list flow.
 */
export const demoMenuData: PublicMenuData = {
  restaurant: {
    name: "The Marigold Table",
    slug: "marigold-table-demo",
    location: "Bandra West · Mumbai",
    description: "Modern Indian kitchen · QRServe showcase menu",
    logoUrl: null,
  },
  categories: [
    {
      id: 900,
      name: "House favourites",
      description: "The dishes our regulars come back for.",
      items: [
        {
          id: 90001,
          categoryId: 900,
          name: "Butter chicken",
          description: "Charred chicken in a silky tomato makhani, finished with butter and kasuri methi.",
          price: 520,
          imageUrl: menuImage.butterChicken,
        },
        {
          id: 90002,
          categoryId: 900,
          name: "Tandoori paneer tikka",
          description: "Cottage cheese, peppers and onion with smoky tandoor char and mint chutney.",
          price: 410,
          imageUrl: menuImage.paneerTikka,
        },
        {
          id: 90003,
          categoryId: 900,
          name: "Chicken dum biryani",
          description: "Fragrant basmati, slow-cooked chicken, saffron and crisp fried onion.",
          price: 480,
          imageUrl: menuImage.chickenBiryani,
        },
        {
          id: 90004,
          categoryId: 900,
          name: "Mango lassi",
          description: "Chilled Alphonso mango, yoghurt and a whisper of cardamom.",
          price: 190,
          imageUrl: menuImage.mangoLassi,
        },
      ],
    },
    {
      id: 901,
      name: "Vegetarian classics",
      description: "Comforting Indian favourites made for the centre of the table.",
      items: [
        {
          id: 90101,
          categoryId: 901,
          name: "Paneer butter masala",
          description: "Soft paneer in a rich tomato-cashew gravy with fresh coriander.",
          price: 390,
          imageUrl: menuImage.paneerTikka,
        },
        {
          id: 90102,
          categoryId: 901,
          name: "Black dal makhani",
          description: "Overnight lentils, cultured butter, cream and a slow ginger finish.",
          price: 360,
          imageUrl: menuImage.dalMakhani,
        },
        {
          id: 90103,
          categoryId: 901,
          name: "Chilli paneer",
          description: "Crisp paneer tossed with peppers, scallion and a glossy chilli-soy glaze.",
          price: 340,
          imageUrl: menuImage.paneerTikka,
        },
        {
          id: 90104,
          categoryId: 901,
          name: "Malai paneer tikka",
          description: "Cashew cream, fenugreek and a gentle smoky char from the tandoor.",
          price: 420,
          imageUrl: menuImage.paneerTikka,
        },
      ],
    },
    {
      id: 902,
      name: "Tandoor & chicken",
      description: "Marinated, charred and served hot from the grill.",
      items: [
        {
          id: 90201,
          categoryId: 902,
          name: "Kashmiri chicken tikka",
          description: "Yoghurt-marinated chicken with kashmiri chilli, lemon and pickled onion.",
          price: 460,
          imageUrl: menuImage.chickenTikka,
        },
        {
          id: 90202,
          categoryId: 902,
          name: "Chicken tikka masala",
          description: "Tandoor chicken folded into a creamy tomato gravy with fresh mint.",
          price: 490,
          imageUrl: menuImage.chickenTikka,
        },
        {
          id: 90203,
          categoryId: 902,
          name: "Tandoori chicken",
          description: "Half chicken, roasted spices, charred lemon and coriander-mint chutney.",
          price: 540,
          imageUrl: menuImage.chickenTikka,
        },
      ],
    },
    {
      id: 903,
      name: "Coolers & chai",
      description: "Bright drinks for a Mumbai afternoon or a long dinner.",
      items: [
        {
          id: 90301,
          categoryId: 903,
          name: "Mango lassi",
          description: "Thick yoghurt, ripe mango and cardamom, served ice cold.",
          price: 190,
          imageUrl: menuImage.mangoLassi,
        },
        {
          id: 90302,
          categoryId: 903,
          name: "Rose lime cooler",
          description: "Rose syrup, lime, soda and crushed ice with a floral lift.",
          price: 210,
          imageUrl: menuImage.roseCooler,
        },
        {
          id: 90303,
          categoryId: 903,
          name: "Masala chai",
          description: "Slow-brewed tea with ginger, cardamom, clove and steamed milk.",
          price: 120,
          imageUrl: menuImage.masalaChai,
        },
      ],
    },
    {
      id: 904,
      name: "Sweet finish",
      description: "A small, cardamom-scented ending for the table.",
      items: [
        {
          id: 90401,
          categoryId: 904,
          name: "Saffron milk cake",
          description: "Tres leches sponge, saffron cream, pistachio and rose petal.",
          price: 250,
          imageUrl: menuImage.dessert,
        },
        {
          id: 90402,
          categoryId: 904,
          name: "Cardamom kulfi",
          description: "Slow-set milk, almond praline and a pinch of sea salt.",
          price: 220,
          imageUrl: menuImage.dessert,
        },
        {
          id: 90403,
          categoryId: 904,
          name: "Gulab jamun",
          description: "Warm milk dumplings in rose-cardamom syrup with pistachio.",
          price: 180,
          imageUrl: menuImage.dessert,
        },
      ],
    },
  ],
};
