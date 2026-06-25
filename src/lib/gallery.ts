/**
 * Showcase prints from the lab. Each image is a pre-sized 1280×1280 square WebP
 * under /public/gallery. Captions are descriptive/generic by design.
 */
export interface GalleryItem {
  src: string;
  title: string;
  subtitle: string;
  alt: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: "/gallery/01-skull-mask.webp",
    title: "Skull Mask",
    subtitle: "Horned skull, smooth finish",
    alt: "3D-printed horned skull mask with a smooth surface finish",
  },
  {
    src: "/gallery/02-blocky-figure.webp",
    title: "Blocky Figure",
    subtitle: "Blocky character figure",
    alt: "3D-printed blocky character figure",
  },
  {
    src: "/gallery/03-chibi-villain.webp",
    title: "Chibi Villain",
    subtitle: "Stylized chibi figure",
    alt: "3D-printed stylized chibi villain figure",
  },
  {
    src: "/gallery/04-baby-dragon.webp",
    title: "Baby Dragon",
    subtitle: "Creature figurine",
    alt: "3D-printed baby dragon creature figurine",
  },
  {
    src: "/gallery/05-articulated-dragon.webp",
    title: "Articulated Dragon",
    subtitle: "Print-in-place, fully articulated",
    alt: "3D-printed fully articulated, print-in-place dragon",
  },
  {
    src: "/gallery/06-geometric-vase.webp",
    title: "Geometric Vase",
    subtitle: "Spiralized vase-mode print",
    alt: "3D-printed geometric vase made in spiralized vase mode",
  },
  {
    src: "/gallery/07-mech-robot.webp",
    title: "Mech Robot",
    subtitle: "Detailed armored figure",
    alt: "3D-printed detailed armored mech robot figure",
  },
  {
    src: "/gallery/08-desk-organizer.webp",
    title: "Desk Organizer",
    subtitle: "Functional hex organizer",
    alt: "3D-printed functional hexagonal desk organizer",
  },
];
