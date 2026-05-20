import { describe, it, expect } from 'vitest'
import { DEAL_STAGES, STAGE_LABELS } from '../types'

describe('types', () => {
  it('DEAL_STAGES has all five stages', () => {
    expect(DEAL_STAGES).toHaveLength(5)
    expect(DEAL_STAGES).toContain('prospeccao')
    expect(DEAL_STAGES).toContain('fechado')
  })

  it('STAGE_LABELS covers all stages', () => {
    DEAL_STAGES.forEach(stage => {
      expect(STAGE_LABELS[stage]).toBeTruthy()
    })
  })
})
