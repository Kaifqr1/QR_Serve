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

// Each demo card deliberately uses one distinct, named food or drink photograph.
// Source pages are public Wikimedia Commons image records, selected by dish name.
const menuImage = {
  butterChicken:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Butter_Chicken%2C_City_Grill_Kottayam.jpg/1280px-Butter_Chicken%2C_City_Grill_Kottayam.jpg",
  paneerTikka:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Panir_Tikka_Indian_cheese_grilled.jpg/1280px-Panir_Tikka_Indian_cheese_grilled.jpg",
  chickenBiryani:
    "https://upload.wikimedia.org/wikipedia/commons/b/b5/Chicken_biryani_02-06-2015_%28India%29.jpg",
  mangoLassi:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mango_Lassi_.jpg/1280px-Mango_Lassi_.jpg",
  paneerButterMasala:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Paneer_butter_masala_2.jpg/1280px-Paneer_butter_masala_2.jpg",
  dalMakhani:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Dal_Makhani_01.jpg/1280px-Dal_Makhani_01.jpg",
  chilliPaneer:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Paneer_Chilli%2C_Bengaluru_%282026%29_01.jpg/1280px-Paneer_Chilli%2C_Bengaluru_%282026%29_01.jpg",
  malaiPaneerTikka:
    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Malai_Paneer_Tikka%2C_PK_007.jpg",
  kashmiriChickenTikka:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Chicken_tikka_in_Araku_Valley%2C_Andhra_Pradesh_01.jpg/1280px-Chicken_tikka_in_Araku_Valley%2C_Andhra_Pradesh_01.jpg",
  chickenTikkaMasala:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Chicken_Tikka_Masala_on_White_Plate_with_Spoon.jpg/1280px-Chicken_Tikka_Masala_on_White_Plate_with_Spoon.jpg",
  tandooriChicken:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Tandoori_chicken_Indian.jpg/1280px-Tandoori_chicken_Indian.jpg",
  badamMilk:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Badam_milk.jpg/1280px-Badam_milk.jpg",
  roseMilk:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Rosemilk.jpg?width=1200",
  masalaChai:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Masala_Chai.jpg/1280px-Masala_Chai.jpg",
  rasmalaiMilkCake:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Rasamalai_Cake.jpg/1280px-Rasamalai_Cake.jpg",
  pistachioKulfi:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Kulfi_de_pistatxo.jpg/1280px-Kulfi_de_pistatxo.jpg",
  gulabJamun:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Two_Gulab_Jamun_in_a_plate_01.jpg/1280px-Two_Gulab_Jamun_in_a_plate_01.jpg",
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
          imageUrl: menuImage.paneerButterMasala,
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
          imageUrl: menuImage.chilliPaneer,
        },
        {
          id: 90104,
          categoryId: 901,
          name: "Malai paneer tikka",
          description: "Cashew cream, fenugreek and a gentle smoky char from the tandoor.",
          price: 420,
          imageUrl: menuImage.malaiPaneerTikka,
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
          imageUrl: menuImage.kashmiriChickenTikka,
        },
        {
          id: 90202,
          categoryId: 902,
          name: "Chicken tikka masala",
          description: "Tandoor chicken folded into a creamy tomato gravy with fresh mint.",
          price: 490,
          imageUrl: menuImage.chickenTikkaMasala,
        },
        {
          id: 90203,
          categoryId: 902,
          name: "Tandoori chicken",
          description: "Half chicken, roasted spices, charred lemon and coriander-mint chutney.",
          price: 540,
          imageUrl: menuImage.tandooriChicken,
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
          name: "Kesar badam milk",
          description: "Chilled almond milk, saffron and cardamom with a delicate nutty finish.",
          price: 180,
          imageUrl: menuImage.badamMilk,
        },
        {
          id: 90302,
          categoryId: 903,
          name: "Rose milk",
          description: "Chilled rose syrup and milk with a floral, creamy finish.",
          price: 210,
          imageUrl: menuImage.roseMilk,
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
          name: "Rasmalai milk cake",
          description: "Milk-soaked sponge, saffron cream, pistachio and rose petal.",
          price: 250,
          imageUrl: menuImage.rasmalaiMilkCake,
        },
        {
          id: 90402,
          categoryId: 904,
          name: "Pistachio kulfi",
          description: "Slow-set milk, almond praline and a pinch of sea salt.",
          price: 220,
          imageUrl: menuImage.pistachioKulfi,
        },
        {
          id: 90403,
          categoryId: 904,
          name: "Gulab jamun",
          description: "Warm milk dumplings in rose-cardamom syrup with pistachio.",
          price: 180,
          imageUrl: menuImage.gulabJamun,
        },
      ],
    },
  ],
};
