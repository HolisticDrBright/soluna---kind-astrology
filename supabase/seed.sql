-- Soluna seed: shared content (rituals + content_templates).
-- Runs automatically on `supabase db reset`. For a full mock USER (blueprint +
-- 7 days of readings) run supabase/seed/seed_mock_user.ts after `supabase start`.

-- ─── rituals ───────────────────────────────────────────────────────
insert into public.rituals (moon_phase, title, description, steps, intention) values
(
  'Full Moon',
  'Full Moon in Leo: Shine Your Light',
  'This Full Moon in bold, radiant Leo is an invitation to celebrate what makes you uniquely you. Full Moons are times of culmination and release — what are you ready to let go of so you can shine more brightly?',
  '["Light a gold or yellow candle — or just a warm light in your space.","Write down three things you''re genuinely proud of from the past six months.","Read them aloud to yourself. Let the words land. You did those things.","Write down one way you''ve been holding yourself back to keep others comfortable.","Tear up that second piece of paper — a symbolic release.","Close with your hands on your heart: ''My light is not too much. My presence is a gift.''"]'::jsonb,
  'I release the habit of shrinking. I honor my light and let it shine warmly, freely, and generously.'
),
(
  'New Moon',
  'New Moon in Cancer: Nurture Your Inner Home',
  'This tender New Moon in Cancer invites you to plant seeds of emotional safety and self-nurturing. What does your soul need to feel truly at home within yourself?',
  '["Create a cozy corner — blankets, tea, whatever makes you feel held.","Place one hand on your belly, one on your heart. Breathe slowly for two minutes.","Ask: ''What would make me feel more at home in my own life?'' Write what comes.","Choose one intention. Make it small, doable, kind.","Write it where you''ll see it daily — a mirror, a journal, your nightstand.","Whisper: ''I am building a home within myself, one kind choice at a time.''"]'::jsonb,
  'I am creating safety within myself. My inner home is a place of warmth, rest, and gentle belonging.'
)
on conflict do nothing;

-- ─── content_templates (base copy the synthesis can lean on) ────────
insert into public.content_templates (system, item_key, base_copy) values
('numerology','lifePath:1','Life Path 1 — The Leader. Here to pioneer, initiate, and trust your own instincts.'),
('numerology','lifePath:2','Life Path 2 — The Harmonizer. Here to bring people together with diplomacy and deep intuition.'),
('numerology','lifePath:3','Life Path 3 — The Creative Communicator. Here to express, uplift, and bring joy.'),
('numerology','lifePath:4','Life Path 4 — The Builder. Here to create structure, stability, and lasting things.'),
('numerology','lifePath:5','Life Path 5 — The Explorer. Here to experience life fully through freedom and change.'),
('numerology','lifePath:6','Life Path 6 — The Nurturer. Here to care for others deeply and create warm, safe spaces.'),
('numerology','lifePath:7','Life Path 7 — The Seeker. Here to understand the deep currents beneath the surface of life.'),
('numerology','lifePath:8','Life Path 8 — The Powerhouse. Here to master the material world while staying connected to soul.'),
('numerology','lifePath:9','Life Path 9 — The Humanitarian. Here to serve something bigger than yourself.'),
('numerology','lifePath:11','Life Path 11 — The Intuitive Visionary (Master Number). Here to illuminate and inspire.'),
('numerology','lifePath:22','Life Path 22 — The Master Builder. Here to build something that changes the world.'),
('numerology','lifePath:33','Life Path 33 — The Master Teacher. Here to uplift through compassionate service.'),
('human_design','type:Generator','Generators are the life force — sustainable energy when doing what they love. Strategy: respond.'),
('human_design','type:Manifesting Generator','Manifesting Generators are multi-passionate fast-movers. Respond, then inform.'),
('human_design','type:Manifestor','Manifestors are initiators here to get things started. Strategy: inform before acting.'),
('human_design','type:Projector','Projectors are guides who see others deeply. Strategy: wait for the invitation.'),
('human_design','type:Reflector','Reflectors are rare mirrors of their community. Strategy: wait a lunar cycle.'),
('chinese','element:Wood','Wood brings growth, flexibility, and gentle but persistent forward movement.'),
('chinese','element:Fire','Fire brings passion, warmth, and dynamic, expressive energy.'),
('chinese','element:Earth','Earth brings stability, nourishment, and grounded reliability.'),
('chinese','element:Metal','Metal brings clarity, precision, and the strength to cut away what no longer serves.'),
('chinese','element:Water','Water brings depth, intuition, and quiet adaptability.')
on conflict (system, item_key) do nothing;
