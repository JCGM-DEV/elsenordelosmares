import sharp from 'sharp';

const variants = [
  // barco variants
  { src: 'public/barco.webp', dest: 'public/barco_noche.webp',       opts: { brightness: 0.5, saturation: 0.6 }, tint: { r: 30, g: 50, b: 100 } },
  { src: 'public/barco.webp', dest: 'public/barco_tormenta.webp',    opts: { brightness: 0.6, saturation: 0.4 }, tint: { r: 60, g: 60, b: 80 } },
  { src: 'public/barco.webp', dest: 'public/barco_amanecer.webp',    opts: { brightness: 1.1, saturation: 1.4 }, tint: { r: 200, g: 120, b: 60 } },

  // taberna variants
  { src: 'public/taberna.webp', dest: 'public/taberna_noche.webp',   opts: { brightness: 0.55, saturation: 0.8 }, tint: { r: 80, g: 50, b: 20 } },
  { src: 'public/taberna.webp', dest: 'public/taberna_madrid.webp',  opts: { brightness: 0.75, saturation: 1.1 }, tint: { r: 120, g: 80, b: 40 } },

  // convento variants
  { src: 'public/convento_pergamino.webp', dest: 'public/pergamino_real.webp',   opts: { brightness: 1.1, saturation: 1.2 }, tint: { r: 200, g: 160, b: 80 } },
  { src: 'public/convento_pergamino.webp', dest: 'public/carta_cifrada.webp',    opts: { brightness: 0.7, saturation: 0.7 }, tint: { r: 60, g: 80, b: 60 } },

  // escorial variants
  { src: 'public/escorial.webp', dest: 'public/escorial_noche.webp', opts: { brightness: 0.45, saturation: 0.5 }, tint: { r: 20, g: 20, b: 60 } },

  // calles variants
  { src: 'public/calles.webp', dest: 'public/calles_lisboa.webp',    opts: { brightness: 0.9, saturation: 1.3 }, tint: { r: 100, g: 140, b: 160 } },

  // astilleros variants
  { src: 'public/astilleros.webp', dest: 'public/astilleros_noche.webp', opts: { brightness: 0.5, saturation: 0.7 }, tint: { r: 40, g: 60, b: 100 } },

  // despacho variants
  { src: 'public/despacho.webp', dest: 'public/despacho_secretario.webp', opts: { brightness: 0.8, saturation: 0.9 }, tint: { r: 100, g: 80, b: 40 } },
];

for (const v of variants) {
  try {
    await sharp(v.src)
      .modulate(v.opts)
      .tint(v.tint)
      .webp({ quality: 82 })
      .toFile(v.dest);
    console.log('✓ ' + v.dest);
  } catch(e) {
    console.error('✗ ' + v.dest + ': ' + e.message);
  }
}
console.log('Done.');
