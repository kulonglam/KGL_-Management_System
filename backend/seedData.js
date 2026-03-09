// Resets the database and inserts a clean demo baseline for local testing and demos.
 
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import PriceSetting from './models/PriceSetting.js';
import Procurement from './models/Procurement.js';
import Sale from './models/Sale.js';
import CreditSale from './models/CreditSale.js';
import TrustedBuyer from './models/TrustedBuyer.js';
import StockNotification from './models/StockNotification.js';
import StockLock from './models/StockLock.js';
import { validatePasswordStrength } from './services/authService.js';

dotenv.config();

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'Karibu@2026!';
const BRANCHES = ['Maganjo', 'Matugga'];
const PRODUCE_PRICES = {
  Beans: 35000,
  'Grain Maize': 28000,
  'Cow peas': 32000,
  Groundnuts: 55000,
  Soybeans: 40000
};

const userSeed = [
  { name: 'Mr Orban', username: 'orban', role: 'director', canViewCrossBranchTotals: true },
  { name: 'Kulong', username: 'kulong', role: 'manager', branch: 'Maganjo' },
  { name: 'Lam', username: 'lam', role: 'manager', branch: 'Matugga' },
  { name: 'Wuol', username: 'wuol', role: 'sales_agent', branch: 'Maganjo' },
  { name: 'Makhol', username: 'makhol', role: 'sales_agent', branch: 'Maganjo' },
  { name: 'Nyar', username: 'nyar', role: 'sales_agent', branch: 'Matugga' },
  { name: 'Chuol', username: 'chuol', role: 'sales_agent', branch: 'Matugga' }
];

const trustedBuyerSeed = [
  {
    name: 'Duol',
    nationalId: 'CM123456789012',
    location: 'Kampala',
    contact: '0700567890',
    branch: 'Matugga',
    recordedByUsername: 'lam'
  },
  {
    name: 'Mary',
    nationalId: 'CF987654321098',
    location: 'Kawempe',
    contact: '0700111222',
    branch: 'Maganjo',
    recordedByUsername: 'kulong'
  },
  {
    name: 'John',
    nationalId: 'CM123456789013',
    location: 'Kampala',
    contact: '0700567890',
    branch: 'Matugga',
    recordedByUsername: 'lam'
  },
  {
    name: 'Rachael',
    nationalId: 'CF987654321099',
    location: 'Kawempe',
    contact: '0700111222',
    branch: 'Maganjo',
    recordedByUsername: 'kulong'
  },
  {
    name: 'Moses',
    nationalId: 'CM123456789014',
    location: 'Kampala',
    contact: '0700567890',
    branch: 'Matugga',
    recordedByUsername: 'lam'
  },
  {
    name: 'Sarah',
    nationalId: 'CF987654321097',
    location: 'Kawempe',
    contact: '0700111222',
    branch: 'Maganjo',
    recordedByUsername: 'kulong'
  },
  {
    name: 'Bol',
    nationalId: 'CM123456789015',
    location: 'Kampala',
    contact: '0700567890',
    branch: 'Matugga',
    recordedByUsername: 'lam'
  },
  {
    name: 'Chol',
    nationalId: 'CF987654321096',
    location: 'Kawempe',
    contact: '0700111222',
    branch: 'Maganjo',
    recordedByUsername: 'kulong'
  },
  {
    name: 'Ruot',
    nationalId: 'CM123456789016',
    location: 'Kampala',
    contact: '0700567890',
    branch: 'Matugga',
    recordedByUsername: 'lam'
  },
  {
    name: 'Nyadiew',
    nationalId: 'CF987654321095',
    location: 'Kawempe',
    contact: '0700111222',
    branch: 'Maganjo',
    recordedByUsername: 'kulong'
  }
];

