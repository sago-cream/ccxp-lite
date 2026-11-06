// Lucide icon geometry from lucide-icons/lucide@b826f0c527e1498f5e46f41ca0277ccab144bf31. ISC /
// MIT; see ../LUCIDE-LICENSE.
export const lucideIconShapes: Readonly<
  Record<string, ReadonlyArray<string | { tag: string; attributes: Record<string, string> }>>
> = {
  "refresh-cw": [
    "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
    "M21 3v5h-5",
    "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
    "M8 16H3v5",
  ],
  "panel-left": [
    {
      tag: "rect",
      attributes: {
        width: "18",
        height: "18",
        x: "3",
        y: "3",
        rx: "2",
      },
    },
    "M9 3v18",
  ],
  "panel-left-close": [
    {
      tag: "rect",
      attributes: {
        width: "18",
        height: "18",
        x: "3",
        y: "3",
        rx: "2",
      },
    },
    "M9 3v18",
    "m16 15-3-3 3-3",
  ],
  "volume-2": [
    "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",
    "M16 9a5 5 0 0 1 0 6",
    "M19.364 18.364a9 9 0 0 0 0-12.728",
  ],
  eye: [
    "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
    {
      tag: "circle",
      attributes: {
        cx: "12",
        cy: "12",
        r: "3",
      },
    },
  ],
  "eye-off": [
    "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
    "M14.084 14.158a3 3 0 0 1-4.242-4.242",
    "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
    "m2 2 20 20",
  ],
  "external-link": [
    "M15 3h6v6",
    "M10 14 21 3",
    "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
  ],
  "circle-question-mark": [
    {
      tag: "circle",
      attributes: {
        cx: "12",
        cy: "12",
        r: "10",
      },
    },
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    "M12 17h.01",
  ],
  megaphone: [
    "M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
    "M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14",
    "M8 6v8",
  ],
};
