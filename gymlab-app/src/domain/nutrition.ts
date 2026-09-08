// Nutrición: seed de alimentos crudos (por 100g salvo baseGrams) y funciones de cálculo.
import type { FoodItem, MealEntry, MealFoodEntry, MealType } from './types'
import { calculateCalories } from './stepsTracker'

// Seed de alimentos crudos (valores por 100g salvo que se indique en baseGrams).
export const FOOD_SEED: Omit<FoodItem, 'id'>[] = [
  // ── Proteínas / Carnes crudas ──
  { foodKey: 'chickenBreast', name: 'Pechuga de pollo', kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, category: 'proteina', raw: true },
  { foodKey: 'turkeyBreast', name: 'Pechuga de pavo', kcal: 135, proteinG: 30, carbsG: 0, fatG: 1, category: 'proteina', raw: true },
  { foodKey: 'chickenThighSkinless', name: 'Muslo de pollo (sin piel)', kcal: 209, proteinG: 26, carbsG: 0, fatG: 10.9, category: 'proteina', raw: true },
  { foodKey: 'chickenThighSkinOn', name: 'Muslo de pollo (con piel)', kcal: 234, proteinG: 26, carbsG: 0, fatG: 13.2, category: 'proteina', raw: true },
  { foodKey: 'chickenWing', name: 'Alita de pollo', kcal: 239, proteinG: 18.7, carbsG: 0, fatG: 17.3, category: 'proteina', raw: true },
  { foodKey: 'wholeEgg', name: 'Huevo entero', kcal: 155, proteinG: 13, carbsG: 1.1, fatG: 11, category: 'proteina', raw: true },
  { foodKey: 'eggWhite', name: 'Clara de huevo', kcal: 52, proteinG: 11, carbsG: 0.7, fatG: 0.2, category: 'proteina', raw: true },
  { foodKey: 'freshSalmon', name: 'Salmón fresco', kcal: 208, proteinG: 20, carbsG: 0, fatG: 13, category: 'proteina', raw: true },
  { foodKey: 'smokedSalmon', name: 'Salmón ahumado', kcal: 117, proteinG: 18, carbsG: 0, fatG: 4.3, category: 'proteina', raw: true },
  { foodKey: 'freshTuna', name: 'Atún fresco', kcal: 132, proteinG: 28, carbsG: 0, fatG: 1.3, category: 'proteina', raw: true },
  { foodKey: 'cannedTunaWater', name: 'Atún enlatado (agua)', kcal: 116, proteinG: 26, carbsG: 0, fatG: 0.8, category: 'proteina', raw: true },
  { foodKey: 'cannedTunaOil', name: 'Atún enlatado (aceite)', kcal: 198, proteinG: 29, carbsG: 0, fatG: 8.1, category: 'proteina', raw: true },
  { foodKey: 'leanGroundBeef', name: 'Carne molida magra (90/10)', kcal: 176, proteinG: 20, carbsG: 0, fatG: 10, category: 'proteina', raw: true },
  { foodKey: 'groundBeef', name: 'Carne molida regular (80/20)', kcal: 254, proteinG: 17, carbsG: 0, fatG: 20, category: 'proteina', raw: true },
  { foodKey: 'porkLoin', name: 'Lomo de cerdo', kcal: 143, proteinG: 26, carbsG: 0, fatG: 3.5, category: 'proteina', raw: true },
  { foodKey: 'porkRibs', name: 'Costillas de cerdo', kcal: 277, proteinG: 18, carbsG: 0, fatG: 22, category: 'proteina', raw: true },
  { foodKey: 'leanVeal', name: 'Ternera magra', kcal: 142, proteinG: 26, carbsG: 0, fatG: 3.7, category: 'proteina', raw: true },
  { foodKey: 'groundVeal', name: 'Ternera molida', kcal: 250, proteinG: 26, carbsG: 0, fatG: 15, category: 'proteina', raw: true },
  { foodKey: 'vealChop', name: 'Chuleta de ternera', kcal: 220, proteinG: 24, carbsG: 0, fatG: 13, category: 'proteina', raw: true },
  { foodKey: 'beefSirloin', name: 'Bistec de res (sirloin)', kcal: 207, proteinG: 26, carbsG: 0, fatG: 11, category: 'proteina', raw: true },
  { foodKey: 'beefChuck', name: 'Aguja de res', kcal: 195, proteinG: 21, carbsG: 0, fatG: 12, category: 'proteina', raw: true },
  { foodKey: 'tenderloinTip', name: 'Punta de solomillo', kcal: 133, proteinG: 21, carbsG: 0, fatG: 5, category: 'proteina', raw: true },
  { foodKey: 'beefLiver', name: 'Hígado de res', kcal: 175, proteinG: 20, carbsG: 3.8, fatG: 4.2, category: 'proteina', raw: true },
  { foodKey: 'firmTofu', name: 'Tofu firme', kcal: 144, proteinG: 15, carbsG: 3.5, fatG: 8, category: 'proteina', raw: true },
  { foodKey: 'silkenTofu', name: 'Tofu suave', kcal: 76, proteinG: 8, carbsG: 1.9, fatG: 4.8, category: 'proteina', raw: true },
  { foodKey: 'tempeh', name: 'Tempeh', kcal: 192, proteinG: 20, carbsG: 7.6, fatG: 11, category: 'proteina', raw: true },
  { foodKey: 'edamame', name: 'Edamame', kcal: 121, proteinG: 12, carbsG: 9, fatG: 5, category: 'proteina', raw: true },
  { foodKey: 'dryLentils', name: 'Lentejas secas', kcal: 353, proteinG: 25, carbsG: 60, fatG: 1.1, category: 'proteina', raw: true },
  { foodKey: 'dryChickpeas', name: 'Garbanzos secos', kcal: 364, proteinG: 19, carbsG: 61, fatG: 6, category: 'proteina', raw: true },
  { foodKey: 'dryBlackBeans', name: 'Frijoles negros secos', kcal: 341, proteinG: 21, carbsG: 62, fatG: 1.4, category: 'proteina', raw: true },
  { foodKey: 'dryRedBeans', name: 'Frijoles rojos secos', kcal: 333, proteinG: 22, carbsG: 60, fatG: 1.3, category: 'proteina', raw: true },

  // ── Carnes procesadas ──
  { foodKey: 'serranoHam', name: 'Jamón serrano', kcal: 145, proteinG: 28, carbsG: 0, fatG: 3.3, category: 'proteina', raw: true },
  { foodKey: 'slicedTurkey', name: 'Pavo en lonchas', kcal: 104, proteinG: 18, carbsG: 2, fatG: 1.7, category: 'proteina', raw: true },
  { foodKey: 'chorizo', name: 'Chorizo', kcal: 455, proteinG: 24, carbsG: 1.5, fatG: 38, category: 'proteina', raw: true },
  { foodKey: 'longaniza', name: 'Longaniza', kcal: 344, proteinG: 14, carbsG: 2, fatG: 31, category: 'proteina', raw: true },
  { foodKey: 'salchichon', name: 'Salchichón', kcal: 304, proteinG: 12, carbsG: 3, fatG: 27, category: 'proteina', raw: true },
  { foodKey: 'bacon', name: 'Tocino / Bacon', kcal: 541, proteinG: 37, carbsG: 1.4, fatG: 42, category: 'proteina', raw: true },

  // ── Pescados y mariscos ──
  { foodKey: 'hake', name: 'Merluza', kcal: 85, proteinG: 18, carbsG: 0, fatG: 1.3, category: 'proteina', raw: true },
  { foodKey: 'cod', name: 'Bacalao', kcal: 82, proteinG: 18, carbsG: 0, fatG: 0.7, category: 'proteina', raw: true },
  { foodKey: 'seaBream', name: 'Dorada', kcal: 100, proteinG: 19, carbsG: 0, fatG: 2.2, category: 'proteina', raw: true },
  { foodKey: 'seaBass', name: 'Lubina', kcal: 124, proteinG: 22, carbsG: 0, fatG: 3.8, category: 'proteina', raw: true },
  { foodKey: 'freshSardines', name: 'Sardinas frescas', kcal: 208, proteinG: 25, carbsG: 0, fatG: 11, category: 'proteina', raw: true },
  { foodKey: 'anchovy', name: 'Boquerón', kcal: 131, proteinG: 21, carbsG: 0, fatG: 5, category: 'proteina', raw: true },
  { foodKey: 'shrimp', name: 'Gambas / Camarones', kcal: 99, proteinG: 24, carbsG: 0.2, fatG: 0.3, category: 'proteina', raw: true },
  { foodKey: 'mussels', name: 'Mejillones', kcal: 86, proteinG: 12, carbsG: 3.7, fatG: 2.2, category: 'proteina', raw: true },
  { foodKey: 'squid', name: 'Calamares', kcal: 92, proteinG: 18, carbsG: 3, fatG: 1.4, category: 'proteina', raw: true },

  // ── Carbohidratos / Cereales (crudos) ──
  { foodKey: 'whiteRiceRaw', name: 'Arroz blanco (crudo)', kcal: 365, proteinG: 7, carbsG: 80, fatG: 0.7, category: 'carbohidrato', raw: true },
  { foodKey: 'brownRiceRaw', name: 'Arroz integral (crudo)', kcal: 370, proteinG: 7.5, carbsG: 77, fatG: 2.7, category: 'carbohidrato', raw: true },
  { foodKey: 'basmatiRiceRaw', name: 'Arroz basmati (crudo)', kcal: 350, proteinG: 7, carbsG: 78, fatG: 0.6, category: 'carbohidrato', raw: true },
  { foodKey: 'pastaRaw', name: 'Pasta (cruda)', kcal: 371, proteinG: 13, carbsG: 75, fatG: 1.5, category: 'carbohidrato', raw: true },
  { foodKey: 'wholeWheatPastaRaw', name: 'Pasta integral (cruda)', kcal: 348, proteinG: 15, carbsG: 72, fatG: 2.5, category: 'carbohidrato', raw: true },
  { foodKey: 'rolledOats', name: 'Avena en hojuelas', kcal: 389, proteinG: 17, carbsG: 66, fatG: 7, category: 'cereal', raw: true },
  { foodKey: 'oatFlour', name: 'Avena molida', kcal: 389, proteinG: 17, carbsG: 66, fatG: 7, category: 'cereal', raw: true },
  { foodKey: 'whiteBread', name: 'Pan blanco', kcal: 265, proteinG: 9, carbsG: 49, fatG: 3.2, category: 'cereal', raw: true },
  { foodKey: 'wholeWheatBread', name: 'Pan integral', kcal: 247, proteinG: 13, carbsG: 41, fatG: 3.4, category: 'cereal', raw: true },
  { foodKey: 'ryeBread', name: 'Pan de centeno', kcal: 259, proteinG: 10, carbsG: 48, fatG: 3.3, category: 'cereal', raw: true },
  { foodKey: 'cornTortilla', name: 'Tortilla de maíz', kcal: 218, proteinG: 5.7, carbsG: 45, fatG: 2.8, category: 'cereal', raw: true },
  { foodKey: 'potatoRaw', name: 'Papa / Patata (cruda)', kcal: 77, proteinG: 2, carbsG: 17, fatG: 0.1, category: 'carbohidrato', raw: true },
  { foodKey: 'sweetPotatoRaw', name: 'Batata / Boniato (crudo)', kcal: 86, proteinG: 1.6, carbsG: 20, fatG: 0.1, category: 'carbohidrato', raw: true },
  { foodKey: 'quinoaRaw', name: 'Quinoa (cruda)', kcal: 368, proteinG: 14, carbsG: 64, fatG: 6, category: 'cereal', raw: true },
  { foodKey: 'couscousRaw', name: 'Cuscús (crudo)', kcal: 376, proteinG: 13, carbsG: 77, fatG: 0.6, category: 'cereal', raw: true },
  { foodKey: 'milletRaw', name: 'Mijo (crudo)', kcal: 378, proteinG: 11, carbsG: 73, fatG: 4.2, category: 'cereal', raw: true },
  { foodKey: 'buckwheatRaw', name: 'Trigo sarraceno (crudo)', kcal: 343, proteinG: 13, carbsG: 72, fatG: 3.4, category: 'cereal', raw: true },

  // ── Frutas ──
  { foodKey: 'banana', name: 'Banana', kcal: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, category: 'fruta', raw: true },
  { foodKey: 'apple', name: 'Manzana', kcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, category: 'fruta', raw: true },
  { foodKey: 'orange', name: 'Naranja', kcal: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1, category: 'fruta', raw: true },
  { foodKey: 'strawberry', name: 'Fresa', kcal: 32, proteinG: 0.7, carbsG: 7.7, fatG: 0.3, category: 'fruta', raw: true },
  { foodKey: 'blueberry', name: 'Arándanos', kcal: 57, proteinG: 0.7, carbsG: 14, fatG: 0.3, category: 'fruta', raw: true },
  { foodKey: 'grapes', name: 'Uvas', kcal: 69, proteinG: 0.7, carbsG: 18, fatG: 0.2, category: 'fruta', raw: true },
  { foodKey: 'watermelon', name: 'Sandía', kcal: 30, proteinG: 0.6, carbsG: 7.6, fatG: 0.2, category: 'fruta', raw: true },
  { foodKey: 'cantaloupe', name: 'Melón', kcal: 34, proteinG: 0.8, carbsG: 8.2, fatG: 0.2, category: 'fruta', raw: true },
  { foodKey: 'pineapple', name: 'Piña', kcal: 50, proteinG: 0.5, carbsG: 13, fatG: 0.1, category: 'fruta', raw: true },
  { foodKey: 'mango', name: 'Mango', kcal: 60, proteinG: 0.8, carbsG: 15, fatG: 0.4, category: 'fruta', raw: true },
  { foodKey: 'pear', name: 'Pera', kcal: 57, proteinG: 0.4, carbsG: 15, fatG: 0.1, category: 'fruta', raw: true },
  { foodKey: 'cherries', name: 'Cerezas', kcal: 50, proteinG: 1, carbsG: 12, fatG: 0.3, category: 'fruta', raw: true },
  { foodKey: 'kiwi', name: 'Kiwi', kcal: 61, proteinG: 1.1, carbsG: 15, fatG: 0.5, category: 'fruta', raw: true },
  { foodKey: 'grapefruit', name: 'Pomelo', kcal: 42, proteinG: 0.8, carbsG: 11, fatG: 0.1, category: 'fruta', raw: true },
  { foodKey: 'avocado', name: 'Aguacate', kcal: 160, proteinG: 2, carbsG: 9, fatG: 15, category: 'fruta', raw: true },

  // ── Verduras / Hortalizas crudas ──
  { foodKey: 'broccoli', name: 'Brócoli', kcal: 34, proteinG: 2.8, carbsG: 7, fatG: 0.4, category: 'verdura', raw: true },
  { foodKey: 'cauliflower', name: 'Coliflor', kcal: 25, proteinG: 1.9, carbsG: 5, fatG: 0.3, category: 'verdura', raw: true },
  { foodKey: 'spinach', name: 'Espinaca', kcal: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, category: 'verdura', raw: true },
  { foodKey: 'lettuce', name: 'Lechuga', kcal: 15, proteinG: 1.4, carbsG: 2.9, fatG: 0.2, category: 'verdura', raw: true },
  { foodKey: 'tomato', name: 'Tomate', kcal: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, category: 'verdura', raw: true },
  { foodKey: 'cucumber', name: 'Pepino', kcal: 16, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, category: 'verdura', raw: true },
  { foodKey: 'carrot', name: 'Zanahoria', kcal: 41, proteinG: 0.9, carbsG: 10, fatG: 0.2, category: 'verdura', raw: true },
  { foodKey: 'greenBellPepper', name: 'Pimiento verde', kcal: 20, proteinG: 0.9, carbsG: 4.6, fatG: 0.2, category: 'verdura', raw: true },
  { foodKey: 'redBellPepper', name: 'Pimiento rojo', kcal: 31, proteinG: 1, carbsG: 6, fatG: 0.3, category: 'verdura', raw: true },
  { foodKey: 'zucchini', name: 'Calabacín', kcal: 17, proteinG: 1.2, carbsG: 3.1, fatG: 0.3, category: 'verdura', raw: true },
  { foodKey: 'eggplant', name: 'Berenjena', kcal: 25, proteinG: 1, carbsG: 6, fatG: 0.2, category: 'verdura', raw: true },
  { foodKey: 'mushrooms', name: 'Champiñones', kcal: 22, proteinG: 3.1, carbsG: 3.3, fatG: 0.3, category: 'verdura', raw: true },
  { foodKey: 'celery', name: 'Apio', kcal: 14, proteinG: 0.7, carbsG: 3, fatG: 0.2, category: 'verdura', raw: true },
  { foodKey: 'arugula', name: 'Rúcula', kcal: 25, proteinG: 2.6, carbsG: 3.7, fatG: 0.7, category: 'verdura', raw: true },
  { foodKey: 'onion', name: 'Cebolla', kcal: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1, category: 'verdura', raw: true },
  { foodKey: 'garlic', name: 'Ajo', kcal: 149, proteinG: 6.4, carbsG: 33, fatG: 0.5, category: 'verdura', raw: true },
  { foodKey: 'asparagus', name: 'Espárragos', kcal: 20, proteinG: 2.2, carbsG: 3.9, fatG: 0.1, category: 'verdura', raw: true },
  { foodKey: 'sweetCorn', name: 'Maíz dulce', kcal: 86, proteinG: 3.2, carbsG: 19, fatG: 1.2, category: 'verdura', raw: true },
  { foodKey: 'peas', name: 'Guisantes', kcal: 81, proteinG: 5.4, carbsG: 14, fatG: 0.4, category: 'verdura', raw: true },
  { foodKey: 'kale', name: 'Kale / Col rizada', kcal: 49, proteinG: 4.3, carbsG: 9, fatG: 0.9, category: 'verdura', raw: true },
  { foodKey: 'brusselsSprouts', name: 'Coles de Bruselas', kcal: 43, proteinG: 3.4, carbsG: 9, fatG: 0.3, category: 'verdura', raw: true },
  { foodKey: 'endive', name: 'Endivia', kcal: 17, proteinG: 1.3, carbsG: 3.4, fatG: 0.2, category: 'verdura', raw: true },
  { foodKey: 'artichoke', name: 'Alcachofa', kcal: 47, proteinG: 3.3, carbsG: 11, fatG: 0.2, category: 'verdura', raw: true },
  { foodKey: 'beetroot', name: 'Remolacha', kcal: 43, proteinG: 1.6, carbsG: 10, fatG: 0.2, category: 'verdura', raw: true },

  // ── Grasas / Aceites / Frutos secos ──
  { foodKey: 'extraVirginOliveOil', name: 'Aceite de oliva virgen', kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, category: 'grasa', raw: true },
  { foodKey: 'coconutOil', name: 'Aceite de coco', kcal: 862, proteinG: 0, carbsG: 0, fatG: 100, category: 'grasa', raw: true },
  { foodKey: 'sunflowerOil', name: 'Aceite de girasol', kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, category: 'grasa', raw: true },
  { foodKey: 'butter', name: 'Mantequilla', kcal: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81, category: 'grasa', raw: true },
  { foodKey: 'lightButter', name: 'Mantequilla light', kcal: 499, proteinG: 0.6, carbsG: 0.4, fatG: 55, category: 'grasa', raw: true },
  { foodKey: 'margarine', name: 'Margarina', kcal: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81, category: 'grasa', raw: true },
  { foodKey: 'peanutButter', name: 'Mantequilla de maní', kcal: 588, proteinG: 25, carbsG: 20, fatG: 50, category: 'grasa', raw: true },
  { foodKey: 'almondButter', name: 'Mantequilla de almendra', kcal: 614, proteinG: 21, carbsG: 19, fatG: 56, category: 'grasa', raw: true },
  { foodKey: 'walnuts', name: 'Nueces', kcal: 654, proteinG: 15, carbsG: 14, fatG: 65, category: 'grasa', raw: true },
  { foodKey: 'almonds', name: 'Almendras', kcal: 579, proteinG: 21, carbsG: 22, fatG: 50, category: 'grasa', raw: true },
  { foodKey: 'hazelnuts', name: 'Avellanas', kcal: 628, proteinG: 15, carbsG: 17, fatG: 61, category: 'grasa', raw: true },
  { foodKey: 'pistachios', name: 'Pistachos', kcal: 560, proteinG: 20, carbsG: 28, fatG: 45, category: 'grasa', raw: true },
  { foodKey: 'cashews', name: 'Anacardos', kcal: 553, proteinG: 18, carbsG: 30, fatG: 44, category: 'grasa', raw: true },
  { foodKey: 'peanuts', name: 'Cacahuetes', kcal: 567, proteinG: 26, carbsG: 16, fatG: 49, category: 'grasa', raw: true },
  { foodKey: 'chiaSeeds', name: 'Semillas de chía', kcal: 486, proteinG: 17, carbsG: 42, fatG: 31, category: 'grasa', raw: true },
  { foodKey: 'sunflowerSeeds', name: 'Semillas de girasol', kcal: 584, proteinG: 21, carbsG: 20, fatG: 51, category: 'grasa', raw: true },
  { foodKey: 'flaxSeeds', name: 'Semillas de lino', kcal: 534, proteinG: 18, carbsG: 29, fatG: 42, category: 'grasa', raw: true },
  { foodKey: 'pumpkinSeeds', name: 'Semillas de calabaza', kcal: 559, proteinG: 30, carbsG: 11, fatG: 49, category: 'grasa', raw: true },
  { foodKey: 'shreddedCoconut', name: 'Coco rallado', kcal: 660, proteinG: 6.9, carbsG: 24, fatG: 65, category: 'grasa', raw: true },
  { foodKey: 'blackOlives', name: 'Aceitunas negras', kcal: 250, proteinG: 2, carbsG: 3.8, fatG: 27, category: 'grasa', raw: true },
  { foodKey: 'greenOlives', name: 'Aceitunas verdes', kcal: 145, proteinG: 1, carbsG: 3.8, fatG: 15, category: 'grasa', raw: true },
  { foodKey: 'guacamole', name: 'Guacamole', kcal: 150, proteinG: 2, carbsG: 8, fatG: 13, category: 'grasa', raw: true },
  { foodKey: 'tahini', name: 'Tahini', kcal: 595, proteinG: 17, carbsG: 21, fatG: 54, category: 'grasa', raw: true },

  // ── Lácteos ──
  { foodKey: 'wholeMilk', name: 'Leche entera', kcal: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, category: 'lacteo', raw: true },
  { foodKey: 'semiSkimmedMilk', name: 'Leche semidesnatada', kcal: 50, proteinG: 3.3, carbsG: 5, fatG: 2, category: 'lacteo', raw: true },
  { foodKey: 'skimmedMilk', name: 'Leche desnatada', kcal: 34, proteinG: 3.4, carbsG: 5, fatG: 0.1, category: 'lacteo', raw: true },
  { foodKey: 'almondMilk', name: 'Leche de almendra', kcal: 13, proteinG: 0.6, carbsG: 0.3, fatG: 1.1, category: 'lacteo', raw: true },
  { foodKey: 'oatMilk', name: 'Leche de avena', kcal: 40, proteinG: 0.3, carbsG: 6.6, fatG: 1.5, category: 'lacteo', raw: true },
  { foodKey: 'soyMilk', name: 'Leche de soja', kcal: 33, proteinG: 2.8, carbsG: 1.8, fatG: 1.6, category: 'lacteo', raw: true },
  { foodKey: 'coconutMilk', name: 'Leche de coco', kcal: 230, proteinG: 2.3, carbsG: 6, fatG: 24, category: 'lacteo', raw: true },
  { foodKey: 'greekYogurt', name: 'Yogur griego natural', kcal: 59, proteinG: 10, carbsG: 3.6, fatG: 0.7, category: 'lacteo', raw: true },
  { foodKey: 'naturalYogurt', name: 'Yogur natural', kcal: 61, proteinG: 3.5, carbsG: 4.7, fatG: 3.3, category: 'lacteo', raw: true },
  { foodKey: 'skimmedYogurt', name: 'Yogur desnatado', kcal: 37, proteinG: 4, carbsG: 5, fatG: 0.3, category: 'lacteo', raw: true },
  { foodKey: 'freshCheese', name: 'Queso fresco', kcal: 72, proteinG: 12, carbsG: 2.7, fatG: 2, category: 'lacteo', raw: true },
  { foodKey: 'creamCheese', name: 'Queso crema', kcal: 342, proteinG: 6, carbsG: 4, fatG: 34, category: 'lacteo', raw: true },
  { foodKey: 'mozzarella', name: 'Queso mozzarella', kcal: 280, proteinG: 28, carbsG: 3.1, fatG: 17, category: 'lacteo', raw: true },
  { foodKey: 'parmesan', name: 'Queso parmesano', kcal: 431, proteinG: 38, carbsG: 4, fatG: 29, category: 'lacteo', raw: true },
  { foodKey: 'manchego', name: 'Queso manchego', kcal: 402, proteinG: 25, carbsG: 3.7, fatG: 33, category: 'lacteo', raw: true },
  { foodKey: 'cottageCheese', name: 'Queso batido / Cottage', kcal: 98, proteinG: 11, carbsG: 3.4, fatG: 4.3, category: 'lacteo', raw: true },
  { foodKey: 'ricotta', name: 'Ricotta', kcal: 174, proteinG: 11, carbsG: 3, fatG: 13, category: 'lacteo', raw: true },
  { foodKey: 'heavyCream', name: 'Nata / Crema de leche', kcal: 340, proteinG: 2, carbsG: 3, fatG: 36, category: 'lacteo', raw: true },

  // ── Bebidas ──
  { foodKey: 'blackCoffee', name: 'Café negro', kcal: 2, proteinG: 0.3, carbsG: 0, fatG: 0, category: 'bebida', raw: true },
  { foodKey: 'coffeeWithMilk', name: 'Café con leche', kcal: 33, proteinG: 1.5, carbsG: 3, fatG: 1.6, category: 'bebida', raw: true },
  { foodKey: 'greenTea', name: 'Té verde', kcal: 1, proteinG: 0.2, carbsG: 0, fatG: 0, category: 'bebida', raw: true },
  { foodKey: 'cocaCola', name: 'Coca-Cola', kcal: 42, proteinG: 0, carbsG: 11, fatG: 0, category: 'bebida', raw: true },
  { foodKey: 'cocaColaZero', name: 'Coca-Cola Zero', kcal: 0.4, proteinG: 0, carbsG: 0, fatG: 0, category: 'bebida', raw: true },
  { foodKey: 'freshOrangeJuice', name: 'Zumo de naranja natural', kcal: 45, proteinG: 0.7, carbsG: 10, fatG: 0.2, category: 'bebida', raw: true },
  { foodKey: 'appleJuice', name: 'Zumo de manzana', kcal: 46, proteinG: 0.1, carbsG: 11, fatG: 0.1, category: 'bebida', raw: true },
  { foodKey: 'beer', name: 'Cerveza', kcal: 43, proteinG: 0.5, carbsG: 3.6, fatG: 0, category: 'bebida', raw: true },
  { foodKey: 'redWine', name: 'Vino tinto', kcal: 85, proteinG: 0.1, carbsG: 2.6, fatG: 0, category: 'bebida', raw: true },
  { foodKey: 'cava', name: 'Cava / Champagne', kcal: 76, proteinG: 0.1, carbsG: 1.3, fatG: 0, category: 'bebida', raw: true },
  { foodKey: 'lemonJuice', name: 'Zumo de limón', kcal: 22, proteinG: 0.4, carbsG: 6.9, fatG: 0.2, category: 'bebida', raw: true },
  { foodKey: 'coconutWater', name: 'Agua de coco', kcal: 19, proteinG: 0.7, carbsG: 3.7, fatG: 0.2, category: 'bebida', raw: true },
  { foodKey: 'kombucha', name: 'Kombucha', kcal: 14, proteinG: 0.3, carbsG: 3, fatG: 0, category: 'bebida', raw: true },

  // ── Dulces / Snacks / Otros ──
  { foodKey: 'honey', name: 'Miel', kcal: 304, proteinG: 0.3, carbsG: 82, fatG: 0, category: 'otro', raw: true },
  { foodKey: 'sugar', name: 'Azúcar', kcal: 387, proteinG: 0, carbsG: 100, fatG: 0, category: 'otro', raw: true },
  { foodKey: 'darkChocolate70', name: 'Chocolate negro 70%', kcal: 598, proteinG: 8, carbsG: 46, fatG: 43, category: 'otro', raw: true },
  { foodKey: 'darkChocolate85', name: 'Chocolate negro 85%', kcal: 590, proteinG: 10, carbsG: 38, fatG: 46, category: 'otro', raw: true },
  { foodKey: 'milkChocolate', name: 'Chocolate con leche', kcal: 535, proteinG: 7, carbsG: 59, fatG: 30, category: 'otro', raw: true },
  { foodKey: 'wheyProtein', name: 'Proteína en polvo (whey)', kcal: 375, proteinG: 80, carbsG: 7, fatG: 3, category: 'proteina', raw: true },
  { foodKey: 'peaProtein', name: 'Proteína vegetal (guisante)', kcal: 360, proteinG: 75, carbsG: 12, fatG: 3, category: 'proteina', raw: true },
  { foodKey: 'cocoaPowder', name: 'Cacao en polvo', kcal: 228, proteinG: 20, carbsG: 58, fatG: 14, category: 'otro', raw: true },
  { foodKey: 'hummus', name: 'Hummus', kcal: 166, proteinG: 8, carbsG: 14, fatG: 10, category: 'otro', raw: true },
  { foodKey: 'soySauce', name: 'Salsa de soja', kcal: 53, proteinG: 8, carbsG: 5, fatG: 0.6, category: 'otro', raw: true },
  { foodKey: 'miso', name: 'Miso', kcal: 199, proteinG: 12, carbsG: 26, fatG: 6, category: 'otro', raw: true },
  { foodKey: 'appleCiderVinegar', name: 'Vinagre de manzana', kcal: 21, proteinG: 0, carbsG: 0.9, fatG: 0, category: 'otro', raw: true },
  { foodKey: 'unflavoredGelatin', name: 'Gelatina sin sabor', kcal: 35, proteinG: 9, carbsG: 0, fatG: 0, category: 'otro', raw: true },
  { foodKey: 'riceCakes', name: 'Tortitas de arroz', kcal: 387, proteinG: 8, carbsG: 81, fatG: 3, category: 'cereal', raw: true },
  { foodKey: 'pitaBread', name: 'Pita bread', kcal: 275, proteinG: 9, carbsG: 55, fatG: 1.2, category: 'cereal', raw: true },
]

