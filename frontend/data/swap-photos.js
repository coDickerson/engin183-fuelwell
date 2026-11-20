// One photo per swap-catalog dish, keyed by the catalog's meal name. Two kinds of entries:
// - Unsplash (Unsplash License): { img, by, id }, loaded from Unsplash's CDN (their hotlinking guideline).
// - Wikimedia Commons (CC0 / CC BY / CC BY-SA): { src, by, license, page }; the credit names the author
//   and license and links to the file page, as those licenses require.
// Each card credits the photographer.
// Chosen to show the plain dish, not styled shots. Missing entries fall back to a no-photo card.
export const swapPhotos = {
  "Congee with salted egg and pickled vegetables": {
    "img": "photo-1766761562530-c8dd12c96d9a",
    "by": "Dean Zhang",
    "id": "duPZXKQHbQ8"
  },
  "Stir-fry with soy sauce and oyster sauce": {
    "img": "photo-1592578630143-fac65cda7a67",
    "by": "Ravi Sharma",
    "id": "XBWjfCsQP4c"
  },
  "Cantonese slow-cooked soup (lo foh tong)": {
    "img": "photo-1609655523488-c292fdba24f1",
    "by": "Kevin kevin",
    "id": "jHmAv_lBuX4"
  },
  "Dim sum with soy dipping sauce": {
    "img": "photo-1779333277496-a5106680169c",
    "by": "Sunira Moses",
    "id": "j9fy7p_hcpM"
  },
  "Panda Express orange chicken with chow mein": {
    "img": "photo-1525755662778-989d0524087e",
    "by": "Drew Taylor",
    "id": "jFu2L04tMBc"
  },
  "Instant ramen": {
    "img": "photo-1628610688436-e635552020fc",
    "by": "sq lim",
    "id": "klAwNfxM9-g"
  },
  "Hot pot": {
    "img": "photo-1703945530505-2f06e3e1cf97",
    "by": "Yihan Wang",
    "id": "zy92yz3sW0E"
  },
  "Pho": {
    "img": "photo-1582878826629-29b7ad1cdc43",
    "by": "Markus Winkler",
    "id": "08aic3qPcag"
  },
  "El Pollo Loco chicken meal": {
    "img": "photo-1777891258069-454e66f8bedc",
    "by": "Husien Bisky",
    "id": "Xfq9nVqVl7Y"
  },
  "Chipotle burrito with cheese, beans and guacamole": {
    "img": "photo-1731090389603-d63060ee08a6",
    "by": "Snappr",
    "id": "BqV9zOdio6A"
  },
  "Enchiladas with canned sauce and cheese": {
    "img": "photo-1674135529596-cb1f707d231d",
    "by": "Aleksandra Gencheva",
    "id": "4vB9GNWnmbM"
  },
  "Chicken adobo": {
    "img": "photo-1596699917234-1c93c61a1083",
    "by": "Eiliv Aceron",
    "id": "ZQjLze3wpec"
  },
  "Sinigang": {
    "img": "photo-1687419950105-b1cdeb6c66bc",
    "by": "RASA DIBALIK LENSA",
    "id": "_jeyw0cidTY"
  },
  "Spam musubi or fried Spam": {
    "img": "photo-1648421714382-70d47442b354",
    "by": "sirasit gullasu",
    "id": "jGUFBHS06BM"
  },
  "Korean BBQ with kimchi": {
    "img": "photo-1677029969065-c9f4003a9ad5",
    "by": "Subagus Indra",
    "id": "hWxFxd-VySY"
  },
  "Potato curry or palak (spinach) with dal": {
    "img": "photo-1756821753226-c0fc88056cf7",
    "by": "Frederick Shaw",
    "id": "EvxE8j6lfyY"
  },
  "Sushi with miso soup and soy sauce": {
    "img": "photo-1579871494447-9811cf80d66c",
    "by": "Vinicius Benedit",
    "id": "-1GEAA8q3wk"
  },
  "Big Mac, fries and a cola": {
    "img": "photo-1600688640154-9619e002df30",
    "by": "Emanuel Ekström",
    "id": "DHxLfzqhoIk"
  },
  "Pizza delivery with pepperoni": {
    "img": "photo-1692737580547-b45bb4a02356",
    "by": "David Foodphototasty",
    "id": "xIqVfW8XUt4"
  },
  "Fried chicken": {
    "img": "photo-1569058242253-92a9c755a0ec",
    "by": "Kevin kevin",
    "id": "nwmZhwOSVnM"
  },
  "Deli sandwich (Subway, cold cuts)": {
    "img": "photo-1509722747041-616f39b57569",
    "by": "Raphael Nogueira",
    "id": "Znvxeud6sDc"
  },
  "Frozen lasagna or mac and cheese": {
    "img": "photo-1759409117421-1a64af35f118",
    "by": "Clare Andrews",
    "id": "rBhXooUziZc"
  },
  "Frozen pizza": {
    "img": "photo-1609795829951-325b91a41471",
    "by": "Jordon Kaplan",
    "id": "tVQwwfyE5Lc"
  },
  "Frozen dumplings with dipping sauce": {
    "img": "photo-1638502338747-f7f368214cce",
    "by": "Huyen Bui",
    "id": "vM9R9uu_BKY"
  },
  "Canned soup": {
    "img": "photo-1757489345059-31d51e241a3e",
    "by": "Elena Leya",
    "id": "JELuDsF96tA"
  },
  "Ice cream at night": {
    "img": "photo-1562790879-dfde82829db0",
    "by": "Irene Kredenets",
    "id": "tVs-nga-tpo"
  },
  "Chips and salty snacks": {
    "img": "photo-1613919113640-25732ec5e61f",
    "by": "Mustafa Bashari",
    "id": "S4PC4SeKwKg"
  },
  "Cola or dark soda": {
    "img": "photo-1700328971815-854758899c06",
    "by": "Lee B. Vining",
    "id": "Ef8W3wcuFiY"
  },
  "Boba milk tea": {
    "img": "photo-1558857563-b371033873b8",
    "by": "Orimi Protograph",
    "id": "dHQQv-BKTjo"
  },
  "Bananas or oranges as a snack": {
    "img": "photo-1641573260130-74d81b179809",
    "by": "Ray Shrewsberry",
    "id": "2ZgflmYgK_E"
  },
  "Taiwanese beef noodle soup (niu rou mian)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/Taiwanese_beef_noodle_soup%2C_Taipei%2C_May_2019.jpg/960px-Taiwanese_beef_noodle_soup%2C_Taipei%2C_May_2019.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "NevinThompson",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Taiwanese_beef_noodle_soup,_Taipei,_May_2019.jpg"
  },
  "Taiwanese braised pork rice (lu rou fan)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/75/Cubed_Pork_with_Rice.jpg/960px-Cubed_Pork_with_Rice.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "kawanet",
    "license": "CC BY 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Cubed_Pork_with_Rice.jpg"
  },
  "Taiwanese salt and pepper fried chicken (yan su ji)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/TWBC_Taiwanese_fried_chicken_20070303.jpg/960px-TWBC_Taiwanese_fried_chicken_20070303.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "JeanHavoc",
    "license": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:TWBC_Taiwanese_fried_chicken_20070303.jpg"
  },
  "Shanghai soup dumplings (xiao long bao)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/2019-02-22_Xiaolongbao_in_%22Taste_Of_Shanghai%22_restaurant%2C_Sydney%2C_Australia.jpg/960px-2019-02-22_Xiaolongbao_in_%22Taste_Of_Shanghai%22_restaurant%2C_Sydney%2C_Australia.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Maksym Kozlenko",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:2019-02-22_Xiaolongbao_in_%22Taste_Of_Shanghai%22_restaurant,_Sydney,_Australia.jpg"
  },
  "Mapo tofu": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Authentic_Mapo_Tofu.jpg/960px-Authentic_Mapo_Tofu.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Sichuanfoodlover",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Authentic_Mapo_Tofu.jpg"
  },
  "Hainanese chicken rice": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Hainanese_chicken_rice_in_Singapore.jpg/960px-Hainanese_chicken_rice_in_Singapore.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Pauloleong2002",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Hainanese_chicken_rice_in_Singapore.jpg"
  },
  "Wonton noodle soup": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Wonton_Noodle_Soup_01.jpg/960px-Wonton_Noodle_Soup_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Jlje",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Wonton_Noodle_Soup_01.jpg"
  },
  "Char siu (BBQ pork) over rice": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Rice_with_Char_Siu_and_Meigan_Cai_Minced_Pork.jpg/960px-Rice_with_Char_Siu_and_Meigan_Cai_Minced_Pork.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Neodymium+Nd",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Rice_with_Char_Siu_and_Meigan_Cai_Minced_Pork.jpg"
  },
  "Home-style fried rice": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/13/A_bilao_of_salted_egg%2C_seafood%2C_porkchop_and_fried_rice.jpg/960px-A_bilao_of_salted_egg%2C_seafood%2C_porkchop_and_fried_rice.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Irvin Parco Sto. Tomas",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:A_bilao_of_salted_egg,_seafood,_porkchop_and_fried_rice.jpg"
  },
  "Steamed fish with soy sauce": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Cantonese_style_steamed_fish_and_special_side_dishes_in_lunch.jpg/960px-Cantonese_style_steamed_fish_and_special_side_dishes_in_lunch.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Apeach316",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Cantonese_style_steamed_fish_and_special_side_dishes_in_lunch.jpg"
  },
  "Zongzi (sticky rice dumplings)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Two_Zongzi.jpg/960px-Two_Zongzi.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Stevenliuyi",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Two_Zongzi.jpg"
  },
  "Banh mi": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/B%C3%A1nh_mi_Sandwich%28Takadanobaba%29IMG_20220215_104413_03.jpg/960px-B%C3%A1nh_mi_Sandwich%28Takadanobaba%29IMG_20220215_104413_03.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "経済特区",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:B%C3%A1nh_mi_Sandwich(Takadanobaba)IMG_20220215_104413_03.jpg"
  },
  "Grilled pork vermicelli bowl (bun thit nuong)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/B%C3%BAn_Th%E1%BB%8Bt_N%C6%B0%E1%BB%9Bng_Ch%E1%BA%A3_Gi%C3%B2.JPG/960px-B%C3%BAn_Th%E1%BB%8Bt_N%C6%B0%E1%BB%9Bng_Ch%E1%BA%A3_Gi%C3%B2.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Calvin Neonardi",
    "license": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:B%C3%BAn_Th%E1%BB%8Bt_N%C6%B0%E1%BB%9Bng_Ch%E1%BA%A3_Gi%C3%B2.JPG"
  },
  "Kimchi stew (kimchi jjigae)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Korean_stew-Kimchi_jjigae-01.jpg/960px-Korean_stew-Kimchi_jjigae-01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "miyagawa",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Korean_stew-Kimchi_jjigae-01.jpg"
  },
  "Bibimbap": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Korean.food-Bibimbap-02.jpg/960px-Korean.food-Bibimbap-02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "abex",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Korean.food-Bibimbap-02.jpg"
  },
  "Japanese ramen at a restaurant": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Ramen_Bowl_2.jpg/960px-Ramen_Bowl_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Shisma",
    "license": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Ramen_Bowl_2.jpg"
  },
  "Teriyaki chicken bowl": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg/960px-Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "CNEcija12345",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Bowl_of_Teriyaki_chicken_and_beef_YakinikuCNE.jpg"
  },
  "Pad thai": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Pad_Thai_Noodles_-_Little_Thai%2C_Brighton_2024-03-21.jpg/960px-Pad_Thai_Noodles_-_Little_Thai%2C_Brighton_2024-03-21.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Andy Li",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Pad_Thai_Noodles_-_Little_Thai,_Brighton_2024-03-21.jpg"
  },
  "Thai green curry with rice": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Thai_green_chicken_curry_at_Highgate_Cricket_Club%2C_Crouch_End%2C_London_1.jpg/960px-Thai_green_chicken_curry_at_Highgate_Cricket_Club%2C_Crouch_End%2C_London_1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Acabashi",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Thai_green_chicken_curry_at_Highgate_Cricket_Club,_Crouch_End,_London_1.jpg"
  },
  "Pancit (bihon or canton)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Pancit_canton.jpg/960px-Pancit_canton.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Andrea Fistetto",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Pancit_canton.jpg"
  },
  "Lumpia shanghai": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/Lumpia_Shanghai_Meal_%28Taichung%29%2C_Feb_2025.jpg/960px-Lumpia_Shanghai_Meal_%28Taichung%29%2C_Feb_2025.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Ralff Nestor Nacor",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Lumpia_Shanghai_Meal_(Taichung),_Feb_2025.jpg"
  },
  "Tocino or longganisa breakfast (silog)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1f/Tocilog.jpg/960px-Tocilog.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Maffeth.opiana",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Tocilog.jpg"
  },
  "Pozole": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Pozole%2C_Mazatl%C3%A1n%2C_13_de_marzo_de_2023_02.jpg/960px-Pozole%2C_Mazatl%C3%A1n%2C_13_de_marzo_de_2023_02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "El Nuevo Doge",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Pozole,_Mazatl%C3%A1n,_13_de_marzo_de_2023_02.jpg"
  },
  "Street tacos (carne asada or pollo)": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Tacos_al_pastor.jpg/960px-Tacos_al_pastor.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "T.Tseng",
    "license": "CC BY 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Tacos_al_pastor.jpg"
  },
  "Tamales": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Tamales_Mexicanos_sweet_corn_tamales_06.jpg/960px-Tamales_Mexicanos_sweet_corn_tamales_06.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Usernet123u",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Tamales_Mexicanos_sweet_corn_tamales_06.jpg"
  },
  "Pupusas": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/Plain_pupusas_revueltas.jpg/960px-Plain_pupusas_revueltas.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Jess Lander",
    "license": "CC BY 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Plain_pupusas_revueltas.jpg"
  },
  "Butter chicken with naan": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Chicken_makhani.jpg/960px-Chicken_makhani.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "stu_spivack",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Chicken_makhani.jpg"
  },
  "Chicken biryani": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5f/Shrimp_Biriyani.JPG/960px-Shrimp_Biriyani.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Jyothis",
    "license": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Shrimp_Biriyani.JPG"
  },
  "Samosas or pakoras": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Indian_Samosa_by_clumsy_home_chef.jpg/960px-Indian_Samosa_by_clumsy_home_chef.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "ClumsyHomeChef",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Indian_Samosa_by_clumsy_home_chef.jpg"
  },
  "Chicken shawarma plate": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Plate_Shawarma_-_variant.jpg/960px-Plate_Shawarma_-_variant.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Vis M",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Plate_Shawarma_-_variant.jpg"
  },
  "Hummus and pita": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Homemade_hummus_and_pita_03.jpg/960px-Homemade_hummus_and_pita_03.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Satdeep Gill",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Homemade_hummus_and_pita_03.jpg"
  },
  "Greek salad with feta and olives": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Flickr_-_cyclonebill_-_Gr%C3%A6sk_salat.jpg/960px-Flickr_-_cyclonebill_-_Gr%C3%A6sk_salat.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "cyclonebill",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Flickr_-_cyclonebill_-_Gr%C3%A6sk_salat.jpg"
  },
  "Jollof rice": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Jollof_rice_and_Dodo.jpg/960px-Jollof_rice_and_Dodo.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Skarfmacaronne",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Jollof_rice_and_Dodo.jpg"
  },
  "Store-bought rotisserie chicken": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/RotisserieChicken.jpg/960px-RotisserieChicken.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Joe Schneid, Louisville, KY",
    "license": "CC BY 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:RotisserieChicken.jpg"
  },
  "Fruit smoothie or juice": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dc/Fresh_fruit_smoothie_preparation_with_assorted_fruits_on_a_table.jpg/960px-Fresh_fruit_smoothie_preparation_with_assorted_fruits_on_a_table.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Shixart1985",
    "license": "CC BY 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:Fresh_fruit_smoothie_preparation_with_assorted_fruits_on_a_table.jpg"
  },
  "Coffee with non-dairy creamer": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Cup_of_coffee_with_creamer.jpg/960px-Cup_of_coffee_with_creamer.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Corn cheese (Wikimedia user)",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Cup_of_coffee_with_creamer.jpg"
  },
  "Bacon, eggs and toast": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Breakfast_in_Australia%3B_bacon_and_fried_eggs_on_toast.jpg/960px-Breakfast_in_Australia%3B_bacon_and_fried_eggs_on_toast.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Kgbo",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Breakfast_in_Australia;_bacon_and_fried_eggs_on_toast.jpg"
  },
  "Restaurant salad": {
    "src": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Plant-fruit-bowl-dish-food-salad-1200225-pxhere.jpg/960px-Plant-fruit-bowl-dish-food-salad-1200225-pxhere.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    "by": "Unknown author",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Plant-fruit-bowl-dish-food-salad-1200225-pxhere.jpg"
  }
};

/** Image URL. Unsplash entries are sized by their CDN; Wikimedia Commons entries carry a ready thumbnail. */
export function photoUrl(entry, w = 640, h = 420) {
  if (entry.src) return entry.src;
  return `https://images.unsplash.com/${entry.img}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;
}

/** The photo's own page (photographer and license). */
export const photoPage = (entry) => entry.page || `https://unsplash.com/photos/${entry.id}?utm_source=fuelwell&utm_medium=referral`;

/** Where the photo is from, for the credit line: "Unsplash" or "Wikimedia Commons, CC BY-SA 4.0". */
export const photoSource = (entry) => (entry.license ? `Wikimedia Commons, ${entry.license}` : 'Unsplash');
