import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import exec from 'k6/execution';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.4/index.js';

const baseUrl = (__ENV.BASE_URL || '').replace(/\/$/, '');
const partnerKey = __ENV.PARTNER_KEY;
const amount = Number(__ENV.AMOUNT || 10);
const thinkTimeSeconds = Number(__ENV.THINK_TIME_SECONDS || 12);

const transactionChecks = new Rate('transaction_checks');

const users = {
  agent1: {
    identifier: __ENV.AGENT1_IDENTIFIER,
    password: __ENV.AGENT1_PASSWORD,
    phone: __ENV.AGENT1_PHONE,
  },
  agent2: {
    identifier: __ENV.AGENT2_IDENTIFIER,
    password: __ENV.AGENT2_PASSWORD,
    phone: __ENV.AGENT2_PHONE,
  },
  customer1: {
    identifier: __ENV.CUSTOMER1_IDENTIFIER,
    password: __ENV.CUSTOMER1_PASSWORD,
    phone: __ENV.CUSTOMER1_PHONE,
  },
  customer2: {
    identifier: __ENV.CUSTOMER2_IDENTIFIER,
    password: __ENV.CUSTOMER2_PASSWORD,
    phone: __ENV.CUSTOMER2_PHONE,
  },
  merchant1: {
    identifier: __ENV.MERCHANT1_IDENTIFIER,
    password: __ENV.MERCHANT1_PASSWORD,
    phone: __ENV.MERCHANT1_PHONE,
  },
  merchant2: {
    identifier: __ENV.MERCHANT2_IDENTIFIER,
    password: __ENV.MERCHANT2_PASSWORD,
    phone: __ENV.MERCHANT2_PHONE,
  },
};

const flows = [
  { name: 'phase1_customer1_sendMoney', phase: '00-30s', api: 'sendMoney', sender: 'customer1', receiver: 'customer2', operation: 'sendmoney' },
  { name: 'phase1_customer2_payment', phase: '00-30s', api: 'payment', sender: 'customer2', receiver: 'merchant1', operation: 'payment' },
  { name: 'phase2_customer2_sendMoney', phase: '30-60s', api: 'sendMoney', sender: 'customer2', receiver: 'customer1', operation: 'sendmoney' },
  { name: 'phase2_agent1_deposit_customer2', phase: '30-60s', api: 'deposit', sender: 'agent1', receiver: 'customer2', operation: 'deposit' },
  { name: 'phase2_customer1_payment', phase: '30-60s', api: 'payment', sender: 'customer1', receiver: 'merchant1', operation: 'payment' },
  { name: 'phase3_agent1_deposit_customer1', phase: '60-90s', api: 'deposit', sender: 'agent1', receiver: 'customer1', operation: 'deposit' },
  { name: 'phase3_agent2_deposit_customer2', phase: '60-90s', api: 'deposit', sender: 'agent2', receiver: 'customer2', operation: 'deposit' },
  { name: 'phase3_customer1_sendMoney', phase: '60-90s', api: 'sendMoney', sender: 'customer1', receiver: 'customer2', operation: 'sendmoney' },
  { name: 'phase3_customer2_payment', phase: '60-90s', api: 'payment', sender: 'customer2', receiver: 'merchant2', operation: 'payment' },
  { name: 'phase4_agent1_payment', phase: '90-120s', api: 'payment', sender: 'agent1', receiver: 'merchant1', operation: 'payment' },
  { name: 'phase4_agent2_payment', phase: '90-120s', api: 'payment', sender: 'agent2', receiver: 'merchant2', operation: 'payment' },
  { name: 'phase4_customer1_payment', phase: '90-120s', api: 'payment', sender: 'customer1', receiver: 'merchant1', operation: 'payment' },
  { name: 'phase4_customer2_payment', phase: '90-120s', api: 'payment', sender: 'customer2', receiver: 'merchant2', operation: 'payment' },
];

const scenarios = {};
for (const flow of flows) {
  const phaseStart = Number(flow.phase.slice(0, 2));
  scenarios[flow.name] = {
    executor: 'constant-vus',
    exec: 'runTransactionFlow',
    vus: 1,
    duration: '30s',
    startTime: `${phaseStart}s`,
    gracefulStop: '0s',
    tags: { phase: flow.phase, api: flow.api },
  };
}

export const options = {
  scenarios,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    transaction_checks: ['rate>=0.99'],
    'http_req_failed{api:deposit}': ['rate<0.01'],
    'http_req_duration{api:deposit}': ['p(95)<1000'],
    'transaction_checks{api:deposit}': ['rate>=0.99'],
    'http_req_failed{api:sendMoney}': ['rate<0.01'],
    'http_req_duration{api:sendMoney}': ['p(95)<1000'],
    'transaction_checks{api:sendMoney}': ['rate>=0.99'],
    'http_req_failed{api:payment}': ['rate<0.01'],
    'http_req_duration{api:payment}': ['p(95)<1000'],
    'transaction_checks{api:payment}': ['rate>=0.99'],
  },
};

