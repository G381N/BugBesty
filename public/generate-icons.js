// generate-icons.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Check if ImageMagick is installed
exec('which convert', (error, stdout) => {
  if (error) {
    console.log('ImageMagick is not installed. Please install it with:');
    console.log('sudo apt-get update && sudo apt-get install -y imagemagick');
    process.exit(1);
  }
  
  // Generate favicon.ico from SVG
  exec('convert -background none -size 32x32 favicon.svg favicon.ico', {
    cwd: path.resolve(__dirname)
  }, (error) => {
    if (error) {
      console.error('Error generating favicon.ico:', error);
    } else {
      console.log('favicon.ico generated successfully');
    }
  });
  
  // Generate apple-icon.png from SVG
  exec('convert -background none -size 180x180 favicon.svg apple-icon.png', {
    cwd: path.resolve(__dirname)
  }, (error) => {
    if (error) {
      console.error('Error generating apple-icon.png:', error);
    } else {
      console.log('apple-icon.png generated successfully');
    }
  });
}); 