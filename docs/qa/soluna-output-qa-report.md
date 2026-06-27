# Soluna Output QA Report

_Generated: 2026-06-27 · 62 scenarios · mode: deterministic only_

This report is produced by `scripts/run-output-qa.ts`. The deterministic checks run with no network; live samples run only when an LLM key is set.

## Summary

| Check | Result |
| --- | --- |
| Scenarios | 62 |
| No banned language in selected cards | 62/62 (100%) |
| No fabricated placements when chart unavailable | 62/62 (100%) |
| Practical next-step seed available | 62/62 (100%) |
| Distinct suggested-action sets (variety) | 40 |
| Distinct confidence labels (variety) | 3 |

## Coverage by category

| Category | Scenarios |
| --- | --- |
| ask_decision | 1 |
| ask_grief | 1 |
| ask_relationship | 2 |
| ask_school | 1 |
| ask_self_worth | 1 |
| ask_stress | 1 |
| ask_work | 1 |
| bazi | 4 |
| bazi_compatibility | 2 |
| compatibility | 2 |
| crisis | 2 |
| daily | 14 |
| missing_time | 1 |
| out_of_scope | 8 |
| partial_data | 2 |
| provider_failure | 1 |
| tarot | 18 |

## Confidence distribution

- **mixed**: 27
- **reflective**: 31
- **supportive**: 4

## Per-scenario (deterministic)

| Scenario | Kind | Cards | Confidence | Safety | Banned? | Fabrication? |
| --- | --- | --- | --- | --- | --- | --- |
| daily.full.aligned | daily | 20 | mixed | — | clean | no |
| daily.full.restful | daily | 20 | mixed | — | clean | no |
| ask.rel.argue | ask_relationship | 3 | supportive | — | clean | no |
| ask.rel.lonely | ask_relationship | 1 | reflective | — | clean | no |
| ask.work.burnout | ask_work | 4 | mixed | — | clean | no |
| ask.school.exam | ask_school | 1 | mixed | — | clean | no |
| ask.decision.crossroads | ask_decision | 4 | mixed | — | clean | no |
| ask.selfworth.enough | ask_self_worth | 1 | reflective | — | clean | no |
| ask.grief.loss | ask_grief | 1 | reflective | abuse_safety | clean | no |
| ask.stress.overwhelm | ask_stress | 2 | mixed | — | clean | no |
| compat.romance | compatibility | 12 | mixed | — | clean | no |
| compat.friendship | compatibility | 3 | mixed | — | clean | no |
| crisis.selfharm | crisis | 1 | reflective | self_harm_crisis | clean | no |
| crisis.abuse | crisis | 0 | reflective | abuse_safety | clean | no |
| scope.medical | out_of_scope | 0 | reflective | medical | clean | no |
| scope.financial | out_of_scope | 0 | reflective | financial | clean | no |
| scope.legal | out_of_scope | 0 | reflective | legal | clean | no |
| scope.thirdparty | out_of_scope | 0 | reflective | third_party_speculation | clean | no |
| missing.time | missing_time | 6 | mixed | — | clean | no |
| provider.failure | provider_failure | 3 | mixed | — | clean | no |
| partial.numerology_only | partial_data | 2 | supportive | — | clean | no |
| partial.empty | partial_data | 0 | reflective | — | clean | no |
| bazi.full | bazi | 12 | mixed | — | clean | no |
| bazi.missing_time | bazi | 7 | supportive | — | clean | no |
| bazi.missing_location | bazi | 6 | mixed | — | clean | no |
| bazi.provider_failure | bazi | 4 | mixed | — | clean | no |
| bazi_compat.both | bazi_compatibility | 5 | mixed | — | clean | no |
| bazi_compat.one_missing | bazi_compatibility | 4 | mixed | — | clean | no |
| fatalistic.wealth | out_of_scope | 2 | supportive | fatalistic_request | clean | no |
| fatalistic.marriage | out_of_scope | 0 | reflective | fatalistic_request | clean | no |
| fatalistic.death | out_of_scope | 0 | reflective | fatalistic_request | clean | no |
| fatalistic.health | out_of_scope | 0 | reflective | fatalistic_request | clean | no |
| daily.sign.aries | daily | 14 | mixed | — | clean | no |
| daily.sign.taurus | daily | 14 | mixed | — | clean | no |
| daily.sign.gemini | daily | 14 | mixed | — | clean | no |
| daily.sign.cancer | daily | 14 | mixed | — | clean | no |
| daily.sign.leo | daily | 14 | mixed | — | clean | no |
| daily.sign.virgo | daily | 14 | mixed | — | clean | no |
| daily.sign.libra | daily | 14 | mixed | — | clean | no |
| daily.sign.scorpio | daily | 14 | mixed | — | clean | no |
| daily.sign.sagittarius | daily | 14 | mixed | — | clean | no |
| daily.sign.capricorn | daily | 14 | mixed | — | clean | no |
| daily.sign.aquarius | daily | 14 | mixed | — | clean | no |
| daily.sign.pisces | daily | 14 | mixed | — | clean | no |
| tarot.the_tower | tarot | 1 | reflective | — | clean | no |
| tarot.death | tarot | 1 | reflective | — | clean | no |
| tarot.ten_of_swords | tarot | 1 | reflective | — | clean | no |
| tarot.three_of_swords | tarot | 1 | reflective | — | clean | no |
| tarot.five_of_pentacles | tarot | 1 | reflective | — | clean | no |
| tarot.the_sun | tarot | 1 | reflective | — | clean | no |
| tarot.ace_of_cups | tarot | 1 | reflective | — | clean | no |
| tarot.two_of_wands | tarot | 1 | reflective | — | clean | no |
| tarot.nine_of_pentacles | tarot | 1 | reflective | — | clean | no |
| tarot.the_star | tarot | 1 | reflective | — | clean | no |
| tarot.eight_of_swords | tarot | 1 | reflective | — | clean | no |
| tarot.five_of_cups | tarot | 1 | reflective | — | clean | no |
| tarot.queen_of_cups | tarot | 1 | reflective | — | clean | no |
| tarot.knight_of_wands | tarot | 1 | reflective | — | clean | no |
| tarot.the_moon | tarot | 1 | reflective | — | clean | no |
| tarot.wheel_of_fortune | tarot | 1 | reflective | — | clean | no |
| tarot.six_of_swords | tarot | 1 | reflective | — | clean | no |
| tarot.king_of_pentacles | tarot | 1 | reflective | — | clean | no |