const procurementSeed = [
  {
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: '2026-03-06',
    timeReceived: '09:00',
    tonnageKg: 5000,
    costUgx: 15000000,
    dealerName: 'Maganjo Farm ',
    dealerContact: '0700123456',
    branch: 'Maganjo',
    sellingPrice: 35000,
    recordedByUsername: 'kulong'
  },
  {
    produceName: 'SoyBeans01',
    produceType: 'Soybeans',
    sourceType: 'kgl_farm',
    dateReceived: '2026-03-06',
    timeReceived: '10:30',
    tonnageKg: 3200,
    costUgx: 12800000,
    dealerName: 'KGL',
    dealerContact: '0770765432',
    branch: 'Maganjo',
    sellingPrice: 40000,
    recordedByUsername: 'kulong'
  },
  {
    produceName: 'Ground Nuts',
    produceType: 'Groundnuts',
    sourceType: 'individual',
    dateReceived: '2026-03-05',
    timeReceived: '11:20',
    tonnageKg: 1800,
    costUgx: 8500000,
    dealerName: 'John Chuol',
    dealerContact: '0700345678',
    branch: 'Maganjo',
    sellingPrice: 55000,
    recordedByUsername: 'kulong'
  },
  {
    produceName: 'Ground Nuts',
    produceType: 'Groundnuts',
    sourceType: 'individual',
    dateReceived: '2026-03-05',
    timeReceived: '11:20',
    tonnageKg: 1800,
    costUgx: 8500000,
    dealerName: 'Peter Chuol',
    dealerContact: '0740345678',
    branch: 'Matugga',
    sellingPrice: 55000,
    recordedByUsername: 'kulong'
  },
  {
    produceName: 'White Maize',
    produceType: 'Grain Maize',
    sourceType: 'company',
    dateReceived: '2026-03-05',
    timeReceived: '08:45',
    tonnageKg: 8000,
    costUgx: 20000000,
    dealerName: 'Lam Restaurant',
    dealerContact: '0750234567',
    branch: 'Matugga',
    sellingPrice: 28000,
    recordedByUsername: 'lam'
  },
  {
    produceName: 'Cow Peas',
    produceType: 'Cow peas',
    sourceType: 'company',
    dateReceived: '2026-03-06',
    timeReceived: '12:10',
    tonnageKg: 2600,
    costUgx: 9100000,
    dealerName: 'Central Grain Traders',
    dealerContact: '0750345678',
    branch: 'Matugga',
    sellingPrice: 32000,
    recordedByUsername: 'lam'
  },
  {
    produceName: 'SoyBeans',
    produceType: 'Soybeans',
    sourceType: 'kgl_farm',
    dateReceived: '2026-02-15',
    timeReceived: '14:00',
    tonnageKg: 3000,
    costUgx: 10200000,
    dealerName: 'KGL',
    dealerContact: '0740456789',
    branch: 'Matugga',
    sellingPrice: 40000,
    recordedByUsername: 'lam'
  }
];

const salesSeed = [
  {
    produceName: 'Beans',
    produceType: 'Beans',
    tonnageKg: 900,
    amountPaidUgx: 31500000,
    buyerName: 'Marys Restaurant',
    date: '2026-03-5',
    time: '10:00',
    branch: 'Maganjo',
    recordedByUsername: 'makhol'
  },
  {
    produceName: 'SoyBeans',
    produceType: 'Soybeans',
    tonnageKg: 600,
    amountPaidUgx: 24000000,
    buyerName: 'Nakasero Market',
    date: '2026-03-05',
    time: '11:20',
    branch: 'Maganjo',
    recordedByUsername: 'wuol'
  },
  {
    produceName: 'Maize',
    produceType: 'Grain Maize',
    tonnageKg: 1500,
    amountPaidUgx: 42000000,
    buyerName: 'City Market',
    date: '2026-03-7',
    time: '11:30',
    branch: 'Matugga',
    recordedByUsername: 'nyar'
  },
  {
    produceName: 'Cow Peas',
    produceType: 'Cow peas',
    tonnageKg: 400,
    amountPaidUgx: 12800000,
    buyerName: 'Wandegeya Buyers',
    date: '2026-03-07',
    time: '13:10',
    branch: 'Matugga',
    recordedByUsername: 'chuol'
  }
];

