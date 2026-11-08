import fs from 'node:fs';

const wizard = fs.readFileSync('src/modules/accommodation/pages/OccupancyWizardPage.tsx', 'utf8');
const extend = fs.readFileSync('src/modules/accommodation/components/ExtendStayDialog.tsx', 'utf8');
const errors = fs.readFileSync('src/shared/api/errors.ts', 'utf8');

const catchAt = wizard.indexOf('} catch (error) {');
if (catchAt < 0) {
  throw new Error('Occupancy wizard has no error catch');
}
const catchBlock = wizard.slice(catchAt, catchAt + 400);
if (!catchBlock.includes('getErrorMessage(error')) {
  throw new Error('Occupancy wizard catch does not show the server message');
}
if (catchBlock.includes('navigate(')) {
  throw new Error('Occupancy wizard catch navigates away from the form');
}
if (!wizard.includes('navigate(exitPath);') || wizard.indexOf('navigate(exitPath);') > catchAt) {
  throw new Error('Occupancy wizard success path no longer leaves the form');
}

if (!extend.includes('setError(getErrorMessage(caught))')) {
  throw new Error('Extend stay dialog does not show the server conflict');
}
if (!errors.includes('return error.message')) {
  throw new Error('API errors no longer return the server message');
}

console.log('stay overlap error stays on the form');
