// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import * as caseReport from './case-report';

describe('App navigation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    cleanup();
  });

  it('renders the THEPHISH tab and opens the dedicated workflow view', async () => {
    mockAppFetch();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\[1\] thephish/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /full email analysis/i })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\[1\] thephish/i }));

    expect(await screen.findByText(/thephish eml intake/i)).toBeInTheDocument();
  });

  it('routes Barracuda decoded targets from THEPHISH to domain analysis and browser sandbox', async () => {
    mockAppFetch({
      '/api/analyze/eml': async () => ({
        ok: true,
        json: async () => ({
          jobId: 'job_eml_456',
          status: 'queued',
          filename: 'barracuda.eml',
          emailAnalysis: null,
          attachmentCount: 0,
          analyzedAttachmentCount: 0,
          ignoredAttachments: [],
          fileAnalysisJobId: null,
          attachmentResults: [],
          consolidatedThreatLevel: null,
          consolidatedRiskScore: null,
          executiveSummary: null,
          externalEnrichment: null,
          error: null,
        }),
      } as Response),
      '/api/analyze/eml/job_eml_456': async () => ({
        ok: true,
        json: async () => buildMockThePhishBarracudaJob(),
      } as Response),
    });

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /\[1\] thephish/i }));

    const uploadInput = screen.getByLabelText(/upload \.eml evidence/i) as HTMLInputElement;
    const file = new File(['From: alerts@secure-example.test'], 'barracuda.eml', { type: 'message/rfc822' });

    fireEvent.change(uploadInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /analyze eml/i }));

    expect(await screen.findByRole('button', { name: /send to domain analysis/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /send to domain analysis/i }));

    expect(screen.getByDisplayValue('evil.example')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /\[1\] thephish/i }));
    fireEvent.click(await screen.findByRole('button', { name: /send to url sandbox/i }));

    expect(screen.getByDisplayValue('https://evil.example/login')).toBeInTheDocument();
  });

  it('keeps analysis state across tab switches and clears it when the case is reset', async () => {
    mockAppFetch();

    render(<App />);

    const domainTabButton = await screen.findByRole('button', { name: /\[2\] domain analysis/i });
    fireEvent.click(domainTabButton);

    const domainInput = screen.getByPlaceholderText(/suspicious-login-update\.com/i) as HTMLInputElement;
    fireEvent.change(domainInput, {
      target: { value: 'secure-example.test' },
    });

    fireEvent.click(screen.getByRole('button', { name: /\[3\] url sandbox/i }));
    fireEvent.click(screen.getByRole('button', { name: /\[2\] domain analysis/i }));

    expect((screen.getByPlaceholderText(/suspicious-login-update\.com/i) as HTMLInputElement).value).toBe('secure-example.test');
    expect(screen.getByText(/visited tools: thephish -> domain -> sandbox/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reset case/i }));
    fireEvent.click(screen.getByRole('button', { name: /\[2\] domain analysis/i }));

    expect((screen.getByPlaceholderText(/suspicious-login-update\.com/i) as HTMLInputElement).value).toBe('');
  });

  it('adds analyst events to the case journal and clears them on reset', async () => {
    mockAppFetch({
      '/api/analyze/domain': async () => buildMockDomainAnalysisResponse(),
    });

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /\[2\] domain analysis/i }));
    fireEvent.change(screen.getByPlaceholderText(/suspicious-login-update\.com/i), {
      target: { value: 'secure-example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /execute/i }));

    expect(await screen.findByText(/domain :: domain analysis completed/i)).toBeInTheDocument();
    expect(screen.getByText(/secure-example\.test scored 82\/100 \(high\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/domain: domain -> secure-example.test/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /reset case/i }));

    expect(screen.getByText(/no analyst actions recorded for this case yet/i)).toBeInTheDocument();
  });

  it('exports the current case report from the global case panel', async () => {
    const fetchSpy = mockAppFetch({
      '/api/analyze/domain': async () => buildMockDomainAnalysisResponse(),
    });
    const downloadSpy = vi.spyOn(caseReport, 'downloadCaseReport').mockImplementation(() => {
      return;
    });

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /\[2\] domain analysis/i }));
    fireEvent.change(screen.getByPlaceholderText(/suspicious-login-update\.com/i), {
      target: { value: 'secure-example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /execute/i }));

    await screen.findByText(/domain :: domain analysis completed/i);
    fireEvent.click(screen.getByRole('button', { name: /export case report/i }));

    expect(fetchSpy).toHaveBeenCalled();
    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(downloadSpy.mock.calls[0]?.[0]).toContain('# CASE REPORT CASE-');
    expect(downloadSpy.mock.calls[0]?.[0]).toContain('DOMAIN | WARNING | Domain analysis completed');
    expect(downloadSpy.mock.calls[0]?.[1]).toMatch(/case-.*-report\.txt/i);
  });

  it('exports the current case as a structured JSON report', async () => {
    mockAppFetch({
      '/api/analyze/domain': async () => buildMockDomainAnalysisResponse(),
    });
    const downloadSpy = vi.spyOn(caseReport, 'downloadCaseJsonReport').mockImplementation(() => {
      return;
    });

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /\[2\] domain analysis/i }));
    fireEvent.change(screen.getByPlaceholderText(/suspicious-login-update\.com/i), {
      target: { value: 'secure-example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: /execute/i }));

    await screen.findByText(/domain :: domain analysis completed/i);
    fireEvent.click(screen.getByRole('button', { name: /export case json/i }));

    expect(downloadSpy).toHaveBeenCalledTimes(1);
    const reportJson = downloadSpy.mock.calls[0]?.[0] ?? '';
    expect(reportJson).toContain('"caseId": "CASE-');
    expect(reportJson).toContain('"tool": "domain"');
    expect(reportJson).toContain('"severity": "warning"');
    expect(reportJson).toContain('"references"');
    expect(reportJson).toContain('"kind": "domain"');
    expect(downloadSpy.mock.calls[0]?.[1]).toMatch(/case-.*-report\.json/i);
  });

  it('restores the current case only from browser session storage after authentication', async () => {
    const fetchSpy = mockAppFetch();
    window.sessionStorage.setItem('phish_hunter_case_session', JSON.stringify({
      caseId: 'CASE-202604141230-03',
      startedAt: '2026-04-14T12:30:00.000Z',
      updatedAt: '2026-04-14T12:35:00.000Z',
      activeTab: 'files',
      visitedTabs: ['domain', 'files'],
      events: [
        {
          id: 'evt-1',
          tool: 'files',
          title: 'File analysis completed',
          detail: 'invoice.zip -> completed',
          severity: 'success',
          occurredAt: '2026-04-14T12:34:00.000Z',
          references: [
            {
              kind: 'job',
              label: 'file-analysis',
              value: 'file_job_123',
            },
            {
              kind: 'artifact',
              label: 'evidence',
              value: 'invoice.zip',
              path: 'storage/uploads/job_file_456/00-invoice.docm',
              url: null,
            },
          ],
        },
      ],
    }));

    render(<App />);

    expect(await screen.findByText(/files :: file analysis completed/i)).toBeInTheDocument();
    expect(screen.getByText(/visited tools: domain -> files/i)).toBeInTheDocument();
    expect(screen.getByText(/job: file-analysis -> file_job_123/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /artifact: evidence -> invoice.zip/i })).toHaveAttribute('href', '/storage/uploads/job_file_456/00-invoice.docm');
    expect(screen.queryByText(/recent cases/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze files/i })).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalledWith('/api/cases/current', expect.anything());
    expect(fetchSpy).not.toHaveBeenCalledWith('/api/cases', expect.anything());
  });
});

