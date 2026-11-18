/** Consent, privacy, and trust copy. A lawyer can edit this file without changing the screens. */

export const MIN_AGE = 18;
export const HIGH_RISK_SKILLS = [
  "electrician",
  "plumber",
  "mason",
  "labourer",
  "carpenter",
  "welder",
  "healthcare",
  "home-nurse",
  "nanny",
  "childcare",
];
export const CONSENT_VERSION = 3;
export const POLICY_VERSION = "1.1";
export const POLICY_DATE = "2026-10-28";

export const PRIVACY_CONTACT = {
  email: "privacy@talentfinder.africa",
  phone: "+233 30 000 0000",
};

export const RETENTION = {
  profile: "until you delete it",
  payments: "as the law requires",
  clicksMonths: 12,
  deletionDays: 30,
  appealDays: 7,
};

export const COUNTRY_LAWS: Record<string, { en: string; fr: string }> = {
  GH: {
    en: "Ghana Data Protection Act, 2012 (Act 843).",
    fr: "Loi ghanéenne sur la protection des données, 2012 (loi 843).",
  },
  NG: {
    en: "Nigeria Data Protection Act, 2023.",
    fr: "Loi nigériane sur la protection des données, 2023.",
  },
  ZA: {
    en: "South Africa: Protection of Personal Information Act (POPIA).",
    fr: "Afrique du Sud : loi POPIA sur la protection des informations personnelles.",
  },
  ZM: {
    en: "Zambia Data Protection Act, 2021.",
    fr: "Loi zambienne sur la protection des données, 2021.",
  },
  CI: {
    en: "Côte d'Ivoire: law on the protection of personal data.",
    fr: "Côte d'Ivoire : loi relative à la protection des données à caractère personnel.",
  },
  KE: {
    en: "Kenya Data Protection Act, 2019.",
    fr: "Loi kényane sur la protection des données, 2019.",
  },
};

export type ConsentCopy = {
  title: string;
  lines: [string, string, string];
  publicOk: string;
  ownWork: string;
  adultOk: string;
  boards: string;
  tips: string;
  agree: string;
  later: string;
  privacy: string;
  terms: string;
};

export const CONSENT_COPY: Record<"en" | "fr", ConsentCopy> = {
  en: {
    title: "Publish my profile",
    lines: [
      "Your profile will be public to people in {country} who use Talent Finder Africa.",
      "These details will be shown: name, skill, Area-Region, photos of your work, and the social buttons you choose. Phone and email stay hidden until you accept a request.",
      "You must be 18 or older. People can message or share your profile. You can hide or delete it at any time.",
    ],
    publicOk: "I agree to show my profile publicly as described above.",
    ownWork: "I confirm the photos I upload are of my own work, or work I have the right to show.",
    adultOk: "I confirm I am 18 or older.",
    boards: "I agree to appear on the Most contacted and Top clicked boards.",
    tips: "Send me tips and offers.",
    agree: "Agree and publish",
    later: "Not now",
    privacy: "Privacy Policy",
    terms: "Terms",
  },
  fr: {
    title: "Publier mon profil",
    lines: [
      "Votre profil sera public pour les personnes au {country} qui utilisent Talent Finder Africa.",
      "Ces détails seront montrés : nom, métier, quartier et région, photos de votre travail, et les boutons sociaux que vous choisissez. Le téléphone et l'e-mail restent cachés tant que vous n'acceptez pas une demande.",
      "Vous devez avoir 18 ans ou plus. Les gens peuvent écrire ou partager votre profil. Vous pouvez le masquer ou le supprimer à tout moment.",
    ],
    publicOk: "J'accepte de montrer mon profil publiquement comme décrit ci-dessus.",
    ownWork: "Je confirme que les photos sont de mon travail, ou d'un travail que j'ai le droit de montrer.",
    adultOk: "Je confirme que j'ai 18 ans ou plus.",
    boards: "J'accepte de figurer sur les tableaux Les plus contactés et Les plus ouverts.",
    tips: "Envoyez-moi des conseils et des offres.",
    agree: "Accepter et publier",
    later: "Pas maintenant",
    privacy: "Politique de confidentialité",
    terms: "Conditions",
  },
};

export function consentLines(language: string, country: string): ConsentCopy {
  const copy = language === "fr" ? CONSENT_COPY.fr : CONSENT_COPY.en;
  return {
    ...copy,
    lines: copy.lines.map((line) => line.replace("{country}", country)) as ConsentCopy["lines"],
  };
}

export type PolicySection = { heading: string; paragraphs: string[] };

export type PolicyDoc = {
  version: string;
  date: string;
  title: string;
  summaryTitle: string;
  summary: string[];
  sections: PolicySection[];
};

