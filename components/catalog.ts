import type { CatalogItem } from "@/components/types";

export const ARCHIVE_RETENTION_MONTHS = 6;

export const BASE_CATALOG: CatalogItem[] = [
  {
    id: "potato",
    name: "Potato",
    smallImage:
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=200&q=80",
    description: "Fresh potatoes for daily cooking.",
    quantityType: "kg",
  },
  {
    id: "tomato",
    name: "Tomato",
    smallImage:
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=200&q=80",
    description: "Ripe tomatoes for salads and curries.",
    quantityType: "kg",
  },
  {
    id: "mango",
    name: "Mango",
    smallImage:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=200&q=80",
    description: "Seasonal fruit, perfect for snacks.",
    quantityType: "number",
  },
  {
    id: "onion",
    name: "Onion",
    smallImage:
      "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=200&q=80",
    description: "Aromatic onions for everyday cooking.",
    quantityType: "kg",
  },
  {
    id: "rice",
    name: "Rice",
    smallImage:
      "https://images.unsplash.com/photo-1586201375761-83865001e31a?auto=format&fit=crop&w=200&q=80",
    description: "Staple grains for the whole household.",
    quantityType: "kg",
  },
  {
    id: "milk",
    name: "Milk",
    smallImage:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80",
    description: "Daily dairy essentials.",
    quantityType: "number",
  },
  {
    id: "banana",
    name: "Banana",
    smallImage:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=200&q=80",
    description: "Fresh bananas for breakfast and smoothies.",
    quantityType: "number",
  },
  {
    id: "cabbage",
    name: "Cabbage",
    smallImage:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=200&q=80",
    description: "Green cabbage, ideal for healthy meals.",
    quantityType: "kg",
  },
];
