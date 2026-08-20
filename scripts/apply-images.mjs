import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function commonsPageUrl(title) {
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

// Curated from a manual review of Wikimedia Commons search results — only
// confident, correctly-labelled matches are included. Devices without a
// confident match are intentionally left without an image.
const images = {
  "ipad-pro-m4": {
    title: "File:M4 iPad Pro front camera and Apple pencil.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/M4_iPad_Pro_front_camera_and_Apple_pencil.jpg/1920px-M4_iPad_Pro_front_camera_and_Apple_pencil.jpg",
    width: 3840, height: 2160, license: "CC BY-SA 4.0", artist: "Kyu3a",
  },
  "ipad-pro-m5": {
    title: "File:11-inch iPad Pro M5 with Apple Pencil Pro.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/11-inch_iPad_Pro_M5_with_Apple_Pencil_Pro.jpg/1920px-11-inch_iPad_Pro_M5_with_Apple_Pencil_Pro.jpg",
    width: 3024, height: 4032, license: "CC BY-SA 4.0", artist: "茅野ふたば",
  },
  "iphone-16": {
    title: "File:IPhone 16 series in Apple Store Nagoya Sakae.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/IPhone_16_series_in_Apple_Store_Nagoya_Sakae.jpg/1920px-IPhone_16_series_in_Apple_Store_Nagoya_Sakae.jpg",
    width: 2880, height: 2160, license: "CC BY-SA 4.0", artist: "Kyu3a",
  },
  "iphone-16-plus": {
    title: "File:About iPhone 16 Plus Teal.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/About_iPhone_16_Plus_Teal.jpg/1920px-About_iPhone_16_Plus_Teal.jpg",
    width: 3024, height: 4032, license: "CC BY-SA 4.0", artist: "メイド理世",
  },
  "iphone-16-pro": {
    title: "File:IPhone 16 Pro Max Desert Titanium Rear.png",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/IPhone_16_Pro_Max_Desert_Titanium_Rear.png/1920px-IPhone_16_Pro_Max_Desert_Titanium_Rear.png",
    width: 2048, height: 1536, license: "CC BY 4.0", artist: "Padgriffin (Pro Max shown, same design as Pro)",
  },
  "iphone-16-pro-max": {
    title: "File:IPhone 16 Pro Max Desert Titanium Rear.png",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/IPhone_16_Pro_Max_Desert_Titanium_Rear.png/1920px-IPhone_16_Pro_Max_Desert_Titanium_Rear.png",
    width: 2048, height: 1536, license: "CC BY 4.0", artist: "Padgriffin",
  },
  "iphone-16e": {
    title: "File:IPhone 16e Black.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/IPhone_16e_Black.jpg/1920px-IPhone_16e_Black.jpg",
    width: 2943, height: 3382, license: "CC BY 4.0", artist: "Jakub CA",
  },
  "iphone-17": {
    title: "File:IPhone 17 launch at Apple TRX Malaysia 13.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/IPhone_17_launch_at_Apple_TRX_Malaysia_13.jpg/1920px-IPhone_17_launch_at_Apple_TRX_Malaysia_13.jpg",
    width: 4160, height: 6240, license: "CC0", artist: "Ahmad Ali Karim",
  },
  "iphone-17-pro": {
    title: "File:IPhone 17 launch at Apple TRX Malaysia 76.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/IPhone_17_launch_at_Apple_TRX_Malaysia_76.jpg/1920px-IPhone_17_launch_at_Apple_TRX_Malaysia_76.jpg",
    width: 6240, height: 4160, license: "CC0", artist: "Ahmad Ali Karim",
  },
  "iphone-17-pro-max": {
    title: "File:Silver iPhone 17 Pro Max.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Silver_iPhone_17_Pro_Max.jpg/1920px-Silver_iPhone_17_Pro_Max.jpg",
    width: 4160, height: 6240, license: "CC0", artist: "Ahmad Ali Karim",
  },
  "iphone-air": {
    title: "File:Space Black iPhone Air.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Space_Black_iPhone_Air.jpg/1920px-Space_Black_iPhone_Air.jpg",
    width: 3973, height: 5959, license: "CC0", artist: "Ahmad Ali Karim",
  },
  "mac-mini-m4": {
    title: "File:M4 Mac mini.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/M4_Mac_mini.jpg/1920px-M4_Mac_mini.jpg",
    width: 4032, height: 3024, license: "CC BY-SA 4.0", artist: "Kyu3a",
  },
  "macbook-pro-14-m5": {
    title: "File:MacBook Pro (14-inch, M5, Space Black).jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/MacBook_Pro_%2814-inch%2C_M5%2C_Space_Black%29.jpg/1920px-MacBook_Pro_%2814-inch%2C_M5%2C_Space_Black%29.jpg",
    width: 5712, height: 4284, license: "CC0", artist: "AzureSaturn",
  },
  "macbook-pro-14-16-m4-pro-max": {
    title: "File:MacBook Pro (16-inch, M4 Pro, Silver).jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/MacBook_Pro_%2816-inch%2C_M4_Pro%2C_Silver%29.jpg/1920px-MacBook_Pro_%2816-inch%2C_M4_Pro%2C_Silver%29.jpg",
    width: 5712, height: 4284, license: "CC0", artist: "AzureSaturn",
  },
  "redmi-k80-pro": {
    title: "File:REDMI K80 Pro Xiaomi Store.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/REDMI_K80_Pro_Xiaomi_Store.jpg/1920px-REDMI_K80_Pro_Xiaomi_Store.jpg",
    width: 3072, height: 4096, license: "CC BY-SA 4.0", artist: "GVZpedia",
  },
  "xiaomi-15": {
    title: "File:Xiaomi 15 (1).jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Xiaomi_15_%281%29.jpg/1920px-Xiaomi_15_%281%29.jpg",
    width: 4032, height: 3024, license: "CC BY-SA 4.0", artist: "茅野ふたば",
  },
  "xiaomi-15-pro": {
    title: "File:Xiaomi 15 Pro (1).jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Xiaomi_15_Pro_%281%29.jpg/1920px-Xiaomi_15_Pro_%281%29.jpg",
    width: 4032, height: 3024, license: "CC BY-SA 4.0", artist: "茅野ふたば",
  },
  "xiaomi-15-ultra": {
    title: "File:Xiaomi 15 Ultra.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Xiaomi_15_Ultra.jpg/1920px-Xiaomi_15_Ultra.jpg",
    width: 8000, height: 4500, license: "CC BY-SA 4.0", artist: "Andreas Fuchs/Weber Shandwick",
  },
  "xiaomi-17": {
    title: "File:Xiaomi 17.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Xiaomi_17.jpg",
    width: 1536, height: 2048, license: "CC BY-SA 4.0", artist: "茅野ふたば",
  },
  "xiaomi-17-pro": {
    title: "File:Xiaomi 17 Pro backside (Black).jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/10/Xiaomi_17_Pro_backside_%28Black%29.jpg",
    width: 1536, height: 2048, license: "CC BY-SA 4.0", artist: "茅野ふたば",
  },
  "xiaomi-17-pro-max": {
    title: "File:Xiaomi 17 Pro Max.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Xiaomi_17_Pro_Max.jpg",
    width: 1536, height: 2048, license: "CC BY-SA 4.0", artist: "茅野ふたば",
  },
  "xiaomi-pad-7-ultra": {
    title: "File:Xiaomi Pad 7 Ultra 及其触控笔、悬浮键盘配件（小米之家样机）.jpg",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Xiaomi_Pad_7_Ultra_%E5%8F%8A%E5%85%B6%E8%A7%A6%E6%8E%A7%E7%AC%94%E3%80%81%E6%82%AC%E6%B5%AE%E9%94%AE%E7%9B%98%E9%85%8D%E4%BB%B6%EF%BC%88%E5%B0%8F%E7%B1%B3%E4%B9%8B%E5%AE%B6%E6%A0%B7%E6%9C%BA%EF%BC%89.jpg/1920px-Xiaomi_Pad_7_Ultra_%E5%8F%8A%E5%85%B6%E8%A7%A6%E6%8E%A7%E7%AC%94%E3%80%81%E6%82%AC%E6%B5%AE%E9%94%AE%E7%9B%98%E9%85%8D%E4%BB%B6%EF%BC%88%E5%B0%8F%E7%B1%B3%E4%B9%8B%E5%AE%B6%E6%A0%B7%E6%9C%BA%EF%BC%89.jpg",
    width: 8160, height: 6120, license: "CC BY-SA 4.0", artist: "MomodaniSakura",
  },
};

async function main() {
  let updated = 0;
  for (const [slug, img] of Object.entries(images)) {
    const device = await prisma.device.findUnique({ where: { slug } });
    if (!device) {
      console.log(`  ! no device found for slug ${slug}`);
      continue;
    }
    await prisma.device.update({
      where: { slug },
      data: {
        imageUrl: img.url,
        imageWidth: img.width,
        imageHeight: img.height,
        imageLicense: img.license,
        imageAttributionText: `Photo: ${img.artist} / ${img.license}, via Wikimedia Commons`,
        imageAttributionUrl: commonsPageUrl(img.title),
      },
    });
    updated++;
  }
  console.log(`Updated ${updated} devices with real Wikimedia Commons photos.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