const creditSalesSeed = [
  {
    trustedBuyerNationalId: 'CM123456789012',
    salesAgentUsername: 'chuol',
    produceName: 'Maize',
    produceType: 'Grain Maize',
    tonnageKg: 700,
    amountDueUgx: 19600000,
    amountPaidUgx: 5000000,
    balanceUgx: 14600000,
    dueDate: '2026-03-20',
    dateOfDispatch: '2026-03-07',
    branch: 'Matugga',
    paymentReceivedByUsername: 'lam',
    isPaid: false
  },
  {
    trustedBuyerNationalId: 'CF987654321098',
    salesAgentUsername: 'wuol',
    produceName: 'Ground Nuts',
    produceType: 'Groundnuts',
    tonnageKg: 200,
    amountDueUgx: 11000000,
    amountPaidUgx: 11000000,
    balanceUgx: 0,
    dueDate: '2026-03-10',
    dateOfDispatch: '2026-03-07',
    branch: 'Maganjo',
    paymentReceivedByUsername: 'kulong',
    isPaid: true
  },
  {
    trustedBuyerNationalId: 'CM123456789013',
    salesAgentUsername: 'chuol',
    produceName: 'Maize',
    produceType: 'Grain Maize',
    tonnageKg: 700,
    amountDueUgx: 19600000,
    amountPaidUgx: 5000000,
    balanceUgx: 14600000,
    dueDate: '2026-03-20',
    dateOfDispatch: '2026-03-07',
    branch: 'Matugga',
    paymentReceivedByUsername: 'lam',
    isPaid: false
  },
  {
    trustedBuyerNationalId: 'CF987654321099',
    salesAgentUsername: 'makhol',
    produceName: 'Ground Nuts',
    produceType: 'Groundnuts',
    tonnageKg: 200,
    amountDueUgx: 11000000,
    amountPaidUgx: 11000000,
    balanceUgx: 0,
    dueDate: '2026-03-10',
    dateOfDispatch: '2026-03-07',
    branch: 'Maganjo',
    paymentReceivedByUsername: 'kulong',
    isPaid: true
  },
  {
    trustedBuyerNationalId: 'CM123456789014',
    salesAgentUsername: 'nyar',
    produceName: 'Maize',
    produceType: 'Grain Maize',
    tonnageKg: 700,
    amountDueUgx: 19600000,
    amountPaidUgx: 5000000,
    balanceUgx: 14600000,
    dueDate: '2026-03-20',
    dateOfDispatch: '2026-03-07',
    branch: 'Matugga',
    paymentReceivedByUsername: 'lam',
    isPaid: false
  },
  {
    trustedBuyerNationalId: 'CF987654321097',
    salesAgentUsername: 'wuol',
    produceName: 'Ground Nuts',
    produceType: 'Groundnuts',
    tonnageKg: 200,
    amountDueUgx: 11000000,
    amountPaidUgx: 11000000,
    balanceUgx: 0,
    dueDate: '2026-03-10',
    dateOfDispatch: '2026-03-07',
    branch: 'Maganjo',
    paymentReceivedByUsername: 'kulong',
    isPaid: true
  },
  {
    trustedBuyerNationalId: 'CM123456789015',
    salesAgentUsername: 'chuol',
    produceName: 'Maize',
    produceType: 'Grain Maize',
    tonnageKg: 700,
    amountDueUgx: 19600000,
    amountPaidUgx: 5000000,
    balanceUgx: 14600000,
    dueDate: '2026-03-20',
    dateOfDispatch: '2026-03-07',
    branch: 'Matugga',
    paymentReceivedByUsername: 'lam',
    isPaid: false
  },
  {
    trustedBuyerNationalId: 'CF987654321096',
    salesAgentUsername: 'wuol',
    produceName: 'Ground Nuts',
    produceType: 'Groundnuts',
    tonnageKg: 200,
    amountDueUgx: 11000000,
    amountPaidUgx: 11000000,
    balanceUgx: 0,
    dueDate: '2026-03-10',
    dateOfDispatch: '2026-03-07',
    branch: 'Maganjo',
    paymentReceivedByUsername: 'kulong',
    isPaid: true
  },
  {
    trustedBuyerNationalId: 'CM123456789016',
    salesAgentUsername: 'chuol',
    produceName: 'Maize',
    produceType: 'Grain Maize',
    tonnageKg: 700,
    amountDueUgx: 19600000,
    amountPaidUgx: 5000000,
    balanceUgx: 14600000,
    dueDate: '2026-03-20',
    dateOfDispatch: '2026-03-07',
    branch: 'Matugga',
    paymentReceivedByUsername: 'lam',
    isPaid: false
  },
  {
    trustedBuyerNationalId: 'CF987654321095',
    salesAgentUsername: 'wuol',
    produceName: 'Ground Nuts',
    produceType: 'Groundnuts',
    tonnageKg: 200,
    amountDueUgx: 11000000,
    amountPaidUgx: 11000000,
    balanceUgx: 0,
    dueDate: '2026-03-10',
    dateOfDispatch: '2026-03-07',
    branch: 'Maganjo',
    paymentReceivedByUsername: 'kulong',
    isPaid: true
  }
];