function mockAppFetch(
  routes: Record<string, (init?: RequestInit) => Promise<Response> | Response> = {},
) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');

    if (url === '/api/auth/session') {
      return {
        ok: true,
        json: async () => ({ authenticated: true }),
      } as Response;
    }

    const handler = routes[url];
    if (handler) {
      return handler(init);
    }

    throw new Error(`Unexpected fetch call: ${url}`);
  });
}

function buildMockEmailAnalysisResponse() {
  return {
    ok: true,
    json: async () => ({
      headers: {
        from: 'alerts@secure-example.test',
        to: 'victim@example.org',
        subject: 'Urgent account review',
        date: 'Tue, 08 Apr 2026 10:00:00 +0000',
        messageId: '<abc@example.test>',
        returnPath: 'bounce@mailer.secure-example.test',
      },
      authentication: {
        spf: 'fail',
        dkim: 'pass',
        dmarc: 'fail',
      },
      urls: [],
      inconsistencies: [],
      threatLevel: 'HIGH',
      executiveSummary: 'The email shows authentication anomalies and phishing-style lures.',
      emailAddresses: ['alerts@secure-example.test'],
      domains: ['secure-example.test'],
      ipAddresses: [],
      attachments: [],
      relatedDomains: [],
    }),
  } as Response;
}