for (const flow of flows) {
  const apiPhase = `{api:${flow.api},phase:${flow.phase}}`;
  options.thresholds[`http_req_failed${apiPhase}`] = ['rate<0.01'];
  options.thresholds[`http_req_duration${apiPhase}`] = ['p(95)<1000'];
  options.thresholds[`transaction_checks${apiPhase}`] = ['rate>=0.99'];
}

function requireConfiguration() {
  if (!baseUrl || !partnerKey) {
    throw new Error('BASE_URL and PARTNER_KEY must be configured in Performance-Testing/.env');
  }
  if (!Number.isFinite(amount) || amount < 10) {
    throw new Error('AMOUNT must be a number of at least 10 BDT');
  }
  if (!Number.isFinite(thinkTimeSeconds) || thinkTimeSeconds <= 0) {
    throw new Error('THINK_TIME_SECONDS must be greater than 0');
  }
  for (const [key, user] of Object.entries(users)) {
    if (!user.identifier || !user.password || !user.phone) {
      throw new Error(`${key} requires IDENTIFIER, PASSWORD, and PHONE values`);
    }
  }
  if (!__ENV.DEFAULT_OTP) {
    throw new Error('DEFAULT_OTP is required for the backend development OTP bypass');
  }
}

function login(userKey, user) {
  const loginIdentifier = user.identifier.includes('@') ? user.identifier : user.phone;
  const loginResponse = http.post(
    `${baseUrl}/user/login`,
    JSON.stringify({
      [loginIdentifier.includes('@') ? 'email' : 'phone_number']: loginIdentifier,
      password: user.password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'user_login', auth_user: userKey },
    }
  );

  let loginBody = {};
  try {
    loginBody = loginResponse.json();
  } catch (_) {
    throw new Error(`Login response for ${userKey} was not valid JSON (HTTP ${loginResponse.status})`);
  }

  if (loginResponse.status !== 200) {
    throw new Error(`Login failed for ${userKey} (HTTP ${loginResponse.status})`);
  }
  if (loginBody.token) {
    return loginBody.token;
  }
  if (loginBody.otpRequired !== true) {
    throw new Error(`Login for ${userKey} returned neither a token nor an OTP challenge`);
  }

  const verifyResponse = http.post(
    `${baseUrl}/user/verify-otp?env=dev`,
    JSON.stringify({ identifier: loginIdentifier, otp: __ENV.DEFAULT_OTP }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'otp_verification', auth_user: userKey },
    }
  );

  let verifyBody = {};
  try {
    verifyBody = verifyResponse.json();
  } catch (_) {
    throw new Error(`OTP response for ${userKey} was not valid JSON (HTTP ${verifyResponse.status})`);
  }

  if (verifyResponse.status !== 200 || !verifyBody.token) {
    throw new Error(`OTP verification failed for ${userKey} (HTTP ${verifyResponse.status})`);
  }
  return verifyBody.token;
}

export function setup() {
  requireConfiguration();
  const tokens = {};
  for (const [key, user] of Object.entries(users)) {
    tokens[key] = login(key, user);
  }
  return { tokens };
}

export function runTransactionFlow(data) {
  const flow = flows.find((candidate) => candidate.name === exec.scenario.name);
  if (!flow) {
    throw new Error(`No transaction flow configured for scenario ${exec.scenario.name}`);
  }

  const payload = {
    from_account: users[flow.sender].phone,
    to_account: users[flow.receiver].phone,
    amount,
  };
  const expectedMessage = {
    deposit: 'Deposit successful',
    sendmoney: 'Send money successful',
    payment: 'Payment successful',
  }[flow.operation];
  const response = http.post(
    `${baseUrl}/transaction/${flow.operation}`,
    JSON.stringify(payload),
    {
      headers: {
        Authorization: `Bearer ${data.tokens[flow.sender]}`,
        'X-AUTH-SECRET-KEY': partnerKey,
        'Content-Type': 'application/json',
      },
      tags: { api: flow.api, phase: flow.phase },
    }
  );

  let body = {};
  try {
    body = response.json();
  } catch (_) {
    body = {};
  }

  const assertions = {
    [`${flow.api} status is 201`]: (r) => r.status === 201,
    [`${flow.api} transaction succeeded`]: (r) => r.status === 201 && body.message === expectedMessage,
    [`${flow.api} returns transaction ID`]: (r) => typeof body.trnxId === 'string' && body.trnxId.length > 0,
    [`${flow.api} returns expected success message`]: (r) => body.message === expectedMessage,
  };
  const checksPassed = check(response, assertions, { api: flow.api, phase: flow.phase });
  transactionChecks.add(checksPassed, { api: flow.api, phase: flow.phase });

  sleep(thinkTimeSeconds);
}

export function teardown() {
  console.log('DMoney transaction performance test finished.');
}

export function handleSummary(data) {
  return {
    'reports/report.html': htmlReport(data),
    'reports/k6-summary.txt': textSummary(data, { indent: ' ', enableColors: false }),
  };
}