const { PRODUCTS_PER_CATEGORY } = require("./figma-menu-categories.cjs");

const PRODUCT_MODIFIERS = [
  "Classic",
  "Premium",
  "Spicy",
  "Deluxe",
  "House",
  "Chef's",
  "Traditional",
  "Special",
  "Family",
  "Gourmet",
];

const CATEGORY_PRODUCT_BASES = {
  "soups-hot-dishes": [
    "Chicken Soup",
    "Beef Broth",
    "Lentil Soup",
    "Tomato Soup",
    "Mushroom Cream Soup",
  ],
  salads: ["Caesar Salad", "Greek Salad", "Garden Salad", "Chicken Salad", "Tuna Salad"],
  shawarma: [
    "Chicken Shawarma",
    "Beef Shawarma",
    "Mixed Shawarma",
    "Falafel Shawarma",
    "Spicy Shawarma Wrap",
  ],
  pizza: [
    "Margherita Pizza",
    "Pepperoni Pizza",
    "Four Cheese Pizza",
    "Vegetable Pizza",
    "BBQ Chicken Pizza",
  ],
  lahmajoun: [
    "Classic Lahmajoun",
    "Spicy Lahmajoun",
    "Cheese Lahmajoun",
    "Herb Lahmajoun",
    "Mini Lahmajoun Set",
  ],
  khachapuri: [
    "Adjarian Khachapuri",
    "Imeruli Khachapuri",
    "Megruli Khachapuri",
    "Cheese Boat Khachapuri",
    "Egg Khachapuri",
  ],
  khorovats: [
    "Pork Khorovats",
    "Chicken Khorovats",
    "Lamb Khorovats",
    "Mixed Grill Skewer",
    "Vegetable Skewer",
  ],
  khinkali: [
    "Beef Khinkali",
    "Pork Khinkali",
    "Mixed Khinkali",
    "Herb Khinkali",
    "Khinkali Platter",
  ],
  "stuffed-potato": [
    "Cheese Stuffed Potato",
    "Bacon Stuffed Potato",
    "Mushroom Stuffed Potato",
    "Chicken Stuffed Potato",
    "Veggie Stuffed Potato",
  ],
  "burgers-sandwiches": [
    "Beef Burger",
    "Chicken Burger",
    "Club Sandwich",
    "Tuna Sandwich",
    "Veggie Burger",
  ],
  "cakes-pancakes": [
    "Chocolate Cake Slice",
    "Honey Cake Slice",
    "Classic Pancakes",
    "Berry Pancakes",
    "Crepe Roll",
  ],
  "combo-packages": [
    "Family Combo",
    "Lunch Combo",
    "Dinner Combo",
    "Kids Combo",
    "Party Combo Box",
  ],
  "lunch-boxes": [
    "Office Lunch Box",
    "Protein Lunch Box",
    "Veggie Lunch Box",
    "Chicken Lunch Box",
    "Balanced Lunch Box",
  ],
  "grill-smoked": [
    "Smoked Chicken Breast",
    "Grilled Sausage",
    "Smoked Ribs",
    "Grilled Wings",
    "Smoked Beef Slice",
  ],
  bread: ["White Loaf", "Whole Wheat Loaf", "Lavash Pack", "Baguette", "Burger Bun Pack"],
  pastry: ["Croissant", "Puff Pastry", "Cheese Borek", "Spinach Borek", "Sweet Roll"],
  "fried-eggs": [
    "Classic Omelet",
    "Cheese Omelet",
    "Vegetable Omelet",
    "Sunny Side Eggs",
    "Scrambled Eggs",
  ],
  "lenten-dishes": [
    "Lentil Stew",
    "Vegetable Pilaf",
    "Bean Stew",
    "Mushroom Pilaf",
    "Fasting Salad Plate",
  ],
  "asian-sushi": [
    "Salmon Roll",
    "California Roll",
    "Tuna Roll",
    "Vegetable Roll",
    "Mixed Sushi Set",
  ],
  pasta: [
    "Spaghetti Bolognese",
    "Penne Alfredo",
    "Carbonara Pasta",
    "Arrabiata Pasta",
    "Chicken Pasta",
  ],
  sauces: ["Garlic Sauce", "BBQ Sauce", "Ketchup Cup", "Mayonnaise Cup", "Spicy Sauce"],
  restaurant: [
    "Chef's Daily Special",
    "Seasonal Plate",
    "Signature Main Course",
    "Tasting Plate",
    "House Platter",
  ],
  "bar-alcohol": [
    "Local Beer",
    "Red Wine Glass",
    "White Wine Glass",
    "Whiskey Shot",
    "Cocktail Classic",
  ],
  "juices-drinks": [
    "Orange Juice",
    "Apple Juice",
    "Mineral Water",
    "Sparkling Water",
    "Iced Tea",
  ],
  "semi-finished": [
    "Frozen Dumplings Pack",
    "Frozen Pelmeni Pack",
    "Frozen Cutlets Pack",
    "Frozen Pizza Base",
    "Frozen Khinkali Pack",
  ],
  mexican: ["Beef Taco", "Chicken Taco", "Burrito Bowl", "Quesadilla", "Nachos Plate"],
};

function buildProductsForCategory(categorySlug, categoryTitleEn) {
  const bases = CATEGORY_PRODUCT_BASES[categorySlug] || [categoryTitleEn];
  const products = [];
  let index = 0;

  while (products.length < PRODUCTS_PER_CATEGORY) {
    const base = bases[index % bases.length];
    const modifier = PRODUCT_MODIFIERS[Math.floor(index / bases.length) % PRODUCT_MODIFIERS.length];
    const title = `${modifier} ${base}`;
    products.push(title);
    index += 1;
  }

  return products.slice(0, PRODUCTS_PER_CATEGORY);
}

module.exports = {
  buildProductsForCategory,
};