function buildMockDomainAnalysisResponse() {
  return {
    ok: true,
    json: async () => ({
      domain: 'secure-example.test',
      normalizedDomain: 'secure-example.test',
      score: 82,
      riskLevel: 'HIGH',
      summary: 'Recently created domain with suspicious keyword patterns.',
      dns: {
        a: ['203.0.113.10'],
        aaaa: [],
        mx: [],
        ns: ['ns1.example.test'],
        txt: ['v=spf1 -all'],
        caa: [],
        soa: null,
      },
      rdap: {
        registrar: 'Test Registrar',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: null,
        expiresAt: null,
      },
      mailSecurity: {
        spf: {
          present: true,
          record: 'v=spf1 -all',
          mode: '-all',
        },
        dmarc: {
          present: false,
          record: null,
          policy: null,
        },
        mtaSts: {
          present: false,
          record: null,
        },
        tlsRpt: {
          present: false,
          record: null,
        },
      },
      infrastructure: {
        ipAddresses: ['203.0.113.10'],
        ipIntelligence: [],
        tls: null,
      },
      history: {
        waybackSnapshots: 0,
        firstSeen: null,
        lastSeen: null,
      },
      certificates: {
        certificateTransparency: {
          certificateCount: 0,
          observedSubdomains: [],
          observedCertificates: [],
        },
      },
      reputation: {
        alienVault: {
          status: 'clean',
          pulseCount: 0,
          reference: null,
        },
        virustotal: {
          status: 'clean',
          malicious: 0,
          suspicious: 0,
          reference: null,
        },
        urlscan: {
          status: 'clean',
          resultUrl: null,
        },
        abuseIpDb: {
          status: 'clean',
          confidenceScore: 0,
          reports: 0,
          reference: null,
        },
        urlhausHost: {
          status: 'not_listed',
          reference: null,
          urls: [],
        },
      },
      riskFactors: ['Recently registered domain.'],
      osint: {
        virustotal: 'https://www.virustotal.com/gui/domain/secure-example.test',
        urlscan: 'https://urlscan.io/domain/secure-example.test',
        viewdns: 'https://viewdns.info/whois/?domain=secure-example.test',
        crtSh: 'https://crt.sh/?q=secure-example.test',
        wayback: 'https://web.archive.org/web/*/secure-example.test',
        dnsdumpster: 'https://dnsdumpster.com/',
        builtwith: 'https://builtwith.com/secure-example.test',
        alienVault: 'https://otx.alienvault.com/indicator/domain/secure-example.test',
        abuseIpDb: 'https://www.abuseipdb.com/check/secure-example.test',
        urlhausHost: 'https://urlhaus.abuse.ch/host/secure-example.test/',
      },
    }),
  } as Response;
}

function buildMockThePhishBarracudaJob() {
  return {
    jobId: 'job_eml_456',
    status: 'completed',
    filename: 'barracuda.eml',
    emailAnalysis: {
      headers: {
        from: 'alerts@secure-example.test',
        to: 'victim@example.org',
        subject: 'Urgent login validation',
        date: 'Tue, 08 Apr 2026 10:00:00 +0000',
        messageId: '<barracuda@example.test>',
        returnPath: 'bounce@secure-example.test',
      },
      authentication: {
        spf: 'pass',
        dkim: 'pass',
        dmarc: 'pass',
      },
      urls: [
        {
          originalUrl: 'https://linkprotect.barracuda.com/redirect?url=https%3A%2F%2Fevil.example%2Flogin',
          decodedUrl: 'https://evil.example/login',
          wrapperType: 'barracuda',
          resolutionChain: [
            {
              label: 'decoded',
              url: 'https://evil.example/login',
            },
          ],
          suspicious: true,
          reason: 'Barracuda wrapper resolved to a suspicious credential landing page.',
        },
      ],
      inconsistencies: [],
      threatLevel: 'HIGH',
      executiveSummary: 'Barracuda-protected URL resolves to an external login lure.',
      emailAddresses: ['alerts@secure-example.test'],
      domains: ['secure-example.test', 'evil.example'],
      ipAddresses: [],
      attachments: [],
      relatedDomains: [],
    },
    attachmentCount: 0,
    analyzedAttachmentCount: 0,
    ignoredAttachments: [],
    fileAnalysisJobId: null,
    attachmentResults: [],
    consolidatedThreatLevel: 'HIGH',
    consolidatedRiskScore: 76,
    executiveSummary: 'Barracuda-protected URL resolves to an external login lure.',
    externalEnrichment: null,
    error: null,
  };
}