function laws(language: "en" | "fr"): string[] {
  return Object.entries(COUNTRY_LAWS).map(([code, law]) => `${code}: ${law[language]}`);
}

const CURRENT_EN: PolicyDoc = {
  version: "1.1",
  date: "2026-10-28",
  title: "Privacy Policy",
  summaryTitle: "In short",
  summary: [
    "Talent Finder Africa is a directory of skilled hands. We run the service.",
    `Privacy questions: ${PRIVACY_CONTACT.email} or ${PRIVACY_CONTACT.phone}.`,
    "We do not sell your data to advertisers. People in another country do not see your profile.",
    "You can see, correct, download, hide, or delete your data.",
  ],
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        "Talent Finder Africa runs this directory.",
        `For privacy questions, email ${PRIVACY_CONTACT.email} or call ${PRIVACY_CONTACT.phone}.`,
        `If you cannot sign in, you can still ask us to delete your data. We answer within ${RETENTION.deletionDays} days.`,
      ],
    },
    {
      heading: "What we collect",
      paragraphs: [
        "We collect your phone number or email, your name, and the year of birth only if you give a date of birth.",
        "We collect your country, skill, area and region, photos of your work, voice notes, links, and messages you send in the app.",
        "We collect payment records, clicks on your profile, and the device information needed to run the app.",
      ],
    },
    {
      heading: "Who sees what",
      paragraphs: [
        "People in the same country see your name, skill, area and region, photos of your work, the contact buttons you chose, ratings, and badges.",
        "A hirer sees nothing more than the public sees.",
        "Only you see your own click and contact report.",
        "Staff see account records, payment records, and reports, only to run and protect the service. Every admin view is logged.",
        "The payment provider, a map or messaging provider if we use one, and the hosting company receive only what they need for that job.",
        "We never sell data to advertisers. We never show a profile to people in other countries.",
      ],
    },
    {
      heading: "Why we use it",
      paragraphs: [
        "We use the data to publish the profile you asked us to publish, to take payment, to keep the directory safe, and to answer a request to see, correct, or delete data.",
      ],
    },
    {
      heading: "How long we keep it, and where",
      paragraphs: [
        `A profile stays ${RETENTION.profile}.`,
        `Payment records stay ${RETENTION.payments}.`,
        `Click logs stay ${RETENTION.clicksMonths} months.`,
        `A deleted account is removed within ${RETENTION.deletionDays} days, apart from records the law requires.`,
        "Data is stored on the servers that host Talent Finder Africa.",
      ],
    },
    {
      heading: "Safety logs",
      paragraphs: [
        "For fraud prevention and safety we log the account, the time of sign-up and sign-in, the IP address, and a device or browser identifier.",
        "Trust and safety staff can see these logs. Each staff view is logged.",
        "We keep these logs for 12 months, then delete or anonymise them, unless a case is still open or the law requires us to keep them.",
        "You can complain about this logging to the privacy contact above, or to the data protection authority in your country.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can see your data, correct it, download it, hide your profile, and delete it.",
        "You can complain to the data protection authority in your country.",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        `The service is not for anyone aged ${MIN_AGE} or younger.`,
        "If you do not pass the age check, we do not save a profile.",
      ],
    },
    {
      heading: "The law in your country",
      paragraphs: laws("en"),
    },
  ],
};

