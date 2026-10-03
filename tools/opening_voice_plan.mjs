import { loadData } from '../tests/lib/content.mjs';
const { data } = loadData(process.cwd());
const s = data.SCENES.s0, o = s.opening, m = o.mission;
const mission = '내 역할은 ' + m.role + '입니다. 마지막 미션은 ' + m.goal.replace(/돌아오기$/, '돌아오는 것입니다.') ;
const speakers = {
  villager: { seed: 41, text: o.quote.text, instruction: 'An original native Korean middle-aged male voice. Slightly rough and breathy, earnest and worried, natural conversational delivery with clear pronunciation.' },
  sejong: { seed: 73, text: o.sejong.text, instruction: 'An original native Korean mature male voice. Low warm register, dignified and calm, measured formal delivery, clear consonants and reassuring authority.' },
  narrator: { seed: 107, text: mission, instruction: 'An original native Korean female narrator voice. Clear, warm, inviting and lightly animated, natural studio narration for a school adventure game.' }
};
const clips = [
  ['s0.villager-request', 'villager', o.quote.text, '[worried]'],
  ['s0.villager-young', 'villager', o.options[0].reaction.text, '[confused]'],
  ['s0.villager-unlearned', 'villager', o.options[1].reaction.text, '[relieved]'],
  ['s0.sejong', 'sejong', o.sejong.text, '[calm]'],
  ['s0.explanation', 'narrator', o.explanation, '[explaining]'],
  ['s0.mission', 'narrator', mission, '[encouraging]'],
  ['s0.portal', 'narrator', s.intro[0].text, '[storytelling]'],
  ['s0.first-task', 'sejong', s.request[0].text, '[guiding]']
].map(([id, speaker, text, direction]) => ({ id, speaker, text, direction }));
process.stdout.write(JSON.stringify({ speakers, clips }));