const ensureRequiredEnv = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required to run seedData.js');
  }

  const passwordError = validatePasswordStrength(DEFAULT_PASSWORD);
  if (passwordError) {
    throw new Error(`SEED_DEFAULT_PASSWORD is invalid: ${passwordError}`);
  }
};

const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
};

const clearCollections = async () => {
  await Promise.all([
    StockLock.deleteMany({}),
    StockNotification.deleteMany({}),
    CreditSale.deleteMany({}),
    Sale.deleteMany({}),
    Procurement.deleteMany({}),
    TrustedBuyer.deleteMany({}),
    PriceSetting.deleteMany({}),
    User.deleteMany({})
  ]);
  console.log('Existing data cleared');
};

const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const records = userSeed.map((user) => ({
    ...user,
    password: hashedPassword
  }));
  const users = await User.insertMany(records);
  console.log(`Users seeded: ${users.length}`);
  return new Map(users.map((user) => [user.username, user]));
};

const seedPriceSettings = async () => {
  const records = [];
  BRANCHES.forEach((branch) => {
    Object.entries(PRODUCE_PRICES).forEach(([produceType, priceUgx]) => {
      records.push({ branch, produceType, priceUgx });
    });
  });

  const prices = await PriceSetting.insertMany(records);
  console.log(`Price settings seeded: ${prices.length}`);
};

const getUserOrThrow = (userByUsername, username) => {
  const user = userByUsername.get(username);
  if (!user) {
    throw new Error(`Seed configuration error: missing user "${username}"`);
  }
  return user;
};

const seedTrustedBuyers = async (userByUsername) => {
  const records = trustedBuyerSeed.map((buyer) => ({
    name: buyer.name,
    nationalId: buyer.nationalId,
    location: buyer.location,
    contact: buyer.contact,
    branch: buyer.branch,
    recordedBy: getUserOrThrow(userByUsername, buyer.recordedByUsername)._id
  }));

  const buyers = await TrustedBuyer.insertMany(records);
  console.log(`Trusted buyers seeded: ${buyers.length}`);
  return new Map(buyers.map((buyer) => [buyer.nationalId, buyer]));
};

