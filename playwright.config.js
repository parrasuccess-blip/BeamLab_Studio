import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/browser',
  fullyParallel:true,
  forbidOnly:!!process.env.CI,
  retries:0,
  workers:process.env.CI?2:undefined,
  timeout:30000,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure',reducedMotion:'reduce'},
  webServer:{command:'node scripts/qa-server.cjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},
    {name:'desktop-firefox',use:{...devices['Desktop Firefox'],viewport:{width:1280,height:900}}},
    {name:'mobile-webkit',use:{...devices['iPhone 13']}},
    {name:'small-mobile-chromium',use:{...devices['Pixel 5'],viewport:{width:360,height:800}}}
  ]
});
