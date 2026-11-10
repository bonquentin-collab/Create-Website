import { test } from 'node:test';
import assert from 'node:assert/strict';
import { qualifyStatus, normalise } from '../tools/financements-ue/adapters/sedia.mjs';
import { validateOpportunity } from '../tools/financements-ue/lib/schema.mjs';
import { excerpt, stripHtml, toIsoDay } from '../tools/financements-ue/lib/text.mjs';

const TODAY = '2026-11-10';
const OPEN = '31094502';
const FORTHCOMING = '31094501';

test('qualifyStatus drops records whose deadlines have all passed', () => {
  assert.equal(qualifyStatus({ rawStatus: OPEN, opens: '2026-01-01', deadlines: ['2026-03-01'], published: '2026-01-01' }, TODAY), null);
});

test('qualifyStatus keeps the next future deadline of a multi-stage call', () => {
  const q = qualifyStatus({ rawStatus: OPEN, opens: '2026-01-01', deadlines: ['2026-03-01', '2027-02-15'], published: null }, TODAY);
  assert.deepEqual(q, { status: 'open', deadline: '2027-02-15', deadlines: ['2027-02-15'] });
});

test('qualifyStatus derives forthcoming/open from the opening date', () => {
  assert.equal(qualifyStatus({ rawStatus: OPEN, opens: '2027-01-01', deadlines: ['2027-04-01'] }, TODAY).status, 'forthcoming');
  assert.equal(qualifyStatus({ rawStatus: FORTHCOMING, opens: '2026-10-01', deadlines: ['2027-04-01'] }, TODAY).status, 'open');
});

test('qualifyStatus drops undated records older than a year', () => {
  assert.equal(qualifyStatus({ rawStatus: OPEN, opens: '2024-01-01', deadlines: [], published: '2024-01-01' }, TODAY), null);
  assert.ok(qualifyStatus({ rawStatus: OPEN, opens: '2026-06-01', deadlines: [], published: '2026-06-01' }, TODAY));
});

const facets = {
  frameworkProgramme: { 43108390: 'Horizon Europe (HORIZON)' },
  crossCuttingPriorities: { AI: 'Artificial Intelligence' },
};

const grantRecord = {
  reference: '1TOPICSen',
  metadata: {
    type: ['1'],
    identifier: ['HORIZON-CL5-2027-06-D6-11'],
    title: ['PNT resilience'],
    callIdentifier: ['HORIZON-CL5-2027-06'],
    callTitle: ['MOBILITY'],
    frameworkProgramme: ['43108390'],
    status: [FORTHCOMING],
    startDate: ['2027-06-03T00:00:00.000+0000'],
    deadlineDate: ['2027-10-07T00:00:00.000+0000'],
    crossCuttingPriorities: ['AI'],
    keywords: ['HORIZON-CL5-2027-06', 'Transport'],
    typesOfAction: ['HORIZON Innovation Actions'],
    descriptionByte: ['<p>Expected Outcome:</p><p>Project results are <b>expected</b> to contribute.</p>'],
    url: ['https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/HORIZON-CL5-2027-06-D6-11'],
    budgetOverview: [JSON.stringify({
      budgetTopicActionMap: {
        1: [{ action: 'HORIZON-CL5-2027-06-D6-11 - HORIZON-IA', expectedGrants: 2, minContribution: 4000000, maxContribution: 5000000, budgetYearMap: { 2027: '10000000' }, deadlineDates: ['2027-10-07'] }],
        2: [{ action: 'HORIZON-CL5-2027-06-D6-110 - other topic', budgetYearMap: { 2027: '99' } }],
      },
    })],
  },
};

test('normalise maps a grant topic to the Opportunity schema', () => {
  const o = normalise(grantRecord, facets, TODAY);
  assert.deepEqual(validateOpportunity({ ...o, source: 'sedia-grants' }), []);
  assert.equal(o.kind, 'grant');
  assert.equal(o.status, 'forthcoming');
  assert.equal(o.deadline, '2027-10-07');
  assert.equal(o.programme, 'Horizon Europe (HORIZON)');
  assert.equal(o.budget, 10000000, 'only the matching topic budget is summed, not a prefix-similar one');
  assert.equal(o.grantMin, 4000000);
  assert.equal(o.grantMax, 5000000);
  assert.equal(o.grants, 2);
  assert.deepEqual(o.themes, ['Artificial Intelligence', 'Transport']);
  assert.equal(o.summary, 'Project results are expected to contribute.');
});

test('normalise flags prior information notices as forthcoming tenders', () => {
  const o = normalise({
    reference: 'x',
    metadata: {
      type: ['0'],
      cftId: ['abc-PIN'],
      title: ['Facility management'],
      status: [OPEN],
      startDate: ['2026-09-01T00:00:00.000+0000'],
      cftEstimatedTotalProcedureValue: ['2900000.00 EUR'],
      url: ['https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/tender-details/abc-PIN'],
    },
  }, {}, TODAY);
  assert.equal(o.kind, 'tender');
  assert.equal(o.status, 'forthcoming');
  assert.equal(o.budget, 2900000);
  assert.equal(o.programme, 'Marchés des institutions de l’UE');
});

test('text helpers', () => {
  assert.equal(stripHtml('<p>A&nbsp;&amp;&#233;</p>'), 'A &é');
  assert.equal(toIsoDay('2026-12-16+01:00'), '2026-12-16');
  assert.equal(excerpt('mot '.repeat(200), 50).endsWith('…'), true);
});