const seedProcurements = async (userByUsername) => {
  const records = procurementSeed.map((item) => ({
    produceName: item.produceName,
    produceType: item.produceType,
    sourceType: item.sourceType,
    dateReceived: new Date(item.dateReceived),
    timeReceived: item.timeReceived,
    tonnageKg: item.tonnageKg,
    costUgx: item.costUgx,
    dealerName: item.dealerName,
    dealerContact: item.dealerContact,
    branch: item.branch,
    sellingPrice: item.sellingPrice,
    recordedBy: getUserOrThrow(userByUsername, item.recordedByUsername)._id
  }));

  const procurements = await Procurement.insertMany(records);
  console.log(`Procurements seeded: ${procurements.length}`);
};

const seedSales = async (userByUsername) => {
  const records = salesSeed.map((item) => {
    const recordedBy = getUserOrThrow(userByUsername, item.recordedByUsername);
    return {
      produceName: item.produceName,
      produceType: item.produceType,
      tonnageKg: item.tonnageKg,
      amountPaidUgx: item.amountPaidUgx,
      buyerName: item.buyerName,
      salesAgentName: recordedBy.name,
      date: new Date(item.date),
      time: item.time,
      branch: item.branch,
      recordedBy: recordedBy._id
    };
  });

  const sales = await Sale.insertMany(records);
  console.log(`Sales seeded: ${sales.length}`);
};

const seedCreditSales = async (userByUsername, buyerByNin) => {
  const records = creditSalesSeed.map((item) => {
    const trustedBuyer = buyerByNin.get(item.trustedBuyerNationalId);
    if (!trustedBuyer) {
      throw new Error(
        `Seed configuration error: missing trusted buyer "${item.trustedBuyerNationalId}"`
      );
    }

    const salesAgent = getUserOrThrow(userByUsername, item.salesAgentUsername);
    const paymentReceivedBy = getUserOrThrow(userByUsername, item.paymentReceivedByUsername);

    return {
      buyerName: trustedBuyer.name,
      nationalId: trustedBuyer.nationalId,
      location: trustedBuyer.location,
      contact: trustedBuyer.contact,
      amountDueUgx: item.amountDueUgx,
      amountPaidUgx: item.amountPaidUgx,
      balanceUgx: item.balanceUgx,
      salesAgentName: salesAgent.name,
      dueDate: new Date(item.dueDate),
      produceName: item.produceName,
      produceType: item.produceType,
      tonnageKg: item.tonnageKg,
      dateOfDispatch: new Date(item.dateOfDispatch),
      branch: item.branch,
      recordedBy: salesAgent._id,
      trustedBuyer: trustedBuyer._id,
      isPaid: item.isPaid,
      payments: item.amountPaidUgx
        ? [
            {
              amountUgx: item.amountPaidUgx,
              paidAt: new Date(item.dateOfDispatch),
              receivedBy: paymentReceivedBy._id
            }
          ]
        : []
    };
  });

  const creditSales = await CreditSale.insertMany(records);
  console.log(`Credit sales seeded: ${creditSales.length}`);
};

const printLoginSummary = () => {
  console.log('\n=== Seed Login Credentials ===');
  console.log(`Password for all users: ${DEFAULT_PASSWORD}`);
  console.log('Director: orban');
  console.log('Managers: kulong (Maganjo), lam (Matugga)');
  console.log('Sales Agents: wuol, makhol, nyar, chuol');
  console.log('==============================\n');
};

const main = async () => {
  ensureRequiredEnv();
  await connectDatabase();

  await clearCollections();
  const userByUsername = await seedUsers();
  await seedPriceSettings();
  const buyerByNin = await seedTrustedBuyers(userByUsername);
  await seedProcurements(userByUsername);
  await seedSales(userByUsername);
  await seedCreditSales(userByUsername, buyerByNin);

  printLoginSummary();
  console.log('Database seed completed successfully.');
};

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`Seed failed: ${error.message}`);
    await mongoose.disconnect();
    process.exit(1);
  });





