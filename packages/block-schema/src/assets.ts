/**
 * Curated media for blocks — the only place block imagery comes from.
 *
 * Every entry was checked to load (2026-10-04). Blocks reference assets by id;
 * swapping an image is a one-line change here. Sources:
 *   - Lummi  (assets.lummi.ai)  — free for commercial use, no attribution required
 *   - Pexels (videos.pexels.com) — Pexels License, no attribution required
 *
 * `tone` is the dominant luminance under text: "dark" media takes light text
 * (pair with surface="dark-always" + a scrim), "light" media takes dark text.
 */

export type AssetSource = "lummi" | "unsplash" | "pexels";
export type AssetTone = "light" | "dark" | "mixed";

export interface BlockImageAsset {
  kind: "image";
  id: string;
  source: AssetSource;
  /** Base URL without size parameters — use `imageUrl()` to size it. */
  url: string;
  alt: string;
  tone: AssetTone;
  orientation: "landscape" | "portrait" | "square";
  /** CSS object-position hint when cropping. */
  focal?: string;
}

export interface BlockVideoAsset {
  kind: "video";
  id: string;
  source: AssetSource;
  /** 1280×720 H.264, ≤3.5MB. */
  url: string;
  poster: string;
  alt: string;
  tone: AssetTone;
  sizeMB: number;
}

const lummi = (cid: string) => `https://assets.lummi.ai/assets/${cid}`;

export const BLOCK_IMAGES = {
  "coastal-sea-of-clouds": { kind: "image", id: "coastal-sea-of-clouds", source: "lummi", url: lummi("QmdLakoNk3qs6vW6GP3zzTGms5ugPKyBKhC2RvjDmhj8h3"), alt: "Soft morning light over a coastline wrapped in low clouds", tone: "light", orientation: "landscape", focal: "center 60%" },
  "couple-pink-wall": { kind: "image", id: "couple-pink-wall", source: "lummi", url: lummi("QmTsaPtLFDMQpYQYMP9C1qWfaxtEWp1EcQUNPQgT4mXY29"), alt: "A couple sitting close together against a warm pink wall", tone: "mixed", orientation: "landscape", focal: "center 40%" },
  "sunlit-living-room": { kind: "image", id: "sunlit-living-room", source: "lummi", url: lummi("QmVQ6Y2zm36g3VK9LHzgCKqJEbTbL8GYXtmjuHB3nkgzeX"), alt: "A bright living room with a cream sofa in afternoon sun", tone: "light", orientation: "landscape" },
  "pilea-on-white": { kind: "image", id: "pilea-on-white", source: "lummi", url: lummi("QmekBZwPh4KM1bLSWAVTRdXotDy2SMyHey3kHHihvoUMKS"), alt: "A young pilea plant in a white pot by a window", tone: "light", orientation: "landscape" },
  "coins-on-peach": { kind: "image", id: "coins-on-peach", source: "lummi", url: lummi("QmSETVchufAEGoYU15T4nFMVr5EKkqp5ZaM5UJmNe8omSw"), alt: "Scattered coins on a peach background", tone: "mixed", orientation: "landscape" },
  "pastel-home": { kind: "image", id: "pastel-home", source: "lummi", url: lummi("QmWfAxfaHHUvxEgKJfYFFSnZH6HAiMKdem6ytSq1dx6CYk"), alt: "A calm pastel living space with mint walls and a yellow armchair", tone: "light", orientation: "landscape" },
  "mountain-road-trip": { kind: "image", id: "mountain-road-trip", source: "lummi", url: lummi("QmdLyEimZF4pscpxK3WKsqffRJ4sjzDgMMz3U8BLjV1z5z"), alt: "A car parked beneath snow-capped mountains", tone: "mixed", orientation: "landscape" },
  "plant-two-tone-wall": { kind: "image", id: "plant-two-tone-wall", source: "lummi", url: lummi("QmfSCe21jQS5RRs8FtCXUt2MKCaKBGgDs2ziDzCs751LEx"), alt: "A small potted tree against a two-tone peach wall", tone: "light", orientation: "landscape" },
  "pastel-swathes": { kind: "image", id: "pastel-swathes", source: "lummi", url: lummi("QmbWYxBrT5mY81ZfHxi7UgTKWrd8nZ1D5FbPKqNPXxq4Yr"), alt: "Layered strokes of pastel paint", tone: "light", orientation: "landscape" },
  "succulent-windowsill": { kind: "image", id: "succulent-windowsill", source: "lummi", url: lummi("QmQ57n8BauDZPxxXUZX1wLGVZDjYBbYXMd5JXWTrrenLqq"), alt: "A succulent on a bright windowsill", tone: "light", orientation: "landscape" },
  "plant-on-violet": { kind: "image", id: "plant-on-violet", source: "lummi", url: lummi("QmUZSfo6iirpxahg1UvF4Pof4D4PrQQMTLBtV3ajSHnHCq"), alt: "A potted plant casting shadows on a violet wall", tone: "mixed", orientation: "landscape" },
  "golden-hills-dusk": { kind: "image", id: "golden-hills-dusk", source: "lummi", url: lummi("QmVUhpcUfSHzRLkfpCkKZb8Q2FrYitiVwsi4cRTXF2aXVY"), alt: "Golden hills around a still pond at dusk", tone: "dark", orientation: "landscape" },
  "warm-living-room": { kind: "image", id: "warm-living-room", source: "lummi", url: lummi("QmQrVUM5reCYVXq4MvwjghJ9Uhx9Uh4oKm6Y9xBzGE9x1S"), alt: "A warm red living room with a low sofa", tone: "mixed", orientation: "landscape" },
  "pastel-abstract": { kind: "image", id: "pastel-abstract", source: "lummi", url: lummi("QmXoc6KwhsbBvmRLWtjbJMuSd2AgBm14J2qaKz6EDhqdhe"), alt: "", tone: "light", orientation: "landscape" },
  "hand-holding-paper": { kind: "image", id: "hand-holding-paper", source: "lummi", url: lummi("QmNqSc99v97Dd7Ba2F1aH4snKgMG1SuM6Mb32S7tox2N7p"), alt: "A hand holding a printed receipt", tone: "light", orientation: "landscape" },
  "older-couple-sofa": { kind: "image", id: "older-couple-sofa", source: "lummi", url: lummi("QmULxW5RiD6JXPPTCHnAuXU85bSpuFV72om4tWYar6iDpR"), alt: "An older couple relaxing together on a sofa", tone: "light", orientation: "landscape" },
  "duo-on-steps": { kind: "image", id: "duo-on-steps", source: "lummi", url: lummi("QmbrmPcCX22Bft158BFHdPU2p1FpYx8GMKtLNgZzohC5rY"), alt: "Two friends sitting on front steps", tone: "mixed", orientation: "landscape" },
  // Portraits (avatars, testimonials, people) — square crops via object-position.
  "portrait-amara": { kind: "image", id: "portrait-amara", source: "lummi", url: lummi("QmUWu25KJZruktibFUXivSoPDWmKs3S9ASXp7zVENaXSqL"), alt: "Portrait of a woman in soft light", tone: "light", orientation: "portrait", focal: "center 30%" },
  "portrait-lucia": { kind: "image", id: "portrait-lucia", source: "lummi", url: lummi("QmX5eK5oLpmJmSstwYVDmKtsUjU7UPN3BXVMSjJkup2FZV"), alt: "Portrait of a woman with dark hair", tone: "mixed", orientation: "portrait", focal: "center 30%" },
  "portrait-mei": { kind: "image", id: "portrait-mei", source: "lummi", url: lummi("QmQcKhezkk7r1v6yWpKETiLR22bUnVth1qxou372nTSS7w"), alt: "Portrait of a woman in warm golden light", tone: "mixed", orientation: "portrait", focal: "center 30%" },
  "portrait-dev": { kind: "image", id: "portrait-dev", source: "lummi", url: lummi("QmajivGeNJJBhcUZrd52CDSeGopQ5cpeS3ew2qopjdXQBX"), alt: "Portrait of a man with a grey beard", tone: "dark", orientation: "portrait", focal: "center 30%" },
  "portrait-noah": { kind: "image", id: "portrait-noah", source: "lummi", url: lummi("QmTHAiMMnDvFtER197ogcdyViTcGbDaQ6tNH63fYX19njP"), alt: "A person holding a camera by a window", tone: "light", orientation: "portrait", focal: "center 35%" },
  "portrait-elias": { kind: "image", id: "portrait-elias", source: "lummi", url: lummi("QmXfEoGQdAQxXbT8ydEjxDR8UtXpmywjsqyUQCUeDLz4Ej"), alt: "Portrait of a bearded man in profile", tone: "dark", orientation: "portrait", focal: "center 30%" },
  "portrait-zuri": { kind: "image", id: "portrait-zuri", source: "lummi", url: lummi("Qma5G7Ysfs1veKyTEdAC8tPvCdM9KDGeGY3Jrsf7Bky7N7"), alt: "Portrait of a woman in natural light", tone: "dark", orientation: "portrait", focal: "center 30%" },
} satisfies Record<string, BlockImageAsset>;