// Ajusta la meta calórica diaria por los pasos de hoy (F84e): TDEE + kcal de
// caminar. Reutiliza calculateCalories de stepsTracker (pasos × 0.04); sin
// pasos registrados el ajuste es +0 (el TDEE queda intacto).
export const adjustTdeeForSteps = (tdee: number, todaySteps: number): number =>
  tdee + calculateCalories(todaySteps, 0)

// Calcula totales diarios de un array de comidas.
export const calculateDailyTotals = (meals: MealEntry[]): {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
} => {
  let kcal = 0, proteinG = 0, carbsG = 0, fatG = 0
  for (const meal of meals) {
    for (const item of meal.items) {
      kcal += item.kcal
      proteinG += item.proteinG
      carbsG += item.carbsG
      fatG += item.fatG
    }
  }
  return { kcal, proteinG, carbsG, fatG }
}

// Calcula macros de un alimento según gramos (baseGrams = 100 por defecto para seed).
export const calculateFoodMacros = (food: FoodItem, grams: number): MealFoodEntry => {
  const base = food.baseGrams ?? 100
  const factor = base > 0 ? grams / base : grams / 100
  return {
    foodId: food.id,
    foodKey: food.foodKey,
    grams,
    kcal: Math.round(food.kcal * factor),
    proteinG: +(food.proteinG * factor).toFixed(1),
    carbsG: +(food.carbsG * factor).toFixed(1),
    fatG: +(food.fatG * factor).toFixed(1),
  }
}

// Orden de presentación de los tipos de comida (desayuno → snack).
export const MEAL_TYPE_ORDER: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snack']

// Agrupa las comidas de un día por tipo con su subtotal de kcal y la lista de comidas,
// conservando el orden de MEAL_TYPE_ORDER. Devuelve `{}` si no hay comidas.
export const calcMealTypeTotals = (meals: MealEntry[]): Partial<Record<MealType, { meals: MealEntry[]; kcal: number }>> => {
  const result: Partial<Record<MealType, { meals: MealEntry[]; kcal: number }>> = {}
  for (const meal of meals) {
    const group = result[meal.mealType] ?? { meals: [], kcal: 0 }
    group.meals.push(meal)
    group.kcal += meal.items.reduce((sum, item) => sum + item.kcal, 0)
    result[meal.mealType] = group
  }
  return result
}
