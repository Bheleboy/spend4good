import { createFileRoute } from '@tanstack/react-router'

const SYSTEM_PROMPT = `You are a compliance reporting specialist for South African non-profit organisations.
You draft DSD (Department of Social Development) Narrative Reports that are clear,
professional, and aligned with the NPO Act and DSD reporting templates.

Your output must:
- Use plain South African English, third person, past tense for activities completed.
- Be structured with clear markdown headings: # Executive Summary, # Organisational Overview,
  # Programme Activities, # Beneficiary Impact, # Financial Summary, # Governance & Compliance,
  # Challenges & Lessons Learned, # Plans for the Next Reporting Period.
- Quote real figures and dates provided by the user verbatim; never invent numbers,
  beneficiary counts, or financial amounts.
- Note "Not provided" inline where the user left a field blank, instead of fabricating content.
- Keep tone factual and donor-ready; no marketing language or emojis.`

export const Route = createFileRoute('/api/generate-report')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
          return Response.json({ error: 'Server not configured' }, { status: 500 })
        }

        let body: Record<string, unknown>
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const userPrompt = formatPrompt(body)

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        })

        if (!res.ok) {
          const errText = await res.text()
          return Response.json(
            { error: 'Anthropic request failed', detail: errText.slice(0, 500) },
            { status: res.status },
          )
        }

        const data = (await res.json()) as {
          content?: Array<{ type: string; text?: string }>
        }
        const text = (data.content ?? [])
          .filter((b) => b.type === 'text')
          .map((b) => b.text ?? '')
          .join('\n')

        return Response.json({ report: text })
      },
    },
  },
})

function formatPrompt(input: Record<string, unknown>): string {
  const get = (k: string) => {
    const v = input[k]
    if (v === undefined || v === null || v === '') return 'Not provided'
    return String(v)
  }
  return `Draft a DSD Narrative Report using the structured inputs below.

## Organisation
- Name: ${get('orgName')}
- NPO registration #: ${get('npoNumber')}
- Province: ${get('province')}
- Reporting period: ${get('periodStart')} to ${get('periodEnd')}

## Programme
- Programme name: ${get('programmeName')}
- Objectives: ${get('objectives')}
- Activities delivered: ${get('activities')}
- Locations: ${get('locations')}

## Beneficiaries
- Total beneficiaries reached: ${get('beneficiariesTotal')}
- Demographics breakdown: ${get('beneficiariesDemographics')}
- Outcomes / impact stories: ${get('impactStories')}

## Financials
- Total budget (ZAR): ${get('budgetTotal')}
- Total spent (ZAR): ${get('spentTotal')}
- Major expense categories: ${get('expenseCategories')}
- Variance explanation: ${get('varianceNotes')}

## Governance & Challenges
- Governance updates (board, AGM, audits): ${get('governanceNotes')}
- Compliance status (NPO, SARS, B-BBEE, POPIA): ${get('complianceStatus')}
- Key challenges: ${get('challenges')}
- Lessons learned: ${get('lessons')}
- Plans for next period: ${get('plansNext')}

Produce the full narrative report now.`
}
