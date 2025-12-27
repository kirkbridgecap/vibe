// Check OAuth Env
console.log('--- OAuth Environment Check ---');

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;

if (!clientId) {
    console.error('❌ GOOGLE_CLIENT_ID is missing!');
} else {
    console.log(`✅ GOOGLE_CLIENT_ID: ${clientId.substring(0, 15)}... (Check if this matches the Console: 742775624700...)`);
}

if (!clientSecret) {
    console.error('❌ GOOGLE_CLIENT_SECRET is missing!');
} else {
    console.log('✅ GOOGLE_CLIENT_SECRET: [Present]');
}

if (!nextAuthUrl) {
    console.warn('⚠️ NEXTAUTH_URL is missing! NextAuth will try to infer it (might be wrong).');
} else {
    console.log(`✅ NEXTAUTH_URL: ${nextAuthUrl}`);
}

console.log('--- End Check ---');
