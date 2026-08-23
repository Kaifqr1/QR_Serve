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
  paneer: "/manus-storage/marigold-paneer_7a461916.jpg",
  curry: "/manus-storage/marigold-curry_d631db38.jpg",
  dessert: "/manus-storage/marigold-dessert_7903ac65.jpg",
} as const;

/**
 * A clearly labelled, browser-only menu intended for QRServe sales demos.
 * It is deliberately not persisted as a client restaurant or included in
 * owner analytics; visitors can still use the same private order-list flow.
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
      id: 901,
      name: "Small plates",
      description: "A bright beginning for the table.",
      items: [
        {
          id: 90101,
          categoryId: 901,
          name: "Crisp chilli paneer",
          description: "Sesame, scallion and a slow-building chilli glaze.",
          price: 320,
          imageUrl: menuImage.curry,
        },
        {
          id: 90102,
          categoryId: 901,
          name: "Curried cauliflower croquettes",
          description: "Golden crust, pea chutney and toasted cumin.",
          price: 290,
          imageUrl: menuImage.curry,
        },
      ],
    },
    {
      id: 902,
      name: "From the grill",
      description: "Charred slowly and brought straight to the table.",
      items: [
        {
          id: 90201,
          categoryId: 902,
          name: "Malai paneer tikka",
          description: "Cashew cream, fenugreek and smoked tomato relish.",
          price: 410,
          imageUrl: menuImage.paneer,
        },
        {
          id: 90202,
          categoryId: 902,
          name: "Charred chicken tikka",
          description: "Yoghurt marinade, kashmiri chilli and pickled onion.",
          price: 460,
          imageUrl: menuImage.paneer,
        },
      ],
    },
    {
      id: 903,
      name: "Mains",
      description: "Generous plates made for sharing.",
      items: [
        {
          id: 90301,
          categoryId: 903,
          name: "Butter chicken with kulcha",
          description: "Tandoor chicken, silky tomato makhani and warm bread.",
          price: 520,
          imageUrl: menuImage.curry,
        },
        {
          id: 90302,
          categoryId: 903,
          name: "Black dal makhani",
          description: "Overnight lentils, cultured butter and ginger.",
          price: 360,
          imageUrl: menuImage.curry,
        },
        {
          id: 90303,
          categoryId: 903,
          name: "Masala lemon rice",
          description: "Turmeric rice, curry leaf, peanuts and fresh lemon.",
          price: 250,
          imageUrl: menuImage.paneer,
        },
      ],
    },
    {
      id: 904,
      name: "Sweet finish",
      description: "A quiet, cardamom-scented ending.",
      items: [
        {
          id: 90401,
          categoryId: 904,
          name: "Saffron milk cake",
          description: "Tres leches sponge, pistachio and rose petal.",
          price: 250,
          imageUrl: menuImage.dessert,
        },
        {
          id: 90402,
          categoryId: 904,
          name: "Cardamom kulfi",
          description: "Slow-set milk, almond praline and a pinch of salt.",
          price: 220,
          imageUrl: menuImage.dessert,
        },
      ],
    },
  ],
};