export const BLOCK_VIDEOS = {
  "serene-sky": { kind: "video", id: "serene-sky", source: "pexels", url: "https://videos.pexels.com/video-files/33227529/14158549_1280_720_30fps.mp4", poster: "https://images.pexels.com/videos/33227529/fsky-33227529.jpeg", alt: "Clouds drifting across a pale blue sky", tone: "light", sizeMB: 2.1 },
  "clouds-forming": { kind: "video", id: "clouds-forming", source: "pexels", url: "https://videos.pexels.com/video-files/2865145/2865145-hd_1280_720_30fps.mp4", poster: "https://images.pexels.com/videos/2865145/free-video-2865145.jpg", alt: "Bright clouds forming in a deep blue sky", tone: "mixed", sizeMB: 3.5 },
} satisfies Record<string, BlockVideoAsset>;

export type BlockImageId = keyof typeof BLOCK_IMAGES;
export type BlockVideoId = keyof typeof BLOCK_VIDEOS;

/** Sized URL for an image asset (providers resize on the fly). */
export function imageUrl(id: BlockImageId, width = 1600): string {
  const a: BlockImageAsset = BLOCK_IMAGES[id];
  return a.source === "pexels" ? `${a.url}?auto=compress&w=${width}` : `${a.url}?auto=format&w=${width}`;
}

/** Sized poster URL for a video asset. */
export function posterUrl(id: BlockVideoId, width = 1600): string {
  return `${BLOCK_VIDEOS[id].poster}?auto=compress&w=${width}`;
}