const CURRENT_FR: PolicyDoc = {
  version: "1.1",
  date: "2026-10-28",
  title: "Politique de confidentialité",
  summaryTitle: "En bref",
  summary: [
    "Talent Finder Africa est un annuaire de métiers. Nous gérons le service.",
    `Questions de confidentialité : ${PRIVACY_CONTACT.email} ou ${PRIVACY_CONTACT.phone}.`,
    "Nous ne vendons pas vos données à des publicitaires. Les personnes d'un autre pays ne voient pas votre profil.",
    "Vous pouvez voir, corriger, télécharger, masquer ou supprimer vos données.",
  ],
  sections: [
    {
      heading: "Qui nous sommes",
      paragraphs: [
        "Talent Finder Africa gère cet annuaire.",
        `Pour une question de confidentialité, écrivez à ${PRIVACY_CONTACT.email} ou appelez le ${PRIVACY_CONTACT.phone}.`,
        `Si vous ne pouvez pas vous connecter, vous pouvez quand même demander la suppression. Nous répondons sous ${RETENTION.deletionDays} jours.`,
      ],
    },
    {
      heading: "Ce que nous collectons",
      paragraphs: [
        "Nous collectons votre téléphone ou votre e-mail, votre nom, et seulement l'année de naissance si vous donnez une date.",
        "Nous collectons votre pays, votre métier, le quartier et la région, les photos de votre travail, les notes vocales, les liens, et les messages envoyés dans l'application.",
        "Nous collectons les paiements, les clics sur votre profil, et les informations de l'appareil nécessaires pour faire fonctionner l'application.",
      ],
    },
    {
      heading: "Qui voit quoi",
      paragraphs: [
        "Les personnes du même pays voient votre nom, votre métier, le quartier et la région, les photos de votre travail, les boutons de contact que vous avez choisis, les notes et les badges.",
        "Un employeur ne voit rien de plus que le public.",
        "Vous seul voyez votre rapport de clics et de contacts.",
        "Le personnel voit les comptes, les paiements et les signalements, seulement pour faire fonctionner et protéger le service. Chaque consultation par un administrateur est enregistrée.",
        "Le prestataire de paiement, un service de carte ou de message s'il est utilisé, et l'hébergeur ne reçoivent que ce dont ils ont besoin.",
        "Nous ne vendons jamais les données à des publicitaires. Nous ne montrons jamais un profil à des personnes d'un autre pays.",
      ],
    },
    {
      heading: "Pourquoi",
      paragraphs: [
        "Nous utilisons les données pour publier le profil que vous demandez, encaisser un paiement, garder l'annuaire sûr, et répondre à une demande de consultation, de correction ou de suppression.",
      ],
    },
    {
      heading: "Durée et lieu",
      paragraphs: [
        "Un profil reste jusqu'à ce que vous le supprimiez.",
        "Les paiements restent aussi longtemps que la loi l'exige.",
        `Les journaux de clics restent ${RETENTION.clicksMonths} mois.`,
        `Un compte supprimé est retiré sous ${RETENTION.deletionDays} jours, sauf les dossiers que la loi impose de garder.`,
        "Les données sont stockées sur les serveurs qui hébergent Talent Finder Africa.",
      ],
    },
    {
      heading: "Journaux de sécurité",
      paragraphs: [
        "Pour prévenir la fraude et protéger les personnes, nous enregistrons le compte, l'heure d'inscription et de connexion, l'adresse IP, et un identifiant d'appareil ou de navigateur.",
        "Seule l'équipe confiance et sécurité peut voir ces journaux. Chaque consultation est enregistrée.",
        "Nous gardons ces journaux 12 mois, puis nous les supprimons ou les anonymisons, sauf si un dossier est ouvert ou si la loi l'exige.",
        "Vous pouvez vous plaindre de ces journaux auprès du contact ci-dessus, ou auprès de l'autorité de protection des données de votre pays.",
      ],
    },
    {
      heading: "Vos droits",
      paragraphs: [
        "Vous pouvez voir vos données, les corriger, les télécharger, masquer votre profil et le supprimer.",
        "Vous pouvez porter plainte auprès de l'autorité de protection des données de votre pays.",
      ],
    },
    {
      heading: "Enfants",
      paragraphs: [
        `Le service n'est pas destiné aux personnes de ${MIN_AGE} ans ou moins.`,
        "Si le contrôle d'âge n'est pas passé, nous n'enregistrons pas de profil.",
      ],
    },
    {
      heading: "La loi de votre pays",
      paragraphs: laws("fr"),
    },
  ],
};

const ARCHIVE_EN: PolicyDoc = {
  version: "1.0",
  date: "2026-10-01",
  title: "Privacy Policy",
  summaryTitle: "In short",
  summary: ["This version was replaced by version 1.1 on 28 October 2026."],
  sections: [
    {
      heading: "Replaced",
      paragraphs: [
        "Version 1.0 was a short draft. It said Talent Finder Africa collects only what a profile needs, does not sell data, and does not show a profile outside the person's country.",
        "Use version 1.1 for the current rules.",
      ],
    },
  ],
};

const ARCHIVE_FR: PolicyDoc = {
  version: "1.0",
  date: "2026-10-01",
  title: "Politique de confidentialité",
  summaryTitle: "En bref",
  summary: ["Cette version a été remplacée par la version 1.1 le 28 octobre 2026."],
  sections: [
    {
      heading: "Remplacée",
      paragraphs: [
        "La version 1.0 était un court brouillon. Elle disait que Talent Finder Africa ne collecte que le nécessaire, ne vend pas les données, et ne montre pas un profil hors du pays de la personne.",
        "La version 1.1 est la version en vigueur.",
      ],
    },
  ],
};

export const POLICIES: Record<"en" | "fr", PolicyDoc[]> = {
  en: [CURRENT_EN, ARCHIVE_EN],
  fr: [CURRENT_FR, ARCHIVE_FR],
};

export function currentPolicy(language: string): PolicyDoc {
  const pack = language === "fr" ? POLICIES.fr : POLICIES.en;
  return pack.find((policy) => policy.version === POLICY_VERSION) ?? pack[0];
}

