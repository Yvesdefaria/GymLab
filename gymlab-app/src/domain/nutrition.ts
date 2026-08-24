// Nutrición: seed de alimentos comunes y funciones de cálculo de totales diarios.
import type { FoodItem, MealEntry, MealFoodEntry } from './types'

// Seed de alimentos comunes (valores por 100g salvo que se indique).
export const FOOD_SEED: Omit<FoodItem, 'id'>[] = [
  // ── Proteínas / Carnes crudas ──
  { name: 'Pechuga de pollo', kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, category: 'proteina' },
  { name: 'Pechuga de pavo', kcal: 135, proteinG: 30, carbsG: 0, fatG: 1, category: 'proteina' },
  { name: 'Muslo de pollo (sin piel)', kcal: 209, proteinG: 26, carbsG: 0, fatG: 10.9, category: 'proteina' },
  { name: 'Muslo de pollo (con piel)', kcal: 234, proteinG: 26, carbsG: 0, fatG: 13.2, category: 'proteina' },
  { name: 'Alita de pollo', kcal: 239, proteinG: 18.7, carbsG: 0, fatG: 17.3, category: 'proteina' },
  { name: 'Huevo entero', kcal: 155, proteinG: 13, carbsG: 1.1, fatG: 11, category: 'proteina' },
  { name: 'Clara de huevo', kcal: 52, proteinG: 11, carbsG: 0.7, fatG: 0.2, category: 'proteina' },
  { name: 'Salmón fresco', kcal: 208, proteinG: 20, carbsG: 0, fatG: 13, category: 'proteina' },
  { name: 'Salmón ahumado', kcal: 117, proteinG: 18, carbsG: 0, fatG: 4.3, category: 'proteina' },
  { name: 'Atún fresco', kcal: 132, proteinG: 28, carbsG: 0, fatG: 1.3, category: 'proteina' },
  { name: 'Atún enlatado (en agua)', kcal: 116, proteinG: 26, carbsG: 0, fatG: 0.8, category: 'proteina' },
  { name: 'Atún enlatado (en aceite)', kcal: 198, proteinG: 29, carbsG: 0, fatG: 8.1, category: 'proteina' },
  { name: 'Carne molida magra (90/10)', kcal: 176, proteinG: 20, carbsG: 0, fatG: 10, category: 'proteina' },
  { name: 'Carne molida regular (80/20)', kcal: 254, proteinG: 17, carbsG: 0, fatG: 20, category: 'proteina' },
  { name: 'Lomo de cerdo', kcal: 143, proteinG: 26, carbsG: 0, fatG: 3.5, category: 'proteina' },
  { name: 'Costillas de cerdo', kcal: 277, proteinG: 18, carbsG: 0, fatG: 22, category: 'proteina' },
  { name: 'Ternera magra', kcal: 142, proteinG: 26, carbsG: 0, fatG: 3.7, category: 'proteina' },
  { name: 'Ternera molida', kcal: 250, proteinG: 26, carbsG: 0, fatG: 15, category: 'proteina' },
  { name: 'Chuleta de ternera', kcal: 220, proteinG: 24, carbsG: 0, fatG: 13, category: 'proteina' },
  { name: 'Bistec de res (sirloin)', kcal: 207, proteinG: 26, carbsG: 0, fatG: 11, category: 'proteina' },
  { name: 'Aguja de res', kcal: 195, proteinG: 21, carbsG: 0, fatG: 12, category: 'proteina' },
  { name: 'Punta de solomillo', kcal: 133, proteinG: 21, carbsG: 0, fatG: 5, category: 'proteina' },
  { name: 'Hígado de res', kcal: 175, proteinG: 20, carbsG: 3.8, fatG: 4.2, category: 'proteina' },
  { name: 'Tofu firme', kcal: 144, proteinG: 15, carbsG: 3.5, fatG: 8, category: 'proteina' },
  { name: 'Tofu suave', kcal: 76, proteinG: 8, carbsG: 1.9, fatG: 4.8, category: 'proteina' },
  { name: 'Tempeh', kcal: 192, proteinG: 20, carbsG: 7.6, fatG: 11, category: 'proteina' },
  { name: 'Edamame', kcal: 121, proteinG: 12, carbsG: 9, fatG: 5, category: 'proteina' },
  { name: 'Lentejas cocidas', kcal: 116, proteinG: 9, carbsG: 20, fatG: 0.4, category: 'proteina' },
  { name: 'Garbanzos cocidos', kcal: 164, proteinG: 8.9, carbsG: 27, fatG: 2.6, category: 'proteina' },
  { name: 'Frijoles negros cocidos', kcal: 132, proteinG: 8.9, carbsG: 24, fatG: 0.5, category: 'proteina' },
  { name: 'Frijoles rojos cocidos', kcal: 127, proteinG: 8.7, carbsG: 22, fatG: 0.5, category: 'proteina' },

  // ── Carnes procesadas ──
  { name: 'Jamón serrano', kcal: 145, proteinG: 28, carbsG: 0, fatG: 3.3, category: 'proteina' },
  { name: 'Pavo en lonchas', kcal: 104, proteinG: 18, carbsG: 2, fatG: 1.7, category: 'proteina' },
  { name: 'Chorizo', kcal: 455, proteinG: 24, carbsG: 1.5, fatG: 38, category: 'proteina' },
  { name: 'Longaniza', kcal: 344, proteinG: 14, carbsG: 2, fatG: 31, category: 'proteina' },
  { name: 'Salchichón', kcal: 304, proteinG: 12, carbsG: 3, fatG: 27, category: 'proteina' },
  { name: 'Tocino / Bacon', kcal: 541, proteinG: 37, carbsG: 1.4, fatG: 42, category: 'proteina' },

  // ── Pescados y mariscos ──
  { name: 'Merluza', kcal: 85, proteinG: 18, carbsG: 0, fatG: 1.3, category: 'proteina' },
  { name: 'Bacalao', kcal: 82, proteinG: 18, carbsG: 0, fatG: 0.7, category: 'proteina' },
  { name: 'Dorada', kcal: 100, proteinG: 19, carbsG: 0, fatG: 2.2, category: 'proteina' },
  { name: 'Lubina', kcal: 124, proteinG: 22, carbsG: 0, fatG: 3.8, category: 'proteina' },
  { name: 'Sardinas frescas', kcal: 208, proteinG: 25, carbsG: 0, fatG: 11, category: 'proteina' },
  { name: 'Boquerón', kcal: 131, proteinG: 21, carbsG: 0, fatG: 5, category: 'proteina' },
  { name: 'Gambas / Camarones', kcal: 99, proteinG: 24, carbsG: 0.2, fatG: 0.3, category: 'proteina' },
  { name: 'Mejillones', kcal: 86, proteinG: 12, carbsG: 3.7, fatG: 2.2, category: 'proteina' },
  { name: 'Calamares', kcal: 92, proteinG: 18, carbsG: 3, fatG: 1.4, category: 'proteina' },

  // ── Carbohidratos / Cereales ──
  { name: 'Arroz blanco cocido', kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, category: 'carbohidrato' },
  { name: 'Arroz integral cocido', kcal: 123, proteinG: 2.7, carbsG: 26, fatG: 1, category: 'carbohidrato' },
  { name: 'Arroz basmati cocido', kcal: 130, proteinG: 3.1, carbsG: 28, fatG: 0.3, category: 'carbohidrato' },
  { name: 'Pasta cocida', kcal: 131, proteinG: 5, carbsG: 25, fatG: 1.1, category: 'carbohidrato' },
  { name: 'Pasta integral cocida', kcal: 124, proteinG: 5.3, carbsG: 27, fatG: 0.5, category: 'carbohidrato' },
  { name: 'Avena en hojuelas', kcal: 389, proteinG: 17, carbsG: 66, fatG: 7, category: 'cereal' },
  { name: 'Avena molida', kcal: 389, proteinG: 17, carbsG: 66, fatG: 7, category: 'cereal' },
  { name: 'Pan blanco', kcal: 265, proteinG: 9, carbsG: 49, fatG: 3.2, category: 'cereal' },
  { name: 'Pan integral', kcal: 247, proteinG: 13, carbsG: 41, fatG: 3.4, category: 'cereal' },
  { name: 'Pan de centeno', kcal: 259, proteinG: 10, carbsG: 48, fatG: 3.3, category: 'cereal' },
  { name: 'Tortilla de maíz', kcal: 218, proteinG: 5.7, carbsG: 45, fatG: 2.8, category: 'cereal' },
  { name: 'Papa cocida', kcal: 87, proteinG: 2, carbsG: 20, fatG: 0.1, category: 'carbohidrato' },
  { name: 'Papa asada', kcal: 93, proteinG: 2.5, carbsG: 21, fatG: 0.1, category: 'carbohidrato' },
  { name: 'Batata / Boniato cocido', kcal: 90, proteinG: 2, carbsG: 21, fatG: 0.1, category: 'carbohidrato' },
  { name: 'Quinoa cocida', kcal: 120, proteinG: 4.4, carbsG: 21, fatG: 1.9, category: 'cereal' },
  { name: 'Cuscús cocido', kcal: 112, proteinG: 3.8, carbsG: 23, fatG: 0.2, category: 'cereal' },
  { name: 'Mijo cocido', kcal: 119, proteinG: 3.5, carbsG: 23, fatG: 1, category: 'cereal' },
  { name: 'Trigo sarraceno cocido', kcal: 92, proteinG: 4.5, carbsG: 20, fatG: 0.7, category: 'cereal' },

  // ── Frutas ──
  { name: 'Banana', kcal: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, category: 'fruta' },
  { name: 'Manzana', kcal: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, category: 'fruta' },
  { name: 'Naranja', kcal: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1, category: 'fruta' },
  { name: 'Fresa', kcal: 32, proteinG: 0.7, carbsG: 7.7, fatG: 0.3, category: 'fruta' },
  { name: 'Arándanos', kcal: 57, proteinG: 0.7, carbsG: 14, fatG: 0.3, category: 'fruta' },
  { name: 'Plátano', kcal: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, category: 'fruta' },
  { name: 'Uvas', kcal: 69, proteinG: 0.7, carbsG: 18, fatG: 0.2, category: 'fruta' },
  { name: 'Sandía', kcal: 30, proteinG: 0.6, carbsG: 7.6, fatG: 0.2, category: 'fruta' },
  { name: 'Melón', kcal: 34, proteinG: 0.8, carbsG: 8.2, fatG: 0.2, category: 'fruta' },
  { name: 'Piña', kcal: 50, proteinG: 0.5, carbsG: 13, fatG: 0.1, category: 'fruta' },
  { name: 'Mango', kcal: 60, proteinG: 0.8, carbsG: 15, fatG: 0.4, category: 'fruta' },
  { name: 'Pera', kcal: 57, proteinG: 0.4, carbsG: 15, fatG: 0.1, category: 'fruta' },
  { name: 'Cerezas', kcal: 50, proteinG: 1, carbsG: 12, fatG: 0.3, category: 'fruta' },
  { name: 'Kiwi', kcal: 61, proteinG: 1.1, carbsG: 15, fatG: 0.5, category: 'fruta' },
  { name: 'Pomelo', kcal: 42, proteinG: 0.8, carbsG: 11, fatG: 0.1, category: 'fruta' },

  // ── Verduras / Hortalizas crudas ──
  { name: 'Brócoli', kcal: 34, proteinG: 2.8, carbsG: 7, fatG: 0.4, category: 'verdura' },
  { name: 'Brócoli al vapor', kcal: 35, proteinG: 2.4, carbsG: 7.2, fatG: 0.4, category: 'verdura' },
  { name: 'Coliflor', kcal: 25, proteinG: 1.9, carbsG: 5, fatG: 0.3, category: 'verdura' },
  { name: 'Espinaca cruda', kcal: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, category: 'verdura' },
  { name: 'Espinaca cocida', kcal: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, category: 'verdura' },
  { name: 'Lechuga', kcal: 15, proteinG: 1.4, carbsG: 2.9, fatG: 0.2, category: 'verdura' },
  { name: 'Tomate', kcal: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, category: 'verdura' },
  { name: 'Pepino', kcal: 16, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, category: 'verdura' },
  { name: 'Zanahoria', kcal: 41, proteinG: 0.9, carbsG: 10, fatG: 0.2, category: 'verdura' },
  { name: 'Pimiento verde', kcal: 20, proteinG: 0.9, carbsG: 4.6, fatG: 0.2, category: 'verdura' },
  { name: 'Pimiento rojo', kcal: 31, proteinG: 1, carbsG: 6, fatG: 0.3, category: 'verdura' },
  { name: 'Calabacín', kcal: 17, proteinG: 1.2, carbsG: 3.1, fatG: 0.3, category: 'verdura' },
  { name: 'Berenjena', kcal: 25, proteinG: 1, carbsG: 6, fatG: 0.2, category: 'verdura' },
  { name: 'Champiñones', kcal: 22, proteinG: 3.1, carbsG: 3.3, fatG: 0.3, category: 'verdura' },
  { name: 'Apio', kcal: 14, proteinG: 0.7, carbsG: 3, fatG: 0.2, category: 'verdura' },
  { name: 'Rúcula', kcal: 25, proteinG: 2.6, carbsG: 3.7, fatG: 0.7, category: 'verdura' },
  { name: 'Bulgur cocido', kcal: 83, proteinG: 3.1, carbsG: 19, fatG: 0.2, category: 'verdura' },
  { name: 'Cebolla', kcal: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1, category: 'verdura' },
  { name: 'Ajo', kcal: 149, proteinG: 6.4, carbsG: 33, fatG: 0.5, category: 'verdura' },
  { name: 'Champiñones portobello', kcal: 22, proteinG: 2.1, carbsG: 3.9, fatG: 0.4, category: 'verdura' },
  { name: 'Espárragos', kcal: 20, proteinG: 2.2, carbsG: 3.9, fatG: 0.1, category: 'verdura' },
  { name: 'Maíz dulce', kcal: 86, proteinG: 3.2, carbsG: 19, fatG: 1.2, category: 'verdura' },
  { name: 'Guisantes', kcal: 81, proteinG: 5.4, carbsG: 14, fatG: 0.4, category: 'verdura' },
  { name: 'Boletus / Setas', kcal: 22, proteinG: 3.1, carbsG: 3.3, fatG: 0.3, category: 'verdura' },
  { name: 'Endivia', kcal: 17, proteinG: 1.3, carbsG: 3.4, fatG: 0.2, category: 'verdura' },
  { name: 'Alcachofa', kcal: 47, proteinG: 3.3, carbsG: 11, fatG: 0.2, category: 'verdura' },
  { name: 'Remolacha', kcal: 43, proteinG: 1.6, carbsG: 10, fatG: 0.2, category: 'verdura' },
  { name: 'Coles de Bruselas', kcal: 43, proteinG: 3.4, carbsG: 9, fatG: 0.3, category: 'verdura' },
  { name: 'Kale / Col rizada', kcal: 49, proteinG: 4.3, carbsG: 9, fatG: 0.9, category: 'verdura' },
  { name: 'Chou chino / Pak choi', kcal: 13, proteinG: 1.5, carbsG: 2.2, fatG: 0.2, category: 'verdura' },

  // ── Grasas / Aceites / Frutos secos ──
  { name: 'Aceite de oliva virgen', kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, category: 'grasa' },
  { name: 'Aceite de coco', kcal: 862, proteinG: 0, carbsG: 0, fatG: 100, category: 'grasa' },
  { name: 'Aceite de girasol', kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, category: 'grasa' },
  { name: 'Mantequilla', kcal: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81, category: 'grasa' },
  { name: 'Mantequilla light', kcal: 499, proteinG: 0.6, carbsG: 0.4, fatG: 55, category: 'grasa' },
  { name: 'Margarina', kcal: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81, category: 'grasa' },
  { name: 'Mantequilla de maní', kcal: 588, proteinG: 25, carbsG: 20, fatG: 50, category: 'grasa' },
  { name: 'Mantequilla de almendra', kcal: 614, proteinG: 21, carbsG: 19, fatG: 56, category: 'grasa' },
  { name: 'Guacamole', kcal: 150, proteinG: 2, carbsG: 8, fatG: 13, category: 'grasa' },
  { name: 'Aguacate', kcal: 160, proteinG: 2, carbsG: 9, fatG: 15, category: 'fruta' },
  { name: 'Nueces', kcal: 654, proteinG: 15, carbsG: 14, fatG: 65, category: 'grasa' },
  { name: 'Almendras', kcal: 579, proteinG: 21, carbsG: 22, fatG: 50, category: 'grasa' },
  { name: 'Avellanas', kcal: 628, proteinG: 15, carbsG: 17, fatG: 61, category: 'grasa' },
  { name: 'Pistachos', kcal: 560, proteinG: 20, carbsG: 28, fatG: 45, category: 'grasa' },
  { name: 'Anacardos / Marañones', kcal: 553, proteinG: 18, carbsG: 30, fatG: 44, category: 'grasa' },
  { name: 'Nueces de la India', kcal: 553, proteinG: 18, carbsG: 30, fatG: 44, category: 'grasa' },
  { name: 'Cacahuetes', kcal: 567, proteinG: 26, carbsG: 16, fatG: 49, category: 'grasa' },
  { name: 'Semillas de chía', kcal: 486, proteinG: 17, carbsG: 42, fatG: 31, category: 'grasa' },
  { name: 'Semillas de girasol', kcal: 584, proteinG: 21, carbsG: 20, fatG: 51, category: 'grasa' },
  { name: 'Semillas de lino', kcal: 534, proteinG: 18, carbsG: 29, fatG: 42, category: 'grasa' },
  { name: 'Semillas de calabaza', kcal: 559, proteinG: 30, carbsG: 11, fatG: 49, category: 'grasa' },
  { name: 'Coco rallado', kcal: 660, proteinG: 6.9, carbsG: 24, fatG: 65, category: 'grasa' },
  { name: 'Aceitunas negras', kcal: 250, proteinG: 2, carbsG: 3.8, fatG: 27, category: 'grasa' },
  { name: 'Aceitunas verdes', kcal: 145, proteinG: 1, carbsG: 3.8, fatG: 15, category: 'grasa' },

  // ── Lácteos ──
  { name: 'Leche entera', kcal: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, category: 'lacteo' },
  { name: 'Leche semidesnatada', kcal: 50, proteinG: 3.3, carbsG: 5, fatG: 2, category: 'lacteo' },
  { name: 'Leche desnatada', kcal: 34, proteinG: 3.4, carbsG: 5, fatG: 0.1, category: 'lacteo' },
  { name: 'Leche de almendra', kcal: 13, proteinG: 0.6, carbsG: 0.3, fatG: 1.1, category: 'lacteo' },
  { name: 'Leche de avena', kcal: 40, proteinG: 0.3, carbsG: 6.6, fatG: 1.5, category: 'lacteo' },
  { name: 'Leche de soja', kcal: 33, proteinG: 2.8, carbsG: 1.8, fatG: 1.6, category: 'lacteo' },
  { name: 'Leche de coco', kcal: 230, proteinG: 2.3, carbsG: 6, fatG: 24, category: 'lacteo' },
  { name: 'Yogur griego natural', kcal: 59, proteinG: 10, carbsG: 3.6, fatG: 0.7, category: 'lacteo' },
  { name: 'Yogur natural', kcal: 61, proteinG: 3.5, carbsG: 4.7, fatG: 3.3, category: 'lacteo' },
  { name: 'Yogur desnatado', kcal: 37, proteinG: 4, carbsG: 5, fatG: 0.3, category: 'lacteo' },
  { name: 'Queso fresco', kcal: 72, proteinG: 12, carbsG: 2.7, fatG: 2, category: 'lacteo' },
  { name: 'Queso crema', kcal: 342, proteinG: 6, carbsG: 4, fatG: 34, category: 'lacteo' },
  { name: 'Queso mozzarella', kcal: 280, proteinG: 28, carbsG: 3.1, fatG: 17, category: 'lacteo' },
  { name: 'Queso parmesano', kcal: 431, proteinG: 38, carbsG: 4, fatG: 29, category: 'lacteo' },
  { name: 'Queso manchego', kcal: 402, proteinG: 25, carbsG: 3.7, fatG: 33, category: 'lacteo' },
  { name: 'Queso batido / Cottage', kcal: 98, proteinG: 11, carbsG: 3.4, fatG: 4.3, category: 'lacteo' },
  { name: 'Ricotta', kcal: 174, proteinG: 11, carbsG: 3, fatG: 13, category: 'lacteo' },
  { name: 'Nata / Crema de leche', kcal: 340, proteinG: 2, carbsG: 3, fatG: 36, category: 'lacteo' },

  // ── Bebidas ──
  { name: 'Café negro', kcal: 2, proteinG: 0.3, carbsG: 0, fatG: 0, category: 'bebida' },
  { name: 'Café con leche', kcal: 33, proteinG: 1.5, carbsG: 3, fatG: 1.6, category: 'bebida' },
  { name: 'Té verde', kcal: 1, proteinG: 0.2, carbsG: 0, fatG: 0, category: 'bebida' },
  { name: 'Coca-Cola', kcal: 42, proteinG: 0, carbsG: 11, fatG: 0, category: 'bebida' },
  { name: 'Coca-Cola Zero', kcal: 0.4, proteinG: 0, carbsG: 0, fatG: 0, category: 'bebida' },
  { name: 'Zumo de naranja natural', kcal: 45, proteinG: 0.7, carbsG: 10, fatG: 0.2, category: 'bebida' },
  { name: 'Zumo de manzana', kcal: 46, proteinG: 0.1, carbsG: 11, fatG: 0.1, category: 'bebida' },
  { name: 'Cerveza', kcal: 43, proteinG: 0.5, carbsG: 3.6, fatG: 0, category: 'bebida' },
  { name: 'Vino tinto', kcal: 85, proteinG: 0.1, carbsG: 2.6, fatG: 0, category: 'bebida' },
  { name: 'Cava / Champagne', kcal: 76, proteinG: 0.1, carbsG: 1.3, fatG: 0, category: 'bebida' },
  { name: 'Zumo de limón', kcal: 22, proteinG: 0.4, carbsG: 6.9, fatG: 0.2, category: 'bebida' },
  { name: 'Agua de coco', kcal: 19, proteinG: 0.7, carbsG: 3.7, fatG: 0.2, category: 'bebida' },
  { name: 'Kombucha', kcal: 14, proteinG: 0.3, carbsG: 3, fatG: 0, category: 'bebida' },

  // ── Dulces / Snacks / Otros ──
  { name: 'Miel', kcal: 304, proteinG: 0.3, carbsG: 82, fatG: 0, category: 'otro' },
  { name: 'Azúcar', kcal: 387, proteinG: 0, carbsG: 100, fatG: 0, category: 'otro' },
  { name: 'Chocolate negro 70%', kcal: 598, proteinG: 8, carbsG: 46, fatG: 43, category: 'otro' },
  { name: 'Chocolate negro 85%', kcal: 590, proteinG: 10, carbsG: 38, fatG: 46, category: 'otro' },
  { name: 'Chocolate con leche', kcal: 535, proteinG: 7, carbsG: 59, fatG: 30, category: 'otro' },
  { name: 'Proteína en polvo (whey)', kcal: 375, proteinG: 80, carbsG: 7, fatG: 3, category: 'proteina' },
  { name: 'Proteína vegetal (pea)', kcal: 360, proteinG: 75, carbsG: 12, fatG: 3, category: 'proteina' },
  { name: 'Creatina monohidratada', kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, category: 'otro' },
  { name: 'Tahini / Pasta de sésamo', kcal: 595, proteinG: 17, carbsG: 21, fatG: 54, category: 'grasa' },
  { name: 'Miso', kcal: 199, proteinG: 12, carbsG: 26, fatG: 6, category: 'otro' },
  { name: 'Salsa de soja', kcal: 53, proteinG: 8, carbsG: 5, fatG: 0.6, category: 'otro' },
  { name: 'Vinagre de manzana', kcal: 21, proteinG: 0, carbsG: 0.9, fatG: 0, category: 'otro' },
  { name: 'Gelatina sin sabor', kcal: 35, proteinG: 9, carbsG: 0, fatG: 0, category: 'otro' },
  { name: 'Cacao en polvo', kcal: 228, proteinG: 20, carbsG: 58, fatG: 14, category: 'otro' },
  { name: 'Tortitas de arroz', kcal: 387, proteinG: 8, carbsG: 81, fatG: 3, category: 'cereal' },
  { name: 'Palitos de apio con crema de cacahuete', kcal: 215, proteinG: 7, carbsG: 8, fatG: 18, category: 'otro' },
  { name: 'Hummus', kcal: 166, proteinG: 8, carbsG: 14, fatG: 10, category: 'otro' },
  { name: 'Pita bread', kcal: 275, proteinG: 9, carbsG: 55, fatG: 1.2, category: 'cereal' },
  { name: 'Pretzels', kcal: 380, proteinG: 10, carbsG: 80, fatG: 3.5, category: 'cereal' },
  { name: 'Frutos secos mixtos', kcal: 607, proteinG: 20, carbsG: 22, fatG: 54, category: 'grasa' },
  { name: 'Barrita de cereal', kcal: 350, proteinG: 10, carbsG: 55, fatG: 12, category: 'cereal' },
  { name: 'Sopa de verduras', kcal: 32, proteinG: 1.8, carbsG: 5.4, fatG: 0.5, category: 'verdura' },
  { name: 'Gazpacho', kcal: 40, proteinG: 1.2, carbsG: 6.6, fatG: 1.3, category: 'verdura' },
  { name: 'Salmorejo', kcal: 139, proteinG: 2.5, carbsG: 7.6, fatG: 11, category: 'verdura' },
]

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
    foodName: food.name,
    grams,
    kcal: Math.round(food.kcal * factor),
    proteinG: +(food.proteinG * factor).toFixed(1),
    carbsG: +(food.carbsG * factor).toFixed(1),
    fatG: +(food.fatG * factor).toFixed(1),
  }
}
