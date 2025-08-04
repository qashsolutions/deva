const fs = require('fs');
const path = require('path');

// Create a proper 1x1 orange PNG
const createOrangePNG = () => {
  // This is a valid 1x1 orange PNG file
  const hexString = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c62f8cf400000018100814f7df2470000000049454e44ae426082';
  return Buffer.from(hexString, 'hex');
};

// Create all placeholder images
const orangePNG = createOrangePNG();

const files = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];

files.forEach(file => {
  fs.writeFileSync(path.join(__dirname, file), orangePNG);
  console.log(`Created ${file}`);
});

console.log('All placeholder images created successfully!');