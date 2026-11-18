export type SampleSeed = {
  countryCode: string;
  regionCode: string;
  townName: string;
  communityName: string;
  skillId: string;
  years: number;
  displayName: string;
  experience: string;
  photo: string;
};

export const SAMPLES: SampleSeed[] = [
  {
    countryCode: "GH",
    regionCode: "GA",
    townName: "Accra",
    communityName: "Osu",
    skillId: "painter",
    years: 11,
    displayName: "Ama Mensah",
    photo: "/samples/painter.jpg",
    experience:
      "I paint homes and small offices around Osu, Labone and Cantonments. Interior walls, exterior weather coating, and clean line work on gates. I bring my own brushes and agree the colour with you before I open a tin.",
  },
  {
    countryCode: "GH",
    regionCode: "AH",
    townName: "Kumasi",
    communityName: "Adum",
    skillId: "ac-repair",
    years: 8,
    displayName: "Kwame Boateng",
    photo: "/samples/ac.jpg",
    experience:
      "I service and repair split air conditioners for homes and shops. Gas refill, drainage, and noisy indoor units. I work across Adum, Bantama and Asokwa and I show you the fault before I replace a part.",
  },
  {
    countryCode: "NG",
    regionCode: "LA",
    townName: "Ikeja",
    communityName: "Allen",
    skillId: "hairstylist",
    years: 6,
    displayName: "Aisha Bello",
    photo: "/samples/braids.jpg",
    experience:
      "Braids, twists, and natural hair care from a chair in Allen. I take appointments and I bring my own products if you would rather not buy them. The work I am proudest of is neat cornrows that last the month.",
  },
  {
    countryCode: "NG",
    regionCode: "FC",
    townName: "Abuja",
    communityName: "Wuse",
    skillId: "electrician",
    years: 14,
    displayName: "Chinedu Okafor",
    photo: "/samples/electrician.jpg",
    experience:
      "House wiring, distribution boards, and fault finding. I do not leave open joints. Most of my jobs are flats in Wuse and Garki. I will tell you if a job needs a certified inspection before I start.",
  },
  {
    countryCode: "KE",
    regionCode: "NB",
    townName: "Nairobi",
    communityName: "Westlands",
    skillId: "tailor",
    years: 9,
    displayName: "Wanjiku Njeri",
    photo: "/samples/tailor.jpg",
    experience:
      "I cut and sew everyday dresses, school uniforms, and alterations from wax print and plain cloth. Fittings are in Westlands. I keep your measurements and I do not rush a guest outfit the night before.",
  },
  {
    countryCode: "ZA",
    regionCode: "GP",
    townName: "Johannesburg",
    communityName: "Soweto",
    skillId: "carpenter",
    years: 17,
    displayName: "Thabo Molefe",
    photo: "/samples/carpenter.jpg",
    experience:
      "Tables, door frames, kitchen cabinets, and roof timber. I have worked from a Soweto workshop since I was an apprentice. I measure twice and I leave the site swept when the job is done.",
  },
  {
    countryCode: "GH",
    regionCode: "GA",
    townName: "Accra",
    communityName: "Labone",
    skillId: "gardener",
    years: 12,
    displayName: "Efua Darko",
    photo: "/samples/garden.jpg",
    experience:
      "I keep home gardens in Labone and Cantonments: lawn edges, hedges, flower beds, and watering. I bring my own shears and I leave clippings bagged. The garden in the photo is a compound I tend every week.",
  },
];
