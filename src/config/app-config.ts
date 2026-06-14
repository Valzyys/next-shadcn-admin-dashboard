import packageJson from "../../package.json";
const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "JKT48Connect Payment",
  version: packageJson.version,
  copyright: `© ${currentYear}, JKT48Connect.`,
  meta: {
    title: "JKT48Connect Payment Gateway - QRIS Payment Management Dashboard",
    description:
      "JKT48Connect Payment Gateway adalah sistem pembayaran QRIS otomatis untuk ekosistem JKT48Connect, mencakup manajemen transaksi, membership, dan ticketing.",
  },
};
